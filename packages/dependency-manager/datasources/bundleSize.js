import axios from "axios";
import axiosRetry from "axios-retry";
import { logger, Logger } from "../utils/logger.js";
import { cache } from "../cache/cache.js";
import { rateLimiter } from "../ratelimit/limiter.js";
import { NetworkError } from "../errors/errors.js";
export class BundleSizeClient {
  client;
  constructor() {
    this.client = axios.create({
      baseURL: "https://bundlephobia.com/api",
      timeout: 60000, // Bundlephobia can be slow
      headers: {
        "User-Agent": "mcp-dependency-manager/0.1.0",
      },
    });
    // Configure retries with longer delays for Bundlephobia
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: (retryCount) => {
        return retryCount * 2000; // 2s, 4s, 6s
      },
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429 ||
          error.response?.status === 503
        );
      },
    });
  }
  /**
   * Get bundle size information for a package
   */
  async getBundleSize(packageName, version) {
    const correlationId = Logger.generateCorrelationId();
    const packageSpec = version ? `${packageName}@${version}` : packageName;
    const cacheKey = `bundlephobia:${packageSpec}`;
    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await logger.time(
          `getBundleSize:${packageSpec}`,
          async () => {
            return await rateLimiter.execute(async () => {
              try {
                const response = await this.client.get(`/size`, {
                  params: {
                    package: packageSpec,
                    record: true, // Record for history
                  },
                });
                const data = response.data;
                logger.info("Bundle size fetched", {
                  correlationId,
                  package: packageName,
                  version: data.version,
                  size: data.size,
                  gzip: data.gzip,
                });
                return {
                  name: data.name,
                  version: data.version,
                  description: data.description,
                  repository: data.repository,
                  size: data.size,
                  gzip: data.gzip,
                  dependencyCount: data.dependencyCount || 0,
                  dependencies: data.dependencySizes || [],
                  hasJSModule: data.hasJSModule || false,
                  hasJSNext: data.hasJSNext || false,
                  hasSideEffects: data.hasSideEffects !== false,
                  isModuleType: data.isModuleType || false,
                  ignoredMissingDependencies:
                    data.ignoredMissingDependencies || [],
                };
              } catch (error) {
                // Bundlephobia can be flaky, log but don't fail hard
                if (error.response?.status === 404) {
                  logger.warn("Package not found on Bundlephobia", {
                    correlationId,
                    package: packageSpec,
                  });
                  throw new NetworkError(
                    `Package not found: ${packageSpec}`,
                    error,
                  );
                }
                logger.warn("Failed to fetch bundle size from Bundlephobia", {
                  correlationId,
                  package: packageSpec,
                  error: error.message,
                });
                throw new NetworkError(
                  `Failed to fetch bundle size: ${error.message}`,
                  error,
                );
              }
            }, "bundlephobia");
          },
          { correlationId, operation: "getBundleSize", packageName },
        );
      },
      { ttl: 86400000, namespace: "bundlesize" }, // 24 hour cache (sizes don't change for a version)
    );
  }
  /**
   * Get bundle size history for a package
   */
  async getBundleHistory(packageName, limit = 10) {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `bundlephobia:history:${packageName}:${limit}`;
    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await rateLimiter.execute(async () => {
          try {
            const response = await this.client.get(`/package-history`, {
              params: {
                package: packageName,
                limit,
              },
            });
            logger.debug("Bundle history fetched", {
              correlationId,
              package: packageName,
              versions: response.data.length,
            });
            return {
              name: packageName,
              versions: response.data,
            };
          } catch (error) {
            logger.warn("Failed to fetch bundle history", {
              correlationId,
              package: packageName,
            });
            // Return empty history on failure
            return {
              name: packageName,
              versions: [],
            };
          }
        }, "bundlephobia");
      },
      { ttl: 3600000, namespace: "bundlesize" }, // 1 hour cache
    );
  }
  /**
   * Compare bundle sizes of multiple packages
   */
  async compareBundleSizes(packages) {
    const correlationId = Logger.generateCorrelationId();
    return await logger.time(
      `compareBundleSizes`,
      async () => {
        const results = await Promise.allSettled(
          packages.map(async (pkg) => {
            try {
              const info = await this.getBundleSize(pkg);
              return {
                package: pkg,
                size: info.size,
                gzip: info.gzip,
              };
            } catch (error) {
              return {
                package: pkg,
                size: 0,
                gzip: 0,
                error: error.message,
              };
            }
          }),
        );
        return results.map((result) => {
          if (result.status === "fulfilled") {
            return result.value;
          }
          return {
            package: "",
            size: 0,
            gzip: 0,
            error: result.reason?.message || "Unknown error",
          };
        });
      },
      {
        correlationId,
        operation: "compareBundleSizes",
        count: packages.length,
      },
    );
  }
  /**
   * Format size for human-readable display
   */
  formatSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
  /**
   * Calculate size impact percentage
   */
  calculateImpact(newSize, oldSize) {
    const change = newSize - oldSize;
    const percentage = oldSize > 0 ? (change / oldSize) * 100 : 0;
    let trend;
    if (change > 0) trend = "increased";
    else if (change < 0) trend = "decreased";
    else trend = "unchanged";
    return {
      change,
      percentage,
      trend,
    };
  }
}
// Export singleton instance
export const bundleSizeClient = new BundleSizeClient();
//# sourceMappingURL=bundleSize.js.map
