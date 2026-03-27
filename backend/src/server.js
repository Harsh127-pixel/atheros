require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { authMiddleware } = require('./middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const { analyzeRepo } = require('./services/repoAnalyzer');
const { performSecurityAudit } = require('./services/securityAudit');
const { runAutonomousDeployment } = require('./services/aetherAgent');
const EventEmitter = require('events');
const temp = require('temp').track();
const simpleGit = require('simple-git');
const fs = require('fs-extra');
const crypto = require('crypto');

const app = express();
const prisma = new PrismaClient();
const logEmitter = new EventEmitter();
const PORT = process.env.PORT || 4000;

// Security Middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false, // Often needed for Third-party scripts like Razorpay
}));

// CORS configuration - allowing multiple origins
app.use(cors({
  origin: true, // Allow all origins during local dev to prevent extension blocks
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
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

const { maintenanceMiddleware } = require('./middleware/maintenanceMiddleware');
const Razorpay = require('razorpay');

// Razorpay Initialization
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret'
});

// Health Check (Public)
app.get('/health', (req, res) => {
  res.json({ status: 'AetherOS Engine: Operational' });
});

// Get current system settings and user info (Public/Protected hybrid)
app.get('/api/me', async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findFirst() || {};
    let user = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        const adminEmails = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim()) : [];
        const isSystemAdmin = adminEmails.includes(decodedToken.email);

        user = await prisma.user.upsert({
          where: { email: decodedToken.email },
          update: { name: decodedToken.name || decodedToken.email.split('@')[0] },
          create: { 
            email: decodedToken.email, 
            name: decodedToken.name || decodedToken.email.split('@')[0],
            role: isSystemAdmin ? 'ADMIN' : 'USER'
          }
        });
      } catch (e) {
        // Ignore invalid token, just return settings + null user
      }
    }
    
    res.json({ user, settings });
  } catch (error) {
    logger.error('Database connection failed in /api/me', error);
    res.json({ user: null, settings: {} });
  }
});

