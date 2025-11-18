/**
 * Phase 1 Infrastructure Tests
 */

describe("Phase 1: Core Infrastructure", () => {
  describe("Error Handling", () => {
    test("custom error types exist", () => {
      const errors = require("../src/errors/errors.js");

      expect(errors.DependencyManagerError).toBeDefined();
      expect(errors.NetworkError).toBeDefined();
      expect(errors.PackageNotFoundError).toBeDefined();
      expect(errors.RateLimitError).toBeDefined();
      expect(errors.ConfigurationError).toBeDefined();
      expect(errors.CacheError).toBeDefined();
      expect(errors.ValidationError).toBeDefined();
      expect(errors.SecurityAuditError).toBeDefined();
      expect(errors.FileSystemError).toBeDefined();
    });

    test("error recovery with retry exists", () => {
      const { ErrorRecovery } = require("../src/errors/errors.js");

      expect(ErrorRecovery.withRetry).toBeDefined();
      expect(ErrorRecovery.withFallback).toBeDefined();
      expect(ErrorRecovery.getBackoffDelay).toBeDefined();
    });
  });

  describe("Logging", () => {
    test("logger instance exists", () => {
      const { logger } = require("../src/utils/logger.js");

      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.time).toBeDefined();
    });

    test("correlation ID generation works", () => {
      const { Logger } = require("../src/utils/logger.js");

      const id1 = Logger.generateCorrelationId();
      const id2 = Logger.generateCorrelationId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBe(10);
    });
  });

  describe("Configuration Management", () => {
    test("config manager exists", () => {
      const { config } = require("../src/config/manager.js");

      expect(config).toBeDefined();
      expect(config.get).toBeDefined();
      expect(config.set).toBeDefined();
      expect(config.getConfig).toBeDefined();
    });

    test("config schema is valid", () => {
      const { ConfigSchema } = require("../src/config/schema.js");

      expect(ConfigSchema).toBeDefined();

      // Test parsing default config
      const defaultConfig = ConfigSchema.parse({});
      expect(defaultConfig.logLevel).toBe("info");
      expect(defaultConfig.cache.enabled).toBe(true);
      expect(defaultConfig.rateLimit.enabled).toBe(true);
    });

    test("config has all required sections", () => {
      const { config } = require("../src/config/manager.js");

      const fullConfig = config.getConfig();
      expect(fullConfig.cache).toBeDefined();
      expect(fullConfig.rateLimit).toBeDefined();
      expect(fullConfig.security).toBeDefined();
      expect(fullConfig.license).toBeDefined();
      expect(fullConfig.update).toBeDefined();
      expect(fullConfig.npm).toBeDefined();
    });
  });

  describe("Caching Layer", () => {
    test("cache manager exists", () => {
      const { cache } = require("../src/cache/cache.js");

      expect(cache).toBeDefined();
      expect(cache.get).toBeDefined();
      expect(cache.set).toBeDefined();
      expect(cache.delete).toBeDefined();
      expect(cache.clear).toBeDefined();
      expect(cache.getOrSet).toBeDefined();
    });

    test("cache get/set works", async () => {
      const { cache } = require("../src/cache/cache.js");

      const testKey = "test:key";
      const testValue = { data: "test" };

      await cache.set(testKey, testValue);
      const retrieved = await cache.get(testKey);

      expect(retrieved).toEqual(testValue);

      // Cleanup
      await cache.delete(testKey);
    });

    test("cache statistics available", () => {
      const { cache } = require("../src/cache/cache.js");

      const stats = cache.getStats();
      expect(stats).toBeDefined();
      expect(stats.memorySize).toBeDefined();
      expect(stats.maxSize).toBeDefined();
    });
  });

  describe("Rate Limiting", () => {
    test("rate limiter exists", () => {
      const { rateLimiter } = require("../src/ratelimit/limiter.js");

      expect(rateLimiter).toBeDefined();
      expect(rateLimiter.execute).toBeDefined();
      expect(rateLimiter.enqueue).toBeDefined();
      expect(rateLimiter.getQueueStatus).toBeDefined();
    });

    test("rate limiter executes function", async () => {
      const { rateLimiter } = require("../src/ratelimit/limiter.js");

      const testFn = jest.fn().mockResolvedValue("success");
      const result = await rateLimiter.execute(testFn);

      expect(result).toBe("success");
      expect(testFn).toHaveBeenCalled();
    });

    test("queue status is accessible", () => {
      const { rateLimiter } = require("../src/ratelimit/limiter.js");

      const status = rateLimiter.getQueueStatus();
      expect(status).toBeDefined();
      expect(status.executing).toBeDefined();
      expect(status.queued).toBeDefined();
      expect(status.done).toBeDefined();
    });
  });

  describe("Integration", () => {
    test("all infrastructure components work together", async () => {
      const { logger } = require("../src/utils/logger.js");
      const { cache } = require("../src/cache/cache.js");
      const { rateLimiter } = require("../src/ratelimit/limiter.js");
      const { config } = require("../src/config/manager.js");

      // All components should be initialized
      expect(logger).toBeDefined();
      expect(cache).toBeDefined();
      expect(rateLimiter).toBeDefined();
      expect(config).toBeDefined();

      // Test workflow: rate-limited cached operation with logging
      const operation = async () => {
        logger.info("Test operation");
        return "completed";
      };

      const result = await cache.getOrSet(
        "test:integration",
        async () => {
          return await rateLimiter.execute(operation);
        }
      );

      expect(result).toBe("completed");

      // Cleanup
      await cache.delete("test:integration");
    });
  });
});
