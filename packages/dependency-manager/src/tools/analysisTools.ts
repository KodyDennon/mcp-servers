import { readFile } from "fs/promises";
import { resolve } from "path";
import { exec } from "child_process";
import { promisify } from "util";

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
  const { directory } = args as { directory: string };
  const packageJsonPath = resolve(directory, "package.json");

  switch (name) {
    case "deps_analyze_package": {
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

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(analysis, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to analyze package.json: ${error}`);
      }
    }

    case "deps_list_outdated": {
      try {
        const { stdout } = await execAsync("npm outdated --json", { cwd: directory });
        const outdated = stdout ? JSON.parse(stdout) : {};

        const formatted = Object.entries(outdated).map(([name, info]: [string, any]) => ({
          package: name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          type: info.type,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ outdated: formatted, total: formatted.length }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        // npm outdated returns exit code 1 when there are outdated packages
        if (error.stdout) {
          const outdated = JSON.parse(error.stdout);
          const formatted = Object.entries(outdated).map(([name, info]: [string, any]) => ({
            package: name,
            current: info.current,
            wanted: info.wanted,
            latest: info.latest,
            type: info.type,
          }));

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ outdated: formatted, total: formatted.length }, null, 2),
              },
            ],
          };
        }
        throw new Error(`Failed to check outdated packages: ${error.message}`);
      }
    }

    case "deps_analyze_bundle_size": {
      const { package_name } = args as { directory: string; package_name?: string };

      try {
        const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const packages = package_name ? [package_name] : Object.keys(dependencies);
        const sizes: Array<{ name: string; size: string }> = [];

        // Use npm view to get unpacked size
        for (const pkg of packages.slice(0, 10)) {
          // Limit to first 10 for performance
          try {
            const { stdout } = await execAsync(`npm view ${pkg} dist.unpackedSize --json`, {
              cwd: directory,
            });
            const size = JSON.parse(stdout);
            sizes.push({
              name: pkg,
              size: `${(size / 1024).toFixed(2)} KB`,
            });
          } catch {
            sizes.push({ name: pkg, size: "unknown" });
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ bundleSizes: sizes }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to analyze bundle size: ${error}`);
      }
    }

    case "deps_find_duplicates": {
      try {
        const { stdout } = await execAsync("npm list --all --json", { cwd: directory });
        const tree = JSON.parse(stdout);

        // Simple duplicate detection
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

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ duplicates, total: duplicates.length }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to find duplicates: ${error}`);
      }
    }

    default:
      throw new Error(`Unknown analysis tool: ${name}`);
  }
}
