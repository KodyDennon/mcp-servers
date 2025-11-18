export namespace CircuitState {
    let CLOSED: string;
    let OPEN: string;
    let HALF_OPEN: string;
}
/**
 * Circuit Breaker
 * Implements the circuit breaker pattern for database connections
 */
export class CircuitBreaker {
    constructor(options?: {});
    failureThreshold: any;
    successThreshold: any;
    timeout: any;
    resetTimeout: any;
    monitoringPeriod: any;
    state: string;
    failures: number;
    successes: number;
    nextAttempt: number;
    stateChangedAt: number;
    totalRequests: number;
    totalFailures: number;
    totalSuccesses: number;
    totalRejected: number;
    stats: {
        stateHistory: never[];
        recentErrors: never[];
    };
    /**
     * Execute a function with circuit breaker protection
     */
    execute(fn: any, fallback?: null): Promise<any>;
    /**
     * Execute function with timeout
     */
    executeWithTimeout(fn: any): Promise<any>;
    /**
     * Handle successful execution
     */
    onSuccess(duration: any): void;
    /**
     * Handle failed execution
     */
    onFailure(error: any): void;
    /**
     * Transition to new state
     */
    transitionTo(newState: any): void;
    /**
     * Record metric
     */
    recordMetric(type: any, duration?: number): void;
    /**
     * Get current status
     */
    getStatus(): {
        state: string;
        failures: number;
        successes: number;
        total_requests: number;
        total_failures: number;
        total_successes: number;
        total_rejected: number;
        failure_rate: number;
        state_changed_at: string;
        next_attempt: string | null;
        recent_errors: never[];
        state_history: never[];
    };
    /**
     * Manually reset circuit breaker
     */
    reset(): void;
    /**
     * Check if circuit is healthy
     */
    isHealthy(): boolean;
}
/**
 * Smart Connection Pool with Circuit Breaker
 * Enhances the standard connection pool with reliability features
 */
export class SmartConnectionPool {
    constructor(pool: any, options?: {});
    pool: any;
    circuitBreaker: CircuitBreaker;
    maxRetries: any;
    retryDelay: any;
    retryBackoff: any;
    connectionAttempts: number;
    connectionFailures: number;
    connectionSuccesses: number;
    queryCount: number;
    queryErrors: number;
    /**
     * Get a connection with circuit breaker protection
     */
    connect(): Promise<any>;
    /**
     * Wrap client to track query metrics
     */
    wrapClient(client: any): any;
    /**
     * Execute query with automatic retry
     */
    executeWithRetry(queryFn: any, retries?: any): Promise<any>;
    /**
     * Sleep helper
     */
    sleep(ms: any): Promise<any>;
    /**
     * Get pool statistics
     */
    getStats(): {
        pool: {
            total_connections: any;
            idle_connections: any;
            waiting_requests: any;
        };
        connections: {
            attempts: number;
            successes: number;
            failures: number;
            success_rate: number;
        };
        queries: {
            total: number;
            errors: number;
            error_rate: number;
        };
        circuit_breaker: {
            state: string;
            failures: number;
            successes: number;
            total_requests: number;
            total_failures: number;
            total_successes: number;
            total_rejected: number;
            failure_rate: number;
            state_changed_at: string;
            next_attempt: string | null;
            recent_errors: never[];
            state_history: never[];
        };
    };
    /**
     * Health check
     */
    healthCheck(): Promise<{
        healthy: boolean;
        circuit_state: string;
        error?: undefined;
    } | {
        healthy: boolean;
        circuit_state: string;
        error: any;
    }>;
    /**
     * End the pool
     */
    end(): Promise<void>;
}
//# sourceMappingURL=circuitBreaker.d.ts.map