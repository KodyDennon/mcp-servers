import Bottleneck from "bottleneck";
import { PQueue } from "p-queue";
import { config } from "../config/manager.js";
import { RateLimitError } from "../errors/errors.js";
import { logger } from "../utils/logger.js";
export class RateLimiter {
  static instance;
  limiters;
  queue;
  stats;
  constructor() {
    this.limiters = new Map();
    this.stats = new Map();
    const rateLimitConfig = config.get("rateLimit");
    // Initialize priority queue
    this.queue = new PQueue({
      concurrency: rateLimitConfig.maxConcurrent,
    });
    // Initialize default limiter for npm registry
    this.createLimiter("npm-registry");
    logger.info("Rate limiter initialized", {
      maxConcurrent: rateLimitConfig.maxConcurrent,
      minTime: rateLimitConfig.minTime,
    });
  }
  static getInstance() {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }
  /**
   * Create a new rate limiter for a specific service
   */
  createLimiter(name) {
    const rateLimitConfig = config.get("rateLimit");
    const limiter = new Bottleneck({
      maxConcurrent: rateLimitConfig.maxConcurrent,
      minTime: rateLimitConfig.minTime,
      reservoir: rateLimitConfig.reservoir,
      reservoirRefreshAmount: rateLimitConfig.reservoirRefreshAmount,
      reservoirRefreshInterval: rateLimitConfig.reservoirRefreshInterval,
    });
    // Event handlers
    limiter.on("failed", async (error, jobInfo) => {
      const stats = this.getStats(name);
      stats.failures++;
      logger.warn("Rate limited request failed", {
        limiter: name,
        error: error.message,
        retryCount: jobInfo.retryCount,
      });
      // Retry logic with exponential backoff
      if (jobInfo.retryCount < rateLimitConfig.maxRetries) {
        stats.retries++;
        const delay = Math.min(1000 * Math.pow(2, jobInfo.retryCount), 30000);
        logger.debug("Retrying request", {
          limiter: name,
          delay,
          retryCount: jobInfo.retryCount,
        });
        return delay;
      }
      return undefined; // No more retries
    });
    limiter.on("retry", (error, jobInfo) => {
      logger.debug("Retrying rate limited request", {
        limiter: name,
        retryCount: jobInfo.retryCount,
      });
    });
    limiter.on("done", (info) => {
      const stats = this.getStats(name);
      stats.requests++;
      logger.trace("Rate limited request completed", {
        limiter: name,
        duration: info.duration,
      });
    });
    this.limiters.set(name, limiter);
    return limiter;
  }
  /**
   * Execute a function with rate limiting
   */
  async execute(fn, service = "npm-registry", options) {
    if (!config.get("rateLimit").enabled) {
      return await fn();
    }
    let limiter = this.limiters.get(service);
    if (!limiter) {
      limiter = this.createLimiter(service);
    }
    try {
      const result = await limiter.schedule(
        {
          priority: options?.priority ?? 5,
          weight: options?.weight ?? 1,
          id: options?.id,
        },
        fn,
      );
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("rate limit")) {
        throw new RateLimitError("Rate limit exceeded", undefined, error);
      }
      throw error;
    }
  }
  /**
   * Execute with queue (simpler alternative)
   */
  async enqueue(fn, options) {
    if (!config.get("rateLimit").enabled) {
      return await fn();
    }
    return await this.queue.add(fn, { priority: options?.priority });
  }
  /**
   * Check if rate limiter is at capacity
   */
  isAtCapacity(service = "npm-registry") {
    const limiter = this.limiters.get(service);
    if (!limiter) {
      return false;
    }
    return limiter.counts().EXECUTING >= config.get("rateLimit").maxConcurrent;
  }
  /**
   * Get current queue status
   */
  getQueueStatus(service = "npm-registry") {
    const limiter = this.limiters.get(service);
    if (!limiter) {
      return { executing: 0, queued: 0, done: 0 };
    }
    const counts = limiter.counts();
    return {
      executing: counts.EXECUTING,
      queued: counts.QUEUED,
      done: counts.DONE,
    };
  }
  /**
   * Get statistics for a service
   */
  getStats(service) {
    let stats = this.stats.get(service);
    if (!stats) {
      stats = { requests: 0, failures: 0, retries: 0 };
      this.stats.set(service, stats);
    }
    return stats;
  }
  /**
   * Get all statistics
   */
  getAllStats() {
    return new Map(this.stats);
  }
  /**
   * Reset statistics
   */
  resetStats(service) {
    if (service) {
      this.stats.delete(service);
    } else {
      this.stats.clear();
    }
  }
  /**
   * Stop all limiters (cleanup)
   */
  async stop() {
    logger.info("Stopping rate limiters");
    for (const [name, limiter] of this.limiters.entries()) {
      await limiter.stop({ dropWaitingJobs: false });
      logger.debug("Rate limiter stopped", { limiter: name });
    }
    await this.queue.onIdle();
  }
  /**
   * Update configuration dynamically
   */
  updateConfig(newConfig) {
    const rateLimitConfig = config.get("rateLimit");
    // Update limiters
    for (const limiter of this.limiters.values()) {
      if (newConfig.maxConcurrent !== undefined) {
        limiter.updateSettings({ maxConcurrent: newConfig.maxConcurrent });
      }
      if (newConfig.minTime !== undefined) {
        limiter.updateSettings({ minTime: newConfig.minTime });
      }
      if (newConfig.reservoir !== undefined) {
        limiter.updateSettings({ reservoir: newConfig.reservoir });
      }
    }
    logger.info("Rate limiter configuration updated", newConfig);
  }
}
// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();
//# sourceMappingURL=limiter.js.map
