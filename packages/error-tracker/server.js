import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { getSentryTools } from "./tools/sentryTools.js";
import { getDatadogTools } from "./tools/datadogTools.js";
import { getNewRelicTools } from "./tools/newrelicTools.js";
import { getLogRocketTools } from "./tools/logrocketTools.js";
import { getRollbarTools } from "./tools/rollbarTools.js";
// Load environment variables
dotenv.config();
export async function startServer() {
  const server = new Server(
    {
      name: "error-tracker-mcp",
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
    ...getSentryTools(),
    ...getDatadogTools(),
    ...getNewRelicTools(),
    ...getLogRocketTools(),
    ...getRollbarTools(),
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
      // Sentry tools
      if (name.startsWith("sentry_")) {
        const { handleSentryToolCall } = await import("./tools/sentryTools.js");
        return await handleSentryToolCall(name, args || {});
      }
      // Datadog tools
      if (name.startsWith("datadog_")) {
        const { handleDatadogToolCall } = await import(
          "./tools/datadogTools.js"
        );
        return await handleDatadogToolCall(name, args || {});
      }
      // New Relic tools
      if (name.startsWith("newrelic_")) {
        const { handleNewRelicToolCall } = await import(
          "./tools/newrelicTools.js"
        );
        return await handleNewRelicToolCall(name, args || {});
      }
      // LogRocket tools
      if (name.startsWith("logrocket_")) {
        const { handleLogRocketToolCall } = await import(
          "./tools/logrocketTools.js"
        );
        return await handleLogRocketToolCall(name, args || {});
      }
      // Rollbar tools
      if (name.startsWith("rollbar_")) {
        const { handleRollbarToolCall } = await import(
          "./tools/rollbarTools.js"
        );
        return await handleRollbarToolCall(name, args || {});
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
  console.error("Error Tracker MCP Server running on stdio");
}
//# sourceMappingURL=server.js.map
