import pg from "pg";
import { SmartConnectionPool } from "./utils/circuitBreaker.js";
import {
  AutoRecoveryManager,
  GracefulShutdown,
  ConnectionWatchdog,
} from "./utils/recovery.js";
import { HealthMonitor } from "./utils/health.js";
const { Pool } = pg;
export class ConnectionManager {
  constructor(options = {}) {
    this.connections = {};
    this.activeConnectionId = null;
    // Reliability features
    this.enableReliability = options.enableReliability !== false;
    this.enableAutoRecovery = options.enableAutoRecovery !== false;
    this.enableHealthMonitoring = options.enableHealthMonitoring !== false;
    this.enableWatchdog = options.enableWatchdog !== false;
    // Initialize reliability managers
    if (this.enableAutoRecovery) {
      this.recoveryManager = new AutoRecoveryManager(this, {
        enabled: true,
        maxRecoveryAttempts: options.maxRecoveryAttempts || 3,
        recoveryDelay: options.recoveryDelay || 5000,
      });
    }
    if (this.enableHealthMonitoring) {
      this.healthMonitor = new HealthMonitor(this);
    }
    // Graceful shutdown handler
    this.gracefulShutdown = new GracefulShutdown(this, {
      shutdownTimeout: options.shutdownTimeout || 10000,
    });
  }
  async addConnection(connectionString, id = null) {
    const connectionId =
      id || `conn_${Object.keys(this.connections).length + 1}`;
    try {
      const pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED === "true",
        },
        max: parseInt(process.env.PG_POOL_SIZE || "10"),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      pool.on("error", async (err) => {
        console.error(
          `Unexpected database error on connection ${connectionId}:`,
          err,
        );
        // Attempt auto-recovery if enabled
        if (this.enableAutoRecovery && this.recoveryManager) {
          await this.recoveryManager.attemptRecovery(err, {
            connectionId: connectionId,
          });
        }
      });
      // Wrap pool with SmartConnectionPool if reliability is enabled
      const wrappedPool = this.enableReliability
        ? new SmartConnectionPool(pool, {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 10000,
            resetTimeout: 30000,
            maxRetries: 3,
            retryDelay: 1000,
          })
        : pool;
      // Test connection with retry
      let client;
      let result;
      if (this.enableReliability && wrappedPool.executeWithRetry) {
        result = await wrappedPool.executeWithRetry(async () => {
          client = await wrappedPool.connect();
          const res = await client.query(
            "SELECT current_database(), current_user, version()",
          );
          return res;
        });
      } else {
        client = await pool.connect();
        result = await client.query(
          "SELECT current_database(), current_user, version()",
        );
      }
      if (client) {
        client.release();
      }
      this.connections[connectionId] = {
        pool: pool,
        smartPool: this.enableReliability ? wrappedPool : null,
        info: result.rows[0],
        created_at: new Date().toISOString(),
      };
      if (!this.activeConnectionId) {
        this.activeConnectionId = connectionId;
      }
      // Start watchdog for this connection if enabled
      if (this.enableWatchdog && this.recoveryManager) {
        const watchdog = new ConnectionWatchdog(this, this.recoveryManager, {
          checkInterval: 30000,
          maxConsecutiveFailures: 3,
        });
        watchdog.start();
        this.connections[connectionId].watchdog = watchdog;
      }
      console.error(`✅ Connection ${connectionId} established successfully`);
      return connectionId;
    } catch (error) {
      console.error(
        `❌ Failed to establish connection ${connectionId}:`,
        error.message,
      );
      // Attempt auto-recovery if enabled
      if (this.enableAutoRecovery && this.recoveryManager) {
        const recovered = await this.recoveryManager.attemptRecovery(error, {
          connectionId: connectionId,
          connectionString: connectionString,
        });
        if (recovered) {
          // Retry connection after recovery
          return this.addConnection(connectionString, id);
        }
      }
      throw error;
    }
  }
  getConnection(connectionId = null) {
    const id = connectionId || this.activeConnectionId;
    if (!id || !this.connections[id]) {
      throw new Error(
        "No active database connection. Use connectToDatabase to add a connection.",
      );
    }
    // Return SmartConnectionPool if available, otherwise regular pool
    return this.connections[id].smartPool || this.connections[id].pool;
  }
  listConnections() {
    return Object.entries(this.connections).map(([id, conn]) => ({
      id,
      ...conn.info,
      active: id === this.activeConnectionId,
      created_at: conn.created_at,
      has_reliability: conn.smartPool !== null,
    }));
  }
  switchConnection(connectionId) {
    if (!this.connections[connectionId]) {
      throw new Error(`Connection ${connectionId} not found.`);
    }
    this.activeConnectionId = connectionId;
  }
  /**
   * Get health status for all connections
   */
  async getHealthStatus() {
    if (!this.healthMonitor) {
      return {
        error: "Health monitoring not enabled",
      };
    }
    return await this.healthMonitor.runDiagnostics();
  }
  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    if (!this.recoveryManager) {
      return {
        error: "Auto-recovery not enabled",
      };
    }
    return this.recoveryManager.getRecoveryStats();
  }
  /**
   * Get connection pool statistics
   */
  getPoolStats(connectionId = null) {
    const id = connectionId || this.activeConnectionId;
    if (!id || !this.connections[id]) {
      return { error: "Connection not found" };
    }
    const conn = this.connections[id];
    if (conn.smartPool && conn.smartPool.getStats) {
      return conn.smartPool.getStats();
    }
    // Return basic stats for regular pool
    return {
      pool: {
        total_connections: conn.pool.totalCount || 0,
        idle_connections: conn.pool.idleCount || 0,
        waiting_requests: conn.pool.waitingCount || 0,
      },
    };
  }
  /**
   * Start health monitoring
   */
  startHealthMonitoring(interval = 30000) {
    if (this.healthMonitor) {
      this.healthMonitor.startMonitoring(interval);
    }
  }
  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthMonitor) {
      this.healthMonitor.stopMonitoring();
    }
  }
  async shutdown() {
    console.error("Shutting down ConnectionManager...");
    // Stop health monitoring
    this.stopHealthMonitoring();
    // Stop all watchdogs
    for (const conn of Object.values(this.connections)) {
      if (conn.watchdog) {
        conn.watchdog.stop();
      }
    }
    // Close all connection pools
    for (const { pool } of Object.values(this.connections)) {
      await pool.end();
    }
    console.error("ConnectionManager shutdown complete");
  }
}
//# sourceMappingURL=connectionManager.js.map
