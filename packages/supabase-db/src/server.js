import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConnectionManager } from "./connectionManager.js";
import { registerHandlers } from "./handlers.js";
import { registerCodeApiHandlers } from "./code-api-handler.js";
import { loadConfig, ensureEnvironment, promptForMode } from "./config.js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

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
  // Load environment variables from .env file
  const cwdEnvPath = path.resolve(process.cwd(), ".env");
  const packageEnvPath = path.resolve(
    process.cwd(),
    "node_modules/mcp-supabase-db/.env",
  );

  if (fs.existsSync(cwdEnvPath)) {
    dotenv.config({ path: cwdEnvPath });
    console.error(`Loaded .env file from project root: ${cwdEnvPath}`);
  } else if (fs.existsSync(packageEnvPath)) {
    dotenv.config({ path: packageEnvPath });
    console.error(`Loaded .env file from package backup: ${packageEnvPath}`);
  }

  // Load configuration
  await loadConfig();

  // Ensure required environment variables are present
  await ensureEnvironment();

  // Create server and connection manager
  const server = createServer();
  const connectionManager = new ConnectionManager();

  // Establish initial database connection
  try {
    await connectionManager.addConnection(
      process.env.POSTGRES_URL_NON_POOLING,
      "default",
    );
    console.error("Initial database connection established successfully.");
  } catch (error) {
    console.error(
      "Failed to establish initial database connection:",
      error.message,
    );
    // Depending on desired behavior, you might want to exit here or continue with limited functionality
    // For now, we'll let the server start but log the error.
  }

  // Prompt for mode selection if not set (interactive mode only)
  const MCP_MODE = await promptForMode();

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

  // Graceful shutdown
  const shutdown = async () => {
    console.error("Shutting down server and database connections...");
    await connectionManager.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return { server, connectionManager, transport };
}
