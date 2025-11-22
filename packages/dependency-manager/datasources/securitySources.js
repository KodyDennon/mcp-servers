import axios from "axios";
import axiosRetry from "axios-retry";
import { logger, Logger } from "../utils/logger.js";
import { cache } from "../cache/cache.js";
import { rateLimiter } from "../ratelimit/limiter.js";
import { NetworkError } from "../errors/errors.js";
export class SecurityDataSources {
  osvClient;
  githubClient;
  constructor() {
    // OSV API client
    this.osvClient = axios.create({
      baseURL: "https://api.osv.dev/v1",
      timeout: 30000,
      headers: {
        "User-Agent": "mcp-dependency-manager/0.1.0",
        "Content-Type": "application/json",
      },
    });
    // GitHub Advisory Database API
    this.githubClient = axios.create({
      baseURL: "https://api.github.com",
      timeout: 30000,
      headers: {
        "User-Agent": "mcp-dependency-manager/0.1.0",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    // Configure retries
    [this.osvClient, this.githubClient].forEach((client) => {
      axiosRetry(client, {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
      });
    });
  }
  /**
   * Query OSV for vulnerabilities affecting a package
   */
  async queryOSV(packageName, version, ecosystem = "npm") {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `osv:${ecosystem}:${packageName}:${version || "all"}`;
    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await logger.time(
          `queryOSV:${packageName}`,
          async () => {
            return await rateLimiter.execute(async () => {
              try {
                const query = {
                  package: {
                    name: packageName,
                    ecosystem: ecosystem.toUpperCase(),
                  },
                };
                if (version) {
                  query.version = version;
                }
                const response = await this.osvClient.post("/query", query);
                const vulns = response.data.vulns || [];
                logger.info("OSV vulnerabilities queried", {
                  correlationId,
                  package: packageName,
                  version,
                  count: vulns.length,
                });
                return vulns;
              } catch (error) {
                throw new NetworkError(
                  `Failed to query OSV: ${error.message}`,
                  error,
                );
              }
            }, "osv-api");
          },
          { correlationId, operation: "queryOSV", packageName, version },
        );
      },
      { ttl: 3600000, namespace: "security" }, // 1 hour cache
    );
  }
  /**
   * Get vulnerability details from OSV by ID
   */
  async getOSVVulnerability(vulnerabilityId) {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `osv:vuln:${vulnerabilityId}`;
    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await rateLimiter.execute(async () => {
          try {
            const response = await this.osvClient.get(
              `/vulns/${vulnerabilityId}`,
            );
            logger.debug("OSV vulnerability fetched", {
              correlationId,
              vulnerabilityId,
            });
            return response.data;
          } catch (error) {
            if (error.response?.status === 404) {
              return null;
            }
            throw new NetworkError(
              `Failed to get OSV vulnerability: ${error.message}`,
              error,
            );
          }
        }, "osv-api");
      },
      { ttl: 86400000, namespace: "security" }, // 24 hour cache
    );
  }
  /**
   * Query GitHub Advisory Database
   */
  async queryGitHubAdvisories(packageName, ecosystem = "npm", severity) {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `github:advisories:${ecosystem}:${packageName}:${severity || "all"}`;
    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await logger.time(
          `queryGitHubAdvisories:${packageName}`,
          async () => {
            return await rateLimiter.execute(async () => {
              try {
                const params = {
                  affects: `${ecosystem}/${packageName}`,
                  per_page: 100,
                };
                if (severity) {
                  params.severity = severity;
                }
                const response = await this.githubClient.get("/advisories", {
                  params,
                });
                logger.info("GitHub advisories queried", {
                  correlationId,
                  package: packageName,
                  count: response.data.length,
                });
                return response.data;
              } catch (error) {
                throw new NetworkError(
                  `Failed to query GitHub advisories: ${error.message}`,
                  error,
                );
              }
            }, "github-api");
          },
          { correlationId, operation: "queryGitHubAdvisories", packageName },
        );
      },
      { ttl: 3600000, namespace: "security" }, // 1 hour cache
    );
  }
  /**
   * Get specific GitHub advisory by GHSA ID
   */
  async getGitHubAdvisory(ghsaId) {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `github:advisory:${ghsaId}`;
    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await rateLimiter.execute(async () => {
          try {
            const response = await this.githubClient.get(
              `/advisories/${ghsaId}`,
            );
            logger.debug("GitHub advisory fetched", {
              correlationId,
              ghsaId,
            });
            return response.data;
          } catch (error) {
            if (error.response?.status === 404) {
              return null;
            }
            throw new NetworkError(
              `Failed to get GitHub advisory: ${error.message}`,
              error,
            );
          }
        }, "github-api");
      },
      { ttl: 86400000, namespace: "security" }, // 24 hour cache
    );
  }
  /**
   * Get comprehensive vulnerability report for a package
   */
  async getVulnerabilityReport(packageName, version, ecosystem = "npm") {
    const correlationId = Logger.generateCorrelationId();
    return await logger.time(
      `getVulnerabilityReport:${packageName}`,
      async () => {
        // Fetch from both sources in parallel
        const [osvVulns, githubAdvisories] = await Promise.all([
          this.queryOSV(packageName, version, ecosystem),
          this.queryGitHubAdvisories(packageName, ecosystem),
        ]);
        // Calculate summary
        const allSeverities = [
          ...osvVulns.map((v) => v.severity),
          ...githubAdvisories.map((a) => a.severity.toUpperCase()),
        ];
        const summary = {
          total: osvVulns.length + githubAdvisories.length,
          critical: allSeverities.filter((s) => s === "CRITICAL").length,
          high: allSeverities.filter((s) => s === "HIGH").length,
          moderate: allSeverities.filter((s) => s === "MODERATE").length,
          low: allSeverities.filter((s) => s === "LOW").length,
        };
        logger.info("Vulnerability report generated", {
          correlationId,
          package: packageName,
          ...summary,
        });
        return {
          osv: osvVulns,
          github: githubAdvisories,
          summary,
        };
      },
      { correlationId, operation: "getVulnerabilityReport", packageName },
    );
  }
}
// Export singleton instance
export const securitySources = new SecurityDataSources();
//# sourceMappingURL=securitySources.js.map
