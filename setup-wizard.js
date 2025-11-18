#!/usr/bin/env node

/**
 * MCP Servers Interactive Setup Wizard
 * Makes it super easy to configure your MCP servers
 */

import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ANSI colors for better UX
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
  log("║   🚀 MCP Servers Interactive Setup Wizard               ║", "bright");
  log("║   Making configuration super easy!                       ║", "bright");
  log(
    "╚═══════════════════════════════════════════════════════════╝\n",
    "bright",
  );

  log("This wizard will help you configure your MCP servers.\n", "blue");
  log("Press Ctrl+C at any time to exit.\n");

  // Ask which server to configure
  log("Which MCP server would you like to configure?\n");
  log("1. Supabase DB MCP Server", "green");
  log("2. iOS Simulator MCP Server (macOS only)", "green");
  log("3. Both\n", "green");

  const serverChoice = await question("Enter your choice (1-3): ");

  const config = {};

  if (serverChoice === "1" || serverChoice === "3") {
    log("\n━━━ Supabase DB Configuration ━━━\n", "bright");
    await configureSupabaseDB(config);
  }

  if (serverChoice === "2" || serverChoice === "3") {
    log("\n━━━ iOS Simulator Configuration ━━━\n", "bright");
    await configureIOSSimulator(config);
  }

  // Generate .env file
  await generateEnvFile(config);

  // Generate Claude Desktop config
  await generateClaudeConfig(config);

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
  log("1. Review your .env file and update any values", "yellow");
  log(
    "2. If using Claude Desktop, copy the config to your Claude settings",
    "yellow",
  );
  log("3. Run the servers:", "yellow");
  log("   • Supabase DB: npm run start --filter mcp-supabase-db", "cyan");
  log("   • iOS Simulator: npm run start --filter mcp-ios-simulator", "cyan");
  log(
    "\nFor more help, visit: https://github.com/KodyDennon/mcp-servers\n",
    "blue",
  );

  rl.close();
}

async function configureSupabaseDB(config) {
  log("Let's configure your Supabase database connection.\n", "blue");

  // Database URL
  log("You can find your PostgreSQL connection URL at:");
  log(
    "Supabase Dashboard → Project Settings → Database → Connection String → URI\n",
    "yellow",
  );

  const dbUrl = await question("PostgreSQL URL (non-pooling): ");
  if (dbUrl && dbUrl.trim()) {
    config.POSTGRES_URL_NON_POOLING = dbUrl.trim();
  }

  // Supabase URL (optional)
  log("\nOptional: For Supabase-specific features");
  log("Supabase Dashboard → Project Settings → API → Project URL\n", "yellow");

  const supabaseUrl = await question("Supabase URL (press Enter to skip): ");
  if (supabaseUrl && supabaseUrl.trim()) {
    config.SUPABASE_URL = supabaseUrl.trim();
  }

  // Anon key (optional)
  log("\nOptional: Supabase Anon Key (for client operations)\n", "yellow");
  const anonKey = await question("Supabase Anon Key (press Enter to skip): ");
  if (anonKey && anonKey.trim()) {
    config.SUPABASE_SECRET_KEY = anonKey.trim();
  }

  // Service role key (optional)
  log("\nOptional: Supabase Service Role Key (for admin operations)");
  log(
    "⚠️  WARNING: This key bypasses Row Level Security. Keep it secret!\n",
    "red",
  );
  const serviceKey = await question("Service Role Key (press Enter to skip): ");
  if (serviceKey && serviceKey.trim()) {
    config.SUPABASE_SERVICE_ROLE_KEY = serviceKey.trim();
  }

  // MCP Mode
  log("\n━━━ MCP Mode Selection ━━━\n", "bright");
  log("Choose your MCP operation mode:\n");
  log(
    "1. Direct Tool Mode (traditional MCP - recommended for most users)",
    "green",
  );
  log("2. Code Execution Mode (98% token reduction, privacy-first)\n", "green");

  const modeChoice = await question("Enter your choice (1-2) [default: 1]: ");
  config.MCP_MODE = modeChoice === "2" ? "code-api" : "direct";

  log(`\n✓ MCP Mode set to: ${config.MCP_MODE}`, "green");
}

