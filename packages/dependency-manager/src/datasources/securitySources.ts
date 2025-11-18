import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { logger, Logger } from "../utils/logger.js";
import { cache } from "../cache/cache.js";
import { rateLimiter } from "../ratelimit/limiter.js";
import { NetworkError } from "../errors/errors.js";

/**
 * Security vulnerability data sources
 * - OSV (Open Source Vulnerabilities)
 * - GitHub Advisory Database
 */

export interface Vulnerability {
  id: string;
  summary: string;
  details?: string;
  severity?: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  cvssScore?: number;
  aliases?: string[]; // CVE IDs, GHSA IDs, etc.
  published?: string;
  modified?: string;
  affected: Array<{
    package: {
      ecosystem: string;
      name: string;
    };
    ranges?: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
        last_affected?: string;
      }>;
    }>;
    versions?: string[];
  }>;
  references?: Array<{
    type: string;
    url: string;
  }>;
  database_specific?: Record<string, any>;
}

export interface GitHubAdvisory {
  ghsa_id: string;
  cve_id?: string;
  url: string;
  html_url: string;
  summary: string;
  description: string;
  severity: "low" | "moderate" | "high" | "critical";
  author: {
    login: string;
    type: string;
  };
  publisher: {
    login: string;
    type: string;
  };
  identifiers: Array<{
    type: string;
    value: string;
  }>;
  state: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  closed_at?: string;
  withdrawn_at?: string;
  vulnerabilities: Array<{
    package: {
      ecosystem: string;
      name: string;
    };
    severity: string;
    vulnerable_version_range: string;
    first_patched_version?: {
      identifier: string;
    };
  }>;
  cvss: {
    vector_string: string;
    score: number;
  };
  cwes: Array<{
    cwe_id: string;
    name: string;
  }>;
  credits?: Array<{
    user: {
      login: string;
      type: string;
    };
    type: string;
  }>;
}

export class SecurityDataSources {
  private osvClient: AxiosInstance;
  private githubClient: AxiosInstance;

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
  async queryOSV(
    packageName: string,
    version?: string,
    ecosystem: string = "npm"
  ): Promise<Vulnerability[]> {
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
                const query: any = {
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
              } catch (error: any) {
                throw new NetworkError(`Failed to query OSV: ${error.message}`, error);
              }
            }, "osv-api");
          },
          { correlationId, operation: "queryOSV", packageName, version }
        );
      },
      { ttl: 3600000, namespace: "security" } // 1 hour cache
    );
  }

  /**
   * Get vulnerability details from OSV by ID
   */
  async getOSVVulnerability(vulnerabilityId: string): Promise<Vulnerability | null> {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `osv:vuln:${vulnerabilityId}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await rateLimiter.execute(async () => {
          try {
            const response = await this.osvClient.get(`/vulns/${vulnerabilityId}`);

            logger.debug("OSV vulnerability fetched", {
              correlationId,
              vulnerabilityId,
            });

            return response.data;
          } catch (error: any) {
            if (error.response?.status === 404) {
              return null;
            }
            throw new NetworkError(`Failed to get OSV vulnerability: ${error.message}`, error);
          }
        }, "osv-api");
      },
      { ttl: 86400000, namespace: "security" } // 24 hour cache
    );
  }

  /**
   * Query GitHub Advisory Database
   */
  async queryGitHubAdvisories(
    packageName: string,
    ecosystem: string = "npm",
    severity?: "low" | "moderate" | "high" | "critical"
  ): Promise<GitHubAdvisory[]> {
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
                const params: any = {
                  affects: `${ecosystem}/${packageName}`,
                  per_page: 100,
                };

                if (severity) {
                  params.severity = severity;
                }

                const response = await this.githubClient.get("/advisories", { params });

                logger.info("GitHub advisories queried", {
                  correlationId,
                  package: packageName,
                  count: response.data.length,
                });

                return response.data;
              } catch (error: any) {
                throw new NetworkError(
                  `Failed to query GitHub advisories: ${error.message}`,
                  error
                );
              }
            }, "github-api");
          },
          { correlationId, operation: "queryGitHubAdvisories", packageName }
        );
      },
      { ttl: 3600000, namespace: "security" } // 1 hour cache
    );
  }

  /**
   * Get specific GitHub advisory by GHSA ID
   */
  async getGitHubAdvisory(ghsaId: string): Promise<GitHubAdvisory | null> {
    const correlationId = Logger.generateCorrelationId();
    const cacheKey = `github:advisory:${ghsaId}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        return await rateLimiter.execute(async () => {
          try {
            const response = await this.githubClient.get(`/advisories/${ghsaId}`);

            logger.debug("GitHub advisory fetched", {
              correlationId,
              ghsaId,
            });

            return response.data;
          } catch (error: any) {
            if (error.response?.status === 404) {
              return null;
            }
            throw new NetworkError(`Failed to get GitHub advisory: ${error.message}`, error);
          }
        }, "github-api");
      },
      { ttl: 86400000, namespace: "security" } // 24 hour cache
    );
  }

  /**
   * Get comprehensive vulnerability report for a package
   */
  async getVulnerabilityReport(
    packageName: string,
    version?: string,
    ecosystem: string = "npm"
  ): Promise<{
    osv: Vulnerability[];
    github: GitHubAdvisory[];
    summary: {
      total: number;
      critical: number;
      high: number;
      moderate: number;
      low: number;
    };
  }> {
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
      { correlationId, operation: "getVulnerabilityReport", packageName }
    );
  }
}

// Export singleton instance
export const securitySources = new SecurityDataSources();
