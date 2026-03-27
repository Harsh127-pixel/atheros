const axios = require('axios');
const logger = require('../utils/logger');

const DECISION_MATRIX = {
  'Java': { provider: 'GCP', reason: 'Native JVM optimization with Cloud Run containers.' },
  'Go': { provider: 'Fly.io', reason: 'Optimized for Firecracker Micro-VMs and low-latency edges.' },
  'Node.js': { provider: 'Render', reason: 'Easiest deployment flow for Node.js monorepos and static assets.' },
  'Unknown': { provider: 'Render', reason: 'Defaulting to Render for standard web service support.' }
};

const getCloudBrokerDecision = (language) => {
  return DECISION_MATRIX[language] || DECISION_MATRIX['Unknown'];
};

const triggerRenderDeploy = async (repoUrl, serviceName) => {
  if (!process.env.RENDER_API_KEY) throw new Error('RENDER_API_KEY missing');
  
  const response = await axios.post('https://api.render.com/v1/services', {
    name: serviceName || 'aetheros-service',
    type: 'web_service',
    repo: repoUrl,
    autoDeploy: 'yes',
    env: 'node',
    plan: 'free',
  }, {
    headers: { Authorization: `Bearer ${process.env.RENDER_API_KEY}` }
  });
  return response.data;
};

const triggerFlyDeploy = async (repoUrl, appName) => {
  if (!process.env.FLY_API_TOKEN) throw new Error('FLY_API_TOKEN missing');
  
  // Fly.io API usually requires GraphQL for app creation
  const query = `
    mutation($input: CreateAppInput!) {
      createApp(input: $input) {
        app { name, organization { slug } }
      }
    }
  `;
  const response = await axios.post('https://api.fly.io/graphql', {
    query,
    variables: { input: { name: appName, organizationId: "personal" } }
  }, {
    headers: { Authorization: `Bearer ${process.env.FLY_API_TOKEN}` }
  });
  return response.data;
};

const triggerGCPDeploy = async (repoUrl, serviceName) => {
  if (!process.env.GCP_PROJECT_ID) throw new Error('GCP_PROJECT_ID missing');
  
  // Simplified GCP Cloud Run Trigger (Requires authentication/credentials)
  const response = await axios.post(`https://run.googleapis.com/v1/projects/${process.env.GCP_PROJECT_ID}/locations/us-central1/services`, {
    metadata: { name: serviceName },
    spec: {
      template: {
        spec: {
          containers: [{ image: `gcr.io/${process.env.GCP_PROJECT_ID}/${serviceName}` }]
        }
      }
    }
  }, {
    headers: { Authorization: `Bearer ${process.env.GCP_ACCESS_TOKEN}` }
  });
  return response.data;
};

const deployToBestCloud = async (language, repoUrl, forcedProvider = null) => {
  const { provider: detectedProvider, reason } = getCloudBrokerDecision(language);
  const provider = forcedProvider || detectedProvider;
  
  const serviceName = `aether-${Math.random().toString(36).substring(7)}`;

  logger.info(`Cloud Broker: ${forcedProvider ? 'Agent' : 'Decision Matrix'} selected ${provider} for ${language}`);

  try {
    let result;
    switch(provider) {
      case 'Render':
        result = await triggerRenderDeploy(repoUrl, serviceName);
        break;
      case 'Fly.io':
        result = await triggerFlyDeploy(repoUrl, serviceName);
        break;
      case 'GCP':
        result = await triggerGCPDeploy(repoUrl, serviceName);
        break;
      default:
        throw new Error(`Provider ${provider} not supported by automation yet.`);
    }
    return { provider, reason, result, serviceName };
  } catch (error) {
    logger.error(`Deployment automation failed for ${provider}`, error.message);
    throw error;
  }
};

module.exports = { deployToBestCloud, getCloudBrokerDecision };
