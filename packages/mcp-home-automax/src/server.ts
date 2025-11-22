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

import { HomeGraph } from "./home-graph/HomeGraph.js";
import { AdapterManager } from "./adapters/AdapterManager.js";
import { FakeAdapter } from "./adapters/FakeAdapter.js";
import { PolicyEngine } from "./policy/PolicyEngine.js";
import { ConfigManager } from "./config/ConfigManager.js";
import { getDeviceTools, handleDeviceToolCall } from "./tools/deviceTools.js";
import { getResources, handleResourceRead } from "./tools/resourceTools.js";

dotenv.config();

/**
 * Start the MCP server
 */
export async function startServer() {
  // Initialize configuration
  const configManager = ConfigManager.fromEnvironment();
  const serverInfo = configManager.getServerInfo();

  // Initialize core components
  const homeGraph = new HomeGraph();
  const adapterManager = new AdapterManager();
  const policyEngine = new PolicyEngine(configManager.getPolicyConfig());

  // Initialize adapters from configuration
  const adapterConfigs = configManager.getEnabledAdapterConfigs();
  for (const adapterConfig of adapterConfigs) {
    if (adapterConfig.type === "fake") {
      const adapter = new FakeAdapter(adapterConfig);
      adapterManager.registerAdapter(adapter);
    }
    // Future adapters (Home Assistant, MQTT, etc.) will be added here
  }

  // Initialize all adapters
  await adapterManager.initializeAll();

  // Sync home graph with adapters
  const [devices, scenes, areas] = await Promise.all([
    adapterManager.discoverAllDevices(),
    adapterManager.discoverAllScenes(),
    adapterManager.discoverAllAreas(),
  ]);

  // Populate home graph
  areas.forEach((area) => homeGraph.setArea(area));
  devices.forEach((device) => homeGraph.setDevice(device));
  scenes.forEach((scene) => homeGraph.setScene(scene));

  console.error("Home graph initialized:");
  console.error(JSON.stringify(homeGraph.getStats(), null, 2));

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
  const allTools = [...getDeviceTools()];

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
      // Route to appropriate tool handler
      if (name.startsWith("home_")) {
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
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

  // Handle list_resources request
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: getResources(),
    };
  });

  // Handle read_resource request
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      return await handleResourceRead(uri, homeGraph, policyEngine);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Error reading resource ${uri}: ${errorMessage}`);
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Home Automax MCP Server running on stdio");

  // Handle graceful shutdown
  const shutdown = async () => {
    console.error("Shutting down...");
    await adapterManager.shutdownAll();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
