/**
 * Breaking Change Detection
 *
 * Analyzes package versions to detect breaking changes through:
 * - Semantic version analysis
 * - CHANGELOG parsing
 * - GitHub release notes parsing
 * - TypeScript API diff detection
 * - Migration guide extraction
 */
import { Logger } from "../utils/logger.js";
import { CacheManager } from "../cache/cache.js";
import { RateLimiter } from "../ratelimit/limiter.js";
import { ErrorRecovery, NetworkError } from "../errors/errors.js";
import { NpmRegistryClient } from "../datasources/npmRegistry.js";
import axios from "axios";
import * as semver from "semver";
const logger = Logger.getInstance();
const cache = CacheManager.getInstance();
const rateLimiter = RateLimiter.getInstance();
const npmClient = NpmRegistryClient.getInstance();
/**
 * Common breaking change patterns database
 */
const BREAKING_PATTERNS = {
  removed: [
    /removed?(\s+function|\s+method|\s+class|\s+API|\s+export|\s+property)/i,
    /deprecated\s+and\s+removed/i,
    /no\s+longer\s+(supported|available|exported)/i,
  ],
  renamed: [
    /renamed?(\s+from|\s+to)/i,
    /\w+\s+has\s+been\s+renamed\s+to\s+\w+/i,
  ],
  changed: [
    /breaking\s+change/i,
    /incompatible\s+change/i,
    /\[breaking\]/i,
    /⚠️.*breaking/i,
    /changed\s+signature/i,
    /changed\s+behavior/i,
  ],
  dependency: [
    /requires?\s+(node|npm|pnpm|yarn)\s+(\d+|>=|>|<=|<)/i,
    /minimum\s+(node|npm)\s+version/i,
    /dropped\s+support\s+for/i,
  ],
  config: [
    /config(uration)?\s+(change|breaking|incompatible)/i,
    /updated\s+default/i,
    /changed\s+default/i,
  ],
};
/**
 * Breaking Change Detection Engine
 */
