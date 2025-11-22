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
/**
 * Breaking change severity levels
 */
export type BreakingSeverity = "critical" | "major" | "moderate" | "minor";
/**
 * Breaking change types
 */
export type BreakingType =
  | "api-removal"
  | "api-change"
  | "dependency-change"
  | "config-change"
  | "behavior-change"
  | "deprecation"
  | "security-fix"
  | "unknown";
/**
 * Breaking change information
 */
export interface BreakingChange {
  type: BreakingType;
  severity: BreakingSeverity;
  description: string;
  affectedAPIs?: string[];
  migration?: string;
  source: "semver" | "changelog" | "release-notes" | "typescript" | "patterns";
  version: string;
  introduced: string;
}
/**
 * Version comparison result
 */
export interface VersionComparison {
  from: string;
  to: string;
  isMajor: boolean;
  isMinor: boolean;
  isPatch: boolean;
  isPrerelease: boolean;
  semverDiff: string | null;
  breakingChanges: BreakingChange[];
  migrationGuides: MigrationGuide[];
  riskScore: number;
  recommendedPath: string[];
}
/**
 * Migration guide information
 */
export interface MigrationGuide {
  from: string;
  to: string;
  url?: string;
  content?: string;
  steps: string[];
  estimatedEffort: "low" | "medium" | "high" | "critical";
  automated: boolean;
}
/**
 * Breaking Change Detection Engine
 */
export declare class BreakingChangeDetector {
  private static instance;
  private constructor();
  static getInstance(): BreakingChangeDetector;
  /**
   * Compare two versions and detect breaking changes
   */
  compareVersions(
    packageName: string,
    fromVersion: string,
    toVersion: string,
  ): Promise<VersionComparison>;
  /**
   * Get all versions between two versions (inclusive)
   */
  private getVersionsInRange;
  /**
   * Analyze changelog for breaking changes
   */
  private analyzeChangelog;
  /**
   * Construct changelog URL from repository URL
   */
  private constructChangelogUrl;
  /**
   * Fetch changelog content from URL
   */
  private fetchChangelog;
  /**
   * Parse changelog markdown and extract breaking changes
   */
  private parseChangelog;
  /**
   * Analyze GitHub release notes for breaking changes
   */
  private analyzeReleaseNotes;
  /**
   * Fetch GitHub releases via API
   */
  private fetchGitHubReleases;
  /**
   * Parse release notes for breaking changes
   */
  private parseReleaseNotes;
  /**
   * Detect API changes from TypeScript definitions
   */
  private detectAPIChanges;
  /**
   * Extract migration guides from documentation
   */
  private extractMigrationGuides;
  /**
   * Parse migration guide content
   */
  private parseMigrationGuide;
  /**
   * Calculate risk score (0-100)
   */
  private calculateRiskScore;
  /**
   * Calculate recommended upgrade path
   */
  private calculateUpgradePath;
  /**
   * Map pattern type to BreakingType
   */
  private mapPatternTypeToBreakingType;
  /**
   * Infer severity from content
   */
  private inferSeverity;
  /**
   * Estimate migration effort
   */
  private estimateMigrationEffort;
}
//# sourceMappingURL=breakingChanges.d.ts.map
