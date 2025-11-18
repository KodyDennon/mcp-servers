/**
 * Rate Limiter
 * Token bucket and sliding window rate limiting
 */

import { MCPError } from "./errorHandler.js";

/**
 * Token Bucket Rate Limiter
 * Allows bursts while maintaining average rate
 */
export class TokenBucketLimiter {
  constructor(options = {}) {
    this.capacity = options.capacity || 100; // Maximum tokens
    this.refillRate = options.refillRate || 10; // Tokens per second
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.buckets = new Map(); // Per-client buckets
  }

  /**
   * Check if request is allowed
   */
  async allow(clientId, cost = 1) {
    const bucket = this.getBucket(clientId);

    // Refill tokens based on time elapsed
    this.refill(bucket);

    // Check if enough tokens available
    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: this.calculateResetTime(bucket),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: this.calculateResetTime(bucket),
      retryAfter: Math.ceil((cost - bucket.tokens) / this.refillRate),
    };
  }

  /**
   * Get or create bucket for client
   */
  getBucket(clientId) {
    if (!this.buckets.has(clientId)) {
      this.buckets.set(clientId, {
        tokens: this.capacity,
        lastRefill: Date.now(),
      });
    }
    return this.buckets.get(clientId);
  }

  /**
   * Refill tokens based on elapsed time
   */
  refill(bucket) {
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = elapsed * this.refillRate;

    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Calculate reset time
   */
  calculateResetTime(bucket) {
    const tokensNeeded = this.capacity - bucket.tokens;
    const secondsToRefill = tokensNeeded / this.refillRate;
    return new Date(Date.now() + secondsToRefill * 1000);
  }

  /**
   * Get statistics
   */
  getStats() {
    const clients = Array.from(this.buckets.entries()).map(([id, bucket]) => ({
      clientId: id,
      tokens: Math.floor(bucket.tokens),
      capacity: this.capacity,
      utilizationPercent: Math.round(
        ((this.capacity - bucket.tokens) / this.capacity) * 100,
      ),
    }));

    return {
      capacity: this.capacity,
      refillRate: this.refillRate,
      activeClients: this.buckets.size,
      clients: clients.slice(0, 10), // Top 10
    };
  }

  /**
   * Reset all buckets
   */
  reset() {
    this.buckets.clear();
  }
}

/**
 * Sliding Window Rate Limiter
 * More accurate rate limiting using sliding time window
 */
export class SlidingWindowLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 100;
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.windows = new Map(); // Per-client windows
  }

  /**
   * Check if request is allowed
   */
  async allow(clientId) {
    const window = this.getWindow(clientId);
    const now = Date.now();

    // Remove old requests outside window
    window.requests = window.requests.filter(
      (time) => now - time < this.windowMs,
    );

    // Check if under limit
    if (window.requests.length < this.maxRequests) {
      window.requests.push(now);
      return {
        allowed: true,
        remaining: this.maxRequests - window.requests.length,
        resetAt: new Date(window.requests[0] + this.windowMs),
      };
    }

    // Calculate retry time
    const oldestRequest = window.requests[0];
    const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(oldestRequest + this.windowMs),
      retryAfter: retryAfter,
    };
  }

  /**
   * Get or create window for client
   */
  getWindow(clientId) {
    if (!this.windows.has(clientId)) {
      this.windows.set(clientId, {
        requests: [],
      });
    }
    return this.windows.get(clientId);
  }

  /**
   * Get statistics
   */
  getStats() {
    const clients = Array.from(this.windows.entries()).map(([id, window]) => ({
      clientId: id,
      requests: window.requests.length,
      maxRequests: this.maxRequests,
      utilizationPercent: Math.round(
        (window.requests.length / this.maxRequests) * 100,
      ),
    }));

    return {
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      activeClients: this.windows.size,
      clients: clients.slice(0, 10),
    };
  }

  /**
   * Reset all windows
   */
  reset() {
    this.windows.clear();
  }
}

