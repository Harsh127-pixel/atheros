const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getCloudBrokerDecision } = require('./cloudBroker');
const logger = require('../utils/logger');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Autonomous Agent: The "AetherOS Brain"
 * It takes the Repository Analysis from Feature 1 and reasons through tool calls.
 */
const runAutonomousDeployment = async (repoAnalysis) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{
        functionDeclarations: [
          {
            name: "get_free_tier_status",
            description: "Fetches the current 2026 limits for Render and GCP Free Tier.",
            parameters: {
              type: "object",
              properties: {
                provider: { type: "string", enum: ["Render", "GCP", "All"], description: "The provider to check limits for." },
              },
            },
          },
          {
            name: "trigger_deploy",
            description: "Calls the Render or GCP Cloud Run API to initiate a deployment.",
            parameters: {
              type: "object",
              properties: {
                provider: { type: "string", enum: ["Render", "GCP"], description: "Which cloud provider to deploy to." },
                repoUrl: { type: "string", description: "The GitHub repository to deploy." },
                serviceName: { type: "string", description: "Internal service name for the new deployment." },
              },
              required: ["provider", "repoUrl"],
            },
          }
        ]
      }]
    });

    const chat = model.startChat();
    const { provider, reason } = getCloudBrokerDecision(repoAnalysis.language);
    const repoUrl = repoAnalysis.repoUrl || 'https://github.com/aetheros/example';

    const prompt = `
      You are the AetherOS Autonomous Agent. Your goal is to deploy the scanned repository to the most suitable cloud environment.
      
      REPOSITORY SCAN RESULTS (Feature 1):
      - Language: ${repoAnalysis.language}
      - Suggested by Scanner: ${repoAnalysis.suggestedProvider}
      - Rationale: ${repoAnalysis.rationale}
      
      AetherOS BROKER DECISION (Feature 5):
      - Priority Provider: ${provider}
      - Broker Rationale: ${reason}
      
      REPO URL: ${repoUrl}
      
      STEPS:
      1. Use 'get_free_tier_status' for the Priority Provider: ${provider}.
      2. Verify this meets the needs of the ${repoAnalysis.language} stack. 
      3. Use 'trigger_deploy' to finalise the deployment on ${provider}.
      4. If ${provider} is unavailable, fallback to Render.
      5. Return a summary of your reasoning and the result of the tool calls.
    `;

    logger.info('AetherOS Autonomous Agent is reasoning...');
    const result = await chat.sendMessage(prompt);
    
    // Process tool calls if any (Gemini handles the orchestration)
    let finalResponse = result.response.text();
    
    // In a production app, we would loop here to handle the function responses.
    // For this boilerplate, the Agent will perform the primary reasoning.

    return {
      agentReasoning: finalResponse,
      status: "COMPLETED",
      finalCloud: repoAnalysis.suggestedProvider
    };

  } catch (error) {
    logger.error('Autonomous Agent reasoning failed', error);
    throw error;
  }
};

module.exports = { runAutonomousDeployment };
