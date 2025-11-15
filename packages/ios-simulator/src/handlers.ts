import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { SimulatorManager } from "./simulatorManager.js";
import type { InspectorManager } from "./inspector/index.js";
import type { AutomationManager } from "./automation/automationManager.js";
import { allTools, callTool } from "./tools/index.js";

export function registerHandlers(
  server: Server,
  managers: {
    simulator: SimulatorManager;
    inspector: InspectorManager;
    automation: AutomationManager;
  },
) {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
        output_schema: tool.output_schema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return callTool(name, args, managers);
  });
}
