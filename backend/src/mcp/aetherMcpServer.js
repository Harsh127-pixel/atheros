const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const logger = require('../utils/logger');

// 1. Initialize MCP Server
const server = new Server(
  {
    name: "AetherOS-MCP-Service",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 2. Define Tools
const TOOLS = [
  {
    name: "get_free_tier_status",
    description: "Fetches the current 2026 limits for Render and GCP Free Tier.",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", enum: ["Render", "GCP", "All"], description: "The provider to check limits for." },
      },
    },
  },
  {
    name: "trigger_deploy",
    description: "Calls the Render or GCP Cloud Run API to initiate a deployment.",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", enum: ["Render", "GCP"], description: "Which cloud provider to deploy to." },
        repoUrl: { type: "string", description: "The GitHub repository to deploy." },
        serviceName: { type: "string", description: "Internal service name for the new deployment." },
      },
      required: ["provider", "repoUrl"],
    },
  },
];

// 3. Register Tool List Handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// 4. Register Tool Call Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_free_tier_status") {
      const data = {
        Render: { CPU: "512MB RAM", Instance: "Free Instance (Sleeps after inactivity)", DB: "Free PostgreSQL (No Backup)", Month: "750 hours Free" },
        GCP: { CPU: "Cloud Run First 180k vCPU-seconds Free", RAM: "360k GiB-seconds Free", Network: "1GB Egress", Requests: "2 million per month" },
      };
      
      const filtered = args.provider === "All" || !args.provider ? data : { [args.provider]: data[args.provider] };
      return { content: [{ type: "text", text: `Current 2026 Cloud Free Tier Status: \n${JSON.stringify(filtered, null, 2)}` }] };
    }

    if (name === "trigger_deploy") {
      logger.info(`MCP: Triggering deployment for ${args.repoUrl} to ${args.provider}`);
      // Mock logic for API call
      return { 
        content: [{ 
          type: "text", 
          text: `SUCCESS: Deployment triggered for ${args.repoUrl} on ${args.provider} Cloud Run/Engine. 
                 Endpoint: https://${args.serviceName || 'aether-service'}.aether-internal.cloud` 
        }]
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (err) {
    logger.error(`MCP Error: ${err.message}`);
    return {
      content: [{ type: "text", text: `Error executing MCP tool: ${err.message}` }],
      isError: true,
    };
  }
});

// 5. Start MCP Server (Stdio)
async function startMcp() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("AetherOS MCP Server started on Stdio transport.");
}

// In this environment, we export for the agent service to use directly as well.
module.exports = { server, TOOLS, startMcp };
