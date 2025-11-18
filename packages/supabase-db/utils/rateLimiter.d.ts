/**
 * Token Bucket Rate Limiter
 * Allows bursts while maintaining average rate
 */
export class TokenBucketLimiter {
    constructor(options?: {});
    capacity: any;
    refillRate: any;
    tokens: any;
    lastRefill: number;
    buckets: Map<any, any>;
    /**
     * Check if request is allowed
     */
    allow(clientId: any, cost?: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetAt: Date;
        retryAfter?: undefined;
    } | {
        allowed: boolean;
        remaining: number;
        resetAt: Date;
        retryAfter: number;
    }>;
    /**
     * Get or create bucket for client
     */
    getBucket(clientId: any): any;
    /**
     * Refill tokens based on elapsed time
     */
    refill(bucket: any): void;
    /**
     * Calculate reset time
     */
    calculateResetTime(bucket: any): Date;
    /**
     * Get statistics
     */
    getStats(): {
        capacity: any;
        refillRate: any;
        activeClients: number;
        clients: {
            clientId: any;
            tokens: number;
            capacity: any;
            utilizationPercent: number;
        }[];
    };
    /**
     * Reset all buckets
     */
    reset(): void;
}
/**
 * Sliding Window Rate Limiter
 * More accurate rate limiting using sliding time window
 */
export class SlidingWindowLimiter {
    constructor(options?: {});
    maxRequests: any;
    windowMs: any;
    windows: Map<any, any>;
    /**
     * Check if request is allowed
     */
    allow(clientId: any): Promise<{
        allowed: boolean;
        remaining: number;
        resetAt: Date;
        retryAfter?: undefined;
    } | {
        allowed: boolean;
        remaining: number;
        resetAt: Date;
        retryAfter: number;
    }>;
    /**
     * Get or create window for client
     */
    getWindow(clientId: any): any;
    /**
     * Get statistics
     */
    getStats(): {
        maxRequests: any;
        windowMs: any;
        activeClients: number;
        clients: {
            clientId: any;
            requests: any;
            maxRequests: any;
            utilizationPercent: number;
        }[];
    };
    /**
     * Reset all windows
     */
    reset(): void;
}
/**
 * Rate Limit Manager
 * Coordinates multiple rate limiters
 */
export class RateLimitManager {
    constructor(options?: {});
    limiters: Map<any, any>;
    defaultTier: any;
    tiers: any;
    clientTiers: Map<any, any>;
    /**
     * Set client tier
     */
    setClientTier(clientId: any, tier: any): void;
    /**
     * Get client tier
     */
    getClientTier(clientId: any): any;
    /**
     * Check if request is allowed
     */
    checkLimit(clientId: any, cost?: number): Promise<any>;
    /**
     * Get statistics for all tiers
     */
    getStats(): {
        clientTiers: {
            clientId: any;
            tier: any;
        }[];
    };
    /**
     * Reset all limiters
     */
    reset(): void;
}
//# sourceMappingURL=rateLimiter.d.ts.map