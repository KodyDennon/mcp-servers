/**
 * Plugin System
 * Extensible plugin architecture for MCP server
 */
import EventEmitter from "events";
/**
 * Plugin Lifecycle Hooks
 */
export declare const PluginHook: {
    BEFORE_INIT: string;
    AFTER_INIT: string;
    BEFORE_QUERY: string;
    AFTER_QUERY: string;
    BEFORE_TOOL_CALL: string;
    AFTER_TOOL_CALL: string;
    BEFORE_SHUTDOWN: string;
    AFTER_SHUTDOWN: string;
    ON_ERROR: string;
    ON_CONNECTION_ERROR: string;
};
/**
 * Base Plugin
 * All plugins must extend this class
 */
export declare class Plugin {
    name: string;
    version: string;
    enabled: boolean;
    options: any;
    constructor(options?: any);
    /**
     * Initialize plugin
     */
    init(context: any): Promise<void>;
    /**
     * Cleanup plugin resources
     */
    destroy(): Promise<void>;
    /**
     * Plugin metadata
     */
    getMetadata(): {
        name: string;
        version: string;
        enabled: boolean;
    };
}
/**
 * Plugin Manager
 * Manages plugin lifecycle and hooks
 */
export declare class PluginManager extends EventEmitter {
    plugins: Map<string, Plugin>;
    hooks: Map<string, Array<(context: any) => Promise<void> | void>>;
    constructor();
    /**
     * Register a plugin
     */
    registerPlugin(plugin: Plugin): Promise<void>;
    /**
     * Unregister a plugin
     */
    unregisterPlugin(pluginName: string): Promise<void>;
    /**
     * Register a hook handler
     */
    registerHook(hook: string, handler: (context: any) => Promise<void> | void): void;
    /**
     * Execute all handlers for a hook
     */
    executeHook(hook: string, context?: any): Promise<void>;
    /**
     * Get context for plugins
     */
    getContext(): any;
    /**
     * List all registered plugins
     */
    listPlugins(): {
        name: string;
        version: string;
        enabled: boolean;
    }[];
    /**
     * Get plugin by name
     */
    getPlugin(name: string): Plugin | undefined;
    /**
     * Enable a plugin
     */
    enablePlugin(name: string): Promise<void>;
    /**
     * Disable a plugin
     */
    disablePlugin(name: string): Promise<void>;
    /**
     * Shutdown all plugins
     */
    shutdown(): Promise<void>;
}
/**
 * Example Plugin: Query Logger
 */
export declare class QueryLoggerPlugin extends Plugin {
    queries: Array<any>;
    maxQueries: number;
    constructor(options?: any);
    init(context: any): Promise<void>;
    logQuery(context: any): Promise<void>;
    getQueries(): any[];
    destroy(): Promise<void>;
}
/**
 * Example Plugin: Performance Monitor
 */
export declare class PerformanceMonitorPlugin extends Plugin {
    threshold: number;
    slowQueries: Array<any>;
    constructor(options?: any);
    init(context: any): Promise<void>;
    checkPerformance(context: any): Promise<void>;
    getSlowQueries(): any[];
    destroy(): Promise<void>;
}
/**
 * Example Plugin: Error Tracker
 */
export declare class ErrorTrackerPlugin extends Plugin {
    errors: Array<any>;
    maxErrors: number;
    constructor(options?: any);
    init(context: any): Promise<void>;
    trackError(context: any): Promise<void>;
    getErrors(): any[];
    getErrorStats(): {
        total: number;
        types: {
            type: any;
            count: any;
        }[];
    };
    destroy(): Promise<void>;
}
/**
 * Example Plugin: Query Cache Warmer
 */
export declare class CacheWarmerPlugin extends Plugin {
    warmupQueries: Array<any>;
    constructor(options?: any);
    init(context: any): Promise<void>;
    warmCache(queryCache: any): Promise<void>;
    destroy(): Promise<void>;
}
/**
 * Plugin Loader
 * Load plugins from filesystem
 */
export declare class PluginLoader {
    pluginManager: PluginManager;
    constructor(pluginManager: PluginManager);
    /**
     * Load plugin from module
     */
    loadPlugin(pluginPath: string, options?: any): Promise<Plugin>;
    /**
     * Load multiple plugins
     */
    loadPlugins(pluginConfigs: Array<{
        path: string;
        options?: any;
    }>): Promise<Array<{
        success: boolean;
        plugin?: string;
        error?: string;
    }>>;
}
//# sourceMappingURL=pluginSystem.d.ts.map