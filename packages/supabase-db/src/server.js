import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConnectionManager } from "./connectionManager.js";
import { registerHandlers } from "./handlers.js";
import { registerCodeApiHandlers } from "./code-api-handler.js";
import { loadConfig, ensureEnvironment, promptForMode } from "./config.js";

const SERVER_VERSION = "3.2.0";
const SERVER_NAME = "supabase-db";

/**
 * Create and configure the MCP server
 */
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

/**
 * Initialize and start the server
 */
export async function startServer() {
  // Load configuration
  await loadConfig();

  // Ensure required environment variables are present
  await ensureEnvironment();

  // Prompt for mode selection if not set (interactive mode only)
  const MCP_MODE = await promptForMode();

  // Create server and connection manager
  const server = createServer();
  const connectionManager = new ConnectionManager();

  // Register request handlers based on mode
  if (MCP_MODE === "code-api") {
    console.error(`Starting Supabase DB MCP Server in CODE EXECUTION mode`);
    registerCodeApiHandlers(server, connectionManager);
  } else {
    console.error(`Starting Supabase DB MCP Server in DIRECT TOOL mode`);
    registerHandlers(server, connectionManager);
  }

  // Start the server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`Server ready! Mode: ${MCP_MODE}`);

  return { server, connectionManager, transport };
}