/**
 * Rate Limit Manager
 * Coordinates multiple rate limiters
 */
export class RateLimitManager {
  constructor(options = {}) {
    this.limiters = new Map();
    this.defaultTier = options.defaultTier || "free";

    // Define tiers
    this.tiers = options.tiers || {
      free: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        burstCapacity: 10,
      },
      pro: {
        requestsPerMinute: 300,
        requestsPerHour: 10000,
        burstCapacity: 50,
      },
      enterprise: {
        requestsPerMinute: 1000,
        requestsPerHour: 100000,
        burstCapacity: 200,
      },
    };

    // Initialize limiters for each tier
    for (const [tierName, config] of Object.entries(this.tiers)) {
      this.limiters.set(
        `${tierName}-minute`,
        new SlidingWindowLimiter({
          maxRequests: config.requestsPerMinute,
          windowMs: 60000,
        }),
      );

      this.limiters.set(
        `${tierName}-hour`,
        new SlidingWindowLimiter({
          maxRequests: config.requestsPerHour,
          windowMs: 3600000,
        }),
      );

      this.limiters.set(
        `${tierName}-burst`,
        new TokenBucketLimiter({
          capacity: config.burstCapacity,
          refillRate: config.requestsPerMinute / 60,
        }),
      );
    }

    this.clientTiers = new Map(); // Client -> tier mapping
  }

  /**
   * Set client tier
   */
  setClientTier(clientId, tier) {
    if (!this.tiers[tier]) {
      throw new MCPError("VALIDATION_INVALID_INPUT", `Unknown tier: ${tier}`, {
        availableTiers: Object.keys(this.tiers),
      });
    }

    this.clientTiers.set(clientId, tier);
  }

  /**
   * Get client tier
   */
  getClientTier(clientId) {
    return this.clientTiers.get(clientId) || this.defaultTier;
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(clientId, cost = 1) {
    const tier = this.getClientTier(clientId);

    // Check all limiters for this tier
    const minuteLimiter = this.limiters.get(`${tier}-minute`);
    const hourLimiter = this.limiters.get(`${tier}-hour`);
    const burstLimiter = this.limiters.get(`${tier}-burst`);

    // Check burst limit first (most restrictive)
    const burstResult = await burstLimiter.allow(clientId, cost);
    if (!burstResult.allowed) {
      return {
        allowed: false,
        reason: "burst_limit_exceeded",
        tier: tier,
        ...burstResult,
      };
    }

    // Check minute limit
    const minuteResult = await minuteLimiter.allow(clientId);
    if (!minuteResult.allowed) {
      // Refund burst tokens
      burstLimiter.getBucket(clientId).tokens += cost;
      return {
        allowed: false,
        reason: "minute_limit_exceeded",
        tier: tier,
        ...minuteResult,
      };
    }

    // Check hour limit
    const hourResult = await hourLimiter.allow(clientId);
    if (!hourResult.allowed) {
      // Refund tokens
      burstLimiter.getBucket(clientId).tokens += cost;
      return {
        allowed: false,
        reason: "hour_limit_exceeded",
        tier: tier,
        ...hourResult,
      };
    }

    return {
      allowed: true,
      tier: tier,
      limits: {
        minute: minuteResult.remaining,
        hour: hourResult.remaining,
        burst: burstResult.remaining,
      },
    };
  }

  /**
   * Get statistics for all tiers
   */
  getStats() {
    const stats = {};

    for (const tier of Object.keys(this.tiers)) {
      stats[tier] = {
        minute: this.limiters.get(`${tier}-minute`).getStats(),
        hour: this.limiters.get(`${tier}-hour`).getStats(),
        burst: this.limiters.get(`${tier}-burst`).getStats(),
      };
    }

    stats.clientTiers = Array.from(this.clientTiers.entries()).map(
      ([id, tier]) => ({
        clientId: id,
        tier: tier,
      }),
    );

    return stats;
  }

  /**
   * Reset all limiters
   */
  reset() {
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
    this.clientTiers.clear();
  }
}
