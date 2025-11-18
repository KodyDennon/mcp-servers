import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { getRuntimeTools } from "./tools/runtimeTools.js";
import { getDockerTools } from "./tools/dockerTools.js";
import { getDevContainerTools } from "./tools/devcontainerTools.js";
import { getServiceTools } from "./tools/serviceTools.js";

// Load environment variables
dotenv.config();

export async function startServer() {
  const server = new Server(
    {
      name: "dev-environment-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Combine all tools
  const allTools = [
    ...getRuntimeTools(),
    ...getDockerTools(),
    ...getDevContainerTools(),
    ...getServiceTools(),
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
      // Runtime version management tools
      if (name.startsWith("runtime_")) {
        const { handleRuntimeToolCall } = await import("./tools/runtimeTools.js");
        return await handleRuntimeToolCall(name, args || {});
      }

      // Docker tools
      if (name.startsWith("docker_")) {
        const { handleDockerToolCall } = await import("./tools/dockerTools.js");
        return await handleDockerToolCall(name, args || {});
      }

      // Dev container tools
      if (name.startsWith("devcontainer_")) {
        const { handleDevContainerToolCall } = await import("./tools/devcontainerTools.js");
        return await handleDevContainerToolCall(name, args || {});
      }

      // Service management tools
      if (name.startsWith("service_")) {
        const { handleServiceToolCall } = await import("./tools/serviceTools.js");
        return await handleServiceToolCall(name, args || {});
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
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

  console.error("Dev Environment MCP Server running on stdio");
}
