import Conf from "conf";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { ConfigSchema, type Config } from "./schema.js";
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
  private static instance: ConfigManager;
  private globalConfig: Conf<Config>;
  private projectConfig: Config | null = null;
  private mergedConfig: Config | null = null;

  private constructor() {
    this.globalConfig = new Conf<Config>({
      projectName: "dependency-manager",
      schema: {
        type: "object",
        properties: {},
      } as any,
    });
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load project-specific configuration from .depmanagerrc.json
   */
  async loadProjectConfig(directory: string): Promise<void> {
    try {
      const configPath = resolve(directory, ".depmanagerrc.json");
      const content = await readFile(configPath, "utf-8");
      const parsed = JSON.parse(content);

      // Validate with Zod schema
      this.projectConfig = ConfigSchema.parse(parsed);
      logger.info("Loaded project configuration", { directory });
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        // No project config found, that's ok
        this.projectConfig = null;
        logger.debug("No project configuration found", { directory });
      } else {
        throw new ConfigurationError(`Failed to load project configuration: ${error}`, error);
      }
    }

    // Rebuild merged config
    this.buildMergedConfig();
  }

  /**
   * Get configuration value
   */
  get<K extends keyof Config>(key: K): Config[K] {
    const config = this.getConfig();
    return config[key];
  }

  /**
   * Set global configuration value
   */
  set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.globalConfig.set(key as string, value);
    this.buildMergedConfig();
  }

  /**
   * Get full merged configuration
   */
  getConfig(): Config {
    if (!this.mergedConfig) {
      this.buildMergedConfig();
    }
    return this.mergedConfig!;
  }

  /**
   * Build merged configuration from all sources
   * Priority: Project > Global > Environment > Defaults
   */
  private buildMergedConfig(): void {
    // Start with defaults (from schema)
    const defaults = ConfigSchema.parse({});

    // Merge with global config
    const globalData = this.globalConfig.store as Partial<Config>;
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
  private applyEnvironmentVariables(config: Config): Config {
    const result = { ...config };

    // LOG_LEVEL
    if (process.env.LOG_LEVEL) {
      result.logLevel = process.env.LOG_LEVEL as any;
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
      result.cache = { ...result.cache, enabled: process.env.CACHE_ENABLED === "true" };
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
  private mergeDeep<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(
          (target[key] as any) || {},
          source[key] as any
        ) as any;
      } else {
        result[key] = source[key] as any;
      }
    }

    return result;
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.globalConfig.clear();
    this.projectConfig = null;
    this.buildMergedConfig();
  }

  /**
   * Export current configuration to JSON
   */
  export(): string {
    return JSON.stringify(this.getConfig(), null, 2);
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();
