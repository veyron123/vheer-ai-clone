#!/usr/bin/env node
/**
 * Render MCP Server
 * Provides MCP tools for managing Render services and deploys
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const https = require("https");

// Render API configuration
const RENDER_API_KEY = process.env.RENDER_API_KEY;
if (!RENDER_API_KEY) {
  console.error("RENDER_API_KEY environment variable is required");
  process.exit(1);
}

const renderApi = {
  hostname: "api.render.com",
  headers: {
    Authorization: `Bearer ${RENDER_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Function to make API request
function renderApiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: renderApi.hostname,
      path: path,
      method: method,
      headers: renderApi.headers,
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${parsed.message || responseData}`));
          }
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Create MCP server
const server = new Server(
  {
    name: "render-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "list_services",
        description: "List all Render services",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_deploys",
        description: "List deploys for a specific service",
        inputSchema: {
          type: "object",
          properties: {
            serviceId: {
              type: "string",
              description: "Service ID to list deploys for",
            },
          },
          required: ["serviceId"],
        },
      },
      {
        name: "create_deploy",
        description: "Create a new deploy for a service",
        inputSchema: {
          type: "object",
          properties: {
            serviceId: {
              type: "string",
              description: "Service ID to deploy",
            },
          },
          required: ["serviceId"],
        },
      },
      {
        name: "get_deploy_status",
        description: "Get status of a specific deploy",
        inputSchema: {
          type: "object",
          properties: {
            serviceId: {
              type: "string",
              description: "Service ID",
            },
            deployId: {
              type: "string",
              description: "Deploy ID",
            },
          },
          required: ["serviceId", "deployId"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_services": {
        const services = await renderApiRequest("GET", "/v1/services?limit=100");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(services, null, 2),
            },
          ],
        };
      }

      case "list_deploys": {
        const { serviceId } = args;
        const deploys = await renderApiRequest("GET", `/v1/services/${serviceId}/deploys`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(deploys, null, 2),
            },
          ],
        };
      }

      case "create_deploy": {
        const { serviceId } = args;
        const deploy = await renderApiRequest("POST", `/v1/services/${serviceId}/deploys`);
        return {
          content: [
            {
              type: "text",
              text: `Deploy created successfully:\n${JSON.stringify(deploy, null, 2)}`,
            },
          ],
        };
      }

      case "get_deploy_status": {
        const { serviceId, deployId } = args;
        const deploy = await renderApiRequest("GET", `/v1/services/${serviceId}/deploys/${deployId}`);
        return {
          content: [
            {
              type: "text",
              text: `Deploy status:\n${JSON.stringify(deploy, null, 2)}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Render MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
