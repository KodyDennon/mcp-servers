/**
 * Advanced Tools
 * Tools for advanced features: caching, templates, help, etc.
 */
import { MCPError } from "../utils/errorHandler.js";
/**
 * Query Cache Tools
 */
export const getCacheStatsTool = {
    name: "get_cache_stats",
    description: "Get query cache statistics including hit rate, size utilization, and top cached queries. Useful for monitoring cache performance.",
    input_schema: {
        type: "object",
        properties: {},
    },
};
export const clearCacheTool = {
    name: "clear_cache",
    description: "Clear the query cache. Optionally clear only entries matching a pattern.",
    input_schema: {
        type: "object",
        properties: {
            pattern: {
                type: "string",
                description: "Optional regex pattern to match cache keys",
            },
        },
    },
};
/**
 * Query Template Tools
 */
export const listTemplatesTool = {
    name: "list_templates",
    description: "List available query templates. Templates provide pre-built queries for common operations like analytics, reporting, optimization, and security audits.",
    input_schema: {
        type: "object",
        properties: {
            category: {
                type: "string",
                description: "Filter by category: analytics, reporting, admin, optimization, security",
            },
        },
    },
};
export const getTemplateTool = {
    name: "get_template",
    description: "Get details about a specific query template including its SQL, parameters, and description.",
    input_schema: {
        type: "object",
        properties: {
            templateId: {
                type: "string",
                description: "Template ID",
            },
        },
        required: ["templateId"],
    },
};
export const executeTemplateTool = {
    name: "execute_template",
    description: "Execute a query template with the provided parameters. Templates automatically handle parameter substitution and validation.",
    input_schema: {
        type: "object",
        properties: {
            templateId: {
                type: "string",
                description: "Template ID to execute",
            },
            params: {
                type: "object",
                description: "Template parameters",
            },
        },
        required: ["templateId"],
    },
};
/**
 * Help System Tools
 */
export const getHelpTool = {
    name: "get_help",
    description: "Get interactive help for a specific topic. Topics include getting_started, database_connection, querying, schema_management, performance, troubleshooting, and advanced features.",
    input_schema: {
        type: "object",
        properties: {
            topic: {
                type: "string",
                description: "Help topic: getting_started, database_connection, querying, schema_management, performance, troubleshooting, advanced",
            },
        },
        required: ["topic"],
    },
};
export const searchHelpTool = {
    name: "search_help",
    description: "Search help content for keywords. Returns relevant help topics ranked by relevance.",
    input_schema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "Search query",
            },
        },
        required: ["query"],
    },
};
export const startTourTool = {
    name: "start_tour",
    description: "Start an interactive guided tour of the MCP server features. Perfect for new users to learn the basics step-by-step.",
    input_schema: {
        type: "object",
        properties: {},
    },
};
/**
 * Rate Limiting Tools
 */
export const getRateLimitsTool = {
    name: "get_rate_limits",
    description: "Get current rate limit status including remaining requests, tier information, and reset times.",
    input_schema: {
        type: "object",
        properties: {
            clientId: {
                type: "string",
                description: "Client ID to check limits for",
            },
        },
    },
};
export const setClientTierTool = {
    name: "set_client_tier",
    description: "Set the rate limit tier for a client. Tiers: free (60/min), pro (300/min), enterprise (1000/min).",
    input_schema: {
        type: "object",
        properties: {
            clientId: {
                type: "string",
                description: "Client ID",
            },
            tier: {
                type: "string",
                description: "Tier: free, pro, or enterprise",
                enum: ["free", "pro", "enterprise"],
            },
        },
        required: ["clientId", "tier"],
    },
};
/**
 * Multi-Tenancy Tools
 */
export const registerTenantTool = {
    name: "register_tenant",
    description: "Register a new tenant for multi-tenant isolation. Supports schema, database, or row-level isolation strategies.",
    input_schema: {
        type: "object",
        properties: {
            tenantId: {
                type: "string",
                description: "Unique tenant identifier",
            },
            name: {
                type: "string",
                description: "Tenant name",
            },
            tier: {
                type: "string",
                description: "Tenant tier: free, pro, enterprise",
                enum: ["free", "pro", "enterprise"],
            },
            connectionString: {
                type: "string",
                description: "Connection string (required for database isolation)",
            },
        },
        required: ["tenantId"],
    },
};
export const listTenantsTool = {
    name: "list_tenants",
    description: "List all registered tenants with their statistics and configuration.",
    input_schema: {
        type: "object",
        properties: {
            tier: {
                type: "string",
                description: "Filter by tier",
            },
            isActive: {
                type: "boolean",
                description: "Filter by active status",
            },
        },
    },
};
/**
 * Plugin Tools
 */
