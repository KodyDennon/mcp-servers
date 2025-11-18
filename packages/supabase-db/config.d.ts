/**
 * Load environment variables from repo root
 */
export function loadEnvConfig(): void;
/**
 * Return a list of required variables that are still missing
 */
export function getMissingEnvVars(): string[];
/**
 * Load configuration from mcp-config.json if it exists, after loading .env
 */
export function loadConfig(): Promise<void>;
/**
 * Perform interactive setup to collect required (or missing) environment variables
 */
export function interactiveSetup(variables?: string[]): Promise<void>;
/**
 * Ensure required environment variables are present before starting the server
 */
export function ensureEnvironment({
  allowInteractive,
}?: {
  allowInteractive?: boolean | undefined;
}): Promise<void>;
/**
 * Get the path to the .env file
 */
export function getEnvPath(): any;
/**
 * Check if .env file exists
 */
export function envFileExists(): Promise<any>;
/**
 * Interactively prompt the user to select MCP mode if not already set
 */
export function promptForMode(): Promise<any>;
//# sourceMappingURL=config.d.ts.map
