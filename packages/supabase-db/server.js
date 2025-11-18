import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConnectionManager } from "./connectionManager.js";
import { registerHandlers } from "./handlers.js";
import { registerCodeApiHandlers } from "./code-api-handler.js";
import { loadConfig, ensureEnvironment, promptForMode } from "./config.js";
// Phase 2: Multi-transport support
import { TransportManager, parseTransportConfig, } from "./transports/transportManager.js";
// Phase 4: Performance & Scalability
import { QueryCache } from "./utils/queryCache.js";
import { QueryOptimizer } from "./utils/queryOptimizer.js";
// Phase 5: Developer Experience
import { PluginManager } from "./utils/pluginSystem.js";
// Phase 6: Monitoring & Observability
import { MetricsRegistry, createDefaultMetrics } from "./utils/metrics.js";
// Phase 7: Documentation
import { InteractiveHelp, InteractiveTour } from "./utils/interactiveHelp.js";
// Phase 8: Advanced Features
import { TemplateEngine } from "./utils/queryTemplates.js";
// Phase 9: Enterprise Features
import { RateLimitManager } from "./utils/rateLimiter.js";
import { MultiTenancyManager } from "./utils/multiTenancy.js";
const SERVER_VERSION = "3.2.5";
const SERVER_NAME = "supabase-db";
/**
 * Create and configure the MCP server
 */
export function createServer() {
    return new Server({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    }, {
        capabilities: {
            tools: {},
        },
    });
}
/**
 * Initialize all feature systems
 */
function initializeFeatureSystems(connectionManager) {
    // Phase 4: Performance & Scalability
    const queryCache = new QueryCache({
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || "104857600"), // 100MB default
        maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || "1000"),
        defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || "300000"), // 5min default
    });
    const queryOptimizer = new QueryOptimizer({
        slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || "1000"),
        maxSlowQueries: parseInt(process.env.MAX_SLOW_QUERIES || "100"),
    });
    // Phase 5: Developer Experience
    const pluginManager = new PluginManager();
    // Phase 6: Monitoring & Observability
    const metricsRegistry = new MetricsRegistry();
    const metrics = createDefaultMetrics(metricsRegistry);
    // Phase 7: Documentation
    const interactiveHelp = new InteractiveHelp();
    const interactiveTour = new InteractiveTour(connectionManager);
    // Phase 8: Advanced Features
    const templateEngine = new TemplateEngine();
    // Phase 9: Enterprise Features
    const rateLimitManager = new RateLimitManager({
        defaultTier: process.env.DEFAULT_RATE_LIMIT_TIER || "free",
    });
    const multiTenancyManager = new MultiTenancyManager(connectionManager, {
        isolationStrategy: process.env.TENANCY_ISOLATION_STRATEGY || "schema",
    });
    // Create context object with all systems
    const context = {
        connectionManager,
        queryCache,
        queryOptimizer,
        pluginManager,
        metricsRegistry,
        metrics,
        interactiveHelp,
        interactiveTour,
        templateEngine,
        rateLimitManager,
        multiTenancyManager,
    };
    console.error("✓ All feature systems initialized");
    return context;
}
/**
 * Initialize and start the server
 */
export async function startServer() {
    // Load configuration
    await loadConfig();
    // Ensure required environment variables are present
    await ensureEnvironment();
    // Create server and connection manager
    const server = createServer();
    const connectionManager = new ConnectionManager();
    // Establish initial database connection
    try {
        await connectionManager.addConnection(process.env.POSTGRES_URL_NON_POOLING, "default");
        console.error("✓ Initial database connection established successfully.");
    }
    catch (error) {
        console.error("✗ Failed to establish initial database connection:", error.message);
        // Depending on desired behavior, you might want to exit here or continue with limited functionality
        // For now, we'll let the server start but log the error.
    }
    // Initialize all feature systems (Phases 2-9)
    const context = initializeFeatureSystems(connectionManager);
    // Prompt for mode selection if not set (interactive mode only)
    const MCP_MODE = await promptForMode();
    // Register request handlers based on mode
    if (MCP_MODE === "code-api") {
        console.error(`Starting Supabase DB MCP Server in CODE EXECUTION mode`);
        registerCodeApiHandlers(server, connectionManager);
    }
    else {
        console.error(`Starting Supabase DB MCP Server in DIRECT TOOL mode`);
        registerHandlers(server, context);
    }
    // Phase 2: Multi-transport support
    const transportConfig = parseTransportConfig();
    const transportManager = new TransportManager(transportConfig);
    // Start transports based on configuration
    if (transportConfig.enabledTransports.includes("stdio")) {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("✓ stdio transport ready");
    }
    // Start HTTP and WebSocket transports if enabled
    if (transportConfig.enabledTransports.includes("http") ||
        transportConfig.enabledTransports.includes("websocket")) {
        await transportManager.start(server);
    }
    console.error(`\n🚀 Server ready! Mode: ${MCP_MODE}`);
    console.error(`   Transports: ${transportConfig.enabledTransports.join(", ")}`);
    // Graceful shutdown
    const shutdown = async () => {
        console.error("\nShutting down server and database connections...");
        await transportManager.stop();
        await connectionManager.shutdown();
        if (context.queryCache) {
            context.queryCache.shutdown();
        }
        if (context.pluginManager) {
            await context.pluginManager.shutdown();
        }
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    return { server, context, transportManager };
}
//# sourceMappingURL=server.js.map