export class BreakingChangeDetector {
  static instance;
  constructor() {}
  static getInstance() {
    if (!BreakingChangeDetector.instance) {
      BreakingChangeDetector.instance = new BreakingChangeDetector();
    }
    return BreakingChangeDetector.instance;
  }
  /**
   * Compare two versions and detect breaking changes
   */
  async compareVersions(packageName, fromVersion, toVersion) {
    const correlationId = Logger.generateCorrelationId();
    return await logger.time(
      "compareVersions",
      async () => {
        const cacheKey = `breaking:${packageName}:${fromVersion}:${toVersion}`;
        return await cache.getOrSet(
          cacheKey,
          async () => {
            // Analyze semantic version difference
            const semverDiff = semver.diff(fromVersion, toVersion);
            const isMajor = semverDiff === "major";
            const isMinor = semverDiff === "minor";
            const isPatch = semverDiff === "patch";
            const isPrerelease = semverDiff?.includes("pre") || false;
            // Collect breaking changes from multiple sources
            const breakingChanges = [];
            // 1. Semantic version analysis
            if (isMajor) {
              breakingChanges.push({
                type: "unknown",
                severity: "major",
                description: `Major version upgrade from ${fromVersion} to ${toVersion}`,
                source: "semver",
                version: toVersion,
                introduced: toVersion,
              });
            }
            // 2. Get versions between from and to
            const versionsInRange = await this.getVersionsInRange(
              packageName,
              fromVersion,
              toVersion,
            );
            // 3. Analyze changelogs for each version
            for (const version of versionsInRange) {
              const changelogBreaking = await this.analyzeChangelog(
                packageName,
                version,
              );
              breakingChanges.push(...changelogBreaking);
            }
            // 4. Analyze GitHub release notes
            const releaseBreaking = await this.analyzeReleaseNotes(
              packageName,
              versionsInRange,
            );
            breakingChanges.push(...releaseBreaking);
            // 5. Detect API changes from TypeScript definitions
            const apiChanges = await this.detectAPIChanges(
              packageName,
              fromVersion,
              toVersion,
            );
            breakingChanges.push(...apiChanges);
            // 6. Extract migration guides
            const migrationGuides = await this.extractMigrationGuides(
              packageName,
              fromVersion,
              toVersion,
              versionsInRange,
            );
            // 7. Calculate risk score
            const riskScore = this.calculateRiskScore({
              isMajor,
              isMinor,
              isPatch,
              breakingChanges,
              versionsCount: versionsInRange.length,
            });
            // 8. Recommend upgrade path
            const recommendedPath = this.calculateUpgradePath(
              fromVersion,
              toVersion,
              versionsInRange,
              breakingChanges,
            );
            return {
              from: fromVersion,
              to: toVersion,
              isMajor,
              isMinor,
              isPatch,
              isPrerelease,
              semverDiff,
              breakingChanges,
              migrationGuides,
              riskScore,
              recommendedPath,
            };
          },
          { ttl: 3600000, namespace: "analysis" }, // 1 hour cache
        );
      },
      { correlationId, operation: "compareVersions", packageName },
    );
  }
  /**
   * Get all versions between two versions (inclusive)
   */
  async getVersionsInRange(packageName, fromVersion, toVersion) {
    const allVersions = await npmClient.getAllVersions(packageName);
    return allVersions
      .filter((version) => {
        try {
          return (
            semver.gte(version, fromVersion) &&
            semver.lte(version, toVersion) &&
            !semver.prerelease(version) // Exclude prereleases
          );
        } catch {
          return false;
        }
      })
      .sort(semver.compare);
  }
  /**
   * Analyze changelog for breaking changes
   */
  async analyzeChangelog(packageName, version) {
    try {
      // Get package metadata to find repository
      const metadata = await npmClient.getVersionMetadata(packageName, version);
      const repoUrl = metadata.repository?.url;
      if (!repoUrl) {
        return [];
      }
      // Try to fetch CHANGELOG.md from GitHub
      const changelogUrl = this.constructChangelogUrl(repoUrl);
      if (!changelogUrl) {
        return [];
      }
      const changelog = await this.fetchChangelog(changelogUrl);
      if (!changelog) {
        return [];
      }
      return this.parseChangelog(changelog, version);
    } catch (error) {
      logger.warn("Failed to analyze changelog", {
        packageName,
        version,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
  /**
   * Construct changelog URL from repository URL
   */
  constructChangelogUrl(repoUrl) {
    // Extract GitHub owner/repo from various URL formats
    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) {
      return null;
    }
    const [, owner, repo] = match;
    // Try common changelog file names
    const changelogNames = [
      "CHANGELOG.md",
      "HISTORY.md",
      "RELEASES.md",
      "CHANGES.md",
    ];
    // Return first changelog URL (we'll try all in fetchChangelog)
    return `https://raw.githubusercontent.com/${owner}/${repo}/main/${changelogNames[0]}`;
  }
  /**
   * Fetch changelog content from URL
   */
  async fetchChangelog(url) {
    const changelogNames = [
      "CHANGELOG.md",
      "HISTORY.md",
      "RELEASES.md",
      "CHANGES.md",
    ];
    const branches = ["main", "master"];
    for (const branch of branches) {
      for (const name of changelogNames) {
        try {
          const testUrl = url
            .replace(/\/[^/]+$/, `/${name}`)
            .replace(/\/(main|master)\//, `/${branch}/`);
          const response = await ErrorRecovery.withRetry(async () => {
            return await rateLimiter.execute(async () => {
              return await axios.get(testUrl, {
                timeout: 5000,
                validateStatus: (status) => status === 200,
              });
            }, "github-api");
          });
          if (response.data) {
            return response.data;
          }
        } catch {
          // Try next combination
          continue;
        }
      }
    }
    return null;
  }
  /**
   * Parse changelog markdown and extract breaking changes
   */
  parseChangelog(changelog, version) {
    const breakingChanges = [];
    // Find the section for this version
    const versionRegex = new RegExp(
      `##?\\s*\\[?v?${version.replace(/\./g, "\\.")}\\]?[^#]*`,
      "i",
    );
    const match = changelog.match(versionRegex);
    if (!match) {
      return [];
    }
    const versionSection = match[0];
    const lines = versionSection.split("\n");
    for (const line of lines) {
      // Check against breaking patterns
      for (const [type, patterns] of Object.entries(BREAKING_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            breakingChanges.push({
              type: this.mapPatternTypeToBreakingType(type),
              severity: this.inferSeverity(line, type),
              description: line.trim().replace(/^[-*]\s*/, ""),
              source: "changelog",
              version,
              introduced: version,
            });
            break;
          }
        }
      }
    }
    return breakingChanges;
  }
  /**
   * Analyze GitHub release notes for breaking changes
   */
  async analyzeReleaseNotes(packageName, versions) {
    try {
      const metadata = await npmClient.getPackageMetadata(packageName);
      const repoUrl = metadata.repository?.url;
      if (!repoUrl) {
        return [];
      }
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
      if (!match) {
        return [];
      }
      const [, owner, repo] = match;
      // Fetch releases from GitHub API
      const releases = await this.fetchGitHubReleases(owner, repo);
      const breakingChanges = [];
      for (const release of releases) {
        // Check if this release matches one of our versions
        const releaseVersion = release.tag_name.replace(/^v/, "");
        if (!versions.includes(releaseVersion)) {
          continue;
        }
        // Parse release body for breaking changes
        const releaseBreaking = this.parseReleaseNotes(
          release.body,
          releaseVersion,
        );
        breakingChanges.push(...releaseBreaking);
      }
      return breakingChanges;
    } catch (error) {
      logger.warn("Failed to analyze release notes", {
        packageName,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
  /**
   * Fetch GitHub releases via API
   */
  async fetchGitHubReleases(owner, repo) {
    try {
      const response = await ErrorRecovery.withRetry(async () => {
        return await rateLimiter.execute(async () => {
          return await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/releases`,
            {
              headers: {
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "dependency-manager-mcp",
              },
              timeout: 10000,
            },
          );
        }, "github-api");
      });
      return response.data;
    } catch (error) {
      throw new NetworkError(`Failed to fetch GitHub releases: ${error}`);
    }
  }
  /**
   * Parse release notes for breaking changes
   */
  parseReleaseNotes(body, version) {
    const breakingChanges = [];
    const lines = body.split("\n");
    for (const line of lines) {
      // Check against breaking patterns
      for (const [type, patterns] of Object.entries(BREAKING_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            breakingChanges.push({
              type: this.mapPatternTypeToBreakingType(type),
              severity: this.inferSeverity(line, type),
              description: line.trim().replace(/^[-*#]\s*/, ""),
              source: "release-notes",
              version,
              introduced: version,
            });
            break;
          }
        }
      }
    }
    return breakingChanges;
  }
  /**
   * Detect API changes from TypeScript definitions
   */
  async detectAPIChanges(packageName, fromVersion, toVersion) {
    try {
      // Fetch package.json for both versions to check for types
      const fromMeta = await npmClient.getVersionMetadata(
        packageName,
        fromVersion,
      );
      const toMeta = await npmClient.getVersionMetadata(packageName, toVersion);
      const breakingChanges = [];
      // Check if types field changed
      if (fromMeta.types && !toMeta.types) {
        breakingChanges.push({
          type: "api-removal",
          severity: "major",
          description: "TypeScript definitions removed",
          source: "typescript",
          version: toVersion,
          introduced: toVersion,
        });
      }
      // Check if main entry point changed
      if (fromMeta.main !== toMeta.main) {
        breakingChanges.push({
          type: "api-change",
          severity: "major",
          description: `Main entry point changed from ${fromMeta.main} to ${toMeta.main}`,
          source: "typescript",
          version: toVersion,
          introduced: toVersion,
        });
      }
      // Check if exports field changed significantly
      if (JSON.stringify(fromMeta.exports) !== JSON.stringify(toMeta.exports)) {
        breakingChanges.push({
          type: "api-change",
          severity: "moderate",
          description: "Package exports configuration changed",
          source: "typescript",
          version: toVersion,
          introduced: toVersion,
        });
      }
      return breakingChanges;
    } catch (error) {
      logger.warn("Failed to detect API changes", {
        packageName,
        fromVersion,
        toVersion,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
  /**
   * Extract migration guides from documentation
   */
  async extractMigrationGuides(
    packageName,
    fromVersion,
    toVersion,
    versionsInRange,
  ) {
    const guides = [];
    try {
      const metadata = await npmClient.getPackageMetadata(packageName);
      const repoUrl = metadata.repository?.url;
      if (!repoUrl) {
        return [];
      }
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
      if (!match) {
        return [];
      }
      const [, owner, repo] = match;
      // Look for migration guides in common locations
      const migrationUrls = [
        `https://raw.githubusercontent.com/${owner}/${repo}/main/MIGRATION.md`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/UPGRADING.md`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/docs/migration.md`,
        `https://raw.githubusercontent.com/${owner}/${repo}/main/docs/upgrading.md`,
      ];
      for (const url of migrationUrls) {
        try {
          const response = await axios.get(url, { timeout: 5000 });
          if (response.data) {
            const guide = this.parseMigrationGuide(
              response.data,
              fromVersion,
              toVersion,
            );
            if (guide) {
              guides.push(guide);
            }
          }
        } catch {
          // Try next URL
          continue;
        }
      }
      return guides;
    } catch (error) {
      logger.warn("Failed to extract migration guides", {
        packageName,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
  /**
   * Parse migration guide content
   */
  parseMigrationGuide(content, fromVersion, toVersion) {
    // Look for sections related to version migration
    const versionPattern = new RegExp(
      `(?:migrat|upgrad).*${fromVersion.split(".")[0]}.*${toVersion.split(".")[0]}`,
      "i",
    );
    if (!versionPattern.test(content)) {
      return null;
    }
    // Extract steps (look for numbered lists or bullet points)
    const steps = [];
    const lines = content.split("\n");
    for (const line of lines) {
      if (/^\d+\.|^[-*]\s/.test(line.trim())) {
        steps.push(line.trim().replace(/^\d+\.|^[-*]\s/, ""));
      }
    }
    return {
      from: fromVersion,
      to: toVersion,
      content,
      steps: steps.slice(0, 10), // Limit to 10 steps
      estimatedEffort: this.estimateMigrationEffort(steps.length),
      automated: false, // Manual migration by default
    };
  }
  /**
   * Calculate risk score (0-100)
   */
  calculateRiskScore(params) {
    let score = 0;
    // Base score from semver
    if (params.isMajor) score += 50;
    else if (params.isMinor) score += 20;
    else if (params.isPatch) score += 5;
    // Add points for each breaking change
    for (const change of params.breakingChanges) {
      switch (change.severity) {
        case "critical":
          score += 15;
          break;
        case "major":
          score += 10;
          break;
        case "moderate":
          score += 5;
          break;
        case "minor":
          score += 2;
          break;
      }
    }
    // Add points for version gap
    score += Math.min(params.versionsCount * 2, 20);
    return Math.min(score, 100);
  }
  /**
   * Calculate recommended upgrade path
   */
  calculateUpgradePath(
    fromVersion,
    toVersion,
    versionsInRange,
    breakingChanges,
  ) {
    // If it's a patch or minor upgrade, upgrade directly
    const diff = semver.diff(fromVersion, toVersion);
    if (diff === "patch" || diff === "minor") {
      return [toVersion];
    }
    // For major upgrades, check if we should go through intermediate majors
    const fromMajor = semver.major(fromVersion);
    const toMajor = semver.major(toVersion);
    if (toMajor - fromMajor > 2) {
      // Large version gap - recommend stepping through major versions
      const path = [];
      for (let major = fromMajor + 1; major <= toMajor; major++) {
        // Find the latest minor.patch for this major version
        const majorVersions = versionsInRange.filter(
          (v) => semver.major(v) === major,
        );
        if (majorVersions.length > 0) {
          path.push(majorVersions[majorVersions.length - 1]);
        }
      }
      return path.length > 0 ? path : [toVersion];
    }
    // Otherwise, upgrade directly
    return [toVersion];
  }
  /**
   * Map pattern type to BreakingType
   */
  mapPatternTypeToBreakingType(patternType) {
    const mapping = {
      removed: "api-removal",
      renamed: "api-change",
      changed: "behavior-change",
      dependency: "dependency-change",
      config: "config-change",
    };
    return mapping[patternType] || "unknown";
  }
  /**
   * Infer severity from content
   */
  inferSeverity(content, type) {
    const lower = content.toLowerCase();
    if (lower.includes("critical") || lower.includes("security")) {
      return "critical";
    }
    if (type === "removed" || lower.includes("breaking")) {
      return "major";
    }
    if (type === "changed" || type === "renamed") {
      return "moderate";
    }
    return "minor";
  }
  /**
   * Estimate migration effort
   */
  estimateMigrationEffort(stepCount) {
    if (stepCount === 0) return "low";
    if (stepCount <= 3) return "low";
    if (stepCount <= 7) return "medium";
    if (stepCount <= 15) return "high";
    return "critical";
  }
}
//# sourceMappingURL=breakingChanges.js.map