async function configureIOSSimulator(config) {
  log("Let's configure your iOS Simulator server.\n", "blue");
  log(
    "⚠️  Note: This server only works on macOS with Xcode installed.\n",
    "yellow",
  );

  // ios_webkit_debug_proxy
  log("Path to ios_webkit_debug_proxy binary:");
  log("Default: /usr/local/bin/ios_webkit_debug_proxy");
  log("Install with: brew install ios-webkit-debug-proxy\n", "yellow");

  const proxyPath = await question(
    "ios_webkit_debug_proxy path [press Enter for default]: ",
  );
  config.IOS_WEBKIT_PROXY_BINARY =
    proxyPath && proxyPath.trim()
      ? proxyPath.trim()
      : "/usr/local/bin/ios_webkit_debug_proxy";

  // WebDriverAgent (optional)
  log("\nOptional: Path to WebDriverAgent project");
  log("Only needed for automation features");
  log("Clone from: https://github.com/appium/WebDriverAgent\n", "yellow");

  const wdaPath = await question("WebDriverAgent path (press Enter to skip): ");
  if (wdaPath && wdaPath.trim()) {
    config.WEBDRIVERAGENT_PROJECT_PATH = wdaPath.trim();
  }

  log("\n✓ iOS Simulator configured", "green");
}

async function generateEnvFile(config) {
  log("\n━━━ Generating .env file ━━━\n", "bright");

  const envPath = path.join(__dirname, ".env");
  const examplePath = path.join(__dirname, ".env.example");

  // Read example if it exists
  let envContent = "";

  if (fs.existsSync(examplePath)) {
    envContent = fs.readFileSync(examplePath, "utf8");
  } else {
    // Create basic template
    envContent = "# MCP Servers Configuration\n# Generated by setup wizard\n\n";
  }

  // Append/update with user values
  envContent += "\n# User Configuration\n";
  envContent += "# Generated on: " + new Date().toISOString() + "\n\n";

  for (const [key, value] of Object.entries(config)) {
    envContent += `${key}=${value}\n`;
  }

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question(
      "\n.env file already exists. Overwrite? (y/N): ",
    );
    if (overwrite.toLowerCase() !== "y") {
      log(
        "\n.env file not modified. Configuration saved to .env.new",
        "yellow",
      );
      fs.writeFileSync(path.join(__dirname, ".env.new"), envContent);
      return;
    }
  }

  fs.writeFileSync(envPath, envContent);
  log("\n✓ .env file created successfully!", "green");
}

async function generateClaudeConfig(config) {
  log("\n━━━ Claude Desktop Configuration ━━━\n", "bright");

  const useClaudeDesktop = await question(
    "Are you using Claude Desktop? (y/N): ",
  );

  if (useClaudeDesktop.toLowerCase() !== "y") {
    return;
  }

  const claudeConfig = {
    mcpServers: {},
  };

  if (config.POSTGRES_URL_NON_POOLING) {
    claudeConfig.mcpServers["supabase-db"] = {
      command: "node",
      args: [path.join(__dirname, "packages/supabase-db/index.js")],
      env: {
        POSTGRES_URL_NON_POOLING: config.POSTGRES_URL_NON_POOLING,
        MCP_MODE: config.MCP_MODE || "direct",
      },
    };

    if (config.SUPABASE_URL) {
      claudeConfig.mcpServers["supabase-db"].env.SUPABASE_URL =
        config.SUPABASE_URL;
    }
    if (config.SUPABASE_SECRET_KEY) {
      claudeConfig.mcpServers["supabase-db"].env.SUPABASE_SECRET_KEY =
        config.SUPABASE_SECRET_KEY;
    }
    if (config.SUPABASE_SERVICE_ROLE_KEY) {
      claudeConfig.mcpServers["supabase-db"].env.SUPABASE_SERVICE_ROLE_KEY =
        config.SUPABASE_SERVICE_ROLE_KEY;
    }
  }

  if (config.IOS_WEBKIT_PROXY_BINARY) {
    claudeConfig.mcpServers["ios-simulator"] = {
      command: "node",
      args: [path.join(__dirname, "packages/ios-simulator/index.js")],
      env: {
        IOS_WEBKIT_PROXY_BINARY: config.IOS_WEBKIT_PROXY_BINARY,
      },
    };

    if (config.WEBDRIVERAGENT_PROJECT_PATH) {
      claudeConfig.mcpServers["ios-simulator"].env.WEBDRIVERAGENT_PROJECT_PATH =
        config.WEBDRIVERAGENT_PROJECT_PATH;
    }
  }

  const configPath = path.join(__dirname, "claude-desktop-config.json");
  fs.writeFileSync(configPath, JSON.stringify(claudeConfig, null, 2));

  log(
    "\n✓ Claude Desktop config saved to: claude-desktop-config.json",
    "green",
  );
  log("\nTo use this config:", "blue");
  log("1. Open Claude Desktop", "cyan");
  log("2. Go to Settings → Developer → Edit Config", "cyan");
  log(
    "3. Copy the contents of claude-desktop-config.json to your config\n",
    "cyan",
  );
}

// Handle Ctrl+C gracefully
rl.on("SIGINT", () => {
  log("\n\nSetup cancelled. No changes were made.\n", "yellow");
  process.exit(0);
});

// Run the wizard
main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, "red");
  process.exit(1);
});
