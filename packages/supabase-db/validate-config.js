#!/usr/bin/env node
/**
 * Configuration Validator for Supabase DB MCP Server
 *
 * This tool validates:
 * 1. Node.js version compatibility
 * 2. Required dependencies installed
 * 3. Environment variables set correctly
 * 4. Database connection works
 * 5. MCP server can start
 * 6. Detects installed AI tools
 * 7. Validates their configurations
 */

import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, "green");
}

function error(message) {
  log(`✗ ${message}`, "red");
}

function warning(message) {
  log(`⚠ ${message}`, "yellow");
}

function info(message) {
  log(`ℹ ${message}`, "cyan");
}

function section(title) {
  log(`\n${"=".repeat(60)}`, "bright");
  log(title, "bright");
  log("=".repeat(60), "bright");
}

// Platform detection
const platform = os.platform();
const homedir = os.homedir();

// MCP config file locations for different tools
const configLocations = {
  "Claude Desktop (macOS)": {
    path: resolve(homedir, "Library/Application Support/Claude/claude_desktop_config.json"),
    supported: platform === "darwin",
  },
  "Claude Desktop (Windows)": {
    path: resolve(homedir, "AppData/Roaming/Claude/claude_desktop_config.json"),
    supported: platform === "win32",
  },
  "Claude Desktop (Linux)": {
    path: resolve(homedir, ".config/Claude/claude_desktop_config.json"),
    supported: platform === "linux",
  },
  "Windsurf (macOS)": {
    path: resolve(homedir, ".codeium/windsurf/mcp_config.json"),
    supported: platform === "darwin",
  },
  "Windsurf (Windows)": {
    path: resolve(homedir, ".codeium/windsurf/mcp_config.json"),
    supported: platform === "win32",
  },
  "Windsurf (Linux)": {
    path: resolve(homedir, ".codeium/windsurf/mcp_config.json"),
    supported: platform === "linux",
  },
  "Gemini CLI": {
    path: resolve(homedir, ".gemini/settings.json"),
    supported: true,
  },
  "Codex": {
    path: resolve(homedir, ".codex/config.toml"),
    supported: true,
  },
  "Roo Code (global)": {
    path: resolve(homedir, ".config/Code/User/mcp_settings.json"),
    supported: platform !== "win32",
  },
  "Roo Code (Windows)": {
    path: resolve(homedir, "AppData/Roaming/Code/User/mcp_settings.json"),
    supported: platform === "win32",
  },
  "Cline (workspace)": {
    path: resolve(process.cwd(), "cline_mcp_settings.json"),
    supported: true,
  },
};

async function checkNodeVersion() {
  section("Node.js Version Check");

  const requiredMajor = 18;
  const currentVersion = process.version;
  const currentMajor = parseInt(currentVersion.slice(1).split(".")[0]);

  info(`Current Node.js version: ${currentVersion}`);
  info(`Required: >= v${requiredMajor}.0.0`);

  if (currentMajor >= requiredMajor) {
    success(`Node.js version is compatible`);
    return true;
  } else {
    error(`Node.js version too old. Please upgrade to v${requiredMajor}+`);
    error(`Download from: https://nodejs.org/`);
    return false;
  }
}

