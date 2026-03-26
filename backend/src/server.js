require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { authMiddleware } = require('./middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const { analyzeRepo } = require('./services/repoAnalyzer');
const EventEmitter = require('events');

const app = express();
const prisma = new PrismaClient();
const logEmitter = new EventEmitter();
const PORT = process.env.PORT || 4000;

// Security Middleware
app.use(helmet());

// CORS configuration - allowing the Vercel URL
app.use(cors({
  origin: process.env.VERCEL_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip, 
    userAgent: req.get('user-agent') 
  });
  next();
});

const { auth } = require('./config/firebase');

// Real-Time Build Streaming (The "Log-Room") - Move BEFORE general auth to handle EventSource query token
app.get('/api/deployments/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    await auth.verifyIdToken(token);
    // Note: In a production app, we would also check if the user own this deployment ID
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onLog = (data) => {
    if (data.deploymentId === id) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  logEmitter.on('log', onLog);

  req.on('close', () => {
    logEmitter.off('log', onLog);
  });
});

const { authMiddleware } = require('./middleware/authMiddleware');
const { maintenanceMiddleware } = require('./middleware/maintenanceMiddleware');
const Razorpay = require('razorpay');

// Razorpay Initialization
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret'
});

// Middleware for Firebase Auth validation (everything after this is protected)
app.use('/api/*', authMiddleware);

// Global Maintenance Guard (Checks for req.user for admin role)
app.use('/api/*', maintenanceMiddleware);

