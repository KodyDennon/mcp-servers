import os from "node:os";
import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--config" && i + 1 < args.length) {
      options.configPath = args[i + 1];
      i += 1;
    } else if (arg === "--device" && i + 1 < args.length) {
      options.defaultDevice = args[i + 1];
      i += 1;
    }
  }
  return options;
}
function resolveConfigPath(explicit) {
  if (explicit) {
    return path.resolve(explicit);
  }
  if (process.env.MCP_CONFIG_PATH) {
    return path.resolve(process.env.MCP_CONFIG_PATH);
  }
  const claudePath = path.join(os.homedir(), ".claude", "config.json");
  if (process.env.HOME && process.platform === "darwin") {
    return claudePath;
  }
  return path.join(os.homedir(), ".mcp.json");
}
async function readConfig(filePath) {
  try {
    const contents = await readFile(filePath, "utf8");
    return JSON.parse(contents);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}
export async function installConfig(args) {
  const options = parseArgs(args);
  const configPath = resolveConfigPath(options.configPath);
  const configDir = path.dirname(configPath);
  await mkdir(configDir, { recursive: true });
  const config = await readConfig(configPath);
  const servers = config.mcpServers ?? (config.mcpServers = {});
  const entry = {
    command: "ios-simulator-mcp",
  };
  if (options.defaultDevice) {
    entry.env = {
      IOS_SIM_DEFAULT_DEVICE: options.defaultDevice,
    };
  }
  servers["ios-simulator"] = entry;
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
  console.log("✅ Added ios-simulator MCP server to config:");
  console.log(`   ${configPath}`);
  console.log(
    "\nRestart your MCP-aware client (Claude Desktop, etc.) to pick up the change.",
  );
}
//# sourceMappingURL=setupConfig.js.map
