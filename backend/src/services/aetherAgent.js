const { GoogleGenerativeAI } = require('@google/generative-ai');
const { deployToBestCloud } = require('./cloudBroker');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Autonomous Agent: The "AetherOS Brain"
 * Now runs in a loop to handle real actions.
 */
const runAutonomousDeployment = async (repoAnalysis, logEmitter, deploymentId) => {
  try {
    const tools = {
      get_free_tier_status: async ({ provider }) => {
        const statuses = {
          "Render": "Free Tier available: 512MB RAM, shared CPU. Perfect for Node.js/Static.",
          "GCP": "Free Tier: 2 Million requests/month on Cloud Run. Best for heavy JVM/Go.",
          "Fly.io": "Free Tier: 3 Shared-CPU-1x VMs (256MB RAM). Best for low-latency Go."
        };
        return { status: statuses[provider] || "Provider limits unknown, proceed with caution." };
      },
      trigger_deploy: async ({ provider, repoUrl, component, serviceName }) => {
        logger.info(`Agent calling trigger_deploy for ${component} on ${provider}`);
        logEmitter?.emit('log', { deploymentId, message: `[agent] Triggering ${provider} deployment for ${component}...` });
        
        try {
          // Map to real cloudBroker call
          const result = await deployToBestCloud(component === 'frontend' ? 'Node.js' : 'Node.js', repoUrl, provider);
          return { status: "SUCCESS", url: result.result?.dashboardUrl || "Provisioning started", serviceName: result.serviceName };
        } catch (e) {
          return { status: "FAILED", error: e.message };
        }
      }
    };

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      tools: [{
        functionDeclarations: [
          {
            name: "get_free_tier_status",
            description: "Check if a provider's free tier is suitable for the component.",
            parameters: {
              type: "object",
              properties: {
                provider: { type: "string", enum: ["Render", "GCP", "Fly.io"] }
              },
              required: ["provider"]
            }
          },
          {
            name: "trigger_deploy",
            description: "Actually initiate a deployment on a cloud provider.",
            parameters: {
              type: "object",
              properties: {
                provider: { type: "string", enum: ["Render", "GCP", "Fly.io"] },
                repoUrl: { type: "string" },
                component: { type: "string", enum: ["backend", "frontend"] },
                serviceName: { type: "string" }
              },
              required: ["provider", "repoUrl", "component"]
            }
          }
        ]
      }]
    });

    const chat = model.startChat();
    const prompt = `
      You are the AetherOS Autonomous Agent. Your goal is to deploy this project:
      
      REPO SCAN RESULTS:
      - Is Monorepo: ${repoAnalysis.isMonorepo}
      - Backend: ${repoAnalysis.backend?.language} (Suggests ${repoAnalysis.backend?.suggestedProvider})
      - Frontend: ${repoAnalysis.frontend ? "Detected" : "Not Detected"} (Suggests ${repoAnalysis.frontend?.suggestedProvider})
      - Global Rationale: ${repoAnalysis.overallRationale}
      
      USER DEPLOYMENT STRATEGY: ${repoAnalysis.strategy || 'AI Optimized'}
      
      REPO URL: ${repoAnalysis.repoUrl}
      
      INSTRUCTIONS:
      1. If strategy is 'UNIFIED', you MUST deploy both frontend and backend to the SAME provider (pick the best one for both).
      2. If strategy is 'DISTRIBUTED', you MUST deploy them to separate platforms if they are different types (e.g. static on Render, API on Fly/GCP).
      3. If strategy is 'AI' or not specified, you have full autonomy to decide.
      4. Check free tier status before deploying.
      5. Call 'trigger_deploy' for each component detected.
      6. Return a final summary of what you did.
    `;

    logEmitter?.emit('log', { deploymentId, message: "[agent] AetherOS Brain starting autonomous reasoning..." });
    let result = await chat.sendMessage(prompt);
    let callCount = 0;

    // The Agentic Loop
    while (result.response.candidates[0].content.parts.some(p => p.functionCall) && callCount < 5) {
      callCount++;
      const toolResults = [];

      for (const part of result.response.candidates[0].content.parts) {
        if (part.functionCall) {
          const { name, args } = part.functionCall;
          logger.info(`Agent executing tool: ${name}`, args);
          const toolResult = await tools[name](args);
          toolResults.push({
            functionResponse: {
              name,
              response: { content: toolResult }
            }
          });
        }
      }

      result = await chat.sendMessage(toolResults);
    }

    return {
      agentReasoning: result.response.text(),
      status: "COMPLETED"
    };

  } catch (error) {
    logger.error('Autonomous Agent reasoning failed', error);
    throw error;
  }
};

module.exports = { runAutonomousDeployment };
