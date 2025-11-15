import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerHandlers } from "./handlers.js";
import { loadConfig } from "./config.js";
import { ensureEnvironment } from "./environment.js";
import { SimulatorManager } from "./simulatorManager.js";
import { InspectorManager } from "./inspector/index.js";
import { AutomationManager } from "./automation/automationManager.js";

const SERVER_NAME = "ios-simulator";
const SERVER_VERSION = "0.1.0";

export function createServer() {
  return new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
}

export async function startServer() {
  const config = await loadConfig();
  await ensureEnvironment({
    webkitProxy: config.iosWebkitProxyBinary,
    webDriverAgentProjectPath: config.webDriverAgentProjectPath,
  });

  const simulatorManager = new SimulatorManager(config);
  const inspectorManager = new InspectorManager(config, simulatorManager);
  const automationManager = new AutomationManager(config, simulatorManager);
  const server = createServer();

  registerHandlers(server, {
    simulator: simulatorManager,
    inspector: inspectorManager,
    automation: automationManager,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("iOS Simulator MCP server ready.");

  const shutdown = async () => {
    console.error("Shutting down iOS Simulator MCP server...");
    await inspectorManager.shutdown();
    await automationManager.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return {
    server,
    transport,
    simulatorManager,
    inspectorManager,
    automationManager,
  };
}
