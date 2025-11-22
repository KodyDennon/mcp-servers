/**
 * Package quality and maintenance metrics
 * Combines data from npm, GitHub, and npms.io
 */
export interface QualityMetrics {
  overall: number;
  quality: {
    score: number;
    carefulness: number;
    tests: number;
    health: number;
    branding: number;
  };
  popularity: {
    score: number;
    downloadsCount: number;
    downloadsAcceleration: number;
    dependentsCount: number;
  };
  maintenance: {
    score: number;
    releasesFrequency: number;
    commitsFrequency: number;
    openIssues: number;
    issuesDistribution: number;
  };
}
export interface MaintenanceInfo {
  isDeprecated: boolean;
  deprecationMessage?: string;
  lastPublish: Date;
  daysSinceLastPublish: number;
  releaseFrequency: "active" | "moderate" | "low" | "abandoned";
  maintainerCount: number;
  hasMultipleMaintainers: boolean;
  repositoryActive: boolean;
}
export interface DependencyHealth {
  score: number;
  issues: string[];
  warnings: string[];
  recommendations: string[];
  flags: {
    hasVulnerabilities: boolean;
    isDeprecated: boolean;
    isUnmaintained: boolean;
    hasLicenseIssues: boolean;
    isLargeBundle: boolean;
  };
}
export declare class PackageQualityClient {
  private npmsClient;
  constructor();
  /**
   * Get quality metrics from npms.io
   */
  getQualityMetrics(packageName: string): Promise<QualityMetrics | null>;
  /**
   * Get maintenance information
   */
  getMaintenanceInfo(packageName: string): Promise<MaintenanceInfo>;
  /**
   * Calculate comprehensive dependency health score
   */
  getDependencyHealth(
    packageName: string,
    version?: string,
    options?: {
      checkVulnerabilities?: boolean;
      checkLicense?: boolean;
      checkBundleSize?: boolean;
    },
  ): Promise<DependencyHealth>;
  /**
   * Compare package alternatives
   */
  comparePackages(packages: string[]): Promise<
    Array<{
      package: string;
      quality: QualityMetrics | null;
      maintenance: MaintenanceInfo;
      health: DependencyHealth;
    }>
  >;
  /**
   * Get package trends over time
   */
  getPackageTrends(packageName: string): Promise<{
    downloads: {
      lastDay: number;
      lastWeek: number;
      lastMonth: number;
      trend: "growing" | "stable" | "declining";
    };
    versions: {
      total: number;
      lastYear: number;
      updateFrequency: "active" | "moderate" | "low";
    };
  }>;
}
export declare const packageQuality: PackageQualityClient;
//# sourceMappingURL=packageQuality.d.ts.map
