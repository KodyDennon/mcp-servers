import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { allTools, callTool } from "./tools/index.js";
export function registerHandlers(server, managers) {
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
//# sourceMappingURL=handlers.js.map