// --- Public Configuration Endpoints ---
app.get('/api/config/plans', (req, res) => {
  res.json([
    {
      id: 'Pro',
      level: 1,
      price: 999,
      features: ['Priority Scan Queue', 'Unlimited Deployments', 'Custom Domains', '24/7 Shield Support'],
      icon: 'Zap',
      color: 'primary'
    },
    {
      id: 'Enterprise',
      level: 2,
      price: 4999,
      features: ['Dedicated Infrastructure', 'SLA Guarantee', 'Advanced RBAC', 'Deep Security Insights'],
      icon: 'Crown',
      color: 'yellow'
    }
  ]);
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
  const { repoUrl, cloudProvider, strategy } = req.body;

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

    logger.info('Initializing deployment lifecycle', { repoUrl });

    // 1. Create PRELIMINARY Deployment Record (To provide a stable ID for logs)
    const deployment = await prisma.deployment.create({
      data: {
        repoUrl,
        cloudProvider: cloudProvider || 'AUTO',
        userId: req.user.id,
        status: 'INITIALIZING',
        url: `http://localhost:3000/pending`, // Placeholder or initial URL
        buildLogs: 'AetherOS Brain initializing development lifecycle...'
      }
    });

    logEmitter.emit('log', { deploymentId: deployment.id, message: '[system] Environment initialized. Preparing scanner...' });

    // 2. Clone and Perform Security Audit
    const tempDir = temp.mkdirSync(`aetheros-${deployment.id}`);
    const git = simpleGit();
    
    logEmitter.emit('log', { deploymentId: deployment.id, message: '[system] Cloning repository for security audit...' });
    await git.clone(repoUrl, tempDir, ['--depth', '1']);
    
    // NEW: Get Commit Hash for Caching
    const gitInstance = simpleGit(tempDir);
    const commitHash = await gitInstance.revparse(['HEAD']);
    
    // NEW: Check for Cached Analysis
    const cachedDeployment = await prisma.deployment.findFirst({
      where: {
        repoUrl,
        commitHash,
        status: 'SUCCESS'
      },
      orderBy: { createdAt: 'desc' }
    });

    let vulnerabilities = [];
    let analysis = null;

    if (cachedDeployment && cachedDeployment.analysisResult) {
      logEmitter.emit('log', { deploymentId: deployment.id, message: '[brain] REUSE: Valid architectural cache found for this commit.' });
      analysis = JSON.parse(cachedDeployment.analysisResult);
      // We reuse the security score too
      vulnerabilities = []; 
    }

    if (!analysis) {
      vulnerabilities = await performSecurityAudit(tempDir, logEmitter, deployment.id);
    }
    
    const hasCritical = vulnerabilities.some(v => v.severity === 'CRITICAL');

    // 3. Update Record with Security Stats
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        commitHash,
        securityScore: analysis ? (cachedDeployment?.securityScore || 100) : Math.max(0, 100 - (vulnerabilities.length * 10)),
        status: hasCritical ? 'FAILED' : 'ANALYZING'
      }
    });

    if (hasCritical) {
      logEmitter.emit('log', { deploymentId: deployment.id, message: '[shield] CRITICAL FAILURE: Deployment blocked due to security risks.' });
      return res.status(403).json({ 
        message: 'Deployment blocked: Critical security vulnerabilities detected', 
        deploymentId: deployment.id,
        vulnerabilities 
      });
    }

    // 4. Perform Repository Analysis (Use Cached or Run New)
    if (!analysis) {
      analysis = await analyzeRepo(repoUrl, logEmitter, deployment.id);
    }
    

    const deploymentUrl = `${process.env.LIVE_URL || 'http://localhost:3000'}/${deployment.id}`;

    // 5. Finalize Handshake Response (With analysis results & suggested plan)
    res.status(202).json({
      message: 'AetherOS Agentic Hub initialized...',
      deploymentId: deployment.id,
      status: 'PLANNING',
      analysis,
      suggestedPlan: analysis.suggestedPlan || 'Free',
      url: deploymentUrl
    });

    // Update URL & Cached Result in DB
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { 
        url: deploymentUrl,
        analysisResult: JSON.stringify(analysis)
      }
    });

    // 6. Trigger Autonomous Agent in Background
    (async () => {
      try {
        logEmitter.emit('log', { deploymentId: deployment.id, message: `[brain] Suggested Plan: ${analysis.suggestedPlan || 'Free'}` });
        
        const agentResult = await runAutonomousDeployment(
          { ...analysis, repoUrl, strategy }, 
          logEmitter, 
          deployment.id
        );

        logEmitter.emit('log', { deploymentId: deployment.id, message: `[agent] SUCCESS: ${agentResult.status}` });

        await prisma.deployment.update({
          where: { id: deployment.id },
          data: { 
            status: 'SUCCESS',
            reasoning: agentResult.agentReasoning
          }
        });
      } catch (err) {
        logger.error('Agentic deployment loop failed', err);
        logEmitter.emit('log', { deploymentId: deployment.id, message: `[error] Agentic failure: ${err.message}` });
        
        await prisma.deployment.update({
          where: { id: deployment.id },
          data: { status: 'FAILED' }
        });
      }
    })();

    } catch (error) {
    logger.error('Deployment creation failed', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
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

// --- Admin Endpoints (RBAC Protection) ---
const { roleMiddleware } = require('./middleware/authMiddleware');

// Get system-wide stats (Admin Only)
app.get('/api/admin/stats', roleMiddleware(['ADMIN']), async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const deploymentCount = await prisma.deployment.count();
    const successCount = await prisma.deployment.count({ where: { status: 'SUCCESS' } });
    const failedCount = await prisma.deployment.count({ where: { status: 'FAILED' } });

    res.json({
      userCount,
      deploymentCount,
      successCount,
      failedCount,
      health: 'EXCELLENT'
    });
  } catch (error) {
    logger.error('Admin Stats Error', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

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

// Super Admin Guard Helper
const isSuperAdmin = (email) => {
  const adminEmails = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim()) : [];
  return adminEmails.includes(email);
};

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

// Update user role (Super Admin Only: Add/Remove/Disable Admins)
app.post('/api/admin/users/:id/role', roleMiddleware(['ADMIN']), async (req, res) => {
  if (!isSuperAdmin(req.user.email)) {
    return res.status(403).json({ error: 'Forbidden: Only the Root Administrator can modify roles.' });
  }

  const { id } = req.params;
  const { role } = req.body; // 'USER', 'ADMIN'
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });
    res.json(user);
  } catch (error) {
    logger.error('Admin Change Role Error', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Ban/Unban user (Super Admin Only)
app.post('/api/admin/users/:id/ban', roleMiddleware(['ADMIN']), async (req, res) => {
  if (!isSuperAdmin(req.user.email)) {
    return res.status(403).json({ error: 'Forbidden: Only the Root Administrator can ban or disable users.' });
  }

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

// Remove User (Super Admin Only)
app.delete('/api/admin/users/:id', roleMiddleware(['ADMIN']), async (req, res) => {
  if (!isSuperAdmin(req.user.email)) {
    return res.status(403).json({ error: 'Forbidden: Only the Root Administrator can delete users.' });
  }

  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Admin Delete User Error', error);
    res.status(500).json({ error: 'Failed to delete user' });
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
