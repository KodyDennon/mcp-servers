/**
 * Create health check tool for MCP
 */
export function createHealthCheckTool(connectionManager: any): {
    name: string;
    description: string;
    input_schema: {
        type: string;
        properties: {
            include_history: {
                type: string;
                description: string;
                default: boolean;
            };
        };
    };
    handler: (input: any) => Promise<{
        success: boolean;
        error: {
            code: any;
            message: any;
            retry: any;
            category: any;
            suggested_action: any;
            details: {};
            timestamp: string;
        };
    } | {
        success: boolean;
        health: {
            status: string;
            timestamp: string;
            duration_ms: number;
            checks: {
                database: {
                    status: string;
                    latency_ms: number;
                    message: string;
                    error?: undefined;
                } | {
                    status: string;
                    latency_ms: number;
                    message: string;
                    error: any;
                };
                memory: {
                    status: string;
                    heap_used_mb: number;
                    heap_total_mb: number;
                    heap_used_percent: number;
                    rss_mb: number;
                    external_mb: number;
                    message: string;
                };
                responseTime: {
                    status: string;
                    response_time_ms: number;
                    message: string;
                };
                connectionPool: {
                    status: string;
                    total_connections: any;
                    idle_connections: any;
                    waiting_requests: any;
                    message: string;
                } | {
                    status: string;
                    message: string;
                    total_connections?: undefined;
                    idle_connections?: undefined;
                    waiting_requests?: undefined;
                };
                environment: {
                    status: string;
                    missing_vars: string[];
                    warnings: string[];
                    message: string;
                    mcp_mode: string;
                    node_env: string;
                };
            };
            version: string;
        } | {
            status: string;
            timestamp: string;
            duration_ms: number;
            error: any;
            checks: {
                database: {
                    status: string;
                    latency_ms: number;
                    message: string;
                    error?: undefined;
                } | {
                    status: string;
                    latency_ms: number;
                    message: string;
                    error: any;
                };
                memory: {
                    status: string;
                    heap_used_mb: number;
                    heap_total_mb: number;
                    heap_used_percent: number;
                    rss_mb: number;
                    external_mb: number;
                    message: string;
                };
                responseTime: {
                    status: string;
                    response_time_ms: number;
                    message: string;
                };
                connectionPool: {
                    status: string;
                    total_connections: any;
                    idle_connections: any;
                    waiting_requests: any;
                    message: string;
                } | {
                    status: string;
                    message: string;
                    total_connections?: undefined;
                    idle_connections?: undefined;
                    waiting_requests?: undefined;
                };
                environment: {
                    status: string;
                    missing_vars: string[];
                    warnings: string[];
                    message: string;
                    mcp_mode: string;
                    node_env: string;
                };
            };
        };
    } | {
        success: boolean;
        error: {
            code: string;
            message: any;
        };
    }>;
};
export namespace HealthStatus {
    let HEALTHY: string;
    let DEGRADED: string;
    let UNHEALTHY: string;
}
/**
 * Health Monitor
 * Runs diagnostics and provides health status
 */
