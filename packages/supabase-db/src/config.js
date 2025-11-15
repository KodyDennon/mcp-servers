import { promises as fs } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";
import readline from "readline";

const repoRoot = resolve(process.env.MCP_SUPABASE_ROOT || process.cwd());

const REQUIRED_ENV_VARS = [
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_ID",
];

// Optional environment variables
const OPTIONAL_ENV_VARS = [
  "OPENAI_API_KEY", // Only needed for AI/RAG features
];

const ENV_ALIASES = {
  SUPABASE_SERVICE_ROLE_KEY: ["SUPABASE_SECRET_KEY"],
  SUPABASE_URL: ["POSTGRES_URL"],
};

const ENV_DESCRIPTIONS = {
  POSTGRES_URL_NON_POOLING:
    "PostgreSQL connection string (non-pooling, direct)",
  SUPABASE_URL: "Supabase project URL (https://[project].supabase.co)",
  SUPABASE_SERVICE_ROLE_KEY:
    "Supabase service role key (never expose publicly)",
  SUPABASE_ACCESS_TOKEN: "Supabase dashboard access token (for management API)",
  SUPABASE_PROJECT_ID: "Supabase project reference (e.g. abcdefghijklmno)",
  OPENAI_API_KEY:
    "OpenAI API key for AI/RAG tools (OPTIONAL - only needed if using rag, indexDirectory, or indexUrl tools)",
};

/**
 * Load environment variables from repo root
 */
export function loadEnvConfig() {
  const envPath = resolve(repoRoot, ".env");
  console.error(`[DEBUG] repoRoot: ${repoRoot}`);
  console.error(`[DEBUG] Attempting to load .env from: ${envPath}`);
  dotenv.config({ path: envPath, quiet: true });
  console.error(
    `[DEBUG] process.env.POSTGRES_URL after dotenv: ${process.env.POSTGRES_URL}`,
  );
  console.error(
    `[DEBUG] process.env.POSTGRES_URL_NON_POOLING after dotenv: ${process.env.POSTGRES_URL_NON_POOLING}`,
  );
  console.error(
    `[DEBUG] process.env.SUPABASE_URL after dotenv: ${process.env.SUPABASE_URL}`,
  );
}

/**
 * Determine whether we can prompt the user (interactive shell)
 */
function isInteractiveShell() {
  return Boolean(
    process.stdin.isTTY && process.stdout.isTTY && !process.env.CI,
  );
}

/**
 * Check whether a variable (or its aliases) are already defined
 */
function isVariableSet(name) {
  if (process.env[name]) {
    return true;
  }
  const aliases = ENV_ALIASES[name] || [];
  return aliases.some((alias) => Boolean(process.env[alias]));
}

/**
 * Return a list of required variables that are still missing
 */
export function getMissingEnvVars() {
  return REQUIRED_ENV_VARS.filter((variable) => !isVariableSet(variable));
}

function formatVariableLabel(variable) {
  const alias = ENV_ALIASES[variable]?.[0];
  return alias ? `${variable}/${alias}` : variable;
}

/**
 * Load configuration from mcp-config.json if it exists, after loading .env
 */
export async function loadConfig() {
  loadEnvConfig();

  const configPath = resolve(repoRoot, "mcp-config.json");
  if (
    await fs
      .access(configPath)
      .then(() => true)
      .catch(() => false)
  ) {
    const configFile = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configFile);
    for (const key in config) {
      if (!process.env[key]) {
        process.env[key] = config[key];
      }
    }
  }
}

/**
 * Perform interactive setup to collect required (or missing) environment variables
 */
export async function interactiveSetup(variables = REQUIRED_ENV_VARS) {
  const envPath = getEnvPath();
  let envConfig = "";

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function question(query) {
    return new Promise((resolveQuestion) => {
      rl.question(query, resolveQuestion);
    });
  }

  console.log("Welcome to the Supabase MCP Server setup!");
  console.log("Please provide the following environment variables:");

  for (const variable of variables) {
    const description = ENV_DESCRIPTIONS[variable];
    const promptLabel = description ? `${variable} (${description})` : variable;
    const value = await question(`${promptLabel}: `);
    envConfig += `${variable}=${value}\n`;
    process.env[variable] = value;
  }

  rl.close();
  await fs.writeFile(envPath, envConfig);
  console.log(".env file created successfully!");
  dotenv.config({ path: envPath });
}

/**
 * Attempt to prompt for missing variables (only when .env is absent)
 */
