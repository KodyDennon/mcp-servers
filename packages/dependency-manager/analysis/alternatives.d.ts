/**
 * Alternative Package Suggestions
 *
 * Discovers and compares alternative packages based on:
 * - Keyword similarity
 * - Feature parity analysis
 * - Popularity metrics
 * - Maintenance status
 * - Bundle size comparison
 * - Migration difficulty estimation
 */
/**
 * Alternative package information
 */
export interface Alternative {
  name: string;
  version: string;
  description: string;
  score: number;
  comparison: Comparison;
  migrationDifficulty: MigrationDifficulty;
  reasoning: string[];
  pros: string[];
  cons: string[];
}
/**
 * Comparison between original and alternative
 */
export interface Comparison {
  popularity: PopularityComparison;
  maintenance: MaintenanceComparison;
  quality: QualityComparison;
  bundle: BundleComparison;
  security: SecurityComparison;
  license: LicenseComparison;
  features: FeatureComparison;
}
/**
 * Popularity comparison
 */
export interface PopularityComparison {
  downloads: {
    original: number;
    alternative: number;
    winner: "original" | "alternative" | "tie";
    ratio: number;
  };
  stars: {
    original: number;
    alternative: number;
    winner: "original" | "alternative" | "tie";
    ratio: number;
  };
  dependents: {
    original: number;
    alternative: number;
    winner: "original" | "alternative" | "tie";
    ratio: number;
  };
}
/**
 * Maintenance comparison
 */
export interface MaintenanceComparison {
  lastPublish: {
    original: string;
    alternative: string;
    winner: "original" | "alternative" | "tie";
  };
  releaseFrequency: {
    original: string;
    alternative: string;
    winner: "original" | "alternative" | "tie";
  };
  isDeprecated: {
    original: boolean;
    alternative: boolean;
    winner: "original" | "alternative" | "tie";
  };
}
/**
 * Quality comparison
 */
export interface QualityComparison {
  score: {
    original: number;
    alternative: number;
    winner: "original" | "alternative" | "tie";
    difference: number;
  };
  hasTypes: {
    original: boolean;
    alternative: boolean;
    winner: "original" | "alternative" | "tie";
  };
  hasTests: {
    original: boolean;
    alternative: boolean;
    winner: "original" | "alternative" | "tie";
  };
}
/**
 * Bundle comparison
 */
export interface BundleComparison {
  size: {
    original: number;
    alternative: number;
    winner: "original" | "alternative" | "tie";
    difference: number;
    differencePercent: number;
  };
  gzip: {
    original: number;
    alternative: number;
    winner: "original" | "alternative" | "tie";
    difference: number;
    differencePercent: number;
  };
}
/**
 * Security comparison
 */
export interface SecurityComparison {
  vulnerabilities: {
    original: number;
    alternative: number;
    winner: "original" | "alternative" | "tie";
  };
  critical: {
    original: number;
    alternative: number;
    winner: "original" | "alternative" | "tie";
  };
}
/**
 * License comparison
 */
export interface LicenseComparison {
  original: string;
  alternative: string;
  compatible: boolean;
  note: string;
}
/**
 * Feature comparison
 */
export interface FeatureComparison {
  similarity: number;
  sharedKeywords: string[];
  uniqueToOriginal: string[];
  uniqueToAlternative: string[];
  likelyCompatible: boolean;
}
/**
 * Migration difficulty
 */
export interface MigrationDifficulty {
  level: "trivial" | "easy" | "moderate" | "hard" | "very-hard";
  estimatedHours: string;
  factors: string[];
  apiCompatibility: "high" | "medium" | "low" | "unknown";
  hasCodemods: boolean;
  hasMigrationGuide: boolean;
}
/**
 * Alternative discovery options
 */
export interface AlternativeOptions {
  maxResults?: number;
  minQualityScore?: number;
  requireTypes?: boolean;
  maxBundleSize?: number;
  licenseCategory?: "permissive" | "copyleft" | "weak-copyleft";
  maintainedOnly?: boolean;
}
/**
 * Alternative Package Discovery Engine
 */
export declare class AlternativeDiscovery {
  private static instance;
  private constructor();
  static getInstance(): AlternativeDiscovery;
  /**
   * Find alternative packages
   */
  findAlternatives(
    packageName: string,
    options?: AlternativeOptions,
  ): Promise<Alternative[]>;
  /**
   * Search for similar packages
   */
  private searchSimilarPackages;
  /**
   * Filter candidates based on options
   */
  private filterCandidates;
  /**
   * Compare two packages
   */
  comparePackages(
    originalName: string,
    alternativeName: string,
  ): Promise<Alternative>;
  /**
   * Compare popularity
   */
  private comparePopularity;
  /**
   * Compare maintenance
   */
  private compareMaintenance;
  /**
   * Compare quality
   */
  private compareQuality;
  /**
   * Compare bundle size
   */
  private compareBundle;
  /**
   * Compare security
   */
  private compareSecurity;
  /**
   * Compare licenses
   */
  private compareLicenses;
  /**
   * Compare features (keyword similarity)
   */
  private compareFeatures;
  /**
   * Calculate migration difficulty
   */
  private calculateMigrationDifficulty;
  /**
   * Calculate alternative score
   */
  private calculateAlternativeScore;
  /**
   * Generate pros, cons, and reasoning
   */
  private generateProsConsReasoning;
  /**
   * Helper: Determine winner from ratio
   */
  private determineWinner;
  /**
   * Helper: Get release frequency label
   */
  private getReleaseFrequency;
  /**
   * Helper: Calculate name similarity (Levenshtein-based)
   */
  private calculateNameSimilarity;
  /**
   * Helper: Levenshtein distance
   */
  private levenshteinDistance;
}
//# sourceMappingURL=alternatives.d.ts.map