export class HealthMonitor {
    constructor(connectionManager: any);
    connectionManager: any;
    lastCheck: {
        status: string;
        timestamp: string;
        duration_ms: number;
        checks: {
            database: {
                status: string;
                latency_ms: number;
                message: string;
                error?: undefined;
            } | {
                status: string;
                latency_ms: number;
                message: string;
                error: any;
            };
            memory: {
                status: string;
                heap_used_mb: number;
                heap_total_mb: number;
                heap_used_percent: number;
                rss_mb: number;
                external_mb: number;
                message: string;
            };
            responseTime: {
                status: string;
                response_time_ms: number;
                message: string;
            };
            connectionPool: {
                status: string;
                total_connections: any;
                idle_connections: any;
                waiting_requests: any;
                message: string;
            } | {
                status: string;
                message: string;
                total_connections?: undefined;
                idle_connections?: undefined;
                waiting_requests?: undefined;
            };
            environment: {
                status: string;
                missing_vars: string[];
                warnings: string[];
                message: string;
                mcp_mode: string;
                node_env: string;
            };
        };
        version: string;
    } | {
        status: string;
        timestamp: string;
        duration_ms: number;
        error: any;
        checks: {
            database: {
                status: string;
                latency_ms: number;
                message: string;
                error?: undefined;
            } | {
                status: string;
                latency_ms: number;
                message: string;
                error: any;
            };
            memory: {
                status: string;
                heap_used_mb: number;
                heap_total_mb: number;
                heap_used_percent: number;
                rss_mb: number;
                external_mb: number;
                message: string;
            };
            responseTime: {
                status: string;
                response_time_ms: number;
                message: string;
            };
            connectionPool: {
                status: string;
                total_connections: any;
                idle_connections: any;
                waiting_requests: any;
                message: string;
            } | {
                status: string;
                message: string;
                total_connections?: undefined;
                idle_connections?: undefined;
                waiting_requests?: undefined;
            };
            environment: {
                status: string;
                missing_vars: string[];
                warnings: string[];
                message: string;
                mcp_mode: string;
                node_env: string;
            };
        };
    } | null;
    checkInterval: number;
    healthHistory: any[];
    maxHistorySize: number;
    /**
     * Run comprehensive health diagnostics
     */
    runDiagnostics(): Promise<{
        status: string;
        timestamp: string;
        duration_ms: number;
        checks: {
            database: {
                status: string;
                latency_ms: number;
                message: string;
                error?: undefined;
            } | {
                status: string;
                latency_ms: number;
                message: string;
                error: any;
            };
            memory: {
                status: string;
                heap_used_mb: number;
                heap_total_mb: number;
                heap_used_percent: number;
                rss_mb: number;
                external_mb: number;
                message: string;
            };
            responseTime: {
                status: string;
                response_time_ms: number;
                message: string;
            };
            connectionPool: {
                status: string;
                total_connections: any;
                idle_connections: any;
                waiting_requests: any;
                message: string;
            } | {
                status: string;
                message: string;
                total_connections?: undefined;
                idle_connections?: undefined;
                waiting_requests?: undefined;
            };
            environment: {
                status: string;
                missing_vars: string[];
                warnings: string[];
                message: string;
                mcp_mode: string;
                node_env: string;
            };
        };
        version: string;
    } | {
        status: string;
        timestamp: string;
        duration_ms: number;
        error: any;
        checks: {
            database: {
                status: string;
                latency_ms: number;
                message: string;
                error?: undefined;
            } | {
                status: string;
                latency_ms: number;
                message: string;
                error: any;
            };
            memory: {
                status: string;
                heap_used_mb: number;
                heap_total_mb: number;
                heap_used_percent: number;
                rss_mb: number;
                external_mb: number;
                message: string;
            };
            responseTime: {
                status: string;
                response_time_ms: number;
                message: string;
            };
            connectionPool: {
                status: string;
                total_connections: any;
                idle_connections: any;
                waiting_requests: any;
                message: string;
            } | {
                status: string;
                message: string;
                total_connections?: undefined;
                idle_connections?: undefined;
                waiting_requests?: undefined;
            };
            environment: {
                status: string;
                missing_vars: string[];
                warnings: string[];
                message: string;
                mcp_mode: string;
                node_env: string;
            };
        };
    }>;
    /**
     * Check database connectivity
     */
    checkDatabase(): Promise<{
        status: string;
        latency_ms: number;
        message: string;
        error?: undefined;
    } | {
        status: string;
        latency_ms: number;
        message: string;
        error: any;
    }>;
    /**
     * Check memory usage
     */
    checkMemory(): Promise<{
        status: string;
        heap_used_mb: number;
        heap_total_mb: number;
        heap_used_percent: number;
        rss_mb: number;
        external_mb: number;
        message: string;
    }>;
    /**
     * Check response time
     */
    checkResponseTime(): Promise<{
        status: string;
        response_time_ms: number;
        message: string;
    }>;
    /**
     * Check connection pool health
     */
    checkConnectionPool(): Promise<{
        status: string;
        total_connections: any;
        idle_connections: any;
        waiting_requests: any;
        message: string;
    } | {
        status: string;
        message: string;
        total_connections?: undefined;
        idle_connections?: undefined;
        waiting_requests?: undefined;
    }>;
    /**
     * Check environment configuration
     */
    checkEnvironment(): Promise<{
        status: string;
        missing_vars: string[];
        warnings: string[];
        message: string;
        mcp_mode: string;
        node_env: string;
    }>;
    /**
     * Calculate overall health status
     */
    calculateOverallStatus(checks: any): string;
    /**
     * Record health check result in history
     */
    recordHealth(result: any): void;
    /**
     * Get health history
     */
    getHealthHistory(): any[];
    /**
     * Get health statistics
     */
    getHealthStats(): {
        total_checks: number;
        healthy_count: number;
        degraded_count: number;
        unhealthy_count: number;
        uptime_percent: number;
        avg_check_duration_ms: number;
        last_check: {
            status: string;
            timestamp: string;
            duration_ms: number;
            checks: {
                database: {
                    status: string;
                    latency_ms: number;
                    message: string;
                    error?: undefined;
                } | {
                    status: string;
                    latency_ms: number;
                    message: string;
                    error: any;
                };
                memory: {
                    status: string;
                    heap_used_mb: number;
                    heap_total_mb: number;
                    heap_used_percent: number;
                    rss_mb: number;
                    external_mb: number;
                    message: string;
                };
                responseTime: {
                    status: string;
                    response_time_ms: number;
                    message: string;
                };
                connectionPool: {
                    status: string;
                    total_connections: any;
                    idle_connections: any;
                    waiting_requests: any;
                    message: string;
                } | {
                    status: string;
                    message: string;
                    total_connections?: undefined;
                    idle_connections?: undefined;
                    waiting_requests?: undefined;
                };
                environment: {
                    status: string;
                    missing_vars: string[];
                    warnings: string[];
                    message: string;
                    mcp_mode: string;
                    node_env: string;
                };
            };
            version: string;
        } | {
            status: string;
            timestamp: string;
            duration_ms: number;
            error: any;
            checks: {
                database: {
                    status: string;
                    latency_ms: number;
                    message: string;
                    error?: undefined;
                } | {
                    status: string;
                    latency_ms: number;
                    message: string;
                    error: any;
                };
                memory: {
                    status: string;
                    heap_used_mb: number;
                    heap_total_mb: number;
                    heap_used_percent: number;
                    rss_mb: number;
                    external_mb: number;
                    message: string;
                };
                responseTime: {
                    status: string;
                    response_time_ms: number;
                    message: string;
                };
                connectionPool: {
                    status: string;
                    total_connections: any;
                    idle_connections: any;
                    waiting_requests: any;
                    message: string;
                } | {
                    status: string;
                    message: string;
                    total_connections?: undefined;
                    idle_connections?: undefined;
                    waiting_requests?: undefined;
                };
                environment: {
                    status: string;
                    missing_vars: string[];
                    warnings: string[];
                    message: string;
                    mcp_mode: string;
                    node_env: string;
                };
            };
        } | null;
    } | null;
    /**
     * Get server version
     */
    getVersion(): "1.0.0" | "unknown";
    /**
     * Start automatic health monitoring
     */
    startMonitoring(interval?: number): void;
    monitoringInterval: NodeJS.Timeout | null | undefined;
    /**
     * Stop automatic health monitoring
     */
    stopMonitoring(): void;
}
//# sourceMappingURL=health.d.ts.map