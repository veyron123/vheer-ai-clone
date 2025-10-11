#!/usr/bin/env node
/**
 * GitHub MCP Server
 * Exposes a small set of GitHub REST API actions via the Model Context Protocol.
 *
 * Environment requirements:
 *   - GITHUB_TOKEN: A GitHub personal access token with the required scopes.
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const https = require("https");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

const githubApi = {
  hostname: "api.github.com",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json",
    "User-Agent": "github-mcp-server",
  },
};

function githubApiRequest(method, path, data = null, query = null) {
  return new Promise((resolve, reject) => {
    let fullPath = path;

    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });
      fullPath += `?${params.toString()}`;
    }

    const options = {
      hostname: githubApi.hostname,
      path: fullPath,
      method,
      headers: {
        ...githubApi.headers,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (!responseData) {
          resolve(null);
          return;
        }

        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const error = new Error(
              `GitHub API error ${res.statusCode}: ${parsed.message || responseData}`
            );
            error.status = res.statusCode;
            error.response = parsed;
            reject(error);
          }
        } catch (parseError) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            const error = new Error(
              `GitHub API error ${res.statusCode}: ${responseData}`
            );
            error.status = res.statusCode;
            reject(error);
          }
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

const server = new Server(
  {
    name: "github-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "list_repos",
        description: "List repositories accessible to the authenticated user",
        inputSchema: {
          type: "object",
          properties: {
            visibility: {
              type: "string",
              description: "Filter by repository visibility (all, public, private)",
            },
            affiliation: {
              type: "string",
              description: "Filter by repository affiliation (owner, collaborator, organization_member)",
            },
          },
        },
      },
      {
        name: "get_repo",
        description: "Get information about a repository",
        inputSchema: {
          type: "object",
          properties: {
            owner: {
              type: "string",
            },
            repo: {
              type: "string",
            },
          },
          required: ["owner", "repo"],
        },
      },
      {
        name: "list_pull_requests",
        description: "List pull requests for a repository",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
            state: {
              type: "string",
              description: "Filter by state (open, closed, all)",
            },
          },
          required: ["owner", "repo"],
        },
      },
      {
        name: "create_issue_comment",
        description: "Create a comment on an issue or pull request",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
            issueNumber: {
              type: "number",
              description: "Issue or pull request number",
            },
            body: {
              type: "string",
              description: "Comment body",
            },
          },
          required: ["owner", "repo", "issueNumber", "body"],
        },
      },
    ],
  };
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case "list_repos": {
        const { visibility = "all", affiliation = "owner,collaborator,organization_member" } =
          args;
        const repos = await githubApiRequest("GET", "/user/repos", null, {
          visibility,
          affiliation,
          per_page: 100,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(repos, null, 2),
            },
          ],
        };
      }

      case "get_repo": {
        const { owner, repo } = args;
        const data = await githubApiRequest("GET", `/repos/${owner}/${repo}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case "list_pull_requests": {
        const { owner, repo, state = "open" } = args;
        const pulls = await githubApiRequest("GET", `/repos/${owner}/${repo}/pulls`, null, {
          state,
          per_page: 100,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(pulls, null, 2),
            },
          ],
        };
      }

      case "create_issue_comment": {
        const { owner, repo, issueNumber, body } = args;
        const comment = await githubApiRequest(
          "POST",
          `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
          { body }
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(comment, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unsupported tool: ${name}`);
    }
  } catch (error) {
    const message = error.response
      ? `${error.message}\n${JSON.stringify(error.response, null, 2)}`
      : error.message;
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error starting GitHub MCP server:", error);
  process.exit(1);
});
