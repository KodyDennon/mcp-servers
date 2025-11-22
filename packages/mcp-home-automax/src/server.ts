/**
 * Home Automax MCP Server
 * Main server implementation
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { LoggerFactory, Logger } from "./utils/Logger.js";
import { createErrorResponse, safeExecute } from "./utils/errorHandler.js";

import { HomeGraph } from "./home-graph/HomeGraph.js";
import { AdapterManager } from "./adapters/AdapterManager.js";
import { FakeAdapter } from "./adapters/FakeAdapter.js";
import { HomeAssistantAdapter, type HomeAssistantConfig } from "./adapters/HomeAssistantAdapter.js";
import { MqttAdapter, type MqttAdapterConfig } from "./adapters/MqttAdapter.js";
import { Zigbee2MqttAdapter, type Zigbee2MqttAdapterConfig } from "./adapters/Zigbee2MqttAdapter.js";
import { ZwaveAdapter, type ZwaveAdapterConfig } from "./adapters/ZwaveAdapter.js";
import { PolicyEngine } from "./policy/PolicyEngine.js";
import { ConfigManager } from "./config/ConfigManager.js";
import { getDeviceTools, handleDeviceToolCall } from "./tools/deviceTools.js";
import { getSceneTools, handleSceneToolCall } from "./tools/sceneTools.js";
import { getResources, handleResourceRead } from "./tools/resourceTools.js";

dotenv.config();

// Initialize logging from environment
LoggerFactory.setLogLevelFromEnv();

/**
 * Start the MCP server
 */
export async function startServer() {
  const logger: Logger = LoggerFactory.getLogger('Server');

  try {
    logger.info('Starting mcp-home-automax server');

    // Initialize configuration
    const configManager = ConfigManager.fromEnvironment();
    const serverInfo = configManager.getServerInfo();

    logger.info('Configuration loaded', {
      serverName: serverInfo.name,
      version: serverInfo.version,
      logLevel: serverInfo.logLevel,
    });

  // Initialize core components
  const homeGraph = new HomeGraph();
  const adapterManager = new AdapterManager();
  const policyEngine = new PolicyEngine(configManager.getPolicyConfig());

  // Initialize adapters from configuration
  const adapterConfigs = configManager.getEnabledAdapterConfigs();
  logger.info(`Initializing ${adapterConfigs.length} adapters`);

  for (const adapterConfig of adapterConfigs) {
    try {
      const priority = (adapterConfig.priority as number) || 0;

      logger.debug(`Registering adapter: ${adapterConfig.id} (${adapterConfig.type})`);

      if (adapterConfig.type === "fake") {
        const adapter = new FakeAdapter(adapterConfig);
        adapterManager.registerAdapter(adapter, priority);
      } else if (adapterConfig.type === "homeassistant") {
        const adapter = new HomeAssistantAdapter(adapterConfig as HomeAssistantConfig);
        adapterManager.registerAdapter(adapter, priority);
      } else if (adapterConfig.type === "mqtt") {
        const adapter = new MqttAdapter(adapterConfig as MqttAdapterConfig);
        adapterManager.registerAdapter(adapter, priority);
      } else if (adapterConfig.type === "zigbee2mqtt") {
        const adapter = new Zigbee2MqttAdapter(adapterConfig as Zigbee2MqttAdapterConfig);
        adapterManager.registerAdapter(adapter, priority);
      } else if (adapterConfig.type === "zwave") {
        const adapter = new ZwaveAdapter(adapterConfig as ZwaveAdapterConfig);
        adapterManager.registerAdapter(adapter, priority);
      } else {
        logger.warn(`Unknown adapter type: ${adapterConfig.type}`, { adapterId: adapterConfig.id });
      }
    } catch (error) {
      logger.error(`Failed to register adapter ${adapterConfig.id}`, error);
      // Continue with other adapters even if one fails
    }
  }

  // Initialize all adapters with error handling
  await safeExecute(
    () => adapterManager.initializeAll(),
    {
      operationName: 'Adapter initialization',
      timeoutMs: 60000,
      retries: 2,
    }
  );

  // Sync home graph with adapters
  logger.info('Discovering devices, scenes, and areas');

  const [devices, scenes, areas] = await Promise.all([
    safeExecute(() => adapterManager.discoverAllDevices(), {
      operationName: 'Device discovery',
      timeoutMs: 30000,
    }),
    safeExecute(() => adapterManager.discoverAllScenes(), {
      operationName: 'Scene discovery',
      timeoutMs: 30000,
    }),
    safeExecute(() => adapterManager.discoverAllAreas(), {
      operationName: 'Area discovery',
      timeoutMs: 30000,
    }),
  ]);

  // Populate home graph
  areas.forEach((area) => homeGraph.setArea(area));
  devices.forEach((device) => homeGraph.setDevice(device));
  scenes.forEach((scene) => homeGraph.setScene(scene));

  const stats = homeGraph.getStats();
  logger.info("Home graph initialized", stats);
  console.error(JSON.stringify(stats, null, 2));

  // Create MCP server
  const server = new Server(
    {
      name: serverInfo.name,
      version: serverInfo.version,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Get all tools
  const allTools = [...getDeviceTools(), ...getSceneTools()];

  // Handle list_tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allTools,
    };
  });

  // Handle call_tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.debug(`Tool called: ${name}`, { args });

    try {
      // Route to appropriate tool handler
      if (
        name.startsWith("home_list_scenes") ||
        name.startsWith("home_get_scene") ||
        name.startsWith("home_find_scenes") ||
        name.startsWith("home_run_scene") ||
        name.startsWith("home_get_context") ||
        name.startsWith("home_list_groups") ||
        name.startsWith("home_set_group")
      ) {
        return await handleSceneToolCall(
          name,
          args || {},
          homeGraph,
          adapterManager,
          policyEngine
        );
      } else if (name.startsWith("home_")) {
        return await handleDeviceToolCall(
          name,
          args || {},
          homeGraph,
          adapterManager,
          policyEngine
        );
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error: unknown) {
      logger.error(`Tool ${name} failed`, error);
      return createErrorResponse(error, name);
    }
  });

  // Handle list_resources request
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: getResources(),
    };
  });

  // Handle read_resource request
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    logger.debug(`Resource read: ${uri}`);

    try {
      return await handleResourceRead(uri, homeGraph, policyEngine);
    } catch (error: unknown) {
      logger.error(`Resource read failed: ${uri}`, error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error reading resource ${uri}: ${errorMessage}`);
    }
  });

    // Start the server
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info("MCP Server started successfully on stdio");
    console.error("Home Automax MCP Server running on stdio");

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down server...");
      console.error("Shutting down...");
      await adapterManager.shutdownAll();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logger.error("Failed to start server", error);
    console.error("Fatal error starting server:", error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  const logger = LoggerFactory.getLogger('Process');
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const logger = LoggerFactory.getLogger('Process');
  logger.error('Unhandled promise rejection', reason instanceof Error ? reason : new Error(String(reason)));
});
