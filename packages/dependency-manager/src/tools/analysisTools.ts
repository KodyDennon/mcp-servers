import { readFile } from "fs/promises";
import { resolve } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { logger, Logger } from "../utils/logger.js";
import { cache } from "../cache/cache.js";
import { rateLimiter } from "../ratelimit/limiter.js";
import {
  FileSystemError,
  PackageNotFoundError,
  ErrorRecovery,
} from "../errors/errors.js";

const execAsync = promisify(exec);

export function getDependencyAnalysisTools() {
  return [
    {
      name: "deps_analyze_package",
      description: "Analyze package.json to get dependency tree and metadata",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
        },
        required: ["directory"],
      },
    },
    {
      name: "deps_list_outdated",
      description: "List all outdated dependencies with current and latest versions",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
        },
        required: ["directory"],
      },
    },
    {
      name: "deps_analyze_bundle_size",
      description: "Analyze and estimate bundle size impact of dependencies",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
          package_name: { type: "string", description: "Specific package to analyze (optional)" },
        },
        required: ["directory"],
      },
    },
    {
      name: "deps_find_duplicates",
      description: "Find duplicate dependencies across the dependency tree",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
        },
        required: ["directory"],
      },
    },
  ];
}

export async function handleAnalysisToolCall(name: string, args: Record<string, unknown>) {
  const correlationId = Logger.generateCorrelationId();
  const { directory } = args as { directory: string };

  logger.info(`Starting ${name}`, { correlationId, directory, operation: name });

  try {
    switch (name) {
      case "deps_analyze_package":
        return await analyzePackage(directory, correlationId);

      case "deps_list_outdated":
        return await listOutdated(directory, correlationId);

      case "deps_analyze_bundle_size":
        return await analyzeBundleSize(directory, args, correlationId);

      case "deps_find_duplicates":
        return await findDuplicates(directory, correlationId);

      default:
        throw new Error(`Unknown analysis tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Failed ${name}`, error, { correlationId, directory });
    throw error;
  }
}

/**
 * Analyze package.json
 */
async function analyzePackage(directory: string, correlationId: string) {
  const cacheKey = `analyze:${directory}`;

  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await logger.time(
        "analyzePackage",
        async () => {
          const packageJsonPath = resolve(directory, "package.json");

          try {
            const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
            const dependencies = packageJson.dependencies || {};
            const devDependencies = packageJson.devDependencies || {};

            const analysis = {
              name: packageJson.name,
              version: packageJson.version,
              totalDependencies: Object.keys(dependencies).length,
              totalDevDependencies: Object.keys(devDependencies).length,
              dependencies,
              devDependencies,
              engines: packageJson.engines,
              scripts: Object.keys(packageJson.scripts || {}),
            };

            logger.info("Package analyzed", {
              correlationId,
              packageName: analysis.name,
              totalDeps: analysis.totalDependencies,
            });

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(analysis, null, 2),
                },
              ],
            };
          } catch (error: any) {
            if (error.code === "ENOENT") {
              throw new PackageNotFoundError(packageJsonPath, error);
            }
            throw new FileSystemError(`Failed to read package.json: ${error.message}`, error);
          }
        },
        { correlationId, operation: "analyzePackage" }
      );
    },
    { ttl: 300000, namespace: "analysis" } // 5 minute cache
  );
}

/**
 * List outdated packages
 */
