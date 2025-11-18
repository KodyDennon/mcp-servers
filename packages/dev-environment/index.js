#!/usr/bin/env node
import { startServer } from "./src/server.js";

// Start the server
startServer().catch((error) => {
  console.error("Fatal error starting Dev Environment MCP server:", error);
  process.exit(1);
});
