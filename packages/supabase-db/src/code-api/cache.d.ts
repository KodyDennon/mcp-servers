/**
 * Query result caching for code execution mode
 * Reduces database load and speeds up repeated operations
 */
import type { CacheOptions } from './types.js';
export declare class QueryCache {
    private cache;
    private defaultTTL;
    private maxSize;
    private stats;
    constructor(options?: {
        ttl?: number;
        maxSize?: number;
    });
    /**
     * Get cached query result
     */
    get(sql: string, customKey?: string): any | null;
    /**
     * Set cache entry
     */
    set(sql: string, result: any, options?: CacheOptions): void;
    /**
     * Delete cache entry
     */
    delete(sql: string, customKey?: string): boolean;
    /**
     * Clear entire cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        hits: number;
        misses: number;
        evictions: number;
        hitRate: number;
    };
    /**
     * Get all cache keys
     */
    keys(): string[];
    /**
     * Evict oldest entry
     */
    private evictOldest;
    /**
     * Hash query for cache key
     */
    private hashQuery;
    /**
     * Cached query execution helper
     */
    cachedQuery<T = any>(sql: string, executor: () => Promise<T>, options?: CacheOptions): Promise<T>;
}
//# sourceMappingURL=cache.d.ts.map