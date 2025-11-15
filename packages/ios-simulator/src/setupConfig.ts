import os from "node:os";
import path from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";

interface Options {
  configPath?: string;
  defaultDevice?: string;
}

function parseArgs(args: string[]): Options {
  const options: Options = {};
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

function resolveConfigPath(explicit?: string) {
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

async function readConfig(filePath: string) {
  try {
    const contents = await readFile(filePath, "utf8");
    return JSON.parse(contents) as Record<string, unknown>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function installConfig(args: string[]) {
  const options = parseArgs(args);
  const configPath = resolveConfigPath(options.configPath);
  const configDir = path.dirname(configPath);

  await mkdir(configDir, { recursive: true });
  const config = await readConfig(configPath);
  const servers =
    (config.mcpServers as Record<string, unknown>) ?? (config.mcpServers = {});

  const entry: Record<string, unknown> = {
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
