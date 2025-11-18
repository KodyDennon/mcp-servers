export class ConnectionManager {
    constructor(options?: {});
    connections: {};
    activeConnectionId: any;
    enableReliability: boolean;
    enableAutoRecovery: boolean;
    enableHealthMonitoring: boolean;
    enableWatchdog: boolean;
    recoveryManager: AutoRecoveryManager | undefined;
    healthMonitor: HealthMonitor | undefined;
    gracefulShutdown: GracefulShutdown;
    addConnection(connectionString: any, id?: null): any;
    getConnection(connectionId?: null): any;
    listConnections(): any[];
    switchConnection(connectionId: any): void;
    /**
     * Get health status for all connections
     */
    getHealthStatus(): Promise<{
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
    } | {
        error: string;
    }>;
    /**
     * Get recovery statistics
     */
    getRecoveryStats(): {
        enabled: boolean;
        total_attempts: number;
        successful: number;
        failed: number;
        success_rate: number;
        recent_history: any[];
        current_attempts: any;
    } | {
        error: string;
    };
    /**
     * Get connection pool statistics
     */
    getPoolStats(connectionId?: null): any;
    /**
     * Start health monitoring
     */
    startHealthMonitoring(interval?: number): void;
    /**
     * Stop health monitoring
     */
    stopHealthMonitoring(): void;
    shutdown(): Promise<void>;
}
import { AutoRecoveryManager } from "./utils/recovery.js";
import { HealthMonitor } from "./utils/health.js";
import { GracefulShutdown } from "./utils/recovery.js";
//# sourceMappingURL=connectionManager.d.ts.map