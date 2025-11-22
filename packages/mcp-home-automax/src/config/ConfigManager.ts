/**
 * Configuration Manager - Handles server configuration
 */

import type { AdapterConfig } from "../adapters/BaseAdapter.js";
import type { PolicyConfig } from "../policy/types.js";

/**
 * Server configuration
 */
export interface ServerConfig {
  adapters: AdapterConfig[];
  policy?: Partial<PolicyConfig>;
  server: {
    name: string;
    version: string;
    logLevel?: "error" | "warn" | "info" | "debug";
  };
}

/**
 * Default server configuration
 */
const DEFAULT_CONFIG: ServerConfig = {
  adapters: [
    {
      id: "fake-adapter",
      type: "fake",
      enabled: true,
    },
  ],
  policy: {},
  server: {
    name: "home-automax-mcp",
    version: "0.1.0",
    logLevel: "info",
  },
};

/**
 * ConfigManager handles loading and managing server configuration
 */
export class ConfigManager {
  private config: ServerConfig;

  constructor(config?: Partial<ServerConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
  }

  /**
   * Get the full configuration
   */
  getConfig(): ServerConfig {
    return { ...this.config };
  }

  /**
   * Get adapter configurations
   */
  getAdapterConfigs(): AdapterConfig[] {
    return [...this.config.adapters];
  }

  /**
   * Get enabled adapter configurations
   */
  getEnabledAdapterConfigs(): AdapterConfig[] {
    return this.config.adapters.filter((adapter) => adapter.enabled);
  }

  /**
   * Get policy configuration
   */
  getPolicyConfig(): Partial<PolicyConfig> | undefined {
    return this.config.policy ? { ...this.config.policy } : undefined;
  }

  /**
   * Get server metadata
   */
  getServerInfo() {
    return { ...this.config.server };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ServerConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  /**
   * Merge configurations with deep merge for nested objects
   */
  private mergeConfig(
    base: ServerConfig,
    updates?: Partial<ServerConfig>
  ): ServerConfig {
    if (!updates) {
      return base;
    }

    return {
      ...base,
      ...updates,
      server: {
        ...base.server,
        ...updates.server,
      },
      adapters: updates.adapters || base.adapters,
      policy: updates.policy
        ? {
            ...base.policy,
            ...updates.policy,
          }
        : base.policy,
    };
  }

  /**
   * Load configuration from environment variables
   */
  static fromEnvironment(): ConfigManager {
    const config: Partial<ServerConfig> = {
      server: {
        name: process.env.SERVER_NAME || "home-automax-mcp",
        version: process.env.SERVER_VERSION || "0.1.0",
        logLevel:
          (process.env.LOG_LEVEL as "error" | "warn" | "info" | "debug") ||
          "info",
      },
    };

    // Add environment-based adapter configuration
    // This can be extended to parse adapter configs from env vars

    return new ConfigManager(config);
  }
}
