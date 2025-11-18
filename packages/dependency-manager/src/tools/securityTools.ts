import { exec } from "child_process";
import { promisify } from "util";
import axios from "axios";

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
  switch (name) {
    case "deps_audit_vulnerabilities": {
      const { directory, level } = args as { directory: string; level?: string };

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

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (error: any) {
        // npm audit returns non-zero exit code when vulnerabilities are found
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
        throw new Error(`Failed to run security audit: ${error.message}`);
      }
    }

    case "deps_security_advisories": {
      const { directory } = args as { directory: string };

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
        throw new Error(`Failed to get security advisories: ${error.message}`);
      }
    }

    case "deps_check_package_security": {
      const { package_name, version } = args as { package_name: string; version?: string };

      try {
        const packageSpec = version ? `${package_name}@${version}` : package_name;
        const response = await axios.get(`https://registry.npmjs.org/${package_name}`);

        const latest = response.data["dist-tags"]?.latest || "";
        const info = {
          name: package_name,
          latestVersion: latest,
          description: response.data.description,
          maintainers: response.data.maintainers?.length || 0,
          weeklyDownloads: "use npm view for this",
          repository: response.data.repository?.url,
          license: response.data.license,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to check package security: ${error}`);
      }
    }

    default:
      throw new Error(`Unknown security tool: ${name}`);
  }
}
