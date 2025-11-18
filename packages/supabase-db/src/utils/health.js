/**
 * Health Check and Diagnostics System
 * Provides comprehensive health monitoring for the MCP server
 */

import { MCPError } from "./errorHandler.js";

/**
 * Health check statuses
 */
export const HealthStatus = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  UNHEALTHY: "unhealthy",
};

/**
 * Health Monitor
 * Runs diagnostics and provides health status
 */
export class HealthMonitor {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.lastCheck = null;
    this.checkInterval = 30000; // 30 seconds
    this.healthHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Run comprehensive health diagnostics
   */
  async runDiagnostics() {
    const startTime = Date.now();
    const checks = {};

    try {
      // 1. Database connectivity check
      checks.database = await this.checkDatabase();

      // 2. Memory usage check
      checks.memory = await this.checkMemory();

      // 3. Response time check
      checks.responseTime = await this.checkResponseTime();

      // 4. Connection pool health
      checks.connectionPool = await this.checkConnectionPool();

      // 5. Environment configuration
      checks.environment = await this.checkEnvironment();

      const duration = Date.now() - startTime;
      const overallStatus = this.calculateOverallStatus(checks);

      const result = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        checks: checks,
        version: this.getVersion(),
      };

      this.recordHealth(result);
      this.lastCheck = result;

      return result;
    } catch (error) {
      const result = {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        error: error.message,
        checks: checks,
      };

      this.recordHealth(result);
      this.lastCheck = result;

      return result;
    }
  }

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    const startTime = Date.now();

    try {
      const pool = await this.connectionManager.getConnection();
      const client = await pool.connect();

      try {
        // Simple query to verify connection
        await client.query("SELECT 1 as health_check");
        const latency = Date.now() - startTime;

        return {
          status: HealthStatus.HEALTHY,
          latency_ms: latency,
          message: "Database connection successful",
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        latency_ms: Date.now() - startTime,
        message: `Database connection failed: ${error.message}`,
        error: error.code,
      };
    }
  }

  /**
   * Check memory usage
   */
  async checkMemory() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const heapUsedPercent = Math.round(
      (usage.heapUsed / usage.heapTotal) * 100,
    );

    let status = HealthStatus.HEALTHY;
    let message = "Memory usage normal";

    if (heapUsedPercent > 90) {
      status = HealthStatus.UNHEALTHY;
      message = "Critical memory usage";
    } else if (heapUsedPercent > 75) {
      status = HealthStatus.DEGRADED;
      message = "High memory usage";
    }

    return {
      status: status,
      heap_used_mb: heapUsedMB,
      heap_total_mb: heapTotalMB,
      heap_used_percent: heapUsedPercent,
      rss_mb: Math.round(usage.rss / 1024 / 1024),
      external_mb: Math.round(usage.external / 1024 / 1024),
      message: message,
    };
  }

  /**
   * Check response time
   */
  async checkResponseTime() {
    const startTime = Date.now();

    try {
      const pool = await this.connectionManager.getConnection();
      const client = await pool.connect();

      try {
        await client.query("SELECT NOW()");
        const responseTime = Date.now() - startTime;

        let status = HealthStatus.HEALTHY;
        let message = "Response time normal";

        if (responseTime > 5000) {
          status = HealthStatus.UNHEALTHY;
          message = "Response time critical";
        } else if (responseTime > 1000) {
          status = HealthStatus.DEGRADED;
          message = "Response time slow";
        }

        return {
          status: status,
          response_time_ms: responseTime,
          message: message,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        response_time_ms: Date.now() - startTime,
        message: `Response time check failed: ${error.message}`,
      };
    }
  }

  /**
   * Check connection pool health
   */
  async checkConnectionPool() {
    try {
      const pool = await this.connectionManager.getConnection();

      const totalConnections = pool.totalCount || 0;
      const idleConnections = pool.idleCount || 0;
      const waitingRequests = pool.waitingCount || 0;

      let status = HealthStatus.HEALTHY;
      let message = "Connection pool healthy";

      if (waitingRequests > 10) {
        status = HealthStatus.DEGRADED;
        message = "High connection pool pressure";
      }

      return {
        status: status,
        total_connections: totalConnections,
        idle_connections: idleConnections,
        waiting_requests: waitingRequests,
        message: message,
      };
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: `Connection pool check failed: ${error.message}`,
      };
    }
  }

  /**
   * Check environment configuration
   */
  async checkEnvironment() {
    const missing = [];
    const warnings = [];

    // Required environment variables
    if (!process.env.POSTGRES_URL_NON_POOLING) {
      missing.push("POSTGRES_URL_NON_POOLING");
    }

    // Optional but recommended
    if (!process.env.MCP_MODE) {
      warnings.push("MCP_MODE not set (defaulting to 'direct')");
    }

    let status = HealthStatus.HEALTHY;
    let message = "Environment configuration valid";

    if (missing.length > 0) {
      status = HealthStatus.UNHEALTHY;
      message = "Missing required environment variables";
    } else if (warnings.length > 0) {
      status = HealthStatus.DEGRADED;
      message = "Environment configuration has warnings";
    }

    return {
      status: status,
      missing_vars: missing,
      warnings: warnings,
      message: message,
      mcp_mode: process.env.MCP_MODE || "direct",
      node_env: process.env.NODE_ENV || "development",
    };
  }

  /**
   * Calculate overall health status
   */
  calculateOverallStatus(checks) {
    const statuses = Object.values(checks).map((check) => check.status);

    if (statuses.includes(HealthStatus.UNHEALTHY)) {
      return HealthStatus.UNHEALTHY;
    }

    if (statuses.includes(HealthStatus.DEGRADED)) {
      return HealthStatus.DEGRADED;
    }

    return HealthStatus.HEALTHY;
  }

  /**
   * Record health check result in history
   */
  recordHealth(result) {
    this.healthHistory.push(result);

    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }
  }

  /**
   * Get health history
   */
  getHealthHistory() {
    return this.healthHistory;
  }

  /**
   * Get health statistics
   */
  getHealthStats() {
    if (this.healthHistory.length === 0) {
      return null;
    }

    const totalChecks = this.healthHistory.length;
    const healthyChecks = this.healthHistory.filter(
      (h) => h.status === HealthStatus.HEALTHY,
    ).length;
    const degradedChecks = this.healthHistory.filter(
      (h) => h.status === HealthStatus.DEGRADED,
    ).length;
    const unhealthyChecks = this.healthHistory.filter(
      (h) => h.status === HealthStatus.UNHEALTHY,
    ).length;

    const avgDuration =
      this.healthHistory.reduce((sum, h) => sum + (h.duration_ms || 0), 0) /
      totalChecks;

    return {
      total_checks: totalChecks,
      healthy_count: healthyChecks,
      degraded_count: degradedChecks,
      unhealthy_count: unhealthyChecks,
      uptime_percent: Math.round((healthyChecks / totalChecks) * 100),
      avg_check_duration_ms: Math.round(avgDuration),
      last_check: this.lastCheck,
    };
  }

  /**
   * Get server version
   */
  getVersion() {
    try {
      // Try to read from package.json
      return "1.0.0"; // Default version
    } catch {
      return "unknown";
    }
  }

  /**
   * Start automatic health monitoring
   */
  startMonitoring(interval = this.checkInterval) {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    console.error("🏥 Health monitoring started");

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runDiagnostics();
      } catch (error) {
        console.error("Health check failed:", error);
      }
    }, interval);
  }

  /**
   * Stop automatic health monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.error("🏥 Health monitoring stopped");
    }
  }
}

/**
 * Create health check tool for MCP
 */
export function createHealthCheckTool(connectionManager) {
  const monitor = new HealthMonitor(connectionManager);

  return {
    name: "health_check",
    description:
      "Run comprehensive health diagnostics on the MCP server and database connection. Returns detailed status including database connectivity, memory usage, response times, and connection pool health.",
    input_schema: {
      type: "object",
      properties: {
        include_history: {
          type: "boolean",
          description: "Include health check history in the response",
          default: false,
        },
      },
    },
    handler: async (input) => {
      try {
        const diagnostics = await monitor.runDiagnostics();

        const response = {
          success: true,
          health: diagnostics,
        };

        if (input.include_history) {
          response.stats = monitor.getHealthStats();
          response.history = monitor.getHealthHistory();
        }

        return response;
      } catch (error) {
        if (error instanceof MCPError) {
          return error.toJSON();
        }

        return {
          success: false,
          error: {
            code: "HEALTH_CHECK_FAILED",
            message: error.message,
          },
        };
      }
    },
  };
}
