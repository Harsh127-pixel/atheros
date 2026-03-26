require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const { apiKeyAuth } = require('./middleware/auth');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
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

// Middleware for API Key validation
app.use('/api/*', apiKeyAuth);

// Main Deployment Endpoint
app.post('/api/deploy', async (req, res) => {
  const { repoUrl, cloudProvider } = req.body;

  if (!repoUrl) {
    logger.warn('Deployment failed: Missing GitHub URL');
    return res.status(400).json({ error: 'GitHub URL is required' });
  }

  try {
    logger.info('Initializing deployment for repo', { repoUrl, provider: cloudProvider });

    // Mock Deployment Process
    const deployment = await prisma.deployment.create({
      data: {
        repoUrl,
        cloudProvider: cloudProvider || 'RENDER',
        status: 'IN_PROGRESS',
        securityScore: Math.floor(Math.random() * 40) + 60, // Mock security scoring
        logs: 'Initializing AetherOS engine...\nScanning codebase for security vulnerabilities...\nProvisioning build environment...'
      }
    });

    res.status(202).json({
      message: 'Deployment triggered successfully',
      deploymentId: deployment.id,
      status: deployment.status
    });

    // Simulate async process completion
    setTimeout(async () => {
      try {
        await prisma.deployment.update({
          where: { id: deployment.id },
          data: {
            status: 'SUCCESS',
            logs: deployment.logs + '\nBuild successful.\nDeployment live on Render.'
          }
        });
        logger.info('Deployment completed successfully', { deploymentId: deployment.id });
      } catch (err) {
        logger.error('Failed to update deployment status', err);
      }
    }, 5000);

  } catch (error) {
    logger.error('Deployment creation failed', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// List all deployments
app.get('/api/deployments', async (req, res) => {
  try {
    const deployments = await prisma.deployment.findMany({
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
    const deployment = await prisma.deployment.findUnique({
      where: { id }
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

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'AetherOS Engine: Operational' });
});

app.listen(PORT, () => {
  logger.info(`AetherOS Backend Server started on port ${PORT}`);
});
