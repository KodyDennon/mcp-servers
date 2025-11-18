import Keyv from "keyv";
import KeyvRedis from "@keyv/redis";
import { config } from "../config/manager.js";
import { CacheError } from "../errors/errors.js";
import { logger } from "../utils/logger.js";

/**
 * Multi-level cache implementation
 * - Level 1: In-memory (fast, limited size)
 * - Level 2: Redis (optional, for distributed caching)
 * - Level 3: File system (optional, for persistence)
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  namespace?: string;
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, { value: any; expiry: number }>;
  private keyvCache: Keyv | null = null;
  private maxSize: number;

  private constructor() {
    this.memoryCache = new Map();
    this.maxSize = config.get("cache").maxSize;
    this.initializeKeyv();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize Keyv cache (Redis or file-based)
   */
  private initializeKeyv(): void {
    const cacheConfig = config.get("cache");

    if (!cacheConfig.enabled) {
      logger.debug("Cache is disabled");
      return;
    }

    try {
      // Redis cache (if configured)
      if (cacheConfig.redis?.enabled && cacheConfig.redis.url) {
        this.keyvCache = new Keyv({
          store: new KeyvRedis(cacheConfig.redis.url),
          namespace: "depmgr",
        });
        logger.info("Redis cache initialized", { url: cacheConfig.redis.url });
      }
      // File-based cache (fallback)
      else if (cacheConfig.directory) {
        this.keyvCache = new Keyv({
          uri: `file://${cacheConfig.directory}`,
          namespace: "depmgr",
        });
        logger.info("File cache initialized", { directory: cacheConfig.directory });
      }

      if (this.keyvCache) {
        this.keyvCache.on("error", (err) => {
          logger.error("Cache error", err);
        });
      }
    } catch (error) {
      logger.warn("Failed to initialize persistent cache, using memory only", error);
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | undefined> {
    if (!config.get("cache").enabled) {
      return undefined;
    }

    const cacheKey = this.buildKey(key, options?.namespace);

    try {
      // Try memory cache first (L1)
      const memoryValue = this.getFromMemory<T>(cacheKey);
      if (memoryValue !== undefined) {
        logger.trace("Cache hit (memory)", { key: cacheKey });
        return memoryValue;
      }

      // Try persistent cache (L2)
      if (this.keyvCache) {
        const persistentValue = await this.keyvCache.get(cacheKey);
        if (persistentValue !== undefined) {
          // Promote to memory cache
          this.setInMemory(cacheKey, persistentValue, options?.ttl);
          logger.trace("Cache hit (persistent)", { key: cacheKey });
          return persistentValue as T;
        }
      }

      logger.trace("Cache miss", { key: cacheKey });
      return undefined;
    } catch (error) {
      logger.warn("Cache get error", error, { key: cacheKey });
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (!config.get("cache").enabled) {
      return;
    }

    const cacheKey = this.buildKey(key, options?.namespace);
    const ttl = options?.ttl ?? config.get("cache").ttl;

    try {
      // Set in memory cache (L1)
      this.setInMemory(cacheKey, value, ttl);

      // Set in persistent cache (L2)
      if (this.keyvCache) {
        await this.keyvCache.set(cacheKey, value, ttl);
      }

      logger.trace("Cache set", { key: cacheKey, ttl });
    } catch (error) {
      throw new CacheError(`Failed to set cache: ${error}`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const cacheKey = this.buildKey(key, options?.namespace);

    try {
      // Delete from memory cache
      this.memoryCache.delete(cacheKey);

      // Delete from persistent cache
      if (this.keyvCache) {
        await this.keyvCache.delete(cacheKey);
      }

      logger.trace("Cache delete", { key: cacheKey });
    } catch (error) {
      throw new CacheError(`Failed to delete cache: ${error}`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        // Clear specific namespace
        const prefix = `${namespace}:`;
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith(prefix)) {
            this.memoryCache.delete(key);
          }
        }
      } else {
        // Clear all
        this.memoryCache.clear();
      }

      if (this.keyvCache) {
        await this.keyvCache.clear();
      }

      logger.info("Cache cleared", { namespace });
    } catch (error) {
      throw new CacheError(`Failed to clear cache: ${error}`, error);
    }
  }

  /**
   * Get or set (compute if missing)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: RegExp, namespace?: string): Promise<number> {
    let count = 0;

    // Invalidate from memory cache
    const prefix = namespace ? `${namespace}:` : "";
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix) && pattern.test(key)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    logger.info("Cache invalidated by pattern", { pattern: pattern.toString(), count });
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      memorySize: this.memoryCache.size,
      maxSize: this.maxSize,
    };
  }

  /**
   * Warm cache with common packages
   */
  async warmCache(packages: string[]): Promise<void> {
    logger.info("Warming cache", { count: packages.length });

    // This would be implemented with actual package data fetching
    // For now, it's a placeholder
    for (const pkg of packages) {
      // Fetch and cache package metadata
      logger.trace("Warming cache for package", { package: pkg });
    }
  }

  /**
   * Build cache key with namespace
   */
  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  /**
   * Get value from memory cache
   */
  private getFromMemory<T>(key: string): T | undefined {
    const cached = this.memoryCache.get(key);
    if (!cached) {
      return undefined;
    }

    // Check expiry
    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key);
      return undefined;
    }

    return cached.value as T;
  }

  /**
   * Set value in memory cache with LRU eviction
   */
  private setInMemory(key: string, value: any, ttl?: number): void {
    // LRU eviction if at max size
    if (this.memoryCache.size >= this.maxSize && !this.memoryCache.has(key)) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }

    const expiry = Date.now() + (ttl ?? config.get("cache").ttl);
    this.memoryCache.set(key, { value, expiry });
  }
}

// Export singleton instance
export const cache = CacheManager.getInstance();
