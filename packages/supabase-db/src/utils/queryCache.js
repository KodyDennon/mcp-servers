/**
 * Query Cache
 * Intelligent caching system for query results
 */

import crypto from "crypto";

/**
 * Cache Entry
 */
class CacheEntry {
  constructor(key, value, ttl) {
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.expiresAt = ttl ? Date.now() + ttl : null;
    this.hits = 0;
    this.lastAccessedAt = Date.now();
    this.size = this.estimateSize(value);
  }

  /**
   * Estimate memory size of cached value
   */
  estimateSize(value) {
    const str = JSON.stringify(value);
    return Buffer.byteLength(str, "utf8");
  }

  /**
   * Check if entry is expired
   */
  isExpired() {
    if (!this.expiresAt) return false;
    return Date.now() > this.expiresAt;
  }

  /**
   * Access the entry (updates stats)
   */
  access() {
    this.hits++;
    this.lastAccessedAt = Date.now();
    return this.value;
  }
}

/**
 * Query Cache
 * LRU cache with TTL support and size limits
 */
export class QueryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB
    this.maxEntries = options.maxEntries || 1000;
    this.defaultTtl = options.defaultTtl || 300000; // 5 minutes
    this.cache = new Map();
    this.currentSize = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      deletes: 0,
    };

    // Auto cleanup expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  /**
   * Generate cache key from query and params
   */
  generateKey(sql, params = []) {
    const hash = crypto.createHash("sha256");
    hash.update(sql);
    hash.update(JSON.stringify(params));
    return hash.digest("hex");
  }

  /**
   * Get cached query result
   */
  get(sql, params = []) {
    const key = this.generateKey(sql, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.isExpired()) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.access();
  }

  /**
   * Set cache entry
   */
  set(sql, params = [], value, ttl = this.defaultTtl) {
    const key = this.generateKey(sql, params);

    // Check if we need to evict entries
    this.ensureSpace();

    const entry = new CacheEntry(key, value, ttl);

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key);
      this.currentSize -= oldEntry.size;
    }

    this.cache.set(key, entry);
    this.currentSize += entry.size;
    this.stats.sets++;

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      this.stats.deletes++;
      return true;
    }
    return false;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.currentSize = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Ensure we have space for new entries
   */
  ensureSpace() {
    // Check size limit
    while (this.currentSize > this.maxSize * 0.9 && this.cache.size > 0) {
      this.evictLRU();
    }

    // Check entry count limit
    while (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let lruKey = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < lruTime) {
        lruTime = entry.lastAccessedAt;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
      this.stats.evictions++;
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.isExpired()) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.error(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      entries: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      sizeUtilization: Math.round((this.currentSize / this.maxSize) * 100),
      topEntries: this.getTopEntries(10),
    };
  }

  /**
   * Get top N most accessed entries
   */
  getTopEntries(n = 10) {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => b[1].hits - a[1].hits);

    return entries.slice(0, n).map(([key, entry]) => ({
      key: key.substring(0, 16) + "...",
      hits: entry.hits,
      size: entry.size,
      age: Date.now() - entry.createdAt,
    }));
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      // This is a simplified pattern matching
      // In production, you'd want to store metadata with entries
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }

    return keysToDelete.length;
  }

  /**
   * Warm cache with common queries
   */
  async warmup(queries, executor) {
    console.error(`Warming up cache with ${queries.length} queries...`);

    for (const { sql, params, ttl } of queries) {
      try {
        const result = await executor(sql, params);
        this.set(sql, params, result, ttl);
      } catch (error) {
        console.error(`Failed to warm cache for query: ${error.message}`);
      }
    }

    console.error(`Cache warmed up with ${this.cache.size} entries`);
  }

  /**
   * Stop cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

/**
 * Query Result Compressor
 * Compresses large query results
 */
export class QueryCompressor {
  /**
   * Compress query result
   */
  static compress(result) {
    // Simple compression: remove null values, deduplicate column names
    if (!result.rows || result.rows.length === 0) {
      return result;
    }

    const compressed = {
      columns: result.fields?.map((f) => f.name) || Object.keys(result.rows[0]),
      rows: result.rows.map((row) => {
        return compressed.columns.map((col) => row[col]);
      }),
      rowCount: result.rowCount,
    };

    return compressed;
  }

  /**
   * Decompress query result
   */
  static decompress(compressed) {
    if (!compressed.rows || compressed.rows.length === 0) {
      return { rows: [], rowCount: 0 };
    }

    const rows = compressed.rows.map((row) => {
      const obj = {};
      compressed.columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });

    return {
      rows: rows,
      rowCount: compressed.rowCount,
    };
  }
}
