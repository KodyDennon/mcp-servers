/**
 * Query result caching for code execution mode
 * Reduces database load and speeds up repeated operations
 */
import crypto from 'crypto';
export class QueryCache {
    cache;
    defaultTTL;
    maxSize;
    stats;
    constructor(options = {}) {
        this.cache = new Map();
        this.defaultTTL = options.ttl || 300000; // 5 minutes default
        this.maxSize = options.maxSize || 100; // Max 100 cached queries
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
        };
    }
    /**
     * Get cached query result
     */
    get(sql, customKey) {
        const key = customKey || this.hashQuery(sql);
        const entry = this.cache.get(key);
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        // Check if expired
        if (Date.now() - entry.timestamp > this.defaultTTL) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        // Update stats
        entry.hits++;
        this.stats.hits++;
        return entry.result;
    }
    /**
     * Set cache entry
     */
    set(sql, result, options = {}) {
        const key = options.key || this.hashQuery(sql);
        const ttl = options.ttl || this.defaultTTL;
        // Evict oldest if at max size
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            hits: 0,
        });
    }
    /**
     * Delete cache entry
     */
    delete(sql, customKey) {
        const key = customKey || this.hashQuery(sql);
        return this.cache.delete(key);
    }
    /**
     * Clear entire cache
     */
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            size: this.cache.size,
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            hitRate: total > 0 ? this.stats.hits / total : 0,
        };
    }
    /**
     * Get all cache keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }
    /**
     * Evict oldest entry
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }
    /**
     * Hash query for cache key
     */
    hashQuery(sql) {
        return crypto
            .createHash('md5')
            .update(sql.trim().toLowerCase())
            .digest('hex');
    }
    /**
     * Cached query execution helper
     */
    async cachedQuery(sql, executor, options = {}) {
        const cached = this.get(sql, options.key);
        if (cached !== null) {
            return cached;
        }
        const result = await executor();
        this.set(sql, result, options);
        return result;
    }
}
//# sourceMappingURL=cache.js.map