#!/usr/bin/env node
import { startServer } from "./src/server.js";

startServer().catch((error) => {
  console.error("Fatal error starting Home Automax MCP server:", error);
  process.exit(1);
});
