#!/usr/bin/env node

/**
 * iOS Simulator MCP Server - Interactive Setup
 * Run after: npm install -g mcp-ios-simulator
 * Then: ios-simulator-setup
 */

import readline from "readline";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

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

function checkCommand(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  log(
    "\n╔═══════════════════════════════════════════════════════════╗",
    "bright",
  );
  log("║   📱 iOS Simulator MCP Server - Easy Setup              ║", "bright");
  log(
    "╚═══════════════════════════════════════════════════════════╝\n",
    "bright",
  );

  // Check if on macOS
  if (process.platform !== "darwin") {
    log("❌ This server only works on macOS!\n", "red");
    log("The iOS Simulator MCP server requires:", "yellow");
    log("  • macOS operating system", "cyan");
    log("  • Xcode installed", "cyan");
    log("  • ios_webkit_debug_proxy\n", "cyan");
    rl.close();
    process.exit(1);
  }

  log("Checking prerequisites...\n", "blue");

  // Check Xcode
  const hasXcode = checkCommand("xcrun");
  log(
    `${hasXcode ? "✓" : "✗"} Xcode: ${hasXcode ? "Found" : "Not found"}`,
    hasXcode ? "green" : "red",
  );

  if (!hasXcode) {
    log("\n⚠️  Please install Xcode from the Mac App Store first!\n", "yellow");
    rl.close();
    process.exit(1);
  }

  // Check ios_webkit_debug_proxy
  const hasProxy = checkCommand("ios_webkit_debug_proxy");
  log(
    `${hasProxy ? "✓" : "✗"} ios_webkit_debug_proxy: ${hasProxy ? "Found" : "Not found"}`,
    hasProxy ? "green" : "red",
  );

  if (!hasProxy) {
    log("\n⚠️  ios_webkit_debug_proxy not found!", "yellow");
    log("Install with: brew install ios-webkit-debug-proxy\n", "cyan");

    const install = await question("Install now using Homebrew? (Y/n): ");
    if (install.toLowerCase() !== "n") {
      try {
        log("\nInstalling ios_webkit_debug_proxy...\n", "blue");
        execSync("brew install ios-webkit-debug-proxy", { stdio: "inherit" });
        log("\n✓ Installed successfully!", "green");
      } catch (error) {
        log("\n❌ Installation failed. Please install manually.", "red");
        rl.close();
        process.exit(1);
      }
    } else {
      log(
        "\nPlease install ios_webkit_debug_proxy and run this setup again.\n",
        "yellow",
      );
      rl.close();
      process.exit(0);
    }
  }

  log("\n━━━ Configuration ━━━\n", "bright");

  const config = {};

  // ios_webkit_debug_proxy path
  let proxyPath;
  try {
    proxyPath = execSync("which ios_webkit_debug_proxy").toString().trim();
  } catch {
    proxyPath = "/usr/local/bin/ios_webkit_debug_proxy";
  }

  log(`Default path: ${proxyPath}\n`, "cyan");
  const customPath = await question(
    "Use custom path? (press Enter to use default): ",
  );
  config.IOS_WEBKIT_PROXY_BINARY = customPath.trim() || proxyPath;

  // WebDriverAgent (optional)
  log("\n━━━ WebDriverAgent (Optional) ━━━\n", "bright");
  log("WebDriverAgent enables advanced automation features:", "blue");
  log("  • Tap, swipe, and gesture automation", "cyan");
  log("  • Native element interaction", "cyan");
  log("  • Advanced UI testing\n", "cyan");

  const wantsWDA = await question("Configure WebDriverAgent? (y/N): ");

  if (wantsWDA.toLowerCase() === "y") {
    log("\nWebDriverAgent setup:", "yellow");
    log("1. Clone: git clone https://github.com/appium/WebDriverAgent", "cyan");
    log("2. Open WebDriverAgent.xcodeproj in Xcode", "cyan");
    log("3. Select a development team for signing", "cyan");
    log("4. Build the project\n", "cyan");

    const wdaPath = await question("Path to WebDriverAgent directory: ");
    if (wdaPath && wdaPath.trim()) {
      config.WEBDRIVERAGENT_PROJECT_PATH = wdaPath.trim();
    }
  }

  // Client configuration
  log("\n━━━ AI Client Configuration ━━━\n", "bright");
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
  log("1. Start an iOS Simulator from Xcode", "yellow");
  log("2. Restart your AI client", "yellow");
  log('3. Test with: "List available iOS simulators"\n', "yellow");

  log("Useful commands:", "blue");
  log("  • List simulators: xcrun simctl list devices", "cyan");
  log("  • Boot simulator: xcrun simctl boot <UDID>", "cyan");
  log("  • Open Simulator app: open -a Simulator\n", "cyan");

  log("Documentation: https://github.com/KodyDennon/mcp-servers", "blue");
  log("Issues: https://github.com/KodyDennon/mcp-servers/issues\n", "blue");

  rl.close();
}

function generateClientConfigs(config) {
  const globalInstall = {
    command: "npx",
    args: ["mcp-ios-simulator"],
    env: { ...config },
  };

  return {
    claude: {
      mcpServers: {
        "ios-simulator": globalInstall,
      },
    },
    cursor: {
      mcpServers: {
        "ios-simulator": globalInstall,
      },
    },
    vscode: {
      "mcp-ios-simulator": globalInstall,
    },
    windsurf: {
      mcpServers: {
        "ios-simulator": globalInstall,
      },
    },
  };
}

async function setupClaudeDesktop(config) {
  log("\n━━━ Claude Desktop Setup ━━━\n", "bright");

  const configPath = path.join(
    os.homedir(),
    "Library/Application Support/Claude/claude_desktop_config.json",
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
  existingConfig.mcpServers["ios-simulator"] =
    config.mcpServers["ios-simulator"];

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
  log("Add this to Cursor Settings → MCP:\n", "yellow");
  log(JSON.stringify(config, null, 2), "cyan");

  const configPath = path.join(os.homedir(), ".cursor", "mcp_config.json");
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
  log("Add this to Windsurf Settings → MCP:\n", "yellow");
  log(JSON.stringify(config, null, 2), "cyan");

  const configPath = path.join(os.homedir(), ".windsurf", "mcp_config.json");
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
  log(`${envVars} npx mcp-ios-simulator`, "cyan");
}

rl.on("SIGINT", () => {
  log("\n\nSetup cancelled.\n", "yellow");
  process.exit(0);
});

main().catch((error) => {
  log(`\n❌ Error: ${error.message}\n`, "red");
  process.exit(1);
});
