/**
 * Monitoring and Diagnostics Tools
 * Provides health checks, metrics, and diagnostics
 */
import { createHealthCheckTool } from "../utils/health.js";
import { MCPError } from "../utils/errorHandler.js";
/**
 * Health Check Tool
 * Comprehensive health diagnostics
 */
export const healthCheckTool = {
    name: "health_check",
    description: "Run comprehensive health diagnostics on the MCP server and database connection. Returns detailed status including database connectivity, memory usage, response times, connection pool health, and recent errors. Use this to troubleshoot issues or verify server health.",
    input_schema: {
        type: "object",
        properties: {
            include_history: {
                type: "boolean",
                description: "Include health check history and statistics in response",
                default: false,
            },
        },
    },
};
/**
 * Get Connection Stats Tool
 */
export const getConnectionStatsTool = {
    name: "get_connection_stats",
    description: "Get detailed statistics about the database connection pool including total connections, idle connections, waiting requests, query metrics, circuit breaker status, and failure rates. Useful for monitoring performance and identifying connection issues.",
    input_schema: {
        type: "object",
        properties: {
            connection_id: {
                type: "string",
                description: "Optional connection ID to get stats for specific connection",
            },
        },
    },
};
/**
 * Get Recovery Stats Tool
 */
export const getRecoveryStatsTool = {
    name: "get_recovery_stats",
    description: "Get statistics about auto-recovery attempts including total attempts, successful recoveries, failed recoveries, success rate, and recent recovery history. Helps understand how well the auto-recovery system is performing.",
    input_schema: {
        type: "object",
        properties: {},
    },
};
/**
 * Reset Circuit Breaker Tool
 */
export const resetCircuitBreakerTool = {
    name: "reset_circuit_breaker",
    description: "Manually reset the circuit breaker to attempt reconnection. Use this when the circuit breaker is open and you want to force a reconnection attempt without waiting for the automatic timeout. This should only be used after addressing the underlying issue causing failures.",
    input_schema: {
        type: "object",
        properties: {
            connection_id: {
                type: "string",
                description: "Optional connection ID to reset specific circuit breaker",
            },
        },
    },
};
/**
 * Handle monitoring tool calls
 */
export async function handleMonitoringToolCall(toolName, args, connectionManager) {
    try {
        switch (toolName) {
            case healthCheckTool.name:
                return await handleHealthCheck(args, connectionManager);
            case getConnectionStatsTool.name:
                return await handleGetConnectionStats(args, connectionManager);
            case getRecoveryStatsTool.name:
                return await handleGetRecoveryStats(args, connectionManager);
            case resetCircuitBreakerTool.name:
                return await handleResetCircuitBreaker(args, connectionManager);
            default:
                throw new MCPError("VALIDATION_INVALID_INPUT", `Unknown monitoring tool: ${toolName}`, {});
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
                            code: "MONITORING_TOOL_ERROR",
                            message: error.message,
                        },
                    }, null, 2),
                },
            ],
        };
    }
}
/**
 * Handle health check
 */
async function handleHealthCheck(args, connectionManager) {
    try {
        const diagnostics = await connectionManager.getHealthStatus();
        const response = {
            success: true,
            health: diagnostics,
        };
        if (args.include_history && connectionManager.healthMonitor) {
            response.stats = connectionManager.healthMonitor.getHealthStats();
            response.history = connectionManager.healthMonitor.getHealthHistory();
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(response, null, 2),
                },
            ],
        };
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
                            code: "HEALTH_CHECK_FAILED",
                            message: error.message,
                        },
                    }, null, 2),
                },
            ],
        };
    }
}
/**
 * Handle get connection stats
 */
async function handleGetConnectionStats(args, connectionManager) {
    try {
        const stats = connectionManager.getPoolStats(args.connection_id);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        stats: stats,
                    }, null, 2),
                },
            ],
        };
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
                            code: "GET_STATS_FAILED",
                            message: error.message,
                        },
                    }, null, 2),
                },
            ],
        };
    }
}
/**
 * Handle get recovery stats
 */
async function handleGetRecoveryStats(args, connectionManager) {
    try {
        const stats = connectionManager.getRecoveryStats();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        recovery_stats: stats,
                    }, null, 2),
                },
            ],
        };
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
                            code: "GET_RECOVERY_STATS_FAILED",
                            message: error.message,
                        },
                    }, null, 2),
                },
            ],
        };
    }
}
/**
 * Handle reset circuit breaker
 */
async function handleResetCircuitBreaker(args, connectionManager) {
    try {
        const connectionId = args.connection_id || connectionManager.activeConnectionId;
        if (!connectionId || !connectionManager.connections[connectionId]) {
            throw new MCPError("DB_CONNECTION_FAILED", "Connection not found", {
                connection_id: connectionId,
            });
        }
        const conn = connectionManager.connections[connectionId];
        if (conn.smartPool && conn.smartPool.circuitBreaker) {
            conn.smartPool.circuitBreaker.reset();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Circuit breaker reset successfully",
                            connection_id: connectionId,
                            circuit_state: conn.smartPool.circuitBreaker.state,
                        }, null, 2),
                    },
                ],
            };
        }
        else {
            throw new MCPError("VALIDATION_INVALID_INPUT", "Circuit breaker not available for this connection", {
                connection_id: connectionId,
                hint: "Ensure reliability features are enabled",
            });
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
                            code: "RESET_CIRCUIT_BREAKER_FAILED",
                            message: error.message,
                        },
                    }, null, 2),
                },
            ],
        };
    }
}
//# sourceMappingURL=monitoringTools.js.map