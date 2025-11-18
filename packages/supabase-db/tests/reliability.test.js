/**
 * Reliability Features Tests
 * Tests for health checks, circuit breaker, and auto-recovery
 */

import {
  describe,
  expect,
  test,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  CircuitBreaker,
  SmartConnectionPool,
  CircuitState,
} from "../src/utils/circuitBreaker.js";
import {
  AutoRecoveryManager,
  ConnectionWatchdog,
} from "../src/utils/recovery.js";
import { HealthMonitor, HealthStatus } from "../src/utils/health.js";
import { MCPError } from "../src/utils/errorHandler.js";

describe("Circuit Breaker", () => {
  let circuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 2000,
    });
  });

  test("should start in CLOSED state", () => {
    expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
    expect(circuitBreaker.isHealthy()).toBe(true);
  });

  test("should open after reaching failure threshold", async () => {
    const failingFn = async () => {
      throw new Error("Service unavailable");
    };

    // Trigger failures
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(failingFn);
      } catch (error) {
        // Expected
      }
    }

    expect(circuitBreaker.state).toBe(CircuitState.OPEN);
    expect(circuitBreaker.isHealthy()).toBe(false);
  });

  test("should reject requests when circuit is OPEN", async () => {
    const failingFn = async () => {
      throw new Error("Service unavailable");
    };

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(failingFn);
      } catch (error) {
        // Expected
      }
    }

    // Circuit should reject next request
    await expect(circuitBreaker.execute(failingFn)).rejects.toThrow(MCPError);
  });

  test("should transition to HALF_OPEN after reset timeout", async () => {
    const failingFn = async () => {
      throw new Error("Service unavailable");
    };

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(failingFn);
      } catch (error) {
        // Expected
      }
    }

    expect(circuitBreaker.state).toBe(CircuitState.OPEN);

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 2100));

    // Next attempt should transition to HALF_OPEN
    try {
      await circuitBreaker.execute(failingFn);
    } catch (error) {
      // Expected to fail but should transition to HALF_OPEN first
    }

    expect(circuitBreaker.state).toBe(CircuitState.OPEN); // Back to OPEN after failure in HALF_OPEN
  });

  test("should close after successful attempts in HALF_OPEN", async () => {
    const fn = jest.fn().mockResolvedValue("success");
    const failingFn = async () => {
      throw new Error("Service unavailable");
    };

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(failingFn);
      } catch (error) {
        // Expected
      }
    }

    expect(circuitBreaker.state).toBe(CircuitState.OPEN);

    // Wait for reset timeout
    await new Promise((resolve) => setTimeout(resolve, 2100));

    // Successful attempts should close the circuit
    circuitBreaker.state = CircuitState.HALF_OPEN; // Manually set for testing
    circuitBreaker.successes = 0;

    await circuitBreaker.execute(fn);
    await circuitBreaker.execute(fn);

    expect(circuitBreaker.state).toBe(CircuitState.CLOSED);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("should use fallback when provided and circuit is OPEN", async () => {
    const failingFn = async () => {
      throw new Error("Service unavailable");
    };

    const fallback = jest.fn().mockResolvedValue("fallback result");

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(failingFn);
      } catch (error) {
        // Expected
      }
    }

    // Execute with fallback
    const result = await circuitBreaker.execute(failingFn, fallback);

    expect(result).toBe("fallback result");
    expect(fallback).toHaveBeenCalled();
  });

  test("should track metrics correctly", async () => {
    const successFn = jest.fn().mockResolvedValue("success");
    const failingFn = async () => {
      throw new Error("Failed");
    };

    await circuitBreaker.execute(successFn);
    await circuitBreaker.execute(successFn);

    try {
      await circuitBreaker.execute(failingFn);
    } catch (error) {
      // Expected
    }

    const status = circuitBreaker.getStatus();

    expect(status.total_requests).toBe(3);
    expect(status.total_successes).toBe(2);
    expect(status.total_failures).toBe(1);
  });
});

