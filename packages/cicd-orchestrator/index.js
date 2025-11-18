#!/usr/bin/env node
import { startServer } from "./src/server.js";

// Start the server
startServer().catch((error) => {
  console.error("Fatal error starting CI/CD Orchestrator MCP server:", error);
  process.exit(1);
});