export const listPluginsTool = {
    name: "list_plugins",
    description: "List all registered plugins including their status and metadata.",
    input_schema: {
        type: "object",
        properties: {},
    },
};
export const enablePluginTool = {
    name: "enable_plugin",
    description: "Enable a disabled plugin.",
    input_schema: {
        type: "object",
        properties: {
            pluginName: {
                type: "string",
                description: "Plugin name",
            },
        },
        required: ["pluginName"],
    },
};
export const disablePluginTool = {
    name: "disable_plugin",
    description: "Disable an active plugin.",
    input_schema: {
        type: "object",
        properties: {
            pluginName: {
                type: "string",
                description: "Plugin name",
            },
        },
        required: ["pluginName"],
    },
};
/**
 * Metrics Tools
 */
export const getMetricsTool = {
    name: "get_metrics",
    description: "Get all metrics in JSON or Prometheus format. Includes HTTP requests, database queries, cache stats, circuit breaker status, and more.",
    input_schema: {
        type: "object",
        properties: {
            format: {
                type: "string",
                description: "Output format: json or prometheus",
                enum: ["json", "prometheus"],
                default: "json",
            },
        },
    },
};
/**
 * Query Optimizer Tools
 */
export const analyzeQueryTool = {
    name: "analyze_query",
    description: "Analyze query performance using EXPLAIN ANALYZE. Provides execution time, query plan, and optimization suggestions including missing indexes and inefficient operations.",
    input_schema: {
        type: "object",
        properties: {
            sql: {
                type: "string",
                description: "SQL query to analyze",
            },
            params: {
                type: "array",
                description: "Query parameters",
                items: {
                    type: "string",
                },
            },
        },
        required: ["sql"],
    },
};
export const getOptimizationReportTool = {
    name: "get_optimization_report",
    description: "Get comprehensive query optimization report including slow queries, suggested indexes, and performance statistics.",
    input_schema: {
        type: "object",
        properties: {},
    },
};
/**
 * Handle advanced tool calls
 */
