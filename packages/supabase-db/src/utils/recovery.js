/**
 * Auto-Recovery Mechanisms
 * Automatically handles and recovers from common failure scenarios
 */

import { MCPError } from "./errorHandler.js";

/**
 * Recovery Strategy Types
 */
export const RecoveryStrategy = {
  RECONNECT: "reconnect",
  RESET_POOL: "reset_pool",
  CIRCUIT_RESET: "circuit_reset",
  CLEAR_CACHE: "clear_cache",
  RESTART: "restart",
};

/**
 * Auto-Recovery Manager
 * Monitors for failures and applies appropriate recovery strategies
 */
export class AutoRecoveryManager {
  constructor(connectionManager, options = {}) {
    this.connectionManager = connectionManager;
    this.enabled = options.enabled !== false;
    this.maxRecoveryAttempts = options.maxRecoveryAttempts || 3;
    this.recoveryDelay = options.recoveryDelay || 5000;

    // Recovery tracking
    this.recoveryAttempts = new Map();
    this.recoveryHistory = [];
    this.maxHistorySize = 50;

    // Error patterns for automatic recovery
    this.errorPatterns = {
      CONNECTION_LOST: /connection.*(?:lost|terminated|closed)/i,
      CONNECTION_REFUSED: /connection.*refused/i,
      TIMEOUT: /timeout|timed out/i,
      POOL_EXHAUSTED: /pool.*exhausted|no.*connections available/i,
      SSL_ERROR: /ssl|tls/i,
      DNS_ERROR: /(?:ENOTFOUND|getaddrinfo)/i,
    };

    this.recoveryStrategies = {
      CONNECTION_LOST: RecoveryStrategy.RECONNECT,
      CONNECTION_REFUSED: RecoveryStrategy.RESET_POOL,
      TIMEOUT: RecoveryStrategy.RECONNECT,
      POOL_EXHAUSTED: RecoveryStrategy.RESET_POOL,
      SSL_ERROR: RecoveryStrategy.RESET_POOL,
      DNS_ERROR: RecoveryStrategy.RECONNECT,
    };
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(error, context = {}) {
    if (!this.enabled) {
      return false;
    }

    const errorPattern = this.identifyErrorPattern(error);
    if (!errorPattern) {
      return false; // No recovery strategy for this error
    }

    const strategy = this.recoveryStrategies[errorPattern];
    const key = `${errorPattern}:${strategy}`;

    // Check if we've exceeded max recovery attempts
    const attempts = this.recoveryAttempts.get(key) || 0;
    if (attempts >= this.maxRecoveryAttempts) {
      console.error(
        `⛔ Max recovery attempts (${this.maxRecoveryAttempts}) reached for ${errorPattern}`,
      );
      return false;
    }

    this.recoveryAttempts.set(key, attempts + 1);

    console.error(
      `🔄 Attempting auto-recovery for ${errorPattern} using ${strategy} (attempt ${attempts + 1}/${this.maxRecoveryAttempts})`,
    );

    try {
      const result = await this.executeRecoveryStrategy(strategy, context);

      if (result.success) {
        console.error(`✅ Auto-recovery successful: ${strategy}`);
        this.recordRecovery(errorPattern, strategy, true, null);
        this.recoveryAttempts.delete(key); // Reset counter on success
        return true;
      } else {
        console.error(`❌ Auto-recovery failed: ${strategy}`);
        this.recordRecovery(errorPattern, strategy, false, result.error);
        return false;
      }
    } catch (recoveryError) {
      console.error(`❌ Auto-recovery error: ${recoveryError.message}`);
      this.recordRecovery(errorPattern, strategy, false, recoveryError.message);
      return false;
    }
  }

  /**
   * Identify error pattern from error message
   */
  identifyErrorPattern(error) {
    const errorMessage = error.message || String(error);

    for (const [pattern, regex] of Object.entries(this.errorPatterns)) {
      if (regex.test(errorMessage)) {
        return pattern;
      }
    }

    return null;
  }

  /**
   * Execute recovery strategy
   */
  async executeRecoveryStrategy(strategy, context = {}) {
    const startTime = Date.now();

    // Wait before attempting recovery
    await this.sleep(this.recoveryDelay);

    try {
      switch (strategy) {
        case RecoveryStrategy.RECONNECT:
          return await this.reconnect(context);

        case RecoveryStrategy.RESET_POOL:
          return await this.resetPool(context);

        case RecoveryStrategy.CIRCUIT_RESET:
          return await this.resetCircuitBreaker(context);

        case RecoveryStrategy.CLEAR_CACHE:
          return await this.clearCache(context);

        default:
          return {
            success: false,
            error: `Unknown recovery strategy: ${strategy}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Reconnect to database
   */
  async reconnect(context) {
    console.error("Attempting to reconnect to database...");

    try {
      const pool = await this.connectionManager.getConnection();
      const client = await pool.connect();

      try {
        await client.query("SELECT 1");
        console.error("Database reconnection successful");
        return { success: true };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reset connection pool
   */
  async resetPool(context) {
    console.error("Resetting connection pool...");

    try {
      // End current pool
      const oldPool = await this.connectionManager.getConnection();
      await oldPool.end();

      // Small delay before creating new pool
      await this.sleep(1000);

      // Create new pool by reconnecting
      const newPool = await this.connectionManager.getConnection();
      const client = await newPool.connect();

      try {
        await client.query("SELECT 1");
        console.error("Connection pool reset successful");
        return { success: true };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reset circuit breaker
   */
  async resetCircuitBreaker(context) {
    console.error("Resetting circuit breaker...");

    try {
      if (
        this.connectionManager.smartPool &&
        this.connectionManager.smartPool.circuitBreaker
      ) {
        this.connectionManager.smartPool.circuitBreaker.reset();
        return { success: true };
      }

      return {
        success: false,
        error: "Circuit breaker not available",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear cache (placeholder for future caching implementation)
   */
  async clearCache(context) {
    console.error("Clearing cache...");
    // This will be implemented when caching is added
    return { success: true };
  }

  /**
   * Record recovery attempt
   */
  recordRecovery(errorPattern, strategy, success, error) {
    const record = {
      timestamp: new Date().toISOString(),
      error_pattern: errorPattern,
      strategy: strategy,
      success: success,
      error: error,
    };

    this.recoveryHistory.push(record);

    if (this.recoveryHistory.length > this.maxHistorySize) {
      this.recoveryHistory.shift();
    }
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    const totalAttempts = this.recoveryHistory.length;
    const successfulRecoveries = this.recoveryHistory.filter(
      (r) => r.success,
    ).length;
    const failedRecoveries = totalAttempts - successfulRecoveries;

    return {
      enabled: this.enabled,
      total_attempts: totalAttempts,
      successful: successfulRecoveries,
      failed: failedRecoveries,
      success_rate:
        totalAttempts > 0
          ? Math.round((successfulRecoveries / totalAttempts) * 100)
          : 0,
      recent_history: this.recoveryHistory.slice(-10),
      current_attempts: Object.fromEntries(this.recoveryAttempts),
    };
  }

  /**
   * Enable auto-recovery
   */
  enable() {
    this.enabled = true;
    console.error("🔄 Auto-recovery enabled");
  }

  /**
   * Disable auto-recovery
   */
  disable() {
    this.enabled = false;
    console.error("🔄 Auto-recovery disabled");
  }

  /**
   * Reset recovery attempt counters
   */
  reset() {
    this.recoveryAttempts.clear();
    console.error("🔄 Recovery attempt counters reset");
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of connections
 */
export class GracefulShutdown {
  constructor(connectionManager, options = {}) {
    this.connectionManager = connectionManager;
    this.shutdownTimeout = options.shutdownTimeout || 10000;
    this.isShuttingDown = false;

    // Register shutdown handlers
    this.registerHandlers();
  }

  /**
   * Register process shutdown handlers
   */
  registerHandlers() {
    const signals = ["SIGTERM", "SIGINT", "SIGHUP"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.error(`\n📡 Received ${signal}, starting graceful shutdown...`);
        await this.shutdown();
      });
    });

    // Handle uncaught errors
    process.on("uncaughtException", async (error) => {
      console.error("💥 Uncaught exception:", error);
      await this.shutdown(1);
    });

    process.on("unhandledRejection", async (reason, promise) => {
      console.error("💥 Unhandled rejection:", reason);
      await this.shutdown(1);
    });
  }

  /**
   * Perform graceful shutdown
   */
  async shutdown(exitCode = 0) {
    if (this.isShuttingDown) {
      console.error("Already shutting down...");
      return;
    }

    this.isShuttingDown = true;

    const timeout = setTimeout(() => {
      console.error(
        `⏰ Shutdown timeout (${this.shutdownTimeout}ms) exceeded, forcing exit`,
      );
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      console.error("Closing database connections...");

      const pool = await this.connectionManager.getConnection();
      await pool.end();

      console.error("✅ Graceful shutdown complete");
      clearTimeout(timeout);
      process.exit(exitCode);
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
      clearTimeout(timeout);
      process.exit(1);
    }
  }
}

/**
 * Connection Watchdog
 * Monitors connection health and triggers recovery
 */
export class ConnectionWatchdog {
  constructor(connectionManager, recoveryManager, options = {}) {
    this.connectionManager = connectionManager;
    this.recoveryManager = recoveryManager;
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.enabled = options.enabled !== false;

    this.watchdogInterval = null;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = options.maxConsecutiveFailures || 3;
  }

  /**
   * Start the watchdog
   */
  start() {
    if (this.watchdogInterval) {
      return; // Already running
    }

    console.error("🐕 Connection watchdog started");

    this.watchdogInterval = setInterval(async () => {
      await this.checkConnection();
    }, this.checkInterval);
  }

  /**
   * Stop the watchdog
   */
  stop() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
      console.error("🐕 Connection watchdog stopped");
    }
  }

  /**
   * Check connection health
   */
  async checkConnection() {
    try {
      const pool = await this.connectionManager.getConnection();
      const client = await pool.connect();

      try {
        await client.query("SELECT 1");
        this.consecutiveFailures = 0; // Reset on success
      } finally {
        client.release();
      }
    } catch (error) {
      this.consecutiveFailures++;

      console.error(
        `⚠️  Watchdog detected connection failure (${this.consecutiveFailures}/${this.maxConsecutiveFailures}): ${error.message}`,
      );

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        console.error(
          "🚨 Max consecutive failures reached, triggering recovery",
        );
        await this.recoveryManager.attemptRecovery(error, {
          source: "watchdog",
        });
        this.consecutiveFailures = 0; // Reset after recovery attempt
      }
    }
  }
}