async function listOutdated(directory: string, correlationId: string) {
  const cacheKey = `outdated:${directory}`;

  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await logger.time(
        "listOutdated",
        async () => {
          return await ErrorRecovery.withRetry(
            async () => {
              return await rateLimiter.execute(
                async () => {
                  const { stdout } = await execAsync("npm outdated --json", { cwd: directory });
                  const outdated = stdout ? JSON.parse(stdout) : {};

                  const formatted = Object.entries(outdated).map(([name, info]: [string, any]) => ({
                    package: name,
                    current: info.current,
                    wanted: info.wanted,
                    latest: info.latest,
                    type: info.type,
                  }));

                  logger.info("Outdated packages listed", {
                    correlationId,
                    count: formatted.length,
                  });

                  return {
                    content: [
                      {
                        type: "text" as const,
                        text: JSON.stringify({ outdated: formatted, total: formatted.length }, null, 2),
                      },
                    ],
                  };
                },
                "npm-registry"
              );
            },
            {
              onRetry: (attempt, error) => {
                logger.warn("Retrying listOutdated", {
                  correlationId,
                  attempt,
                  error: String(error),
                });
              },
            }
          );
        },
        { correlationId, operation: "listOutdated" }
      );
    },
    { ttl: 600000, namespace: "analysis" } // 10 minute cache
  );
}

/**
 * Analyze bundle size
 */
async function analyzeBundleSize(
  directory: string,
  args: Record<string, unknown>,
  correlationId: string
) {
  const { package_name } = args as { directory: string; package_name?: string };
  const cacheKey = `bundlesize:${directory}:${package_name || "all"}`;

  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await logger.time(
        "analyzeBundleSize",
        async () => {
          const packageJsonPath = resolve(directory, "package.json");

          try {
            const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

            const packages = package_name ? [package_name] : Object.keys(dependencies);
            const sizes: Array<{ name: string; size: string }> = [];

            // Limit to first 10 for performance
            const packagesToAnalyze = packages.slice(0, 10);

            logger.debug("Analyzing bundle sizes", {
              correlationId,
              count: packagesToAnalyze.length,
            });

            for (const pkg of packagesToAnalyze) {
              try {
                const size = await rateLimiter.execute(async () => {
                  const { stdout } = await execAsync(
                    `npm view ${pkg} dist.unpackedSize --json`,
                    { cwd: directory }
                  );
                  return JSON.parse(stdout);
                }, "npm-registry");

                sizes.push({
                  name: pkg,
                  size: `${(size / 1024).toFixed(2)} KB`,
                });
              } catch {
                sizes.push({ name: pkg, size: "unknown" });
              }
            }

            logger.info("Bundle size analyzed", {
              correlationId,
              analyzedCount: sizes.length,
            });

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ bundleSizes: sizes }, null, 2),
                },
              ],
            };
          } catch (error: any) {
            if (error.code === "ENOENT") {
              throw new PackageNotFoundError(packageJsonPath, error);
            }
            throw new FileSystemError(`Failed to analyze bundle size: ${error.message}`, error);
          }
        },
        { correlationId, operation: "analyzeBundleSize" }
      );
    },
    { ttl: 3600000, namespace: "analysis" } // 1 hour cache (bundle sizes don't change often)
  );
}

/**
 * Find duplicate dependencies
 */
async function findDuplicates(directory: string, correlationId: string) {
  const cacheKey = `duplicates:${directory}`;

  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await logger.time(
        "findDuplicates",
        async () => {
          try {
            const { stdout } = await execAsync("npm list --all --json", { cwd: directory });
            const tree = JSON.parse(stdout);

            const allDeps = new Map<string, Set<string>>();

            function traverse(node: any) {
              if (node.dependencies) {
                for (const [name, info] of Object.entries<any>(node.dependencies)) {
                  if (!allDeps.has(name)) {
                    allDeps.set(name, new Set());
                  }
                  allDeps.get(name)!.add(info.version);

                  traverse(info);
                }
              }
            }

            traverse(tree);

            const duplicates = Array.from(allDeps.entries())
              .filter(([_, versions]) => versions.size > 1)
              .map(([name, versions]) => ({
                package: name,
                versions: Array.from(versions),
                count: versions.size,
              }));

            logger.info("Duplicates found", {
              correlationId,
              count: duplicates.length,
            });

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ duplicates, total: duplicates.length }, null, 2),
                },
              ],
            };
          } catch (error) {
            throw new FileSystemError(`Failed to find duplicates: ${error}`, error);
          }
        },
        { correlationId, operation: "findDuplicates" }
      );
    },
    { ttl: 600000, namespace: "analysis" } // 10 minute cache
  );
}
