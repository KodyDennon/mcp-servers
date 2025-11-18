import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import semver from "semver";
import { logger, Logger } from "../utils/logger.js";
import { cache } from "../cache/cache.js";
import { rateLimiter } from "../ratelimit/limiter.js";
import { NetworkError } from "../errors/errors.js";
import { npmRegistry, type PackageMetadata } from "./npmRegistry.js";

/**
 * Package quality and maintenance metrics
 * Combines data from npm, GitHub, and npms.io
 */

export interface QualityMetrics {
  overall: number; // 0-100 score
  quality: {
    score: number;
    carefulness: number;
    tests: number;
    health: number;
    branding: number;
  };
  popularity: {
    score: number;
    downloadsCount: number;
    downloadsAcceleration: number;
    dependentsCount: number;
  };
  maintenance: {
    score: number;
    releasesFrequency: number;
    commitsFrequency: number;
    openIssues: number;
    issuesDistribution: number;
  };
}

export interface MaintenanceInfo {
  isDeprecated: boolean;
  deprecationMessage?: string;
  lastPublish: Date;
  daysSinceLastPublish: number;
  releaseFrequency: "active" | "moderate" | "low" | "abandoned";
  maintainerCount: number;
  hasMultipleMaintainers: boolean;
  repositoryActive: boolean;
}

export interface DependencyHealth {
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  recommendations: string[];
  flags: {
    hasVulnerabilities: boolean;
    isDeprecated: boolean;
    isUnmaintained: boolean;
    hasLicenseIssues: boolean;
    isLargeBundle: boolean;
  };
}

export class PackageQualityClient {
  private npmsClient: AxiosInstance;