async function maybePromptForEnv(missingVars) {
  if (!missingVars.length) {
    return false;
  }
  if (!(isInteractiveShell() && !(await envFileExists()))) {
    return false;
  }
  await interactiveSetup(missingVars);
  return true;
}

/**
 * Ensure required environment variables are present before starting the server
 */
export async function ensureEnvironment({ allowInteractive = true } = {}) {
  let missing = getMissingEnvVars();
  if (!missing.length) {
    return;
  }

  if (allowInteractive) {
    const prompted = await maybePromptForEnv(missing);
    if (prompted) {
      missing = getMissingEnvVars();
      if (!missing.length) {
        return;
      }
    }
  }

  const friendlyList = missing
    .map((variable) => {
      const alias = ENV_ALIASES[variable]?.[0];
      return alias ? `${variable} (or ${alias})` : variable;
    })
    .join(", ");

  throw new Error(
    `Missing required environment variables: ${friendlyList}. ` +
      `Set them via '.env' (${getEnvPath()}) or your MCP client config. ` +
      `See README.md for configuration details.`,
  );
}

/**
 * Get the path to the .env file
 */
export function getEnvPath() {
  return resolve(repoRoot, ".env");
}

/**
 * Check if .env file exists
 */
export async function envFileExists() {
  const envPath = getEnvPath();
  return await fs
    .access(envPath)
    .then(() => true)
    .catch(() => false);
}

/**
 * Interactively prompt the user to select MCP mode if not already set
 */
export async function promptForMode() {
  // If MCP_MODE is already set, don't prompt
  if (process.env.MCP_MODE) {
    return process.env.MCP_MODE;
  }

  // Only prompt in interactive shell
  if (!isInteractiveShell()) {
    return "direct"; // Default to direct mode in non-interactive environments
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function question(query) {
    return new Promise((resolveQuestion) => {
      rl.question(query, resolveQuestion);
    });
  }

  console.log("\n=== Supabase MCP Server - Mode Selection ===\n");
  console.log("Choose your MCP mode:\n");
  console.log("1. Direct Tool Mode (default)");
  console.log("   - 35+ MCP tools for database operations");
  console.log("   - Traditional tool-based approach");
  console.log("   - Best for most users\n");
  console.log("2. Code Execution Mode");
  console.log("   - 98% token reduction");
  console.log("   - Privacy-first with automatic PII filtering");
  console.log("   - Advanced code execution API");
  console.log("   - Requires additional configuration\n");

  const choice = await question("Select mode (1 or 2) [default: 1]: ");

  let mcpMode = "direct";
  let codeExecutionMode = null;

  if (choice.trim() === "2") {
    mcpMode = "code-api";

    console.log(
      "\nCode Execution Mode selected. Choose execution environment:\n",
    );
    console.log("1. Sandbox Mode (default)");
    console.log("   - Isolated execution environment");
    console.log("   - Enhanced security");
    console.log("   - Recommended for production\n");
    console.log("2. Direct Mode");
    console.log("   - Direct database access");
    console.log("   - Faster execution");
    console.log("   - Use only in trusted environments\n");

    const execChoice = await question(
      "Select execution mode (1 or 2) [default: 1]: ",
    );
    codeExecutionMode = execChoice.trim() === "2" ? "direct" : "sandbox";
  }

  rl.close();

  // Set environment variables
  process.env.MCP_MODE = mcpMode;
  if (codeExecutionMode) {
    process.env.CODE_EXECUTION_MODE = codeExecutionMode;
  }

  // Save to .env file if it exists or create it
  const envPath = getEnvPath();
  let envContent = "";

  if (await envFileExists()) {
    envContent = await fs.readFile(envPath, "utf8");
    // Remove existing MCP_MODE and CODE_EXECUTION_MODE lines
    envContent = envContent
      .split("\n")
      .filter(
        (line) =>
          !line.startsWith("MCP_MODE=") &&
          !line.startsWith("CODE_EXECUTION_MODE="),
      )
      .join("\n");
  }

  // Add mode configuration
  envContent += `\n# MCP Server Mode Configuration\nMCP_MODE=${mcpMode}\n`;
  if (codeExecutionMode) {
    envContent += `CODE_EXECUTION_MODE=${codeExecutionMode}\n`;
  }

  await fs.writeFile(envPath, envContent.trim() + "\n");

  console.log(`\n✓ Mode configuration saved to ${envPath}`);
  console.log(`  MCP_MODE: ${mcpMode}`);
  if (codeExecutionMode) {
    console.log(`  CODE_EXECUTION_MODE: ${codeExecutionMode}`);
  }
  console.log();

  return mcpMode;
}
