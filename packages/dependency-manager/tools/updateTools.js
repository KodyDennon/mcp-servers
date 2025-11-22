import { readFile } from "fs/promises";
import { resolve } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import semver from "semver";
import axios from "axios";
const execAsync = promisify(exec);
export function getUpdateTools() {
  return [
    {
      name: "deps_check_updates",
      description: "Check for available updates with breaking change detection",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
        },
        required: ["directory"],
      },
    },
    {
      name: "deps_suggest_safe_updates",
      description: "Suggest safe updates (patch and minor versions only)",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
        },
        required: ["directory"],
      },
    },
    {
      name: "deps_get_changelog",
      description: "Get changelog/release notes for a package version",
      inputSchema: {
        type: "object",
        properties: {
          package_name: { type: "string", description: "Package name" },
          from_version: { type: "string", description: "Current version" },
          to_version: { type: "string", description: "Target version" },
        },
        required: ["package_name", "from_version", "to_version"],
      },
    },
    {
      name: "deps_suggest_alternatives",
      description:
        "Suggest alternative packages with better maintenance or performance",
      inputSchema: {
        type: "object",
        properties: {
          package_name: {
            type: "string",
            description: "Package name to find alternatives for",
          },
        },
        required: ["package_name"],
      },
    },
  ];
}
export async function handleUpdateToolCall(name, args) {
  switch (name) {
    case "deps_check_updates": {
      const { directory } = args;
      try {
        const packageJsonPath = resolve(directory, "package.json");
        const packageJson = JSON.parse(
          await readFile(packageJsonPath, "utf-8"),
        );
        const dependencies = packageJson.dependencies || {};
        const updates = [];
        for (const [pkg, currentRange] of Object.entries(dependencies)) {
          try {
            const { stdout } = await execAsync(
              `npm view ${pkg} version --json`,
              { cwd: directory },
            );
            const latest = stdout.trim().replace(/"/g, "");
            const current = currentRange.replace(/^[\^~]/, "");
            if (
              semver.valid(current) &&
              semver.valid(latest) &&
              semver.gt(latest, current)
            ) {
              const diff = semver.diff(latest, current);
              updates.push({
                package: pkg,
                current,
                latest,
                type: diff || "unknown",
              });
            }
          } catch {
            // Skip packages that can't be checked
          }
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalUpdates: updates.length,
                  major: updates.filter((u) => u.type === "major").length,
                  minor: updates.filter((u) => u.type === "minor").length,
                  patch: updates.filter((u) => u.type === "patch").length,
                  updates,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to check updates: ${error}`);
      }
    }
    case "deps_suggest_safe_updates": {
      const { directory } = args;
      try {
        const packageJsonPath = resolve(directory, "package.json");
        const packageJson = JSON.parse(
          await readFile(packageJsonPath, "utf-8"),
        );
        const dependencies = packageJson.dependencies || {};
        const safeUpdates = [];
        for (const [pkg, currentRange] of Object.entries(dependencies)) {
          try {
            const { stdout } = await execAsync(
              `npm view ${pkg} version --json`,
              { cwd: directory },
            );
            const latest = stdout.trim().replace(/"/g, "");
            const current = currentRange.replace(/^[\^~]/, "");
            if (semver.valid(current) && semver.valid(latest)) {
              const diff = semver.diff(latest, current);
              if (diff === "patch" || diff === "minor") {
                safeUpdates.push({
                  package: pkg,
                  current,
                  recommended: latest,
                  type: diff,
                });
              }
            }
          } catch {
            // Skip packages that can't be checked
          }
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  safeUpdates,
                  total: safeUpdates.length,
                  recommendation:
                    "These updates are unlikely to contain breaking changes",
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to suggest safe updates: ${error}`);
      }
    }
    case "deps_get_changelog": {
      const { package_name, from_version, to_version } = args;
      try {
        // Try to get repository URL
        const { stdout } = await execAsync(
          `npm view ${package_name} repository.url --json`,
        );
        const repoUrl = stdout.trim().replace(/"/g, "");
        const info = {
          package: package_name,
          from: from_version,
          to: to_version,
          repository: repoUrl,
          changelogUrl: `${repoUrl.replace("git+", "").replace(".git", "")}/releases`,
          npmUrl: `https://www.npmjs.com/package/${package_name}?activeTab=versions`,
          recommendation:
            "Check the repository releases page or npm package page for detailed changelog",
        };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to get changelog: ${error}`);
      }
    }
    case "deps_suggest_alternatives": {
      const { package_name } = args;
      try {
        const response = await axios.get(
          `https://registry.npmjs.org/${package_name}`,
        );
        const pkg = response.data;
        const alternatives = {
          current: {
            name: package_name,
            description: pkg.description,
            weeklyDownloads: "use npm-stat.com for this data",
            lastPublish: pkg.time?.modified,
            license: pkg.license,
          },
          suggestion:
            "Check npmtrends.com or bundlephobia.com to compare alternatives based on your specific needs",
          resources: [
            `https://npmtrends.com/${package_name}`,
            `https://bundlephobia.com/package/${package_name}`,
            `https://www.npmjs.com/search?q=${encodeURIComponent(pkg.description || package_name)}`,
          ],
        };
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(alternatives, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to suggest alternatives: ${error}`);
      }
    }
    default:
      throw new Error(`Unknown update tool: ${name}`);
  }
}
//# sourceMappingURL=updateTools.js.map