describe("SmartConnectionPool", () => {
  let mockPool;
  let smartPool;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      totalCount: 10,
      idleCount: 5,
      waitingCount: 0,
      end: jest.fn().mockResolvedValue(undefined),
    };

    smartPool = new SmartConnectionPool(mockPool, {
      failureThreshold: 3,
      timeout: 1000,
      maxRetries: 2,
    });
  });

  test("should connect successfully", async () => {
    const client = await smartPool.connect();

    expect(client).toBeDefined();
    expect(mockPool.connect).toHaveBeenCalled();
  });

  test("should track connection attempts", async () => {
    await smartPool.connect();
    await smartPool.connect();

    const stats = smartPool.getStats();

    expect(stats.connections.attempts).toBe(2);
    expect(stats.connections.successes).toBe(2);
  });

  test("should retry on failure", async () => {
    mockPool.connect
      .mockRejectedValueOnce(new Error("Connection failed"))
      .mockResolvedValueOnce(mockClient);

    await expect(
      smartPool.executeWithRetry(async () => {
        const client = await mockPool.connect();
        await client.query("SELECT 1");
      }),
    ).resolves.not.toThrow();

    expect(mockPool.connect).toHaveBeenCalledTimes(2);
  });

  test("should track query metrics", async () => {
    const client = await smartPool.connect();

    await client.query("SELECT 1");
    await client.query("SELECT 2");

    const stats = smartPool.getStats();

    expect(stats.queries.total).toBe(2);
  });

  test("should report pool statistics", () => {
    const stats = smartPool.getStats();

    expect(stats.pool).toBeDefined();
    expect(stats.pool.total_connections).toBe(10);
    expect(stats.pool.idle_connections).toBe(5);
    expect(stats.pool.waiting_requests).toBe(0);
  });
});

describe("Auto-Recovery Manager", () => {
  let mockConnectionManager;
  let recoveryManager;

  beforeEach(() => {
    mockConnectionManager = {
      getConnection: jest.fn().mockResolvedValue({
        connect: jest.fn().mockResolvedValue({
          query: jest.fn().mockResolvedValue({ rows: [] }),
          release: jest.fn(),
        }),
      }),
    };

    recoveryManager = new AutoRecoveryManager(mockConnectionManager, {
      enabled: true,
      maxRecoveryAttempts: 2,
      recoveryDelay: 100,
    });
  });

  test("should identify error patterns", () => {
    const connectionError = new Error("Connection lost");
    const timeoutError = new Error("Operation timed out");
    const unknownError = new Error("Random error");

    expect(recoveryManager.identifyErrorPattern(connectionError)).toBe(
      "CONNECTION_LOST",
    );
    expect(recoveryManager.identifyErrorPattern(timeoutError)).toBe("TIMEOUT");
    expect(recoveryManager.identifyErrorPattern(unknownError)).toBeNull();
  });

  test("should attempt recovery for known error patterns", async () => {
    const error = new Error("Connection lost");

    const result = await recoveryManager.attemptRecovery(error);

    expect(result).toBe(true);
    expect(mockConnectionManager.getConnection).toHaveBeenCalled();
  });

  test("should not attempt recovery for unknown errors", async () => {
    const error = new Error("Unknown error");

    const result = await recoveryManager.attemptRecovery(error);

    expect(result).toBe(false);
  });

  test("should respect max recovery attempts", async () => {
    mockConnectionManager.getConnection = jest
      .fn()
      .mockRejectedValue(new Error("Still failing"));

    const error = new Error("Connection lost");

    await recoveryManager.attemptRecovery(error);
    await recoveryManager.attemptRecovery(error);
    const result = await recoveryManager.attemptRecovery(error);

    expect(result).toBe(false); // Should give up after max attempts
  });

  test("should track recovery history", async () => {
    const error = new Error("Connection lost");

    await recoveryManager.attemptRecovery(error);

    const stats = recoveryManager.getRecoveryStats();

    expect(stats.total_attempts).toBeGreaterThan(0);
    expect(stats.recent_history).toBeDefined();
  });

  test("should enable and disable recovery", () => {
    recoveryManager.disable();
    expect(recoveryManager.enabled).toBe(false);

    recoveryManager.enable();
    expect(recoveryManager.enabled).toBe(true);
  });
});

