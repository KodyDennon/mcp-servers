#!/usr/bin/env node

/**
 * Supabase DB MCP Server - Interactive Setup
 * Run after: npm install -g mcp-supabase-db
 * Then: supabase-db-setup
 */

import readline from "readline";
import fs from "fs";
import path from "path";
import os from "os";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset}`, resolve);
  });
}

async function main() {
  log(
    "\n╔═══════════════════════════════════════════════════════════╗",
    "bright",
  );
  log("║   🗄️  Supabase DB MCP Server - Easy Setup               ║", "bright");
  log(
    "╚═══════════════════════════════════════════════════════════╝\n",
    "bright",
  );

  log(
    "This wizard will configure your Supabase database connection.\n",
    "blue",
  );

  const config = {};

  // Step 1: Database URL
  log("━━━ Step 1: Database Connection ━━━\n", "bright");
  log("Find your PostgreSQL connection URL at:", "yellow");
  log(
    "Supabase Dashboard → Settings → Database → Connection String\n",
    "yellow",
  );
  log("Select: URI (non-pooling mode)\n", "yellow");

  const dbUrl = await question("PostgreSQL URL: ");
  if (!dbUrl || !dbUrl.trim()) {
    log("\n❌ Database URL is required!\n", "red");
    rl.close();
    process.exit(1);
  }
  config.POSTGRES_URL_NON_POOLING = dbUrl.trim();

  // Step 2: Optional Supabase features
  log("\n━━━ Step 2: Supabase Features (Optional) ━━━\n", "bright");

  const wantsSupabase = await question(
    "Enable Supabase-specific features? (y/N): ",
  );

  if (wantsSupabase.toLowerCase() === "y") {
    log("\nFind these at: Supabase Dashboard → Settings → API\n", "yellow");

    const supabaseUrl = await question("Supabase URL: ");
    if (supabaseUrl && supabaseUrl.trim()) {
      config.SUPABASE_URL = supabaseUrl.trim();
    }

    const anonKey = await question("Anon Key (public): ");
    if (anonKey && anonKey.trim()) {
      config.SUPABASE_SECRET_KEY = anonKey.trim();
    }

    log("\n⚠️  Service Role Key bypasses Row Level Security!", "red");
    const serviceKey = await question(
      "Service Role Key (admin) [Enter to skip]: ",
    );
    if (serviceKey && serviceKey.trim()) {
      config.SUPABASE_SERVICE_ROLE_KEY = serviceKey.trim();
    }
  }

  // Step 3: MCP Mode
  log("\n━━━ Step 3: Operation Mode ━━━\n", "bright");
  log("Choose how the server operates:\n");
  log("1. Direct Tool Mode - Traditional MCP (recommended for most)", "green");
  log("   → Claude calls tools directly", "cyan");
  log("   → Simple and straightforward\n", "cyan");
  log("2. Code Execution Mode - Advanced", "green");
  log("   → 98% token reduction", "cyan");
  log("   → Privacy-first PII protection", "cyan");
  log("   → Best for large datasets\n", "cyan");

  const mode = await question("Select mode (1 or 2) [default: 1]: ");
  config.MCP_MODE = mode === "2" ? "code-api" : "direct";

  log(
    `\n✓ Mode: ${config.MCP_MODE === "code-api" ? "Code Execution" : "Direct Tool"}`,
    "green",
  );

  // Step 4: Client configuration
  log("\n━━━ Step 4: Client Configuration ━━━\n", "bright");
  log("Which AI client are you using?\n");
  log("1. Claude Desktop", "green");
  log("2. Cursor IDE", "green");
  log("3. VS Code (Cline/Roo/Continue)", "green");
  log("4. Windsurf", "green");
  log("5. Other / Manual setup\n", "green");

  const client = await question("Select client (1-5): ");

  const configs = generateClientConfigs(config);

  switch (client) {
    case "1":
      await setupClaudeDesktop(configs.claude);
      break;
    case "2":
      await setupCursor(configs.cursor);
      break;
    case "3":
      await setupVSCode(configs.vscode);
      break;
    case "4":
      await setupWindsurf(configs.windsurf);
      break;
    default:
      await setupManual(config);
      break;
  }

  log(
    "\n╔═══════════════════════════════════════════════════════════╗",
    "green",
  );
  log("║   ✅ Setup Complete!                                     ║", "green");
  log(
    "╚═══════════════════════════════════════════════════════════╝\n",
    "green",
  );

  log("Next steps:\n", "bright");
  log("1. Restart your AI client", "yellow");
  log("2. The supabase-db MCP server should now be available", "yellow");
  log('3. Test with: "List all tables in my database"\n', "yellow");

  log("Documentation: https://github.com/KodyDennon/mcp-servers", "blue");
  log("Issues: https://github.com/KodyDennon/mcp-servers/issues\n", "blue");

  rl.close();
}

function generateClientConfigs(config) {
  const globalInstall = {
    command: "npx",
    args: ["mcp-supabase-db"],
    env: { ...config },
  };

  return {
    claude: {
      mcpServers: {
        "supabase-db": globalInstall,
      },
    },
    cursor: {
      mcpServers: {
        "supabase-db": globalInstall,
      },
    },
    vscode: {
      "mcp-supabase-db": globalInstall,
    },
    windsurf: {
      mcpServers: {
        "supabase-db": globalInstall,
      },
    },
  };
}

async function setupClaudeDesktop(config) {
  log("\n━━━ Claude Desktop Setup ━━━\n", "bright");

  const configPath = path.join(
    os.homedir(),
    process.platform === "darwin"
      ? "Library/Application Support/Claude/claude_desktop_config.json"
      : process.platform === "win32"
        ? "AppData/Roaming/Claude/claude_desktop_config.json"
        : ".config/Claude/claude_desktop_config.json",
  );

  log(`Config location: ${configPath}\n`, "cyan");

  let existingConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      existingConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      log("⚠️  Could not parse existing config", "yellow");
    }
  }

  existingConfig.mcpServers = existingConfig.mcpServers || {};
  existingConfig.mcpServers["supabase-db"] = config.mcpServers["supabase-db"];

  const overwrite = await question("Write to Claude Desktop config? (Y/n): ");
  if (overwrite.toLowerCase() !== "n") {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(existingConfig, null, 2));
    log("\n✓ Claude Desktop configured!", "green");
  } else {
    log("\nManual config:", "yellow");
    log(JSON.stringify(config, null, 2), "cyan");
  }
}

async function setupCursor(config) {
  log("\n━━━ Cursor IDE Setup ━━━\n", "bright");

  const configPath = path.join(os.homedir(), ".cursor", "mcp_config.json");

  log("Add this to Cursor Settings → MCP:\n", "yellow");
  log(JSON.stringify(config, null, 2), "cyan");

  const write = await question("\nWrite to ~/.cursor/mcp_config.json? (Y/n): ");
  if (write.toLowerCase() !== "n") {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    log("\n✓ Cursor configured!", "green");
  }
}

async function setupVSCode(config) {
  log("\n━━━ VS Code Setup ━━━\n", "bright");

  log("For Cline/Roo/Continue extensions:\n", "yellow");
  log("1. Open VS Code Settings", "cyan");
  log('2. Search for "MCP" or your extension name', "cyan");
  log("3. Add this configuration:\n", "cyan");
  log(JSON.stringify(config, null, 2), "cyan");
}

async function setupWindsurf(config) {
  log("\n━━━ Windsurf Setup ━━━\n", "bright");

  const configPath = path.join(os.homedir(), ".windsurf", "mcp_config.json");

  log("Add this to Windsurf Settings → MCP:\n", "yellow");
  log(JSON.stringify(config, null, 2), "cyan");

  const write = await question(
    "\nWrite to ~/.windsurf/mcp_config.json? (Y/n): ",
  );
  if (write.toLowerCase() !== "n") {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    log("\n✓ Windsurf configured!", "green");
  }
}

async function setupManual(config) {
  log("\n━━━ Manual Setup ━━━\n", "bright");

  log("Environment variables to set:\n", "yellow");
  Object.entries(config).forEach(([key, value]) => {
    log(`${key}=${value}`, "cyan");
  });

  log("\nOr run the server with:\n", "yellow");
  const envVars = Object.entries(config)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  log(`${envVars} npx mcp-supabase-db`, "cyan");
}

rl.on("SIGINT", () => {
  log("\n\nSetup cancelled.\n", "yellow");
  process.exit(0);
});

main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, "red");
  process.exit(1);
});
