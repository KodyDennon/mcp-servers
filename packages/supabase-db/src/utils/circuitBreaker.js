/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by failing fast when services are unhealthy
 */

import { MCPError } from "./errorHandler.js";

/**
 * Circuit breaker states
 */
export const CircuitState = {
  CLOSED: "closed", // Normal operation
  OPEN: "open", // Failing fast
  HALF_OPEN: "half_open", // Testing if service recovered
};

/**
 * Circuit Breaker
 * Implements the circuit breaker pattern for database connections
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = Date.now();
    this.stateChangedAt = Date.now();

    // Metrics
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.totalRejected = 0;

    this.stats = {
      stateHistory: [],
      recentErrors: [],
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute(fn, fallback = null) {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.totalRejected++;
        const error = new MCPError(
          "NETWORK_UNAVAILABLE",
          "Circuit breaker is open - service temporarily unavailable",
          {
            state: this.state,
            failures: this.failures,
            next_attempt_in_ms: this.nextAttempt - Date.now(),
            suggested_action: "wait_and_retry",
            retry: true,
          },
        );

        if (fallback) {
          console.error("Circuit breaker open, using fallback");
          return await fallback();
        }

        throw error;
      }

      // Try transitioning to half-open
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      const startTime = Date.now();
      const result = await this.executeWithTimeout(fn);
      const duration = Date.now() - startTime;

      this.onSuccess(duration);
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  async executeWithTimeout(fn) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new MCPError("NETWORK_TIMEOUT", "Operation timed out", {
              timeout_ms: this.timeout,
              retry: true,
            }),
          );
        }, this.timeout);
      }),
    ]);
  }

  /**
   * Handle successful execution
   */
  onSuccess(duration) {
    this.totalSuccesses++;
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;

      if (this.successes >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
        this.successes = 0;
      }
    }

    // Record success metric
    this.recordMetric("success", duration);
  }

  /**
   * Handle failed execution
   */
  onFailure(error) {
    this.totalFailures++;
    this.failures++;

    // Record error
    this.stats.recentErrors.push({
      timestamp: new Date().toISOString(),
      error: error.message,
      code: error.error?.code || error.code,
    });

    // Keep only last 10 errors
    if (this.stats.recentErrors.length > 10) {
      this.stats.recentErrors.shift();
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failures >= this.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }

    this.recordMetric("failure");
  }

  /**
   * Transition to new state
   */
  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.stateChangedAt = Date.now();

    // Record state change
    this.stats.stateHistory.push({
      from: oldState,
      to: newState,
      timestamp: new Date().toISOString(),
      failures: this.failures,
    });

    // Keep only last 20 state changes
    if (this.stats.stateHistory.length > 20) {
      this.stats.stateHistory.shift();
    }

    switch (newState) {
      case CircuitState.OPEN:
        this.nextAttempt = Date.now() + this.resetTimeout;
        console.error(
          `🔴 Circuit breaker opened after ${this.failures} failures. Will retry in ${this.resetTimeout}ms`,
        );
        break;

      case CircuitState.HALF_OPEN:
        this.successes = 0;
        console.error("🟡 Circuit breaker half-open, testing service...");
        break;

      case CircuitState.CLOSED:
        this.failures = 0;
        console.error("🟢 Circuit breaker closed, service healthy");
        break;
    }
  }

  /**
   * Record metric
   */
  recordMetric(type, duration = 0) {
    // This can be extended to send metrics to monitoring systems
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      total_requests: this.totalRequests,
      total_failures: this.totalFailures,
      total_successes: this.totalSuccesses,
      total_rejected: this.totalRejected,
      failure_rate:
        this.totalRequests > 0
          ? Math.round((this.totalFailures / this.totalRequests) * 100)
          : 0,
      state_changed_at: new Date(this.stateChangedAt).toISOString(),
      next_attempt:
        this.state === CircuitState.OPEN
          ? new Date(this.nextAttempt).toISOString()
          : null,
      recent_errors: this.stats.recentErrors,
      state_history: this.stats.stateHistory,
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    console.error("Circuit breaker manually reset");
  }

  /**
   * Check if circuit is healthy
   */
  isHealthy() {
    return this.state === CircuitState.CLOSED;
  }
}

/**
 * Smart Connection Pool with Circuit Breaker
 * Enhances the standard connection pool with reliability features
 */
export class SmartConnectionPool {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 10000,
      resetTimeout: options.resetTimeout || 30000,
    });

    // Connection retry options
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.retryBackoff = options.retryBackoff || 2;

    // Metrics
    this.connectionAttempts = 0;
    this.connectionFailures = 0;
    this.connectionSuccesses = 0;
    this.queryCount = 0;
    this.queryErrors = 0;
  }

  /**
   * Get a connection with circuit breaker protection
   */
  async connect() {
    this.connectionAttempts++;

    return this.circuitBreaker.execute(
      async () => {
        const client = await this.pool.connect();
        this.connectionSuccesses++;

        // Wrap the client to track queries
        return this.wrapClient(client);
      },
      async () => {
        // Fallback: throw a more informative error
        throw new MCPError(
          "DB_CONNECTION_FAILED",
          "Unable to connect to database - circuit breaker open",
          {
            circuit_status: this.circuitBreaker.getStatus(),
            retry: true,
          },
        );
      },
    );
  }

  /**
   * Wrap client to track query metrics
   */
  wrapClient(client) {
    const originalQuery = client.query.bind(client);

    client.query = async (...args) => {
      this.queryCount++;
      const startTime = Date.now();

      try {
        const result = await originalQuery(...args);
        const duration = Date.now() - startTime;

        // Log slow queries
        if (duration > 1000) {
          console.error(`⚠️  Slow query detected: ${duration}ms`);
        }

        return result;
      } catch (error) {
        this.queryErrors++;
        throw error;
      }
    };

    return client;
  }

  /**
   * Execute query with automatic retry
   */
  async executeWithRetry(queryFn, retries = this.maxRetries) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error;

        // Don't retry on validation errors
        if (
          error instanceof MCPError &&
          error.error.category === "validation"
        ) {
          throw error;
        }

        // Don't retry if circuit is open
        if (this.circuitBreaker.state === CircuitState.OPEN) {
          throw error;
        }

        if (attempt < retries) {
          const delay = this.retryDelay * Math.pow(this.retryBackoff, attempt);
          console.error(
            `Retry attempt ${attempt + 1}/${retries} after ${delay}ms...`,
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      pool: {
        total_connections: this.pool.totalCount || 0,
        idle_connections: this.pool.idleCount || 0,
        waiting_requests: this.pool.waitingCount || 0,
      },
      connections: {
        attempts: this.connectionAttempts,
        successes: this.connectionSuccesses,
        failures: this.connectionFailures,
        success_rate:
          this.connectionAttempts > 0
            ? Math.round(
                (this.connectionSuccesses / this.connectionAttempts) * 100,
              )
            : 0,
      },
      queries: {
        total: this.queryCount,
        errors: this.queryErrors,
        error_rate:
          this.queryCount > 0
            ? Math.round((this.queryErrors / this.queryCount) * 100)
            : 0,
      },
      circuit_breaker: this.circuitBreaker.getStatus(),
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const client = await this.connect();
      try {
        await client.query("SELECT 1");
        return {
          healthy: true,
          circuit_state: this.circuitBreaker.state,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        healthy: false,
        circuit_state: this.circuitBreaker.state,
        error: error.message,
      };
    }
  }

  /**
   * End the pool
   */
  async end() {
    await this.pool.end();
  }
}
