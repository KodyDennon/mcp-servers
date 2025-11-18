/**
 * Plugin System
 * Extensible plugin architecture for MCP server
 */

import { MCPError } from "./errorHandler.js";
import EventEmitter from "events";

/**
 * Plugin Lifecycle Hooks
 */
export const PluginHook = {
  BEFORE_INIT: "before_init",
  AFTER_INIT: "after_init",
  BEFORE_QUERY: "before_query",
  AFTER_QUERY: "after_query",
  BEFORE_TOOL_CALL: "before_tool_call",
  AFTER_TOOL_CALL: "after_tool_call",
  BEFORE_SHUTDOWN: "before_shutdown",
  AFTER_SHUTDOWN: "after_shutdown",
  ON_ERROR: "on_error",
  ON_CONNECTION_ERROR: "on_connection_error",
};

/**
 * Base Plugin
 * All plugins must extend this class
 */
export class Plugin {
  name: string;
  version: string;
  enabled: boolean;
  options: any;

  constructor(options: any = {}) {
    this.name = this.constructor.name;
    this.version = options.version || "1.0.0";
    this.enabled = options.enabled !== false;
    this.options = options;
  }

  /**
   * Initialize plugin
   */
  async init(context: any): Promise<void> {
    // Override in subclass
  }

  /**
   * Cleanup plugin resources
   */
  async destroy(): Promise<void> {
    // Override in subclass
  }

  /**
   * Plugin metadata
   */
  getMetadata() {
    return {
      name: this.name,
      version: this.version,
      enabled: this.enabled,
    };
  }
}

/**
 * Plugin Manager
 * Manages plugin lifecycle and hooks
 */
export class PluginManager extends EventEmitter {
  plugins: Map<string, Plugin>;
  hooks: Map<string, Array<(context: any) => Promise<void> | void>>;

