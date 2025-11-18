import { readFile } from "fs/promises";
import { resolve } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Common license classifications
const LICENSE_TYPES = {
  permissive: ["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD"],
  copyleft: ["GPL-2.0", "GPL-3.0", "AGPL-3.0", "LGPL-2.1", "LGPL-3.0"],
  weak_copyleft: ["MPL-2.0", "EPL-1.0", "CDDL-1.0"],
  proprietary: ["UNLICENSED", "SEE LICENSE IN"],
};

export function getLicenseTools() {
  return [
    {
      name: "deps_license_check",
      description: "Check licenses of all dependencies for compliance issues",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
        },
        required: ["directory"],
      },
    },
    {
      name: "deps_license_report",
      description: "Generate a comprehensive license report",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", description: "Project directory path" },
          format: { type: "string", description: "Report format: summary or detailed" },
        },
        required: ["directory"],
      },
    },
    {
      name: "deps_license_classify",
      description: "Classify licenses by type (permissive, copyleft, etc.)",
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

export async function handleLicenseToolCall(name: string, args: Record<string, unknown>) {
  const { directory } = args as { directory: string };

  switch (name) {
    case "deps_license_check": {
      try {
        const packageJsonPath = resolve(directory, "package.json");
        const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const licenses: Array<{ package: string; license: string; type: string }> = [];

        for (const [pkg] of Object.entries(dependencies)) {
          try {
            const { stdout } = await execAsync(`npm view ${pkg} license --json`, { cwd: directory });
            const license = stdout.trim().replace(/"/g, "");
            const type = classifyLicense(license);
            licenses.push({ package: pkg, license, type });
          } catch {
            licenses.push({ package: pkg, license: "unknown", type: "unknown" });
          }
        }

        const issues = licenses.filter((l) => l.type === "copyleft" || l.type === "unknown");

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  totalPackages: licenses.length,
                  issues: issues.length,
                  problematicLicenses: issues,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to check licenses: ${error}`);
      }
    }

    case "deps_license_report": {
      const { format = "summary" } = args as { directory: string; format?: string };

      try {
        const packageJsonPath = resolve(directory, "package.json");
        const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const licenses: Array<{ package: string; license: string }> = [];

        for (const [pkg] of Object.entries(dependencies)) {
          try {
            const { stdout } = await execAsync(`npm view ${pkg} license --json`, { cwd: directory });
            const license = stdout.trim().replace(/"/g, "");
            licenses.push({ package: pkg, license });
          } catch {
            licenses.push({ package: pkg, license: "unknown" });
          }
        }

        if (format === "summary") {
          const summary = licenses.reduce((acc, { license }) => {
            acc[license] = (acc[license] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({ licenseSummary: summary }, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ licenses }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to generate license report: ${error}`);
      }
    }

    case "deps_license_classify": {
      try {
        const packageJsonPath = resolve(directory, "package.json");
        const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const licenses: Array<{ package: string; license: string; type: string }> = [];

        for (const [pkg] of Object.entries(dependencies)) {
          try {
            const { stdout } = await execAsync(`npm view ${pkg} license --json`, { cwd: directory });
            const license = stdout.trim().replace(/"/g, "");
            const type = classifyLicense(license);
            licenses.push({ package: pkg, license, type });
          } catch {
            licenses.push({ package: pkg, license: "unknown", type: "unknown" });
          }
        }

        const classified = {
          permissive: licenses.filter((l) => l.type === "permissive"),
          copyleft: licenses.filter((l) => l.type === "copyleft"),
          weak_copyleft: licenses.filter((l) => l.type === "weak_copyleft"),
          proprietary: licenses.filter((l) => l.type === "proprietary"),
          unknown: licenses.filter((l) => l.type === "unknown"),
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  permissive: classified.permissive.length,
                  copyleft: classified.copyleft.length,
                  weak_copyleft: classified.weak_copyleft.length,
                  proprietary: classified.proprietary.length,
                  unknown: classified.unknown.length,
                  details: classified,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to classify licenses: ${error}`);
      }
    }

    default:
      throw new Error(`Unknown license tool: ${name}`);
  }
}

function classifyLicense(license: string): string {
  for (const [type, licenses] of Object.entries(LICENSE_TYPES)) {
    if (licenses.some((l) => license.includes(l))) {
      return type;
    }
  }
  return "unknown";
}
