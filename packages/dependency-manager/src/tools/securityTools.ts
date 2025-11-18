import { exec } from "child_process";
import { promisify } from "util";
import axios from "axios";
import { logger, Logger } from "../utils/logger.js";
import { cache } from "../cache/cache.js";
import { rateLimiter } from "../ratelimit/limiter.js";
import {
  SecurityAuditError,
  NetworkError,
  ErrorRecovery,
} from "../errors/errors.js";

const execAsync = promisify(exec);

export function getSecurityTools() {
  return [
    {
      name: "deps_audit_vulnerabilities",
      description: "Run npm audit to find security vulnerabilities",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
          level: { type: "string", description: "Minimum severity: low, moderate, high, critical" },
        },
        required: ["directory"],
      },
    },
    {
      name: "deps_security_advisories",
      description: "Get detailed security advisories for vulnerable packages",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
        },
        required: ["directory"],
      },
    },
    {
      name: "deps_check_package_security",
      description: "Check security status of a specific package using npm registry",
      inputSchema: {
        type: "object",
        properties: {
          package_name: { type: "string", description: "Package name to check" },
          version: { type: "string", description: "Package version (optional)" },
        },
        required: ["package_name"],
      },
    },
  ];
}

export async function handleSecurityToolCall(name: string, args: Record<string, unknown>) {
  const correlationId = Logger.generateCorrelationId();

  logger.info(`Starting ${name}`, { correlationId, operation: name });

  try {
    switch (name) {
      case "deps_audit_vulnerabilities":
        return await auditVulnerabilities(args, correlationId);

      case "deps_security_advisories":
        return await getSecurityAdvisories(args, correlationId);

      case "deps_check_package_security":
        return await checkPackageSecurity(args, correlationId);

      default:
        throw new Error(`Unknown security tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Failed ${name}`, error, { correlationId });
    throw error;
  }
}

/**
 * Audit vulnerabilities using npm audit
 */
async function auditVulnerabilities(args: Record<string, unknown>, correlationId: string) {
  const { directory, level } = args as { directory: string; level?: string };
  const cacheKey = `audit:${directory}:${level || "all"}`;

  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await logger.time(
        "auditVulnerabilities",
        async () => {
          try {
            const auditLevel = level ? `--audit-level=${level}` : "";
            const { stdout } = await execAsync(`npm audit --json ${auditLevel}`, { cwd: directory });
            const audit = JSON.parse(stdout);

            const summary = {
              vulnerabilities: audit.metadata?.vulnerabilities || {},
              totalDependencies: audit.metadata?.dependencies || 0,
              advisories: Object.entries(audit.advisories || {}).map(([id, adv]: [string, any]) => ({
                id,
                severity: adv.severity,
                title: adv.title,
                moduleName: adv.module_name,
                recommendation: adv.recommendation,
                patchedVersions: adv.patched_versions,
              })),
            };

            logger.info("Vulnerabilities audited", {
              correlationId,
              total: Object.values(summary.vulnerabilities).reduce((a: number, b: any) => a + b, 0),
            });

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(summary, null, 2),
                },
              ],
            };
          } catch (error: any) {
            if (error.stdout) {
              const audit = JSON.parse(error.stdout);
              const summary = {
                vulnerabilities: audit.metadata?.vulnerabilities || {},
                totalDependencies: audit.metadata?.dependencies || 0,
                advisories: Object.entries(audit.advisories || {}).map(([id, adv]: [string, any]) => ({
                  id,
                  severity: adv.severity,
                  title: adv.title,
                  moduleName: adv.module_name,
                  recommendation: adv.recommendation,
                  patchedVersions: adv.patched_versions,
                })),
              };

              return {
                content: [
                  {
                    type: "text" as const,
                    text: JSON.stringify(summary, null, 2),
                  },
                ],
              };
            }
            throw new SecurityAuditError(`Failed to run security audit: ${error.message}`, error);
          }
        },
        { correlationId, operation: "auditVulnerabilities" }
      );
    },
    { ttl: 3600000, namespace: "security" } // 1 hour cache
  );
}

/**
 * Get detailed security advisories
 */
async function getSecurityAdvisories(args: Record<string, unknown>, correlationId: string) {
  const { directory } = args as { directory: string };
  const cacheKey = `advisories:${directory}`;

  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await logger.time(
        "getSecurityAdvisories",
        async () => {
          try {
            const { stdout } = await execAsync("npm audit --json", { cwd: directory });
            const audit = JSON.parse(stdout);

            const advisories = Object.entries(audit.advisories || {}).map(([id, adv]: [string, any]) => ({
              id,
              severity: adv.severity,
              title: adv.title,
              overview: adv.overview,
              moduleName: adv.module_name,
              vulnerableVersions: adv.vulnerable_versions,
              patchedVersions: adv.patched_versions,
              recommendation: adv.recommendation,
              references: adv.references,
              cves: adv.cves,
            }));

            logger.info("Security advisories fetched", {
              correlationId,
              count: advisories.length,
            });

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ advisories, total: advisories.length }, null, 2),
                },
              ],
            };
          } catch (error: any) {
            if (error.stdout) {
              const audit = JSON.parse(error.stdout);
              const advisories = Object.entries(audit.advisories || {}).map(([id, adv]: [string, any]) => ({
                id,
                severity: adv.severity,
                title: adv.title,
                overview: adv.overview,
                moduleName: adv.module_name,
                vulnerableVersions: adv.vulnerable_versions,
                patchedVersions: adv.patched_versions,
                recommendation: adv.recommendation,
                references: adv.references,
                cves: adv.cves,
              }));

              return {
                content: [
                  {
                    type: "text" as const,
                    text: JSON.stringify({ advisories, total: advisories.length }, null, 2),
                  },
                ],
              };
            }
            throw new SecurityAuditError(`Failed to get security advisories: ${error.message}`, error);
          }
        },
        { correlationId, operation: "getSecurityAdvisories" }
      );
    },
    { ttl: 3600000, namespace: "security" } // 1 hour cache
  );
}

/**
 * Check package security from npm registry
 */
async function checkPackageSecurity(args: Record<string, unknown>, correlationId: string) {
  const { package_name, version } = args as { package_name: string; version?: string };
  const cacheKey = `package-security:${package_name}:${version || "latest"}`;

  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await logger.time(
        "checkPackageSecurity",
        async () => {
          return await ErrorRecovery.withRetry(
            async () => {
              return await rateLimiter.execute(
                async () => {
                  try {
                    const response = await axios.get(`https://registry.npmjs.org/${package_name}`);

                    const latest = response.data["dist-tags"]?.latest || "";
                    const info = {
                      name: package_name,
                      latestVersion: latest,
                      description: response.data.description,
                      maintainers: response.data.maintainers?.length || 0,
                      repository: response.data.repository?.url,
                      license: response.data.license,
                      lastPublish: response.data.time?.modified,
                    };

                    logger.info("Package security checked", {
                      correlationId,
                      package: package_name,
                    });

                    return {
                      content: [
                        {
                          type: "text" as const,
                          text: JSON.stringify(info, null, 2),
                        },
                      ],
                    };
                  } catch (error) {
                    throw new NetworkError(`Failed to check package security: ${error}`, error);
                  }
                },
                "npm-registry"
              );
            },
            {
              onRetry: (attempt, error) => {
                logger.warn("Retrying checkPackageSecurity", {
                  correlationId,
                  attempt,
                  package: package_name,
                });
              },
            }
          );
        },
        { correlationId, operation: "checkPackageSecurity" }
      );
    },
    { ttl: 86400000, namespace: "security" } // 24 hour cache (package metadata doesn't change often)
  );
}
