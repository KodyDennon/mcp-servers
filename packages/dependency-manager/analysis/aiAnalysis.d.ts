/**
 * AI-Ready Analysis Data
 *
 * Provides structured data optimized for AI analysis:
 * - Risk scoring algorithms
 * - Upgrade path recommendations
 * - Context-aware suggestions
 * - Rollback strategy data
 *
 * NOTE: This module does NOT integrate with external AI APIs.
 * It provides structured data for the MCP client (Claude) to analyze.
 */
import { VersionComparison } from "./breakingChanges.js";
/**
 * Project type detection
 */
export type ProjectType =
  | "react"
  | "vue"
  | "angular"
  | "nextjs"
  | "gatsby"
  | "svelte"
  | "node-backend"
  | "library"
  | "cli"
  | "unknown";
/**
 * Risk level
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";
/**
 * Comprehensive package analysis
 */
export interface PackageAnalysis {
  package: string;
  currentVersion: string;
  latestVersion: string;
  analysis: {
    security: SecurityAnalysis;
    quality: QualityAnalysis;
    maintenance: MaintenanceAnalysis;
    breaking: VersionComparison | null;
    bundle: BundleAnalysis | null;
    license: LicenseAnalysis;
  };
  recommendations: Recommendation[];
  riskAssessment: RiskAssessment;
  upgradePlan: UpgradePlan;
  rollbackStrategy: RollbackStrategy;
  context: ProjectContext;
}
/**
 * Security analysis
 */
export interface SecurityAnalysis {
  vulnerabilities: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  hasKnownExploits: boolean;
  oldestVulnerability?: {
    id: string;
    publishedDate: string;
    ageInDays: number;
  };
  fixAvailable: boolean;
  fixedInVersion?: string;
}
/**
 * Quality analysis
 */
export interface QualityAnalysis {
  score: number;
  hasTests: boolean;
  hasCI: boolean;
  hasDocumentation: boolean;
  hasTypes: boolean;
  popularity: {
    downloads: number;
    stars: number;
    dependents: number;
  };
  flags: string[];
}
/**
 * Maintenance analysis
 */
export interface MaintenanceAnalysis {
  isActive: boolean;
  isDeprecated: boolean;
  lastPublish: string;
  daysSinceLastPublish: number;
  releaseFrequency: "very-high" | "high" | "moderate" | "low" | "very-low";
  maintainerCount: number;
  commitActivity: "active" | "moderate" | "low" | "stale";
}
/**
 * Bundle analysis
 */
export interface BundleAnalysis {
  size: number;
  gzip: number;
  impact: {
    change: number;
    percentage: number;
    trend: "increased" | "decreased" | "unchanged";
  };
  treeShakleable: boolean;
  hasSideEffects: boolean;
}
/**
 * License analysis
 */
export interface LicenseAnalysis {
  license: string;
  category: string;
  compatible: boolean;
  issues: string[];
  changedFromPrevious: boolean;
}
/**
 * Recommendation
 */
export interface Recommendation {
  type:
    | "upgrade"
    | "security-fix"
    | "alternative"
    | "downgrade"
    | "remove"
    | "keep";
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  reasoning: string[];
  action: string;
  estimatedEffort: "trivial" | "low" | "medium" | "high" | "critical";
  automatable: boolean;
}
/**
 * Risk assessment
 */
export interface RiskAssessment {
  overall: RiskLevel;
  score: number;
  factors: RiskFactor[];
  mitigations: string[];
  redFlags: string[];
  greenFlags: string[];
}
/**
 * Risk factor
 */
export interface RiskFactor {
  factor: string;
  impact: "critical" | "high" | "medium" | "low";
  description: string;
  weight: number;
}
/**
 * Upgrade plan
 */
export interface UpgradePlan {
  recommended: boolean;
  path: UpgradeStep[];
  totalEstimatedTime: string;
  canAutomate: boolean;
  prerequisites: string[];
  postUpgradeChecks: string[];
}
/**
 * Upgrade step
 */
export interface UpgradeStep {
  order: number;
  version: string;
  description: string;
  changes: string[];
  testing: string[];
  estimatedTime: string;
  automated: boolean;
}
/**
 * Rollback strategy
 */
export interface RollbackStrategy {
  difficulty: "easy" | "moderate" | "hard" | "very-hard";
  steps: string[];
  dataLoss: boolean;
  estimatedTime: string;
  notes: string[];
}
/**
 * Project context
 */
export interface ProjectContext {
  projectType: ProjectType;
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | "unknown";
  hasLockfile: boolean;
  nodeVersion?: string;
  isMonorepo: boolean;
  dependencies: {
    total: number;
    direct: number;
    transitive: number;
  };
  detectedFrameworks: string[];
}
/**
 * AI-Ready Analysis Engine
 */
export declare class AIAnalysisEngine {
  private static instance;
  private constructor();
  static getInstance(): AIAnalysisEngine;
  /**
   * Perform comprehensive package analysis
   */
  analyzePackage(
    packageName: string,
    currentVersion: string,
    projectPath?: string,
  ): Promise<PackageAnalysis>;
  /**
   * Analyze security
   */
  private analyzeSecurity;
  /**
   * Analyze quality
   */
  private analyzeQuality;
  /**
   * Analyze maintenance
   */
  private analyzeMaintenance;
  /**
   * Analyze breaking changes
   */
  private analyzeBreakingChanges;
  /**
   * Analyze bundle
   */
  private analyzeBundle;
  /**
   * Analyze license
   */
  private analyzeLicense;
  /**
   * Detect project context
   */
  private detectProjectContext;
  /**
   * Detect project type from package.json
   */
  private detectProjectType;
  /**
   * Detect package manager
   */
  private detectPackageManager;
  /**
   * Detect frameworks
   */
  private detectFrameworks;
  /**
   * Generate recommendations
   */
  private generateRecommendations;
  /**
   * Calculate risk assessment
   */
  private calculateRiskAssessment;
  /**
   * Create upgrade plan
   */
  private createUpgradePlan;
  /**
   * Create rollback strategy
   */
  private createRollbackStrategy;
}
//# sourceMappingURL=aiAnalysis.d.ts.map