describe("Health Monitor", () => {
  let mockConnectionManager;
  let healthMonitor;

  beforeEach(() => {
    mockConnectionManager = {
      getConnection: jest.fn().mockResolvedValue({
        connect: jest.fn().mockResolvedValue({
          query: jest.fn().mockResolvedValue({ rows: [] }),
          release: jest.fn(),
        }),
        totalCount: 10,
        idleCount: 5,
        waitingCount: 0,
      }),
    };

    healthMonitor = new HealthMonitor(mockConnectionManager);
  });

  test("should run diagnostics successfully", async () => {
    const result = await healthMonitor.runDiagnostics();

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.checks).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });

  test("should check database connectivity", async () => {
    const result = await healthMonitor.checkDatabase();

    expect(result).toBeDefined();
    expect(result.status).toBe(HealthStatus.HEALTHY);
    expect(result.latency_ms).toBeDefined();
  });

  test("should detect database connection failures", async () => {
    mockConnectionManager.getConnection = jest
      .fn()
      .mockRejectedValue(new Error("Database unavailable"));

    const result = await healthMonitor.checkDatabase();

    expect(result.status).toBe(HealthStatus.UNHEALTHY);
    expect(result.message).toContain("failed");
  });

  test("should check memory usage", async () => {
    const result = await healthMonitor.checkMemory();

    expect(result).toBeDefined();
    expect(result.heap_used_mb).toBeDefined();
    expect(result.heap_total_mb).toBeDefined();
    expect(result.heap_used_percent).toBeDefined();
  });

  test("should check response time", async () => {
    const result = await healthMonitor.checkResponseTime();

    expect(result).toBeDefined();
    expect(result.response_time_ms).toBeDefined();
  });

  test("should check environment configuration", async () => {
    process.env.POSTGRES_URL_NON_POOLING = "postgresql://test";
    process.env.MCP_MODE = "direct";

    const result = await healthMonitor.checkEnvironment();

    expect(result).toBeDefined();
    expect(result.status).toBe(HealthStatus.HEALTHY);

    delete process.env.POSTGRES_URL_NON_POOLING;
    delete process.env.MCP_MODE;
  });

  test("should detect missing environment variables", async () => {
    const originalEnv = process.env.POSTGRES_URL_NON_POOLING;
    delete process.env.POSTGRES_URL_NON_POOLING;

    const result = await healthMonitor.checkEnvironment();

    expect(result.status).toBe(HealthStatus.UNHEALTHY);
    expect(result.missing_vars).toContain("POSTGRES_URL_NON_POOLING");

    if (originalEnv) {
      process.env.POSTGRES_URL_NON_POOLING = originalEnv;
    }
  });

  test("should calculate overall status correctly", () => {
    const checks = {
      database: { status: HealthStatus.HEALTHY },
      memory: { status: HealthStatus.HEALTHY },
      responseTime: { status: HealthStatus.DEGRADED },
    };

    const status = healthMonitor.calculateOverallStatus(checks);

    expect(status).toBe(HealthStatus.DEGRADED);
  });

  test("should record health history", async () => {
    await healthMonitor.runDiagnostics();
    await healthMonitor.runDiagnostics();

    const history = healthMonitor.getHealthHistory();

    expect(history.length).toBe(2);
  });

  test("should provide health statistics", async () => {
    await healthMonitor.runDiagnostics();

    const stats = healthMonitor.getHealthStats();

    expect(stats).toBeDefined();
    expect(stats.total_checks).toBe(1);
    expect(stats.uptime_percent).toBeDefined();
  });

  test("should limit health history size", async () => {
    healthMonitor.maxHistorySize = 5;

    for (let i = 0; i < 10; i++) {
      await healthMonitor.runDiagnostics();
    }

    const history = healthMonitor.getHealthHistory();

    expect(history.length).toBeLessThanOrEqual(5);
  });
});

describe("Connection Watchdog", () => {
  let mockConnectionManager;
  let mockRecoveryManager;
  let watchdog;

  beforeEach(() => {
    mockConnectionManager = {
      getConnection: jest.fn().mockResolvedValue({
        connect: jest.fn().mockResolvedValue({
          query: jest.fn().mockResolvedValue({ rows: [] }),
          release: jest.fn(),
        }),
      }),
    };

    mockRecoveryManager = {
      attemptRecovery: jest.fn().mockResolvedValue(true),
    };

    watchdog = new ConnectionWatchdog(
      mockConnectionManager,
      mockRecoveryManager,
      {
        checkInterval: 100,
        maxConsecutiveFailures: 2,
        enabled: false, // Don't auto-start
      },
    );
  });

  afterEach(() => {
    watchdog.stop();
  });

  test("should start and stop", () => {
    watchdog.start();
    expect(watchdog.watchdogInterval).toBeDefined();

    watchdog.stop();
    expect(watchdog.watchdogInterval).toBeNull();
  });

  test("should check connection health periodically", async () => {
    watchdog.start();

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(mockConnectionManager.getConnection).toHaveBeenCalled();

    watchdog.stop();
  });

  test("should trigger recovery after max consecutive failures", async () => {
    mockConnectionManager.getConnection = jest
      .fn()
      .mockRejectedValue(new Error("Connection failed"));

    watchdog.maxConsecutiveFailures = 2;

    await watchdog.checkConnection();
    await watchdog.checkConnection();

    expect(mockRecoveryManager.attemptRecovery).toHaveBeenCalled();
  });
});
