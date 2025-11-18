/**
 * Create and configure the MCP server
 */
export function createServer(): Server<{
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
        } | undefined;
    } | undefined;
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | undefined;
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
}>;
/**
 * Initialize and start the server
 */
export function startServer(): Promise<{
    server: Server<{
        method: string;
        params?: {
            [x: string]: unknown;
            _meta?: {
                [x: string]: unknown;
                progressToken?: string | number | undefined;
            } | undefined;
        } | undefined;
    }, {
        method: string;
        params?: {
            [x: string]: unknown;
            _meta?: {
                [x: string]: unknown;
            } | undefined;
        } | undefined;
    }, {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    }>;
    context: {
        connectionManager: any;
        queryCache: QueryCache;
        queryOptimizer: QueryOptimizer;
        pluginManager: PluginManager;
        metricsRegistry: MetricsRegistry;
        metrics: {
            httpRequestsTotal: import("./utils/metrics.js").Counter;
            httpRequestDuration: import("./utils/metrics.js").Histogram;
            dbQueriesTotal: import("./utils/metrics.js").Counter;
            dbQueryDuration: import("./utils/metrics.js").Histogram;
            dbConnectionsActive: import("./utils/metrics.js").Gauge;
            dbConnectionsIdle: import("./utils/metrics.js").Gauge;
            cacheHits: import("./utils/metrics.js").Counter;
            cacheMisses: import("./utils/metrics.js").Counter;
            cacheSize: import("./utils/metrics.js").Gauge;
            circuitBreakerState: import("./utils/metrics.js").Gauge;
            circuitBreakerFailures: import("./utils/metrics.js").Counter;
            recoveryAttempts: import("./utils/metrics.js").Counter;
            rateLimitExceeded: import("./utils/metrics.js").Counter;
        };
        interactiveHelp: InteractiveHelp;
        interactiveTour: InteractiveTour;
        templateEngine: TemplateEngine;
        rateLimitManager: RateLimitManager;
        multiTenancyManager: MultiTenancyManager;
    };
    transportManager: TransportManager;
}>;
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { QueryCache } from "./utils/queryCache.js";
import { QueryOptimizer } from "./utils/queryOptimizer.js";
import { PluginManager } from "./utils/pluginSystem.js";
import { MetricsRegistry } from "./utils/metrics.js";
import { InteractiveHelp } from "./utils/interactiveHelp.js";
import { InteractiveTour } from "./utils/interactiveHelp.js";
import { TemplateEngine } from "./utils/queryTemplates.js";
import { RateLimitManager } from "./utils/rateLimiter.js";
import { MultiTenancyManager } from "./utils/multiTenancy.js";
import { TransportManager } from "./transports/transportManager.js";
//# sourceMappingURL=server.d.ts.map