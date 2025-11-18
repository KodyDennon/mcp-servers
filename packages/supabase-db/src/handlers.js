import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  connectToDatabaseTool,
  listConnectionsTool,
  switchConnectionTool,
  handleConnectionToolCall,
} from "./tools/connectionTools.js";
import {
  queryTool,
  queryTransactionTool,
  explainQueryTool,
  handleQueryToolCall,
} from "./tools/queryTools.js";
import {
  listTablesTool,
  getTableSchemaTool,
  listIndexesTool,
  listFunctionsTool,
  searchSchemaTool,
  createTableTool,
  dropTableTool,
  addColumnTool,
  dropColumnTool,
  createIndexTool,
  diffSchemaTool,
  handleSchemaToolCall,
} from "./tools/schemaTools.js";
import {
  runMigrationTool,
  listMigrationsTool,
  generateMigrationTool,
  seedDataTool,
  handleMigrationToolCall,
} from "./tools/migrationTools.js";
import {
  importDataTool,
  insertRowTool,
  updateRowTool,
  deleteRowTool,
  handleDataToolCall,
} from "./tools/dataTools.js";
import {
  getDatabaseStatsTool,
  createBackupTool,
  manageAuthTool,
  manageStorageTool,
  handleAdminToolCall,
} from "./tools/adminTools.js";
import {
  subscribeTool,
  handleSubscriptionToolCall,
} from "./tools/subscriptionTools.js";
import {
  deployFunctionTool,
  listFunctionsTool as listEdgeFunctionsTool,
  deleteFunctionTool,
  handleEdgeFunctionToolCall,
} from "./tools/edgeFunctionTools.js";
import { rag, indexDirectory, indexUrl } from "./tools/aiTools.js";
import {
  healthCheckTool,
  getConnectionStatsTool,
  getRecoveryStatsTool,
  resetCircuitBreakerTool,
  handleMonitoringToolCall,
} from "./tools/monitoringTools.js";
import {
  getCacheStatsTool,
  clearCacheTool,
  listTemplatesTool,
  getTemplateTool,
  executeTemplateTool,
  getHelpTool,
  searchHelpTool,
  startTourTool,
  getRateLimitsTool,
  setClientTierTool,
  registerTenantTool,
  listTenantsTool,
  listPluginsTool,
  enablePluginTool,
  disablePluginTool,
  getMetricsTool,
  analyzeQueryTool,
  getOptimizationReportTool,
  handleAdvancedToolCall,
} from "./tools/advancedTools.js";

/**
 * Get all available tools
 */
export function getAllTools() {
  const tools = [
    // Connection Tools
    connectToDatabaseTool,
    listConnectionsTool,
    switchConnectionTool,
    // Query Tools
    queryTool,
    queryTransactionTool,
    explainQueryTool,
    // Schema Tools
    listTablesTool,
    getTableSchemaTool,
    listIndexesTool,
    listFunctionsTool,
    searchSchemaTool,
    createTableTool,
    dropTableTool,
    addColumnTool,
    dropColumnTool,
    createIndexTool,
    diffSchemaTool,
    // Migration Tools
    runMigrationTool,
    listMigrationsTool,
    generateMigrationTool,
    seedDataTool,
    // Data Tools
    importDataTool,
    insertRowTool,
    updateRowTool,
    deleteRowTool,
    // Admin Tools
    getDatabaseStatsTool,
    createBackupTool,
    manageAuthTool,
    manageStorageTool,
    // Subscription Tools
    subscribeTool,
    // Edge Function Tools
    deployFunctionTool,
    listEdgeFunctionsTool,
    deleteFunctionTool,
    // Monitoring Tools
    healthCheckTool,
    getConnectionStatsTool,
    getRecoveryStatsTool,
    resetCircuitBreakerTool,
    // Advanced Tools (Phases 4-9)
    getCacheStatsTool,
    clearCacheTool,
    listTemplatesTool,
    getTemplateTool,
    executeTemplateTool,
    getHelpTool,
    searchHelpTool,
    startTourTool,
    getRateLimitsTool,
    setClientTierTool,
    registerTenantTool,
    listTenantsTool,
    listPluginsTool,
    enablePluginTool,
    disablePluginTool,
    getMetricsTool,
    analyzeQueryTool,
    getOptimizationReportTool,
  ];

  // Only include AI tools if OPENAI_API_KEY is set
  if (process.env.OPENAI_API_KEY) {
    tools.push(rag, indexDirectory, indexUrl);
  }

  return tools;
}

