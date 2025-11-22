/**
 * Configuration Manager - Handles server configuration
 */

import { readFileSync, existsSync } from "fs";
import { z } from "zod";
import type { AdapterConfig } from "../adapters/BaseAdapter.js";
import type { PolicyConfig } from "../policy/types.js";

/**
 * Zod schema for adapter configuration
 */
const AdapterConfigSchema = z.object({
  id: z.string(),
  type: z.string(),
  enabled: z.boolean(),
  priority: z.number().optional(),
  maxReconnectAttempts: z.number().optional(),
  reconnectDelay: z.number().optional(),
  healthCheckInterval: z.number().optional(),
}).passthrough(); // Allow additional properties

/**
 * Zod schema for server configuration
 */
const ServerConfigSchema = z.object({
  adapters: z.array(AdapterConfigSchema),
  policy: z.any().optional(),
  server: z.object({
    name: z.string(),
    version: z.string(),
    logLevel: z.enum(["error", "warn", "info", "debug"]).optional(),
  }),
  deviceOverrides: z.record(z.string(), z.any()).optional(),
  deviceGroups: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        deviceIds: z.array(z.string()),
        tags: z.array(z.string()).optional(),
      })
    )
    .optional(),
  areas: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        aliases: z.array(z.string()).optional(),
        floor: z.string().optional(),
        parentAreaId: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

/**
 * Device group configuration
 */
export interface DeviceGroupConfig {
  id: string;
  name: string;
  description?: string;
  deviceIds: string[];
  tags?: string[];
}

/**
 * Area configuration
 */
export interface AreaConfig {
  id: string;
  name: string;
  aliases?: string[];
  floor?: string;
  parentAreaId?: string;
  tags?: string[];
}

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
  deviceOverrides?: Record<string, unknown>;
  deviceGroups?: DeviceGroupConfig[];
  areas?: AreaConfig[];
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
   * Validate configuration with Zod schema
   */
  static validate(config: unknown): ServerConfig {
    try {
      return ServerConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        throw new Error(
          `Configuration validation failed:\n${issues.join("\n")}`
        );
      }
      throw error;
    }
  }

  /**
   * Load configuration from a JSON file
   */
  static fromFile(filePath: string): ConfigManager {
    if (!existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
    }

    try {
      const content = readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);
      const validated = ConfigManager.validate(data);
      return new ConfigManager(validated);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in configuration file: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Load configuration from environment variables
   */
  static fromEnvironment(): ConfigManager {
    // Check for config file path in environment
    const configPath = process.env.HOME_AUTOMAX_CONFIG;
    if (configPath && existsSync(configPath)) {
      return ConfigManager.fromFile(configPath);
    }

    // Default config from environment variables
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

  /**
   * Get device group configurations
   */
  getDeviceGroups(): DeviceGroupConfig[] {
    return this.config.deviceGroups || [];
  }

  /**
   * Get area configurations
   */
  getAreaConfigs(): AreaConfig[] {
    return this.config.areas || [];
  }

  /**
   * Get device overrides
   */
  getDeviceOverrides(): Record<string, unknown> {
    return this.config.deviceOverrides || {};
  }
}
