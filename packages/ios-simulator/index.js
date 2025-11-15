#!/usr/bin/env node
import { startServer } from "./src/server.js";
import { installConfig } from "./src/setupConfig.js";

const [command, ...rest] = process.argv.slice(2);

async function main() {
  if (command === "setup-config" || command === "config") {
    await installConfig(rest);
    return;
  }

  await startServer();
}

main().catch((error) => {
  console.error("Fatal error running iOS Simulator MCP server:", error);
  process.exit(1);
});
