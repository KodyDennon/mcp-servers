import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { getGitHubWorkflowsTools } from "./tools/githubTools.js";
import { getGitLabPipelinesTools } from "./tools/gitlabTools.js";
import { getCircleCITools } from "./tools/circleci Tools.js";
import { getJenkinsTools } from "./tools/jenkinsTools.js";
// Load environment variables
dotenv.config();
export async function startServer() {
  const server = new Server(
    {
      name: "cicd-orchestrator-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  // Combine all tools from different providers
  const allTools = [
    ...getGitHubWorkflowsTools(),
    ...getGitLabPipelinesTools(),
    ...getCircleCITools(),
    ...getJenkinsTools(),
  ];
  // Handle list_tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools,
    };
  });
  // Handle call_tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      // GitHub Actions tools
      if (name.startsWith("github_")) {
        const { handleGitHubToolCall } = await import("./tools/githubTools.js");
        return await handleGitHubToolCall(name, args || {});
      }
      // GitLab CI tools
      if (name.startsWith("gitlab_")) {
        const { handleGitLabToolCall } = await import("./tools/gitlabTools.js");
        return await handleGitLabToolCall(name, args || {});
      }
      // CircleCI tools
      if (name.startsWith("circleci_")) {
        const { handleCircleCIToolCall } = await import(
          "./tools/circleci Tools.js"
        );
        return await handleCircleCIToolCall(name, args || {});
      }
      // Jenkins tools
      if (name.startsWith("jenkins_")) {
        const { handleJenkinsToolCall } = await import(
          "./tools/jenkinsTools.js"
        );
        return await handleJenkinsToolCall(name, args || {});
      }
      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CI/CD Orchestrator MCP Server running on stdio");
}
//# sourceMappingURL=server.js.map
