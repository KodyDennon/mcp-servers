export namespace RecoveryStrategy {
    let RECONNECT: string;
    let RESET_POOL: string;
    let CIRCUIT_RESET: string;
    let CLEAR_CACHE: string;
    let RESTART: string;
}
/**
 * Auto-Recovery Manager
 * Monitors for failures and applies appropriate recovery strategies
 */
export class AutoRecoveryManager {
    constructor(connectionManager: any, options?: {});
    connectionManager: any;
    enabled: boolean;
    maxRecoveryAttempts: any;
    recoveryDelay: any;
    recoveryAttempts: Map<any, any>;
    recoveryHistory: any[];
    maxHistorySize: number;
    errorPatterns: {
        CONNECTION_LOST: RegExp;
        CONNECTION_REFUSED: RegExp;
        TIMEOUT: RegExp;
        POOL_EXHAUSTED: RegExp;
        SSL_ERROR: RegExp;
        DNS_ERROR: RegExp;
    };
    recoveryStrategies: {
        CONNECTION_LOST: string;
        CONNECTION_REFUSED: string;
        TIMEOUT: string;
        POOL_EXHAUSTED: string;
        SSL_ERROR: string;
        DNS_ERROR: string;
    };
    /**
     * Attempt to recover from an error
     */
    attemptRecovery(error: any, context?: {}): Promise<boolean>;
    /**
     * Identify error pattern from error message
     */
    identifyErrorPattern(error: any): string | null;
    /**
     * Execute recovery strategy
     */
    executeRecoveryStrategy(strategy: any, context?: {}): Promise<{
        success: boolean;
    } | {
        success: boolean;
        error: any;
        duration_ms: number;
    }>;
    /**
     * Reconnect to database
     */
    reconnect(context: any): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    /**
     * Reset connection pool
     */
    resetPool(context: any): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    /**
     * Reset circuit breaker
     */
    resetCircuitBreaker(context: any): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    /**
     * Clear cache (placeholder for future caching implementation)
     */
    clearCache(context: any): Promise<{
        success: boolean;
    }>;
    /**
     * Record recovery attempt
     */
    recordRecovery(errorPattern: any, strategy: any, success: any, error: any): void;
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
    };
    /**
     * Enable auto-recovery
     */
    enable(): void;
    /**
     * Disable auto-recovery
     */
    disable(): void;
    /**
     * Reset recovery attempt counters
     */
    reset(): void;
    /**
     * Sleep helper
     */
    sleep(ms: any): Promise<any>;
}
/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of connections
 */
export class GracefulShutdown {
    constructor(connectionManager: any, options?: {});
    connectionManager: any;
    shutdownTimeout: any;
    isShuttingDown: boolean;
    /**
     * Register process shutdown handlers
     */
    registerHandlers(): void;
    /**
     * Perform graceful shutdown
     */
    shutdown(exitCode?: number): Promise<void>;
}
/**
 * Connection Watchdog
 * Monitors connection health and triggers recovery
 */
export class ConnectionWatchdog {
    constructor(connectionManager: any, recoveryManager: any, options?: {});
    connectionManager: any;
    recoveryManager: any;
    checkInterval: any;
    enabled: boolean;
    watchdogInterval: NodeJS.Timeout | null;
    consecutiveFailures: number;
    maxConsecutiveFailures: any;
    /**
     * Start the watchdog
     */
    start(): void;
    /**
     * Stop the watchdog
     */
    stop(): void;
    /**
     * Check connection health
     */
    checkConnection(): Promise<void>;
}
//# sourceMappingURL=recovery.d.ts.map