import Conf from "conf";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { ConfigSchema } from "./schema.js";
import { ConfigurationError } from "../errors/errors.js";
import { logger } from "../utils/logger.js";
/**
 * Configuration manager supporting multiple sources:
 * 1. .depmanagerrc.json (project-level)
 * 2. Global config (~/.config/dependency-manager/config.json)
 * 3. Environment variables
 * 4. Defaults from schema
 */
export class ConfigManager {
  static instance;
  globalConfig;
  projectConfig = null;
  mergedConfig = null;
  constructor() {
    this.globalConfig = new Conf({
      projectName: "dependency-manager",
      schema: {
        type: "object",
        properties: {},
      },
    });
  }
  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  /**
   * Load project-specific configuration from .depmanagerrc.json
   */
  async loadProjectConfig(directory) {
    try {
      const configPath = resolve(directory, ".depmanagerrc.json");
      const content = await readFile(configPath, "utf-8");
      const parsed = JSON.parse(content);
      // Validate with Zod schema
      this.projectConfig = ConfigSchema.parse(parsed);
      logger.info("Loaded project configuration", { directory });
    } catch (error) {
      if (error.code === "ENOENT") {
        // No project config found, that's ok
        this.projectConfig = null;
        logger.debug("No project configuration found", { directory });
      } else {
        throw new ConfigurationError(
          `Failed to load project configuration: ${error}`,
          error,
        );
      }
    }
    // Rebuild merged config
    this.buildMergedConfig();
  }
  /**
   * Get configuration value
   */
  get(key) {
    const config = this.getConfig();
    return config[key];
  }
  /**
   * Set global configuration value
   */
  set(key, value) {
    this.globalConfig.set(key, value);
    this.buildMergedConfig();
  }
  /**
   * Get full merged configuration
   */
  getConfig() {
    if (!this.mergedConfig) {
      this.buildMergedConfig();
    }
    return this.mergedConfig;
  }
  /**
   * Build merged configuration from all sources
   * Priority: Project > Global > Environment > Defaults
   */
  buildMergedConfig() {
    // Start with defaults (from schema)
    const defaults = ConfigSchema.parse({});
    // Merge with global config
    const globalData = this.globalConfig.store;
    const withGlobal = { ...defaults, ...globalData };
    // Merge with project config
    const withProject = this.projectConfig
      ? this.mergeDeep(withGlobal, this.projectConfig)
      : withGlobal;
    // Apply environment variables
    const withEnv = this.applyEnvironmentVariables(withProject);
    // Final validation
    try {
      this.mergedConfig = ConfigSchema.parse(withEnv);
    } catch (error) {
      throw new ConfigurationError(`Invalid configuration: ${error}`, error);
    }
  }
  /**
   * Apply environment variable overrides
   */
  applyEnvironmentVariables(config) {
    const result = { ...config };
    // LOG_LEVEL
    if (process.env.LOG_LEVEL) {
      result.logLevel = process.env.LOG_LEVEL;
    }
    // NPM_TOKEN
    if (process.env.NPM_TOKEN) {
      result.npm = { ...result.npm, token: process.env.NPM_TOKEN };
    }
    // NPM_REGISTRY
    if (process.env.NPM_REGISTRY) {
      result.npm = { ...result.npm, registry: process.env.NPM_REGISTRY };
    }
    // CACHE_ENABLED
    if (process.env.CACHE_ENABLED !== undefined) {
      result.cache = {
        ...result.cache,
        enabled: process.env.CACHE_ENABLED === "true",
      };
    }
    // RATE_LIMIT_ENABLED
    if (process.env.RATE_LIMIT_ENABLED !== undefined) {
      result.rateLimit = {
        ...result.rateLimit,
        enabled: process.env.RATE_LIMIT_ENABLED === "true",
      };
    }
    // REDIS_URL
    if (process.env.REDIS_URL) {
      result.cache = {
        ...result.cache,
        redis: {
          url: process.env.REDIS_URL,
          enabled: true,
        },
      };
    }
    return result;
  }
  /**
   * Deep merge two objects
   */
  mergeDeep(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.mergeDeep(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
  /**
   * Reset to defaults
   */
  reset() {
    this.globalConfig.clear();
    this.projectConfig = null;
    this.buildMergedConfig();
  }
  /**
   * Export current configuration to JSON
   */
  export() {
    return JSON.stringify(this.getConfig(), null, 2);
  }
}
// Export singleton instance
export const config = ConfigManager.getInstance();
//# sourceMappingURL=manager.js.map