  constructor() {
    // npms.io API client
    this.npmsClient = axios.create({
      baseURL: "https://api.npms.io/v2",
      timeout: 30000,
      headers: {
        "User-Agent": "mcp-dependency-manager/0.1.0",
      },
    });

    axiosRetry(this.npmsClient, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });
  }

  /**
   * Get quality metrics from npms.io
   */
  async getQualityMetrics(packageName: string): Promise<QualityMetrics | null> {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `npms:quality:${packageName}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await logger.time(
          `getQualityMetrics:${packageName}`,
          async () => {
            return await rateLimiter.execute(async () => {
              try {
                const response = await this.npmsClient.get(`/package/${encodeURIComponent(packageName)}`);

                const data = response.data;
                const overall = data.score?.final ? Math.round(data.score.final * 100) : 0;

                logger.info("Quality metrics fetched", {
                  correlationId,
                  package: packageName,
                  overall,
                });

                return {
                  overall,
                  quality: {
                    score: data.score?.detail?.quality || 0,
                    carefulness: data.evaluation?.quality?.carefulness || 0,
                    tests: data.evaluation?.quality?.tests || 0,
                    health: data.evaluation?.quality?.health || 0,
                    branding: data.evaluation?.quality?.branding || 0,
                  },
                  popularity: {
                    score: data.score?.detail?.popularity || 0,
                    downloadsCount: data.collected?.npm?.downloads?.[0]?.count || 0,
                    downloadsAcceleration: data.evaluation?.popularity?.downloadsAcceleration || 0,
                    dependentsCount: data.collected?.npm?.dependentsCount || 0,
                  },
                  maintenance: {
                    score: data.score?.detail?.maintenance || 0,
                    releasesFrequency: data.evaluation?.maintenance?.releasesFrequency || 0,
                    commitsFrequency: data.evaluation?.maintenance?.commitsFrequency || 0,
                    openIssues: data.collected?.github?.issues?.openCount || 0,
                    issuesDistribution: data.evaluation?.maintenance?.issuesDistribution || 0,
                  },
                };
              } catch (error: any) {
                if (error.response?.status === 404) {
                  logger.debug("Package not found on npms.io", {
                    correlationId,
                    package: packageName,
                  });
                  return null;
                }

                logger.warn("Failed to fetch quality metrics", {
                  correlationId,
                  package: packageName,
                  error: error.message,
                });

                return null;
              }
            }, "npms-api");
          },
          { correlationId, operation: "getQualityMetrics", packageName }
        );
      },
      { ttl: 86400000, namespace: "quality" } // 24 hour cache
    );
  }

  /**
   * Get maintenance information
   */
  async getMaintenanceInfo(packageName: string): Promise<MaintenanceInfo> {
    const correlationId = Logger.generateCorrelationId();

    return await logger.time(
      `getMaintenanceInfo:${packageName}`,
      async () => {
        const metadata = await npmRegistry.getPackageMetadata(packageName);

        const lastPublish = metadata.time?.modified
          ? new Date(metadata.time.modified)
          : new Date();
        const daysSinceLastPublish = Math.floor(
          (Date.now() - lastPublish.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine release frequency
        let releaseFrequency: "active" | "moderate" | "low" | "abandoned";
        if (daysSinceLastPublish < 30) releaseFrequency = "active";
        else if (daysSinceLastPublish < 180) releaseFrequency = "moderate";
        else if (daysSinceLastPublish < 365) releaseFrequency = "low";
        else releaseFrequency = "abandoned";

        const maintainerCount = metadata.maintainers?.length || 0;

        // Check if deprecated
        const latestVersion = metadata["dist-tags"]?.latest;
        const latestVersionData = latestVersion ? (metadata as any).versions?.[latestVersion] : null;
        const isDeprecated = latestVersionData?.deprecated !== undefined;

        logger.debug("Maintenance info calculated", {
          correlationId,
          package: packageName,
          daysSinceLastPublish,
          releaseFrequency,
          isDeprecated,
        });

        return {
          isDeprecated,
          deprecationMessage: latestVersionData?.deprecated,
          lastPublish,
          daysSinceLastPublish,
          releaseFrequency,
          maintainerCount,
          hasMultipleMaintainers: maintainerCount > 1,
          repositoryActive: releaseFrequency !== "abandoned",
        };
      },
      { correlationId, operation: "getMaintenanceInfo", packageName }
    );
  }

  /**
   * Calculate comprehensive dependency health score
   */
  async getDependencyHealth(
    packageName: string,
    version?: string,
    options?: {
      checkVulnerabilities?: boolean;
      checkLicense?: boolean;
      checkBundleSize?: boolean;
    }
  ): Promise<DependencyHealth> {
    const correlationId = Logger.generateCorrelationId();

    return await logger.time(
      `getDependencyHealth:${packageName}`,
      async () => {
        const issues: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];
        let score = 100;

        // Get quality metrics
        const quality = await this.getQualityMetrics(packageName);
        if (quality) {
          if (quality.overall < 50) {
            score -= 20;
            warnings.push(`Low quality score: ${quality.overall}/100`);
          }
          if (quality.maintenance.score < 0.5) {
            score -= 15;
            warnings.push("Low maintenance score");
          }
        }

        // Get maintenance info
        const maintenance = await this.getMaintenanceInfo(packageName);

        if (maintenance.isDeprecated) {
          score -= 50;
          issues.push("Package is deprecated");
          if (maintenance.deprecationMessage) {
            issues.push(`Reason: ${maintenance.deprecationMessage}`);
          }
        }

        if (maintenance.releaseFrequency === "abandoned") {
          score -= 30;
          issues.push(`Not updated in ${maintenance.daysSinceLastPublish} days`);
          recommendations.push("Consider finding an alternative package");
        } else if (maintenance.releaseFrequency === "low") {
          score -= 10;
          warnings.push("Infrequent updates");
        }

        if (!maintenance.hasMultipleMaintainers) {
          score -= 5;
          warnings.push("Single maintainer (bus factor risk)");
        }

        // Ensure score doesn't go below 0
        score = Math.max(0, score);

        logger.info("Dependency health calculated", {
          correlationId,
          package: packageName,
          score,
          issues: issues.length,
          warnings: warnings.length,
        });

        return {
          score,
          issues,
          warnings,
          recommendations,
          flags: {
            hasVulnerabilities: false, // Would be populated by security scan
            isDeprecated: maintenance.isDeprecated,
            isUnmaintained: maintenance.releaseFrequency === "abandoned",
            hasLicenseIssues: false, // Would be populated by license check
            isLargeBundle: false, // Would be populated by bundle size check
          },
        };
      },
      { correlationId, operation: "getDependencyHealth", packageName }
    );
  }

  /**
   * Compare package alternatives
   */
  async comparePackages(
    packages: string[]
  ): Promise<
    Array<{
      package: string;
      quality: QualityMetrics | null;
      maintenance: MaintenanceInfo;
      health: DependencyHealth;
    }>
  > {
    const correlationId = Logger.generateCorrelationId();

    return await logger.time(
      "comparePackages",
      async () => {
        const results = await Promise.all(
          packages.map(async (pkg) => {
            try {
              const [quality, maintenance, health] = await Promise.all([
                this.getQualityMetrics(pkg),
                this.getMaintenanceInfo(pkg),
                this.getDependencyHealth(pkg),
              ]);

              return {
                package: pkg,
                quality,
                maintenance,
                health,
              };
            } catch (error) {
              logger.warn("Failed to compare package", { package: pkg, error });
              throw error;
            }
          })
        );

        // Sort by overall health score
        results.sort((a, b) => b.health.score - a.health.score);

        logger.info("Packages compared", {
          correlationId,
          count: packages.length,
        });

        return results;
      },
      { correlationId, operation: "comparePackages", count: packages.length }
    );
  }

  /**
   * Get package trends over time
   */
  async getPackageTrends(packageName: string): Promise<{
    downloads: {
      lastDay: number;
      lastWeek: number;
      lastMonth: number;
      trend: "growing" | "stable" | "declining";
    };
    versions: {
      total: number;
      lastYear: number;
      updateFrequency: "active" | "moderate" | "low";
    };
  }> {
    const correlationId = Logger.generateCorrelationId();

    return await logger.time(
      `getPackageTrends:${packageName}`,
      async () => {
        const [dayDownloads, weekDownloads, monthDownloads, metadata] = await Promise.all([
          npmRegistry.getDownloads(packageName, "last-day"),
          npmRegistry.getDownloads(packageName, "last-week"),
          npmRegistry.getDownloads(packageName, "last-month"),
          npmRegistry.getPackageMetadata(packageName),
        ]);

        // Calculate download trend
        const weekAvg = weekDownloads.downloads / 7;
        const monthAvg = monthDownloads.downloads / 30;

        let downloadTrend: "growing" | "stable" | "declining";
        if (weekAvg > monthAvg * 1.1) downloadTrend = "growing";
        else if (weekAvg < monthAvg * 0.9) downloadTrend = "declining";
        else downloadTrend = "stable";

        // Count versions in last year
        const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
        const recentVersions = Object.entries(metadata.time || {})
          .filter(([version, time]) => {
            if (version === "created" || version === "modified") return false;
            return new Date(time).getTime() > oneYearAgo;
          })
          .length;

        let updateFrequency: "active" | "moderate" | "low";
        if (recentVersions >= 12) updateFrequency = "active";
        else if (recentVersions >= 4) updateFrequency = "moderate";
        else updateFrequency = "low";

        logger.debug("Package trends calculated", {
          correlationId,
          package: packageName,
          downloadTrend,
          updateFrequency,
        });

        return {
          downloads: {
            lastDay: dayDownloads.downloads,
            lastWeek: weekDownloads.downloads,
            lastMonth: monthDownloads.downloads,
            trend: downloadTrend,
          },
          versions: {
            total: Object.keys(metadata.time || {}).length - 2, // Exclude created/modified
            lastYear: recentVersions,
            updateFrequency,
          },
        };
      },
      { correlationId, operation: "getPackageTrends", packageName }
    );
  }
}

// Export singleton instance
export const packageQuality = new PackageQualityClient();