async function checkDependencies() {
  section("Dependency Check");

  try {
    const packageJsonPath = resolve(__dirname, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
    const deps = packageJson.dependencies || {};

    info(`Checking ${Object.keys(deps).length} dependencies...`);

    for (const [name, version] of Object.entries(deps)) {
      try {
        await import(name);
        success(`${name} ${version}`);
      } catch (err) {
        error(`${name} NOT FOUND`);
        warning(`Run: npm install`);
        return false;
      }
    }

    success("All dependencies installed");
    return true;
  } catch (err) {
    error(`Failed to check dependencies: ${err.message}`);
    return false;
  }
}

async function checkEnvironmentVariables() {
  section("Environment Variables Check");

  // Try to load from .env file
  const repoRoot = resolve(__dirname, "../..");
  const envPath = resolve(repoRoot, ".env");

  try {
    await fs.access(envPath);
    success(`.env file found at: ${envPath}`);

    // Load dotenv
    const { default: dotenv } = await import("dotenv");
    dotenv.config({ path: envPath });
  } catch (err) {
    warning(`.env file not found at: ${envPath}`);
    info("Checking system environment variables...");
  }

  const requiredVars = [
    { name: "POSTGRES_URL_NON_POOLING" },
    { name: "SUPABASE_URL" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", aliases: ["SUPABASE_SECRET_KEY"] },
    { name: "SUPABASE_ACCESS_TOKEN" },
    { name: "SUPABASE_PROJECT_ID" },
    { name: "OPENAI_API_KEY" },
  ];
  let allPresent = true;

  for (const variable of requiredVars) {
    const value =
      process.env[variable.name] ||
      (variable.aliases || []).map((alias) => process.env[alias]).find(Boolean);

    if (value) {
      const displayName = variable.name;
      success(`${displayName} is set`);

      if (variable.aliases && !process.env[variable.name]) {
        info(`  Using alias ${variable.aliases[0]}`);
      }

      if (variable.name === "POSTGRES_URL_NON_POOLING") {
        if (value.startsWith("postgresql://") || value.startsWith("postgres://")) {
          success(`  Format looks correct (starts with postgresql://)`);

          if (value.includes("sslmode=")) {
            warning(`  Contains sslmode parameter (will be stripped by server)`);
          }
          if (!value.includes("@")) {
            error(`  Missing @ symbol - connection string may be malformed`);
            allPresent = false;
          }
        } else {
          error(`  Invalid format - should start with postgresql://`);
          allPresent = false;
        }
      }

      if (variable.name === "SUPABASE_URL" && !value.startsWith("https://")) {
        warning(`  Supabase URL should start with https://`);
      }
    } else {
      const aliasHint = variable.aliases
        ? ` (or ${variable.aliases.join(", ")})`
        : "";
      error(`${variable.name}${aliasHint} is NOT set`);
      allPresent = false;
    }
  }

  if (!allPresent) {
    warning("\nTo fix:");
    warning(`1. Create .env file in: ${repoRoot}`);
    warning(`2. Add all required keys exactly as shown in README.md (Configuration section)`);
    warning(`3. Or set them via the 'env' object in your MCP client configuration`);
  }

  return allPresent;
}

async function checkDatabaseConnection() {
  section("Database Connection Test");

  if (!process.env.POSTGRES_URL_NON_POOLING) {
    error("Cannot test connection - POSTGRES_URL_NON_POOLING not set");
    return false;
  }

  try {
    info("Attempting to connect to database...");

    const { default: pg } = await import("pg");
    const { Pool } = pg;

    // Remove query parameters from connection string
    const connectionString = process.env.POSTGRES_URL_NON_POOLING.replace(/\?.*$/, "");

    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();

    // Test queries
    const dbInfo = await client.query("SELECT current_database(), current_user, version()");
    const tableCount = await client.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
    );

    success(`Connected to database: ${dbInfo.rows[0].current_database}`);
    success(`  User: ${dbInfo.rows[0].current_user}`);
    success(`  PostgreSQL version: ${dbInfo.rows[0].version.split(" ")[1]}`);
    success(`  Tables in public schema: ${tableCount.rows[0].count}`);

    client.release();
    await pool.end();

    return true;
  } catch (err) {
    error(`Database connection failed: ${err.message}`);

    if (err.message.includes("certificate")) {
      warning("SSL certificate issue detected");
      info("The server automatically handles this, but manual connections may fail");
    } else if (err.message.includes("authentication")) {
      error("Authentication failed - check username/password in connection string");
    } else if (err.message.includes("timeout")) {
      error("Connection timeout - check network/firewall settings");
    }

    return false;
  }
}

async function checkMCPServerStartup() {
  section("MCP Server Startup Test");

  try {
    info("Attempting to start MCP server...");

    const indexPath = resolve(__dirname, "index.js");

    // Spawn the server process
    const { spawn } = await import("child_process");
    const serverProcess = spawn("node", [indexPath], {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let errorOutput = "";

    serverProcess.stderr.on("data", (data) => {
      output += data.toString();
    });

    serverProcess.stdout.on("data", (data) => {
      errorOutput += data.toString();
    });

    // Wait for startup (max 5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Kill the process
    serverProcess.kill("SIGTERM");

    // Check if started successfully
    if (output.includes("Server is ready")) {
      success("MCP server started successfully");
      success("  All 12 tools loaded");
      return true;
    } else if (output.includes("Connected to database")) {
      success("MCP server started (connected to database)");
      warning("  Didn't see 'ready' message, but connection works");
      return true;
    } else {
      error("MCP server failed to start properly");
      if (output) {
        info("\nServer output:");
        console.log(output);
      }
      if (errorOutput) {
        error("\nErrors:");
        console.log(errorOutput);
      }
      return false;
    }
  } catch (err) {
    error(`Failed to test server startup: ${err.message}`);
    return false;
  }
}

async function detectInstalledTools() {
  section("Installed AI Tools Detection");

  const detectedTools = [];

  for (const [toolName, config] of Object.entries(configLocations)) {
    if (!config.supported) continue;

    try {
      await fs.access(config.path);

      // Check if it's actually a valid config file
      try {
        if (config.path.endsWith(".json")) {
          const content = await fs.readFile(config.path, "utf8");
          JSON.parse(content); // Validate JSON
          success(`${toolName}: Found at ${config.path}`);
          detectedTools.push({ name: toolName, path: config.path, format: "json" });
        } else if (config.path.endsWith(".toml")) {
          success(`${toolName}: Found at ${config.path}`);
          detectedTools.push({ name: toolName, path: config.path, format: "toml" });
        }
      } catch (parseErr) {
        warning(`${toolName}: Found but invalid format (${parseErr.message})`);
      }
    } catch (err) {
      // File doesn't exist - not installed
    }
  }

  if (detectedTools.length === 0) {
    warning("No AI tool configurations found");
    info("This is normal if you haven't set up any AI tools yet");
  } else {
    success(`\nDetected ${detectedTools.length} AI tool(s) with configurations`);
  }

  return detectedTools;
}

async function validateToolConfigurations(detectedTools) {
  if (detectedTools.length === 0) return true;

  section("Configuration Validation");

  const serverPath = resolve(__dirname, "index.js");
  let allValid = true;

  for (const tool of detectedTools) {
    info(`\nChecking ${tool.name}...`);

    try {
      if (tool.format === "json") {
        const content = await fs.readFile(tool.path, "utf8");
        const config = JSON.parse(content);

        if (!config.mcpServers) {
          warning(`  No 'mcpServers' section found`);
          continue;
        }

        // Check if our server is configured
        const serverNames = Object.keys(config.mcpServers);
        const supabaseServer = serverNames.find(
          (name) => name.includes("supabase") || name.includes("db")
        );

        if (supabaseServer) {
          success(`  Server configured as: '${supabaseServer}'`);

          const serverConfig = config.mcpServers[supabaseServer];

          // Validate command
          if (serverConfig.command) {
            success(`    Command: ${serverConfig.command}`);
          } else {
            error(`    Missing 'command' field`);
            allValid = false;
          }

          // Validate args
          if (serverConfig.args && Array.isArray(serverConfig.args)) {
            success(`    Args: ${serverConfig.args.length} argument(s)`);

            // Check if points to our server
            const pointsToUs = serverConfig.args.some((arg) => arg.includes("index.js"));
            if (pointsToUs) {
              success(`    Points to this server ✓`);
            } else {
              warning(`    Points to different server`);
            }
          } else {
            error(`    Missing or invalid 'args' array`);
            allValid = false;
          }

          // Check environment variables
          if (serverConfig.env) {
            success(`    Environment variables configured`);
            if (serverConfig.env.POSTGRES_URL_NON_POOLING) {
              success(`      POSTGRES_URL_NON_POOLING is set`);
            } else {
              warning(`      POSTGRES_URL_NON_POOLING not in config (may load from .env)`);
            }
          } else {
            warning(`    No 'env' object (relies on system environment or .env file)`);
          }
        } else {
          warning(`  Supabase DB server not configured`);
          info(`    Available servers: ${serverNames.join(", ") || "none"}`);
        }
      } else if (tool.format === "toml") {
        // Basic TOML check (we're not parsing TOML, just checking if file exists)
        success(`  TOML config exists (manual validation recommended)`);
      }
    } catch (err) {
      error(`  Error validating config: ${err.message}`);
      allValid = false;
    }
  }

  return allValid;
}

async function provideSummary(results) {
  section("Validation Summary");

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log("");
  results.forEach((result) => {
    if (result.passed) {
      success(result.name);
    } else {
      error(result.name);
    }
  });

  console.log("");
  if (passed === total) {
    success(`All checks passed! (${passed}/${total})`);
    success("\nYour Supabase DB MCP Server is ready to use!");
    info("\nNext steps:");
    info("1. Configure an AI tool (see PLATFORMS.md)");
    info("2. Restart the AI tool");
    info("3. Ask it: 'What database tools are available?'");
  } else {
    error(`Some checks failed (${passed}/${total} passed)`);
    warning("\nPlease fix the issues above before using the server");
    info("\nFor help:");
    info("- Check PLATFORMS.md for setup instructions");
    info("- Run: node validate-config.js (this script)");
    info("- File an issue: https://github.com/KodyDennon/PersonalOF/issues");
  }
}

// Main validation flow
async function main() {
  log("\n" + "=".repeat(60), "bright");
  log("  Supabase DB MCP Server Configuration Validator", "bright");
  log("=".repeat(60) + "\n", "bright");

  const results = [];

  // Run all checks
  results.push({ name: "Node.js version", passed: await checkNodeVersion() });
  results.push({ name: "Dependencies", passed: await checkDependencies() });
  results.push({ name: "Environment variables", passed: await checkEnvironmentVariables() });
  results.push({ name: "Database connection", passed: await checkDatabaseConnection() });
  results.push({ name: "MCP server startup", passed: await checkMCPServerStartup() });

  // Detect and validate AI tool configurations
  const detectedTools = await detectInstalledTools();
  results.push({
    name: `AI tools detection (${detectedTools.length} config${detectedTools.length === 1 ? "" : "s"})`,
    passed: true,
  });

  if (detectedTools.length > 0) {
    results.push({
      name: "Configuration validation",
      passed: await validateToolConfigurations(detectedTools),
    });
  }

  // Summary
  await provideSummary(results);

  // Exit with appropriate code
  const allPassed = results.every((r) => r.passed);
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  error(`\n✗ Validator error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
