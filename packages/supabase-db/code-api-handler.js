/**
 * Code API Handler for code execution mode
 * Exposes filesystem-based API for agent code execution
 */
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { initialize } from "./code-api/index.js";
import { getSandboxConfig, getExecutionMode } from "./code-api/sandbox.config.js";
/**
 * Register code API handlers
 * In code execution mode, tools are exposed as importable modules
 */
export function registerCodeApiHandlers(server, connectionManager) {
    // Initialize the code API with connection manager
    initialize(connectionManager);
    // List available code API modules
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "code_execution",
                    description: "Execute code that uses the Supabase DB API. Import from './servers/supabase-db/' to access database operations.",
                    input_schema: {
                        type: "object",
                        properties: {
                            code: {
                                type: "string",
                                description: "TypeScript/JavaScript code to execute",
                            },
                        },
                        required: ["code"],
                    },
                    output_schema: {
                        type: "object",
                        properties: {
                            result: {
                                type: "any",
                                description: "Result of code execution",
                            },
                        },
                    },
                },
                {
                    name: "list_api_modules",
                    description: "List all available code API modules and their exports",
                    input_schema: {
                        type: "object",
                        properties: {},
                    },
                    output_schema: {
                        type: "object",
                        properties: {
                            modules: {
                                type: "array",
                                description: "Available modules",
                            },
                        },
                    },
                },
                {
                    name: "get_execution_config",
                    description: "Get current code execution mode configuration (sandbox vs direct)",
                    input_schema: {
                        type: "object",
                        properties: {},
                    },
                    output_schema: {
                        type: "object",
                        properties: {
                            mode: {
                                type: "string",
                                description: "Current execution mode: sandbox or direct",
                            },
                            config: {
                                type: "object",
                                description: "Full sandbox configuration",
                            },
                        },
                    },
                },
            ],
        };
    });
    // Handle code API tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            if (name === "list_api_modules") {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                modules: {
                                    "query": {
                                        path: "./servers/supabase-db/query",
                                        exports: ["query", "transaction", "explain"],
                                    },
                                    "schema": {
                                        path: "./servers/supabase-db/schema",
                                        exports: [
                                            "listTables",
                                            "getTableSchema",
                                            "createTable",
                                            "dropTable",
                                            "addColumn",
                                            "dropColumn",
                                            "createIndex",
                                            "listIndexes",
                                        ],
                                    },
                                    "data": {
                                        path: "./servers/supabase-db/data",
                                        exports: [
                                            "insertRow",
                                            "updateRow",
                                            "deleteRow",
                                            "bulkInsert",
                                            "importData",
                                            "upsert",
                                        ],
                                    },
                                    "builder": {
                                        path: "./servers/supabase-db/builder",
                                        exports: ["QueryBuilder"],
                                    },
                                    "pipeline": {
                                        path: "./servers/supabase-db/pipeline",
                                        exports: ["DataPipeline"],
                                    },
                                    "streaming": {
                                        path: "./servers/supabase-db/streaming",
                                        exports: [
                                            "streamQuery",
                                            "streamAggregate",
                                            "streamTransform",
                                            "streamCount",
                                        ],
                                    },
                                    "cache": {
                                        path: "./servers/supabase-db/cache",
                                        exports: ["QueryCache"],
                                    },
                                    "privacy": {
                                        path: "./servers/supabase-db/privacy",
                                        exports: ["PrivacyFilter"],
                                    },
                                    "skills": {
                                        path: "./servers/supabase-db/skills",
                                        exports: [
                                            "getActiveUserGrowth",
                                            "getUserRetention",
                                            "getUserEngagement",
                                            "findDuplicates",
                                            "findNullValues",
                                            "getDailySummary",
                                            "getTopN",
                                        ],
                                    },
                                },
                            }, null, 2),
                        },
                    ],
                };
            }
            if (name === "get_execution_config") {
                const config = getSandboxConfig();
                const mode = getExecutionMode();
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                executionMode: mode,
                                description: mode === 'sandbox'
                                    ? 'Code runs in Claude Code sandbox (safer, PII-protected)'
                                    : 'Code runs directly on server (more powerful, requires trust)',
                                configuration: config,
                                environmentVariable: 'CODE_EXECUTION_MODE',
                                availableModes: ['sandbox', 'direct'],
                            }, null, 2),
                        },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: "Code execution not implemented in this runtime. Use a sandbox environment that supports code execution mode.",
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: `Error in code API: ${error.message}`,
                            stack: error.stack,
                        }, null, 2),
                    },
                ],
            };
        }
    });
}
//# sourceMappingURL=code-api-handler.js.map