/**
 * Register the list tools handler
 */
export function registerListToolsHandler(server) {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const allTools = getAllTools();
    const toolDetails = allTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
      output_schema: tool.output_schema,
    }));

    return { tools: toolDetails };
  });
}

/**
 * Register the call tool handler
 */
export function registerCallToolHandler(server, context) {
  // Support both context object and connectionManager for backward compatibility
  const connectionManager = context.connectionManager || context;

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Connection Tools
      if (
        [
          connectToDatabaseTool.name,
          listConnectionsTool.name,
          switchConnectionTool.name,
        ].includes(name)
      ) {
        return await handleConnectionToolCall(name, args, connectionManager);
      }

      // Query Tools
      if (
        [
          queryTool.name,
          queryTransactionTool.name,
          explainQueryTool.name,
        ].includes(name)
      ) {
        return await handleQueryToolCall(name, args, connectionManager);
      }

      // AI Tools (only if OPENAI_API_KEY is set)
      if ([rag.name, indexDirectory.name, indexUrl.name].includes(name)) {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error(
            `Tool '${name}' requires OPENAI_API_KEY environment variable to be set. AI/RAG tools are optional and only needed for embeddings and semantic search features.`,
          );
        }
        const tool = getAllTools().find((t) => t.name === name);
        const result = await tool.execute(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Schema Tools
      if (
        [
          listTablesTool.name,
          getTableSchemaTool.name,
          listIndexesTool.name,
          listFunctionsTool.name,
          searchSchemaTool.name,
          createTableTool.name,
          dropTableTool.name,
          addColumnTool.name,
          dropColumnTool.name,
          createIndexTool.name,
          diffSchemaTool.name,
        ].includes(name)
      ) {
        return await handleSchemaToolCall(name, args, connectionManager);
      }

      // Migration Tools
      if (
        [
          runMigrationTool.name,
          listMigrationsTool.name,
          generateMigrationTool.name,
          seedDataTool.name,
        ].includes(name)
      ) {
        return await handleMigrationToolCall(name, args, connectionManager);
      }

      // Data Tools
      if (
        [
          importDataTool.name,
          insertRowTool.name,
          updateRowTool.name,
          deleteRowTool.name,
        ].includes(name)
      ) {
        return await handleDataToolCall(name, args, connectionManager);
      }

      // Admin Tools
      if (
        [
          getDatabaseStatsTool.name,
          createBackupTool.name,
          manageAuthTool.name,
          manageStorageTool.name,
        ].includes(name)
      ) {
        return await handleAdminToolCall(name, args, connectionManager);
      }

      // Subscription Tools
      if (name === subscribeTool.name) {
        return await handleSubscriptionToolCall(name, args, connectionManager);
      }

      // Edge Function Tools
      if (
        [
          deployFunctionTool.name,
          listEdgeFunctionsTool.name,
          deleteFunctionTool.name,
        ].includes(name)
      ) {
        return await handleEdgeFunctionToolCall(name, args);
      }

      // Monitoring Tools
      if (
        [
          healthCheckTool.name,
          getConnectionStatsTool.name,
          getRecoveryStatsTool.name,
          resetCircuitBreakerTool.name,
        ].includes(name)
      ) {
        return await handleMonitoringToolCall(name, args, connectionManager);
      }

      // Advanced Tools (Phases 4-9)
      if (
        [
          getCacheStatsTool.name,
          clearCacheTool.name,
          listTemplatesTool.name,
          getTemplateTool.name,
          executeTemplateTool.name,
          getHelpTool.name,
          searchHelpTool.name,
          startTourTool.name,
          getRateLimitsTool.name,
          setClientTierTool.name,
          registerTenantTool.name,
          listTenantsTool.name,
          listPluginsTool.name,
          enablePluginTool.name,
          disablePluginTool.name,
          getMetricsTool.name,
          analyzeQueryTool.name,
          getOptimizationReportTool.name,
        ].includes(name)
      ) {
        return await handleAdvancedToolCall(name, args, context);
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: `Error in tool '${name}': ${error.message}`,
                stack: error.stack,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  });
}

/**
 * Register all handlers
 */
export function registerHandlers(server, context) {
  registerListToolsHandler(server);
  registerCallToolHandler(server, context);
}