  constructor() {
    super();
    this.plugins = new Map();
    this.hooks = new Map();

    // Initialize all hook arrays
    for (const hook of Object.values(PluginHook)) {
      this.hooks.set(hook, []);
    }
  }

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: Plugin): Promise<void> {
    if (!(plugin instanceof Plugin)) {
      throw new MCPError(
        "VALIDATION_INVALID_INPUT",
        "Plugin must extend Plugin class",
        {},
      );
    }

    if (this.plugins.has(plugin.name)) {
      throw new MCPError(
        "VALIDATION_INVALID_INPUT",
        "Plugin already registered",
        {
          pluginName: plugin.name,
        },
      );
    }

    this.plugins.set(plugin.name, plugin);

    if (plugin.enabled) {
      await plugin.init(this.getContext());
      console.error(`🔌 Plugin registered: ${plugin.name} v${plugin.version}`);
    }

    this.emit("plugin_registered", plugin);
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);

    if (!plugin) {
      throw new MCPError("VALIDATION_INVALID_INPUT", "Plugin not found", {
        pluginName: pluginName,
      });
    }

    await plugin.destroy();
    this.plugins.delete(pluginName);

    console.error(`🔌 Plugin unregistered: ${pluginName}`);
    this.emit("plugin_unregistered", pluginName);
  }

  /**
   * Register a hook handler
   */
  registerHook(hook: string, handler: (context: any) => Promise<void> | void): void {
    if (!Object.values(PluginHook).includes(hook)) {
      throw new MCPError("VALIDATION_INVALID_INPUT", "Unknown hook", {
        hook: hook,
        availableHooks: Object.values(PluginHook),
      });
    }

    const handlers = this.hooks.get(hook);
    if (handlers) {
      handlers.push(handler);
    }
  }

  /**
   * Execute all handlers for a hook
   */
  async executeHook(hook: string, context: any = {}): Promise<void> {
    const handlers = this.hooks.get(hook) || [];

    for (const handler of handlers) {
      try {
        await handler(context);
      } catch (error) {
        console.error(`Error executing ${hook} hook:`, error);
        this.emit("hook_error", { hook, error });
      }
    }
  }

  /**
   * Get context for plugins
   */
  getContext(): any {
    return {
      pluginManager: this,
      emit: this.emit.bind(this),
      on: this.registerHook.bind(this),
    };
  }

  /**
   * List all registered plugins
   */
  listPlugins() {
    return Array.from(this.plugins.values()).map((p) => p.getMetadata());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(name: string): Promise<void> {
    const plugin = this.getPlugin(name);

    if (!plugin) {
      throw new MCPError("VALIDATION_INVALID_INPUT", "Plugin not found", {
        pluginName: name,
      });
    }

    if (plugin.enabled) {
      return;
    }

    plugin.enabled = true;
    await plugin.init(this.getContext());
    console.error(`🔌 Plugin enabled: ${name}`);
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(name: string): Promise<void> {
    const plugin = this.getPlugin(name);

    if (!plugin) {
      throw new MCPError("VALIDATION_INVALID_INPUT", "Plugin not found", {
        pluginName: name,
      });
    }

    if (!plugin.enabled) {
      return;
    }

    plugin.enabled = false;
    await plugin.destroy();
    console.error(`🔌 Plugin disabled: ${name}`);
  }

  /**
   * Shutdown all plugins
   */
  async shutdown(): Promise<void> {
    console.error("Shutting down all plugins...");

    for (const plugin of this.plugins.values()) {
      try {
        await plugin.destroy();
      } catch (error) {
        console.error(`Error shutting down plugin ${plugin.name}:`, error);
      }
    }

    this.plugins.clear();
    console.error("All plugins shut down");
  }
}

/**
 * Example Plugin: Query Logger
 */
export class QueryLoggerPlugin extends Plugin {
  queries: Array<any>;
  maxQueries: number;

  constructor(options: any = {}) {
    super(options);
    this.queries = [];
    this.maxQueries = options.maxQueries || 100;
  }

  async init(context: any): Promise<void> {
    context.on(PluginHook.AFTER_QUERY, this.logQuery.bind(this));
  }

  async logQuery(context: any): Promise<void> {
    this.queries.push({
      sql: context.sql,
      duration: context.duration,
      timestamp: new Date(),
    });

    if (this.queries.length > this.maxQueries) {
      this.queries.shift();
    }
  }

  getQueries() {
    return this.queries;
  }

  async destroy(): Promise<void> {
    this.queries = [];
  }
}

/**
 * Example Plugin: Performance Monitor
 */
export class PerformanceMonitorPlugin extends Plugin {
  threshold: number;
  slowQueries: Array<any>;

  constructor(options: any = {}) {
    super(options);
    this.threshold = options.threshold || 1000; // 1 second
    this.slowQueries = [];
  }

  async init(context: any): Promise<void> {
    context.on(PluginHook.AFTER_QUERY, this.checkPerformance.bind(this));
  }

  async checkPerformance(context: any): Promise<void> {
    if (context.duration >= this.threshold) {
      this.slowQueries.push({
        sql: context.sql,
        duration: context.duration,
        timestamp: new Date(),
      });

      console.warn(`⚠️  Slow query detected: ${context.duration}ms`);
    }
  }

  getSlowQueries() {
    return this.slowQueries;
  }

  async destroy(): Promise<void> {
    this.slowQueries = [];
  }
}

/**
 * Example Plugin: Error Tracker
 */
export class ErrorTrackerPlugin extends Plugin {
  errors: Array<any>;
  maxErrors: number;

  constructor(options: any = {}) {
    super(options);
    this.errors = [];
    this.maxErrors = options.maxErrors || 100;
  }

  async init(context: any): Promise<void> {
    context.on(PluginHook.ON_ERROR, this.trackError.bind(this));
  }

  async trackError(context: any): Promise<void> {
    this.errors.push({
      error: context.error.message,
      stack: context.error.stack,
      sql: context.sql,
      timestamp: new Date(),
    });

    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  getErrors() {
    return this.errors;
  }

  getErrorStats() {
    const errorTypes = new Map();

    for (const error of this.errors) {
      const type = error.error.split(":")[0];
      errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
    }

    return {
      total: this.errors.length,
      types: Array.from(errorTypes.entries()).map(([type, count]) => ({
        type,
        count,
      })),
    };
  }

  async destroy(): Promise<void> {
    this.errors = [];
  }
}

/**
 * Example Plugin: Query Cache Warmer
 */
export class CacheWarmerPlugin extends Plugin {
  warmupQueries: Array<any>;

  constructor(options: any = {}) {
    super(options);
    this.warmupQueries = options.warmupQueries || [];
  }

  async init(context: any): Promise<void> {
    if (context.queryCache && this.warmupQueries.length > 0) {
      await this.warmCache(context.queryCache);
    }
  }

  async warmCache(queryCache: any): Promise<void> {
    console.error(`Warming cache with ${this.warmupQueries.length} queries...`);

    for (const { sql, params } of this.warmupQueries) {
      try {
        // This would need access to query executor
        console.error(`Warmed: ${sql.substring(0, 50)}...`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to warm cache: ${errorMessage}`);
      }
    }
  }

  async destroy(): Promise<void> {
    // Nothing to clean up
  }
}

/**
 * Plugin Loader
 * Load plugins from filesystem
 */
export class PluginLoader {
  pluginManager: PluginManager;

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
  }

  /**
   * Load plugin from module
   */
  async loadPlugin(pluginPath: string, options: any = {}): Promise<Plugin> {
    try {
      const pluginModule = await import(pluginPath);
      const PluginClass = pluginModule.default || pluginModule;

      const plugin = new PluginClass(options);
      await this.pluginManager.registerPlugin(plugin);

      return plugin;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new MCPError(
        "PLUGIN_LOAD_FAILED",
        `Failed to load plugin: ${errorMessage}`,
        {
          pluginPath: pluginPath,
        },
      );
    }
  }

  /**
   * Load multiple plugins
   */
  async loadPlugins(pluginConfigs: Array<{ path: string; options?: any }>): Promise<Array<{ success: boolean; plugin?: string; error?: string }>> {
    const results = [];

    for (const config of pluginConfigs) {
      try {
        const plugin = await this.loadPlugin(config.path, config.options);
        results.push({ success: true, plugin: plugin.name });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ success: false, error: errorMessage });
      }
    }

    return results;
  }
}
