import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { logger, Logger } from "../utils/logger.js";
import { cache } from "../cache/cache.js";
import { rateLimiter } from "../ratelimit/limiter.js";
import { NetworkError, PackageNotFoundError } from "../errors/errors.js";
import { config } from "../config/manager.js";

/**
 * Enhanced npm registry client with caching and rate limiting
 */

export interface PackageMetadata {
  name: string;
  version: string;
  description?: string;
  license?: string;
  repository?: {
    type: string;
    url: string;
  };
  homepage?: string;
  bugs?: {
    url: string;
  };
  maintainers?: Array<{
    name: string;
    email: string;
  }>;
  keywords?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  dist?: {
    tarball: string;
    shasum: string;
    integrity?: string;
    unpackedSize?: number;
  };
  time?: {
    created: string;
    modified: string;
    [version: string]: string;
  };
  "dist-tags"?: {
    latest: string;
    [tag: string]: string;
  };
}

export interface PackageDownloads {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

export interface PackageQualityScore {
  final: number;
  detail: {
    quality: number;
    popularity: number;
    maintenance: number;
  };
}

export class NpmRegistryClient {
  private client: AxiosInstance;
  private downloadsClient: AxiosInstance;

  constructor() {
    const registryUrl = config.get("npm").registry;

    // Main registry client
    this.client = axios.create({
      baseURL: registryUrl,
      timeout: 30000,
      headers: {
        "User-Agent": "mcp-dependency-manager/0.1.0",
        Accept: "application/json",
      },
    });

    // npm downloads API client
    this.downloadsClient = axios.create({
      baseURL: "https://api.npmjs.org",
      timeout: 10000,
      headers: {
        "User-Agent": "mcp-dependency-manager/0.1.0",
      },
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
      },
    });

    axiosRetry(this.downloadsClient, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });

    // Add auth token if configured
    const token = config.get("npm").token;
    if (token) {
      this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }

  /**
   * Get full package metadata
   */
  async getPackageMetadata(packageName: string): Promise<PackageMetadata> {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `npm:metadata:${packageName}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await logger.time(
          `getPackageMetadata:${packageName}`,
          async () => {
            return await rateLimiter.execute(async () => {
              try {
                const response = await this.client.get(`/${packageName}`);

                logger.info("Package metadata fetched", {
                  correlationId,
                  package: packageName,
                  version: response.data["dist-tags"]?.latest,
                });

                return response.data;
              } catch (error: any) {
                if (error.response?.status === 404) {
                  throw new PackageNotFoundError(packageName, error);
                }
                throw new NetworkError(`Failed to fetch package metadata: ${error.message}`, error);
              }
            }, "npm-registry");
          },
          { correlationId, operation: "getPackageMetadata", packageName }
        );
      },
      { ttl: 3600000, namespace: "npm" } // 1 hour cache
    );
  }

  /**
   * Get specific version metadata
   */
  async getVersionMetadata(packageName: string, version: string): Promise<PackageMetadata> {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `npm:version:${packageName}:${version}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await rateLimiter.execute(async () => {
          try {
            const response = await this.client.get(`/${packageName}/${version}`);

            logger.debug("Version metadata fetched", {
              correlationId,
              package: packageName,
              version,
            });

            return response.data;
          } catch (error: any) {
            if (error.response?.status === 404) {
              throw new PackageNotFoundError(`${packageName}@${version}`, error);
            }
            throw new NetworkError(`Failed to fetch version metadata: ${error.message}`, error);
          }
        }, "npm-registry");
      },
      { ttl: 86400000, namespace: "npm" } // 24 hour cache (versions don't change)
    );
  }

  /**
   * Get package download stats
   */
  async getDownloads(
    packageName: string,
    period: "last-day" | "last-week" | "last-month" | "last-year" = "last-week"
  ): Promise<PackageDownloads> {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `npm:downloads:${packageName}:${period}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await rateLimiter.execute(async () => {
          try {
            const response = await this.downloadsClient.get(
              `/downloads/point/${period}/${packageName}`
            );

            logger.debug("Download stats fetched", {
              correlationId,
              package: packageName,
              downloads: response.data.downloads,
            });

            return response.data;
          } catch (error: any) {
            logger.warn("Failed to fetch download stats", {
              correlationId,
              package: packageName,
              error: error.message,
            });
            // Return default on failure
            return {
              downloads: 0,
              start: "",
              end: "",
              package: packageName,
            };
          }
        }, "npm-registry");
      },
      { ttl: 86400000, namespace: "npm" } // 24 hour cache
    );
  }

  /**
   * Search packages
   */
  async searchPackages(
    query: string,
    options?: {
      size?: number;
      quality?: number;
      popularity?: number;
      maintenance?: number;
    }
  ): Promise<Array<{ package: PackageMetadata; score: PackageQualityScore; searchScore: number }>> {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `npm:search:${query}:${JSON.stringify(options)}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await rateLimiter.execute(async () => {
          try {
            const params: Record<string, any> = {
              text: query,
              size: options?.size || 20,
            };

            if (options?.quality !== undefined) params.quality = options.quality;
            if (options?.popularity !== undefined) params.popularity = options.popularity;
            if (options?.maintenance !== undefined) params.maintenance = options.maintenance;

            const response = await this.client.get("/-/v1/search", { params });

            logger.info("Package search completed", {
              correlationId,
              query,
              results: response.data.objects?.length || 0,
            });

            return response.data.objects || [];
          } catch (error: any) {
            throw new NetworkError(`Failed to search packages: ${error.message}`, error);
          }
        }, "npm-registry");
      },
      { ttl: 3600000, namespace: "npm" } // 1 hour cache
    );
  }

  /**
   * Get all versions of a package
   */
  async getAllVersions(packageName: string): Promise<string[]> {
    const metadata = await this.getPackageMetadata(packageName);
    return Object.keys(metadata.time || {}).filter((v) => v !== "created" && v !== "modified");
  }

  /**
   * Get latest version
   */
  async getLatestVersion(packageName: string): Promise<string> {
    const metadata = await this.getPackageMetadata(packageName);
    return metadata["dist-tags"]?.latest || "";
  }

  /**
   * Check if package exists
   */
  async packageExists(packageName: string): Promise<boolean> {
    try {
      await this.getPackageMetadata(packageName);
      return true;
    } catch (error) {
      if (error instanceof PackageNotFoundError) {
        return false;
      }
      throw error;
    }
  }
}

// Export singleton instance
export const npmRegistry = new NpmRegistryClient();
