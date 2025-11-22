import { type Config } from "./schema.js";
/**
 * Configuration manager supporting multiple sources:
 * 1. .depmanagerrc.json (project-level)
 * 2. Global config (~/.config/dependency-manager/config.json)
 * 3. Environment variables
 * 4. Defaults from schema
 */
export declare class ConfigManager {
  private static instance;
  private globalConfig;
  private projectConfig;
  private mergedConfig;
  private constructor();
  static getInstance(): ConfigManager;
  /**
   * Load project-specific configuration from .depmanagerrc.json
   */
  loadProjectConfig(directory: string): Promise<void>;
  /**
   * Get configuration value
   */
  get<K extends keyof Config>(key: K): Config[K];
  /**
   * Set global configuration value
   */
  set<K extends keyof Config>(key: K, value: Config[K]): void;
  /**
   * Get full merged configuration
   */
  getConfig(): Config;
  /**
   * Build merged configuration from all sources
   * Priority: Project > Global > Environment > Defaults
   */
  private buildMergedConfig;
  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentVariables;
  /**
   * Deep merge two objects
   */
  private mergeDeep;
  /**
   * Reset to defaults
   */
  reset(): void;
  /**
   * Export current configuration to JSON
   */
  export(): string;
}
export declare const config: ConfigManager;
//# sourceMappingURL=manager.d.ts.map
