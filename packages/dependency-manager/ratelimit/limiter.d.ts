/**
 * Rate limiting and request throttling
 * Uses token bucket algorithm via Bottleneck
 */
export interface RateLimitOptions {
  priority?: number;
  weight?: number;
  id?: string;
}
export declare class RateLimiter {
  private static instance;
  private limiters;
  private queue;
  private stats;
  private constructor();
  static getInstance(): RateLimiter;
  /**
   * Create a new rate limiter for a specific service
   */
  private createLimiter;
  /**
   * Execute a function with rate limiting
   */
  execute<T>(
    fn: () => Promise<T>,
    service?: string,
    options?: RateLimitOptions,
  ): Promise<T>;
  /**
   * Execute with queue (simpler alternative)
   */
  enqueue<T>(
    fn: () => Promise<T>,
    options?: {
      priority?: number;
    },
  ): Promise<T>;
  /**
   * Check if rate limiter is at capacity
   */
  isAtCapacity(service?: string): boolean;
  /**
   * Get current queue status
   */
  getQueueStatus(service?: string): {
    executing: number;
    queued: number;
    done: number;
  };
  /**
   * Get statistics for a service
   */
  private getStats;
  /**
   * Get all statistics
   */
  getAllStats(): Map<
    string,
    {
      requests: number;
      failures: number;
      retries: number;
    }
  >;
  /**
   * Reset statistics
   */
  resetStats(service?: string): void;
  /**
   * Stop all limiters (cleanup)
   */
  stop(): Promise<void>;
  /**
   * Update configuration dynamically
   */
  updateConfig(
    newConfig: Partial<{
      maxConcurrent: number;
      minTime: number;
      reservoir: number;
    }>,
  ): void;
}
export declare const rateLimiter: RateLimiter;
//# sourceMappingURL=limiter.d.ts.map
