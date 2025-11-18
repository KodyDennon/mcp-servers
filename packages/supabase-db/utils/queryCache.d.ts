/**
 * Query Cache
 * LRU cache with TTL support and size limits
 */
export class QueryCache {
    constructor(options?: {});
    maxSize: any;
    maxEntries: any;
    defaultTtl: any;
    cache: Map<any, any>;
    currentSize: number;
    stats: {
        hits: number;
        misses: number;
        evictions: number;
        sets: number;
        deletes: number;
    };
    cleanupInterval: NodeJS.Timeout;
    /**
     * Generate cache key from query and params
     */
    generateKey(sql: any, params?: any[]): string;
    /**
     * Get cached query result
     */
    get(sql: any, params?: any[]): any;
    /**
     * Set cache entry
     */
    set(sql: any, params: any[] | undefined, value: any, ttl?: any): boolean;
    /**
     * Delete cache entry
     */
    delete(key: any): boolean;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Ensure we have space for new entries
     */
    ensureSpace(): void;
    /**
     * Evict least recently used entry
     */
    evictLRU(): void;
    /**
     * Clean up expired entries
     */
    cleanup(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        hitRate: number;
        entries: number;
        currentSize: number;
        maxSize: any;
        sizeUtilization: number;
        topEntries: {
            key: string;
            hits: any;
            size: any;
            age: number;
        }[];
        hits: number;
        misses: number;
        evictions: number;
        sets: number;
        deletes: number;
    };
    /**
     * Get top N most accessed entries
     */
    getTopEntries(n?: number): {
        key: string;
        hits: any;
        size: any;
        age: number;
    }[];
    /**
     * Invalidate cache entries matching pattern
     */
    invalidatePattern(pattern: any): number;
    /**
     * Warm cache with common queries
     */
    warmup(queries: any, executor: any): Promise<void>;
    /**
     * Stop cleanup interval
     */
    destroy(): void;
}
/**
 * Query Result Compressor
 * Compresses large query results
 */
export class QueryCompressor {
    /**
     * Compress query result
     */
    static compress(result: any): any;
    /**
     * Decompress query result
     */
    static decompress(compressed: any): {
        rows: any;
        rowCount: any;
    };
}
//# sourceMappingURL=queryCache.d.ts.map