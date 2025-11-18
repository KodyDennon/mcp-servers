# Reliability & Robustness Features

The Supabase DB MCP Server includes comprehensive reliability features designed to ensure production-grade stability and automatic recovery from failures.

## Table of Contents

- [Overview](#overview)
- [Health Monitoring](#health-monitoring)
- [Circuit Breaker](#circuit-breaker)
- [Auto-Recovery](#auto-recovery)
- [Connection Management](#connection-management)
- [Monitoring Tools](#monitoring-tools)
- [Configuration](#configuration)
- [Best Practices](#best-practices)

## Overview

Phase 1 reliability improvements provide:

- **Health Checks & Diagnostics** - Comprehensive server and database health monitoring
- **Smart Connection Pool** - Enhanced connection pooling with circuit breaker protection
- **Auto-Recovery** - Automatic detection and recovery from common failure scenarios
- **Connection Watchdog** - Continuous monitoring and proactive issue detection
- **Graceful Shutdown** - Clean resource cleanup on server termination

## Health Monitoring

### Features

The Health Monitor provides comprehensive diagnostics:

- **Database Connectivity** - Verify connection health and latency
- **Memory Usage** - Track heap usage and detect memory pressure
- **Response Time** - Measure query response times
- **Connection Pool** - Monitor active, idle, and waiting connections
- **Environment Configuration** - Validate required environment variables

### Usage

#### Via MCP Tool

```javascript
// Run health check
await mcp.callTool("health_check", {
  include_history: true
});

// Returns:
{
  "success": true,
  "health": {
    "status": "healthy",
    "timestamp": "2025-01-18T10:30:00.000Z",
    "duration_ms": 45,
    "checks": {
      "database": {
        "status": "healthy",
        "latency_ms": 12,
        "message": "Database connection successful"
      },
      "memory": {
        "status": "healthy",
        "heap_used_mb": 45,
        "heap_total_mb": 100,
        "heap_used_percent": 45,
        "message": "Memory usage normal"
      },
      "responseTime": {
        "status": "healthy",
        "response_time_ms": 23,
        "message": "Response time normal"
      }
    }
  }
}
```

#### Programmatically

```javascript
import { HealthMonitor } from "./src/utils/health.js";

const monitor = new HealthMonitor(connectionManager);

// Run diagnostics
const health = await monitor.runDiagnostics();
console.log(`Server status: ${health.status}`);

// Start automatic monitoring (every 30 seconds)
monitor.startMonitoring(30000);

// Get health statistics
const stats = monitor.getHealthStats();
console.log(`Uptime: ${stats.uptime_percent}%`);
```

### Health Statuses

- **`healthy`** - All systems operating normally
- **`degraded`** - Some issues detected but service functional
- **`unhealthy`** - Critical issues requiring attention

## Circuit Breaker

The Circuit Breaker prevents cascading failures by failing fast when services are unhealthy.

### States

1. **CLOSED** (Normal operation)
   - Requests pass through normally
   - Failures are tracked

2. **OPEN** (Failing fast)
   - Requests are rejected immediately
   - Prevents overwhelming a failing service
   - Automatic timeout triggers transition to HALF_OPEN

3. **HALF_OPEN** (Testing recovery)
   - Limited requests allowed to test if service recovered
   - Success → transitions to CLOSED
   - Failure → transitions back to OPEN

### Configuration

```javascript
const smartPool = new SmartConnectionPool(pool, {
  failureThreshold: 5, // Open after 5 consecutive failures
  successThreshold: 2, // Close after 2 consecutive successes in HALF_OPEN
  timeout: 10000, // Request timeout (10 seconds)
  resetTimeout: 30000, // Wait 30 seconds before trying HALF_OPEN
  maxRetries: 3, // Retry failed operations 3 times
  retryDelay: 1000, // Initial retry delay (1 second)
  retryBackoff: 2, // Exponential backoff multiplier
});
```

### Monitoring Circuit Breaker

```javascript
// Get circuit breaker status
await mcp.callTool("get_connection_stats", {});

// Returns:
{
  "success": true,
  "stats": {
    "circuit_breaker": {
      "state": "closed",
      "failures": 0,
      "total_requests": 1523,
      "total_failures": 12,
      "total_successes": 1511,
      "failure_rate": 1,
      "recent_errors": []
    }
  }
}
```

### Manual Reset

```javascript
// Manually reset circuit breaker
await mcp.callTool("reset_circuit_breaker", {});
```

## Auto-Recovery

The Auto-Recovery Manager automatically detects and recovers from common failure scenarios.

### Supported Error Patterns

| Error Pattern      | Recovery Strategy | Description                            |
| ------------------ | ----------------- | -------------------------------------- |
| CONNECTION_LOST    | Reconnect         | Connection was terminated unexpectedly |
| CONNECTION_REFUSED | Reset Pool        | Connection rejected by server          |
| TIMEOUT            | Reconnect         | Operation exceeded time limit          |
| POOL_EXHAUSTED     | Reset Pool        | No available connections               |
| SSL_ERROR          | Reset Pool        | TLS/SSL handshake failed               |
| DNS_ERROR          | Reconnect         | DNS resolution failed                  |

### Configuration

```javascript
const recoveryManager = new AutoRecoveryManager(connectionManager, {
  enabled: true,
  maxRecoveryAttempts: 3, // Try up to 3 times
  recoveryDelay: 5000, // Wait 5 seconds before recovery
});
```

### Recovery Statistics

```javascript
// Get recovery stats
await mcp.callTool("get_recovery_stats", {});

// Returns:
{
  "success": true,
  "recovery_stats": {
    "enabled": true,
    "total_attempts": 5,
    "successful": 4,
    "failed": 1,
    "success_rate": 80,
    "recent_history": [
      {
        "timestamp": "2025-01-18T10:15:00.000Z",
        "error_pattern": "CONNECTION_LOST",
        "strategy": "reconnect",
        "success": true
      }
    ]
  }
}
```

### Manual Recovery Control

```javascript
// Disable auto-recovery
recoveryManager.disable();

// Enable auto-recovery
recoveryManager.enable();

// Reset recovery attempt counters
recoveryManager.reset();
```

## Connection Management

Enhanced connection management with reliability features.

### Initialization

```javascript
import { ConnectionManager } from "./src/connectionManager.js";

const connectionManager = new ConnectionManager({
  enableReliability: true, // Enable SmartConnectionPool
  enableAutoRecovery: true, // Enable automatic recovery
  enableHealthMonitoring: true, // Enable health monitoring
  enableWatchdog: true, // Enable connection watchdog
  maxRecoveryAttempts: 3,
  recoveryDelay: 5000,
  shutdownTimeout: 10000,
});

// Add connection
await connectionManager.addConnection(process.env.POSTGRES_URL_NON_POOLING);

// Start health monitoring
connectionManager.startHealthMonitoring(30000); // Every 30 seconds
```

### Connection Statistics

```javascript
// Get connection pool statistics
const stats = connectionManager.getPoolStats();

console.log(`Total connections: ${stats.pool.total_connections}`);
console.log(`Idle connections: ${stats.pool.idle_connections}`);
console.log(`Waiting requests: ${stats.pool.waiting_requests}`);
console.log(`Query error rate: ${stats.queries.error_rate}%`);
```

### Graceful Shutdown

```javascript
// Graceful shutdown is automatic on SIGTERM/SIGINT
// Or manually:
await connectionManager.shutdown();
```

## Monitoring Tools

### Available Tools

#### 1. `health_check`

Run comprehensive health diagnostics.

```javascript
{
  "include_history": boolean  // Include historical health data
}
```

#### 2. `get_connection_stats`

Get detailed connection pool statistics.

```javascript
{
  "connection_id": string  // Optional: specific connection
}
```

#### 3. `get_recovery_stats`

Get auto-recovery attempt statistics.

```javascript
{
} // No parameters required
```

#### 4. `reset_circuit_breaker`

Manually reset the circuit breaker.

```javascript
{
  "connection_id": string  // Optional: specific connection
}
```

### Example: Complete Monitoring Workflow

```javascript
// 1. Check overall health
const health = await mcp.callTool("health_check", { include_history: true });

if (health.health.status !== "healthy") {
  // 2. Get detailed connection stats
  const stats = await mcp.callTool("get_connection_stats", {});

  // 3. Check if circuit breaker is open
  if (stats.stats.circuit_breaker.state === "open") {
    console.log("Circuit breaker is open, waiting for recovery...");

    // 4. Check recovery attempts
    const recovery = await mcp.callTool("get_recovery_stats", {});
    console.log(
      `Recovery success rate: ${recovery.recovery_stats.success_rate}%`,
    );

    // 5. Optionally reset circuit breaker after fixing underlying issue
    await mcp.callTool("reset_circuit_breaker", {});
  }
}
```

## Configuration

### Environment Variables

```bash
# Database Connection (Required)
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/database

# Optional: Supabase Features
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MCP Mode
MCP_MODE=direct  # or "code-api"

# Node Environment
NODE_ENV=production
```

### Connection Manager Options

```javascript
const options = {
  // Reliability Features
  enableReliability: true, // Enable SmartConnectionPool with circuit breaker
  enableAutoRecovery: true, // Enable automatic failure recovery
  enableHealthMonitoring: true, // Enable health monitoring
  enableWatchdog: true, // Enable connection watchdog

  // Recovery Configuration
  maxRecoveryAttempts: 3, // Max recovery attempts per error pattern
  recoveryDelay: 5000, // Delay before attempting recovery (ms)

  // Shutdown Configuration
  shutdownTimeout: 10000, // Max time for graceful shutdown (ms)
};
```

## Best Practices

### 1. Monitor Health Regularly

```javascript
// Set up periodic health checks
connectionManager.startHealthMonitoring(30000); // Every 30 seconds

// Or use cron jobs for less frequent checks
setInterval(async () => {
  const health = await connectionManager.getHealthStatus();
  if (health.status !== "healthy") {
    // Alert your monitoring system
    console.error("Server health degraded:", health);
  }
}, 60000); // Every minute
```

### 2. Handle Circuit Breaker States

```javascript
async function safeQuery(sql, params) {
  try {
    const pool = connectionManager.getConnection();
    const client = await pool.connect();

    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.error?.code === "NETWORK_UNAVAILABLE") {
      // Circuit breaker is open
      console.log("Service temporarily unavailable, using fallback...");
      return getFallbackData();
    }
    throw error;
  }
}
```

### 3. Enable All Reliability Features in Production

```javascript
// Production configuration
const connectionManager = new ConnectionManager({
  enableReliability: true,
  enableAutoRecovery: true,
  enableHealthMonitoring: true,
  enableWatchdog: true,
  maxRecoveryAttempts: 5,
  recoveryDelay: 3000,
  shutdownTimeout: 30000,
});
```

### 4. Monitor Recovery Statistics

```javascript
// Check recovery effectiveness daily
setInterval(async () => {
  const stats = connectionManager.getRecoveryStats();

  if (stats.success_rate < 80) {
    console.warn("Low recovery success rate:", stats);
    // Investigate underlying issues
  }
}, 86400000); // Daily
```

### 5. Use Health Checks for Load Balancers

```javascript
// Express.js health endpoint
app.get("/health", async (req, res) => {
  const health = await connectionManager.getHealthStatus();

  if (health.status === "healthy") {
    res.status(200).json(health);
  } else {
    res.status(503).json(health);
  }
});
```

### 6. Log Circuit Breaker State Changes

Circuit breaker automatically logs state transitions:

```
🔴 Circuit breaker opened after 5 failures. Will retry in 30000ms
🟡 Circuit breaker half-open, testing service...
🟢 Circuit breaker closed, service healthy
```

Monitor these logs to identify recurring issues.

### 7. Plan for Graceful Degradation

```javascript
async function queryWithFallback(sql, params) {
  const pool = connectionManager.getConnection();

  try {
    return await pool.executeWithRetry(async () => {
      const client = await pool.connect();
      try {
        return await client.query(sql, params);
      } finally {
        client.release();
      }
    });
  } catch (error) {
    // Circuit breaker open or max retries exceeded
    console.log("Database unavailable, using cache...");
    return getCachedData(sql, params);
  }
}
```

## Troubleshooting

### Circuit Breaker Stuck Open

**Symptoms:**

- All requests fail with "Circuit breaker is open"
- Health checks show unhealthy status

**Solutions:**

1. Check database connectivity:

   ```bash
   psql "$POSTGRES_URL_NON_POOLING" -c "SELECT 1"
   ```

2. Review recovery statistics:

   ```javascript
   const recovery = await mcp.callTool("get_recovery_stats", {});
   console.log(recovery.recovery_stats.recent_history);
   ```

3. Manually reset after fixing underlying issue:
   ```javascript
   await mcp.callTool("reset_circuit_breaker", {});
   ```

### High Memory Usage

**Symptoms:**

- Health checks show degraded/unhealthy memory status
- Heap usage consistently above 75%

**Solutions:**

1. Check connection pool size:

   ```javascript
   const stats = await mcp.callTool("get_connection_stats", {});
   console.log(stats.stats.pool);
   ```

2. Reduce max connections if needed (in ConnectionManager)

3. Check for connection leaks (connections not released)

### Slow Response Times

**Symptoms:**

- Health checks show slow response times (>1000ms)
- Degraded status for responseTime check

**Solutions:**

1. Check database performance
2. Review connection pool waiting requests
3. Consider increasing connection pool size
4. Check for slow queries

## Advanced Features

### Custom Error Patterns

Add custom error patterns to auto-recovery:

```javascript
recoveryManager.errorPatterns.CUSTOM_ERROR = /my custom pattern/i;
recoveryManager.recoveryStrategies.CUSTOM_ERROR = RecoveryStrategy.RECONNECT;
```

### Custom Health Checks

Extend HealthMonitor with custom checks:

```javascript
HealthMonitor.prototype.checkCustom = async function () {
  // Your custom health check logic
  return {
    status: HealthStatus.HEALTHY,
    message: "Custom check passed",
  };
};
```

## Performance Impact

Reliability features have minimal performance overhead:

- **Circuit Breaker**: <1ms per request
- **Health Monitoring**: Background process, no request impact
- **Auto-Recovery**: Only activates on failures
- **Smart Connection Pool**: ~2-3ms additional latency for retry logic

## Summary

Phase 1 Reliability & Robustness features provide:

✅ **Production-Ready Stability** - Circuit breaker prevents cascading failures
✅ **Automatic Recovery** - Self-healing from common failure scenarios
✅ **Comprehensive Monitoring** - Health checks and detailed diagnostics
✅ **Graceful Degradation** - Fails safely with fallback options
✅ **Zero-Configuration** - Works out of the box with sensible defaults

For more information, see:

- [ENHANCEMENT_ROADMAP.md](./ENHANCEMENT_ROADMAP.md) - Future improvements
- [README.md](./README.md) - General documentation
- [Security documentation](./SECURITY.md) - Security features