export async function handleAdvancedToolCall(toolName, args, context) {
    try {
        switch (toolName) {
            case getCacheStatsTool.name:
                return await handleGetCacheStats(args, context);
            case clearCacheTool.name:
                return await handleClearCache(args, context);
            case listTemplatesTool.name:
                return await handleListTemplates(args, context);
            case getTemplateTool.name:
                return await handleGetTemplate(args, context);
            case executeTemplateTool.name:
                return await handleExecuteTemplate(args, context);
            case getHelpTool.name:
                return await handleGetHelp(args, context);
            case searchHelpTool.name:
                return await handleSearchHelp(args, context);
            case startTourTool.name:
                return await handleStartTour(args, context);
            case getRateLimitsTool.name:
                return await handleGetRateLimits(args, context);
            case setClientTierTool.name:
                return await handleSetClientTier(args, context);
            case registerTenantTool.name:
                return await handleRegisterTenant(args, context);
            case listTenantsTool.name:
                return await handleListTenants(args, context);
            case listPluginsTool.name:
                return await handleListPlugins(args, context);
            case enablePluginTool.name:
                return await handleEnablePlugin(args, context);
            case disablePluginTool.name:
                return await handleDisablePlugin(args, context);
            case getMetricsTool.name:
                return await handleGetMetrics(args, context);
            case analyzeQueryTool.name:
                return await handleAnalyzeQuery(args, context);
            case getOptimizationReportTool.name:
                return await handleGetOptimizationReport(args, context);
            default:
                throw new MCPError("VALIDATION_INVALID_INPUT", `Unknown advanced tool: ${toolName}`, {});
        }
    }
    catch (error) {
        if (error instanceof MCPError) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(error.toJSON(), null, 2),
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: {
                            code: "ADVANCED_TOOL_ERROR",
                            message: error.message,
                        },
                    }, null, 2),
                },
            ],
        };
    }
}
// Implementation stubs - these would connect to the actual systems
async function handleGetCacheStats(args, context) {
    const stats = context.queryCache?.getStats() || {
        error: "Cache not enabled",
    };
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, stats }, null, 2),
            },
        ],
    };
}
async function handleClearCache(args, context) {
    if (!context.queryCache) {
        throw new MCPError("VALIDATION_INVALID_INPUT", "Cache not enabled", {});
    }
    if (args.pattern) {
        const cleared = context.queryCache.invalidatePattern(args.pattern);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ success: true, message: `Cleared ${cleared} entries` }, null, 2),
                },
            ],
        };
    }
    else {
        context.queryCache.clear();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ success: true, message: "Cache cleared" }, null, 2),
                },
            ],
        };
    }
}
async function handleListTemplates(args, context) {
    const templates = context.templateEngine.listTemplates(args.category);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, templates }, null, 2),
            },
        ],
    };
}
async function handleGetTemplate(args, context) {
    const template = context.templateEngine.getTemplate(args.templateId);
    const params = context.templateEngine.getTemplateParams(args.templateId);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, template, params }, null, 2),
            },
        ],
    };
}
async function handleExecuteTemplate(args, context) {
    const compiled = context.templateEngine.compile(args.templateId, args.params || {});
    // Execute the query
    const pool = context.connectionManager.getConnection();
    const client = await pool.connect();
    try {
        const result = await client.query(compiled.sql);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        result: result.rows,
                        rowCount: result.rowCount,
                        template: args.templateId,
                    }, null, 2),
                },
            ],
        };
    }
    finally {
        client.release();
    }
}
async function handleGetHelp(args, context) {
    const help = context.interactiveHelp.getTopic(args.topic);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, help }, null, 2),
            },
        ],
    };
}
async function handleSearchHelp(args, context) {
    const results = context.interactiveHelp.search(args.query);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, results }, null, 2),
            },
        ],
    };
}
async function handleStartTour(args, context) {
    const tour = context.interactiveTour;
    tour.reset();
    const step = tour.getCurrentStep();
    const progress = tour.getProgress();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, step, progress }, null, 2),
            },
        ],
    };
}
async function handleGetRateLimits(args, context) {
    const clientId = args.clientId || "default";
    const limiter = context.rateLimitManager;
    if (!limiter) {
        throw new MCPError("VALIDATION_INVALID_INPUT", "Rate limiting not enabled", {});
    }
    const result = await limiter.checkLimit(clientId, 0); // Check without consuming
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, limits: result }, null, 2),
            },
        ],
    };
}
async function handleSetClientTier(args, context) {
    context.rateLimitManager?.setClientTier(args.clientId, args.tier);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, message: `Tier set to ${args.tier}` }, null, 2),
            },
        ],
    };
}
async function handleRegisterTenant(args, context) {
    const tenant = await context.multiTenancyManager.registerTenant(args.tenantId, args);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, tenant: tenant.toJSON() }, null, 2),
            },
        ],
    };
}
async function handleListTenants(args, context) {
    const tenants = context.multiTenancyManager.listTenants(args);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, tenants }, null, 2),
            },
        ],
    };
}
async function handleListPlugins(args, context) {
    const plugins = context.pluginManager.listPlugins();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, plugins }, null, 2),
            },
        ],
    };
}
async function handleEnablePlugin(args, context) {
    await context.pluginManager.enablePlugin(args.pluginName);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, message: "Plugin enabled" }, null, 2),
            },
        ],
    };
}
async function handleDisablePlugin(args, context) {
    await context.pluginManager.disablePlugin(args.pluginName);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, message: "Plugin disabled" }, null, 2),
            },
        ],
    };
}
async function handleGetMetrics(args, context) {
    const format = args.format || "json";
    const registry = context.metricsRegistry;
    if (!registry) {
        throw new MCPError("VALIDATION_INVALID_INPUT", "Metrics not enabled", {});
    }
    const output = format === "prometheus"
        ? registry.exportPrometheus()
        : JSON.stringify(registry.exportJSON(), null, 2);
    return {
        content: [
            {
                type: "text",
                text: output,
            },
        ],
    };
}
async function handleAnalyzeQuery(args, context) {
    const analysis = await context.queryOptimizer.analyzeQuery(args.sql, args.params || []);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, analysis }, null, 2),
            },
        ],
    };
}
async function handleGetOptimizationReport(args, context) {
    const report = context.queryOptimizer.getOptimizationReport();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({ success: true, report }, null, 2),
            },
        ],
    };
}
//# sourceMappingURL=advancedTools.js.map