// Intelligent Repository Analyzer
app.post('/api/scan', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'Repository URL is required' });

  try {
    const analysis = await analyzeRepo(repoUrl);
    res.json(analysis);
  } catch (error) {
    logger.error('Analysis endpoint failed', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// Main Deployment Endpoint
app.post('/api/deploy', async (req, res) => {
  const { repoUrl, cloudProvider } = req.body;

  try {
    // Check Global System Settings
    const settings = await prisma.systemSettings.findFirst();
    if (settings) {
      if (settings.maintenanceMode && req.user.role !== 'ADMIN') {
        return res.status(503).json({ error: 'System is currently in Maintenance Mode. Please try again later.' });
      }
      if (!settings.freeTierEnabled && req.user.upgradeLevel === 0 && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Free tier deployments are currently disabled. Please upgrade your plan.' });
      }
    }

    if (!repoUrl) {
      logger.warn('Deployment failed: Missing GitHub URL');
      return res.status(400).json({ error: 'GitHub URL is required' });
    }

    logger.info('Initializing deployment and security audit for repo', { repoUrl });

    // 1. First, create a temporary directory to clone and scan (The "Scanner" & "Shield")
    const { analyzeRepo } = require('./services/repoAnalyzer');
    const { performSecurityAudit } = require('./services/securityAudit');
    const temp = require('temp').track();
    const simpleGit = require('simple-git');
    const fs = require('fs-extra');
    
    const tempDir = temp.mkdirSync('aetheros-deploy-shield');
    const git = simpleGit();
    await git.clone(repoUrl, tempDir, ['--depth', '1']);

    // 2. Perform Security Audit
    const vulnerabilities = await performSecurityAudit(tempDir);
    const hasCritical = vulnerabilities.some(v => v.severity === 'CRITICAL');

    // 3. Create Deployment Record
    const deployment = await prisma.deployment.create({
      data: {
        repoUrl,
        cloudProvider: cloudProvider || 'RENDER',
        userId: req.user.id,
        status: hasCritical ? 'FAILED' : 'IN_PROGRESS',
        securityScore: 100 - (vulnerabilities.length * 10), // Simple math for now
        buildLogs: hasCritical 
          ? `CRITICAL SECURITY FAILURE: \n${JSON.stringify(vulnerabilities, null, 2)}`
          : 'Initializing AetherOS engine...\nScanning codebase for security vulnerabilities...\nProvisioning build environment...'
      }
    });

    // Cleanup temp dir
    await fs.remove(tempDir);

    if (hasCritical) {
      logger.warn('Deployment FAILED due to critical security vulnerabilities', { repoUrl, vulnerabilities });
      return res.status(403).json({
        message: 'Deployment blocked: Critical security vulnerabilities detected',
        deploymentId: deployment.id,
        vulnerabilities
      });
    }

    // 4. Start Streaming Simulation (Feature 4)
    res.status(202).json({
      message: 'Secure deployment triggered successfully',
      deploymentId: deployment.id,
      status: deployment.status
    });

    // Async process with real-time log simulation
    (async () => {
      const logs = [
        '[shield] Running Feature 2 Audit...',
        '[shield] Secrets check: OK',
        '[shield] Dependencies check: OK',
        '[mcp] Reasoning Cloud Fit for Render...',
        '[mcp] Fetching 2026 Free Tier Limits...',
        '[mcp] Triggering deployment to Render API...',
      ];

      let fullLog = deployment.buildLogs;

      for (const log of logs) {
        await new Promise(r => setTimeout(r, 1500));
        fullLog += `\n${log}`;
        logEmitter.emit('log', { deploymentId: deployment.id, message: log });
      }

      await prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: 'SUCCESS',
          buildLogs: fullLog + '\n[aether] Deployment live on Render.'
        }
      });
      logEmitter.emit('log', { deploymentId: deployment.id, message: '[aether] Deployment live on Render.' });
    })();

    } catch (error) {
    logger.error('Deployment creation failed', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// List all deployments
app.get('/api/deployments', async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const deployments = await prisma.deployment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(deployments);
  } catch (error) {
    logger.error('Failed to fetch deployments', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get deployment by ID
app.get('/api/deployments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const where = req.user.role === 'ADMIN' ? { id } : { id, userId: req.user.id };
    const deployment = await prisma.deployment.findFirst({
      where
    });
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    res.json(deployment);
  } catch (error) {
    logger.error('Failed to fetch deployment details', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get current user and system settings
app.get('/api/me', async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findFirst();
    res.json({ user: req.user, settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Create Payment Order
app.post('/api/payments/order', async (req, res) => {
  const { amount, planId } = req.body;
  try {
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    logger.error('Razorpay Order Error', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify Payment Signature
const crypto = require('crypto');
app.post('/api/payments/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planLevel } = req.body;
  
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret');
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generated_signature = hmac.digest('hex');

  if (generated_signature === razorpay_signature) {
    try {
      // Upgrade user level in DB
      await prisma.user.update({
        where: { id: req.user.id },
        data: { upgradeLevel: parseInt(planLevel) }
      });
      res.json({ success: true, message: 'Payment verified and plan upgraded' });
    } catch (e) {
       res.status(500).json({ error: 'Payment verified but DB upgrade failed' });
    }
  } else {
    res.status(400).json({ error: 'Invalid payment signature' });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'AetherOS Engine: Operational' });
});

// --- Admin Endpoints (RBAC Protection) ---
const { roleMiddleware } = require('./middleware/authMiddleware');

// Get all system settings
app.get('/api/admin/settings', roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} });
    }
    res.json(settings);
  } catch (error) {
    logger.error('Admin Fetch Settings Error', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update system settings
app.post('/api/admin/settings', roleMiddleware(['ADMIN']), async (req, res) => {
  const { maintenanceMode, freeTierEnabled, subscriptionModelOn } = req.body;
  try {
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'global-settings' },
      update: { maintenanceMode, freeTierEnabled, subscriptionModelOn },
      create: { maintenanceMode, freeTierEnabled, subscriptionModelOn }
    });
    res.json(settings);
  } catch (error) {
    logger.error('Admin Update Settings Error', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// List all users for management
app.get('/api/admin/users', roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    logger.error('Admin List Users Error', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Ban/Unban user
app.post('/api/admin/users/:id/ban', roleMiddleware(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { isBanned } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isBanned }
    });
    res.json(user);
  } catch (error) {
    logger.error('Admin Ban User Error', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Upgrade/Downgrade user level
app.post('/api/admin/users/:id/upgrade', roleMiddleware(['ADMIN']), async (req, res) => {
  const { id } = req.params;
  const { level } = req.body; // 0, 1, 2
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { upgradeLevel: parseInt(level) }
    });
    res.json(user);
  } catch (error) {
    logger.error('Admin Upgrade User Error', error);
    res.status(500).json({ error: 'Failed to upgrade user' });
  }
});

app.listen(PORT, () => {
  logger.info(`AetherOS Backend Server started on port ${PORT}`);
});
