/**
 * Multi-level cache implementation
 * - Level 1: In-memory (fast, limited size)
 * - Level 2: Redis (optional, for distributed caching)
 * - Level 3: File system (optional, for persistence)
 */
export interface CacheOptions {
  ttl?: number;
  namespace?: string;
}
export declare class CacheManager {
  private static instance;
  private memoryCache;
  private keyvCache;
  private maxSize;
  private constructor();
  static getInstance(): CacheManager;
  /**
   * Initialize Keyv cache (Redis or file-based)
   */
  private initializeKeyv;
  /**
   * Get value from cache
   */
  get<T>(key: string, options?: CacheOptions): Promise<T | undefined>;
  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  /**
   * Delete value from cache
   */
  delete(key: string, options?: CacheOptions): Promise<void>;
  /**
   * Clear all cache
   */
  clear(namespace?: string): Promise<void>;
  /**
   * Get or set (compute if missing)
   */
  getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T>;
  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: RegExp, namespace?: string): Promise<number>;
  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number;
    maxSize: number;
    hitRate?: number;
  };
  /**
   * Warm cache with common packages
   */
  warmCache(packages: string[]): Promise<void>;
  /**
   * Build cache key with namespace
   */
  private buildKey;
  /**
   * Get value from memory cache
   */
  private getFromMemory;
  /**
   * Set value in memory cache with LRU eviction
   */
  private setInMemory;
}
export declare const cache: CacheManager;
//# sourceMappingURL=cache.d.ts.map
