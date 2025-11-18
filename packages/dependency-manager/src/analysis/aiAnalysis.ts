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

import { Logger } from '../utils/logger.js';
import { CacheManager } from '../cache/cache.js';
import { NpmRegistryClient } from '../datasources/npmRegistry.js';
import { SecurityDataSources } from '../datasources/securitySources.js';
import { BundleSizeClient } from '../datasources/bundleSize.js';
import { PackageQualityClient } from '../datasources/packageQuality.js';
import { LicenseDataClient } from '../datasources/licenseData.js';
import { BreakingChangeDetector, VersionComparison } from './breakingChanges.js';
import * as semver from 'semver';
import { readFile } from 'fs/promises';
import { join } from 'path';

const logger = Logger.getInstance();
const cache = CacheManager.getInstance();
const npmClient = NpmRegistryClient.getInstance();
const securityClient = SecurityDataSources.getInstance();
const bundleClient = BundleSizeClient.getInstance();
const qualityClient = PackageQualityClient.getInstance();
const licenseClient = LicenseDataClient.getInstance();
const breakingDetector = BreakingChangeDetector.getInstance();

/**
 * Project type detection
 */
export type ProjectType =
  | 'react'
  | 'vue'
  | 'angular'
  | 'nextjs'
  | 'gatsby'
  | 'svelte'
  | 'node-backend'
  | 'library'
  | 'cli'
  | 'unknown';

/**
 * Risk level
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

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
  score: number; // 0-100
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
  releaseFrequency: 'very-high' | 'high' | 'moderate' | 'low' | 'very-low';
  maintainerCount: number;
  commitActivity: 'active' | 'moderate' | 'low' | 'stale';
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
    trend: 'increased' | 'decreased' | 'unchanged';
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
  type: 'upgrade' | 'security-fix' | 'alternative' | 'downgrade' | 'remove' | 'keep';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string[];
  action: string;
  estimatedEffort: 'trivial' | 'low' | 'medium' | 'high' | 'critical';
  automatable: boolean;
}

/**
 * Risk assessment
 */
export interface RiskAssessment {
  overall: RiskLevel;
  score: number; // 0-100
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
  impact: 'critical' | 'high' | 'medium' | 'low';
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
  difficulty: 'easy' | 'moderate' | 'hard' | 'very-hard';
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
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';
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
export class AIAnalysisEngine {
  private static instance: AIAnalysisEngine;

  private constructor() {}

  static getInstance(): AIAnalysisEngine {
    if (!AIAnalysisEngine.instance) {
      AIAnalysisEngine.instance = new AIAnalysisEngine();
    }
    return AIAnalysisEngine.instance;
  }

  /**
   * Perform comprehensive package analysis
   */
  async analyzePackage(
    packageName: string,
    currentVersion: string,
    projectPath: string = process.cwd()
  ): Promise<PackageAnalysis> {
    const correlationId = Logger.generateCorrelationId();

    return await logger.time(
      'analyzePackage',
      async () => {
        // Get latest version
        const latestVersion = await npmClient.getLatestVersion(packageName);

        // Gather all analysis data in parallel
        const [
          securityData,
          qualityData,
          breakingData,
          bundleData,
          licenseData,
          projectContext,
        ] = await Promise.all([
          this.analyzeSecurity(packageName, currentVersion, latestVersion),
          this.analyzeQuality(packageName),
          this.analyzeBreakingChanges(packageName, currentVersion, latestVersion),
          this.analyzeBundle(packageName, currentVersion, latestVersion),
          this.analyzeLicense(packageName, currentVersion, latestVersion),
          this.detectProjectContext(projectPath),
        ]);

        const maintenanceData = await this.analyzeMaintenance(packageName);

        // Generate recommendations based on all data
        const recommendations = this.generateRecommendations({
          packageName,
          currentVersion,
          latestVersion,
          security: securityData,
          quality: qualityData,
          maintenance: maintenanceData,
          breaking: breakingData,
          bundle: bundleData,
          license: licenseData,
          context: projectContext,
        });

        // Calculate risk assessment
        const riskAssessment = this.calculateRiskAssessment({
          security: securityData,
          quality: qualityData,
          maintenance: maintenanceData,
          breaking: breakingData,
          bundle: bundleData,
        });

        // Create upgrade plan
        const upgradePlan = this.createUpgradePlan({
          packageName,
          currentVersion,
          latestVersion,
          breaking: breakingData,
          risk: riskAssessment,
          context: projectContext,
        });

        // Create rollback strategy
        const rollbackStrategy = this.createRollbackStrategy({
          packageName,
          currentVersion,
          latestVersion,
          breaking: breakingData,
          context: projectContext,
        });

        return {
          package: packageName,
          currentVersion,
          latestVersion,
          analysis: {
            security: securityData,
            quality: qualityData,
            maintenance: maintenanceData,
            breaking: breakingData,
            bundle: bundleData,
            license: licenseData,
          },
          recommendations,
          riskAssessment,
          upgradePlan,
          rollbackStrategy,
          context: projectContext,
        };
      },
      { correlationId, operation: 'analyzePackage', packageName }
    );
  }

  /**
   * Analyze security
   */
  private async analyzeSecurity(
    packageName: string,
    currentVersion: string,
    latestVersion: string
  ): Promise<SecurityAnalysis> {
    const vulnerabilityReport = await securityClient.getVulnerabilityReport(
      packageName,
      currentVersion
    );

    const hasKnownExploits = vulnerabilityReport.osv.some(
      (v) => v.database_specific?.exploit_available
    );

    // Find oldest vulnerability
    let oldestVulnerability: SecurityAnalysis['oldestVulnerability'];
    if (vulnerabilityReport.osv.length > 0) {
      const oldest = vulnerabilityReport.osv.sort(
        (a, b) =>
          new Date(a.published || 0).getTime() - new Date(b.published || 0).getTime()
      )[0];

      if (oldest.published) {
        const publishedDate = new Date(oldest.published);
        const ageInDays = Math.floor(
          (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        oldestVulnerability = {
          id: oldest.id,
          publishedDate: oldest.published,
          ageInDays,
        };
      }
    }

    // Check if fix is available in latest version
    const fixAvailable = vulnerabilityReport.osv.some((v) =>
      v.affected?.some((a) =>
        a.ranges?.some((r) =>
          r.events?.some(
            (e) => e.fixed && semver.gte(latestVersion, e.fixed)
          )
        )
      )
    );

    return {
      vulnerabilities: vulnerabilityReport.summary.total,
      critical: vulnerabilityReport.summary.critical,
      high: vulnerabilityReport.summary.high,
      moderate: vulnerabilityReport.summary.moderate,
      low: vulnerabilityReport.summary.low,
      hasKnownExploits,
      oldestVulnerability,
      fixAvailable,
      fixedInVersion: fixAvailable ? latestVersion : undefined,
    };
  }

  /**
   * Analyze quality
   */
  private async analyzeQuality(packageName: string): Promise<QualityAnalysis> {
    const metrics = await qualityClient.getQualityMetrics(packageName);
    const metadata = await npmClient.getPackageMetadata(packageName);

    return {
      score: metrics.final * 100,
      hasTests: metrics.quality.tests > 0,
      hasCI: metrics.quality.tests > 0, // Proxy for CI
      hasDocumentation: metrics.quality.documentation > 0,
      hasTypes: !!metadata.types || !!metadata.typings,
      popularity: {
        downloads: metrics.popularity.downloadsCount || 0,
        stars: metadata.repository?.stargazers_count || 0,
        dependents: metrics.popularity.dependentsCount || 0,
      },
      flags: metrics.evaluation.quality.flags || [],
    };
  }

  /**
   * Analyze maintenance
   */
  private async analyzeMaintenance(
    packageName: string
  ): Promise<MaintenanceAnalysis> {
    const maintenanceInfo = await qualityClient.getMaintenanceInfo(packageName);
    const metadata = await npmClient.getPackageMetadata(packageName);

    const lastPublish = metadata.time?.modified || metadata.time?.created || '';
    const daysSinceLastPublish = lastPublish
      ? Math.floor((Date.now() - new Date(lastPublish).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Calculate release frequency
    let releaseFrequency: MaintenanceAnalysis['releaseFrequency'] = 'very-low';
    if (maintenanceInfo.releasesCount) {
      const releasesPerMonth = maintenanceInfo.releasesCount / 12;
      if (releasesPerMonth > 4) releaseFrequency = 'very-high';
      else if (releasesPerMonth > 2) releaseFrequency = 'high';
      else if (releasesPerMonth > 1) releaseFrequency = 'moderate';
      else if (releasesPerMonth > 0.5) releaseFrequency = 'low';
    }

    return {
      isActive: daysSinceLastPublish < 180,
      isDeprecated: !!metadata.deprecated,
      lastPublish,
      daysSinceLastPublish,
      releaseFrequency,
      maintainerCount: metadata.maintainers?.length || 0,
      commitActivity: maintenanceInfo.commitsFrequency > 50 ? 'active' :
                      maintenanceInfo.commitsFrequency > 20 ? 'moderate' :
                      maintenanceInfo.commitsFrequency > 5 ? 'low' : 'stale',
    };
  }

  /**
   * Analyze breaking changes
   */
  private async analyzeBreakingChanges(
    packageName: string,
    currentVersion: string,
    latestVersion: string
  ): Promise<VersionComparison | null> {
    if (currentVersion === latestVersion) {
      return null;
    }

    return await breakingDetector.compareVersions(
      packageName,
      currentVersion,
      latestVersion
    );
  }

  /**
   * Analyze bundle
   */
  private async analyzeBundle(
    packageName: string,
    currentVersion: string,
    latestVersion: string
  ): Promise<BundleAnalysis | null> {
    try {
      const [currentBundle, latestBundle] = await Promise.all([
        bundleClient.getBundleSize(packageName, currentVersion),
        bundleClient.getBundleSize(packageName, latestVersion),
      ]);

      const impact = bundleClient.calculateImpact(
        latestBundle.size,
        currentBundle.size
      );

      return {
        size: latestBundle.size,
        gzip: latestBundle.gzip,
        impact,
        treeShakleable: latestBundle.hasJSModule || false,
        hasSideEffects: latestBundle.hasSideEffects || false,
      };
    } catch (error) {
      logger.warn('Failed to analyze bundle', {
        packageName,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Analyze license
   */
  private async analyzeLicense(
    packageName: string,
    currentVersion: string,
    latestVersion: string
  ): Promise<LicenseAnalysis> {
    const [currentMeta, latestMeta] = await Promise.all([
      npmClient.getVersionMetadata(packageName, currentVersion),
      npmClient.getVersionMetadata(packageName, latestVersion),
    ]);

    const currentLicense = currentMeta.license || 'Unknown';
    const latestLicense = latestMeta.license || 'Unknown';

    const licenseInfo = licenseClient.getLicenseInfo(latestLicense);
    const category = licenseClient.categorizeLicense(latestLicense);

    // Check compatibility (assuming MIT project license)
    const compatible = licenseClient.isCompatible('MIT', latestLicense);

    const issues: string[] = [];
    if (!compatible) {
      issues.push(`License ${latestLicense} may not be compatible with MIT projects`);
    }
    if (currentLicense !== latestLicense) {
      issues.push(`License changed from ${currentLicense} to ${latestLicense}`);
    }

    return {
      license: latestLicense,
      category,
      compatible,
      issues,
      changedFromPrevious: currentLicense !== latestLicense,
    };
  }

  /**
   * Detect project context
   */
  private async detectProjectContext(projectPath: string): Promise<ProjectContext> {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

      // Detect project type
      const projectType = this.detectProjectType(packageJson);

      // Detect package manager
      const packageManager = await this.detectPackageManager(projectPath);

      // Check for lockfile
      const hasLockfile = packageManager !== 'unknown';

      // Count dependencies
      const directDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      const directCount = Object.keys(directDeps).length;

      // Detect frameworks
      const detectedFrameworks = this.detectFrameworks(packageJson);

      return {
        projectType,
        packageManager,
        hasLockfile,
        nodeVersion: packageJson.engines?.node,
        isMonorepo: !!packageJson.workspaces,
        dependencies: {
          total: directCount, // Simplified, would need full tree for accurate count
          direct: directCount,
          transitive: 0, // Would need to parse lockfile
        },
        detectedFrameworks,
      };
    } catch (error) {
      return {
        projectType: 'unknown',
        packageManager: 'unknown',
        hasLockfile: false,
        isMonorepo: false,
        dependencies: {
          total: 0,
          direct: 0,
          transitive: 0,
        },
        detectedFrameworks: [],
      };
    }
  }

  /**
   * Detect project type from package.json
   */
  private detectProjectType(packageJson: any): ProjectType {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    if (deps['next']) return 'nextjs';
    if (deps['gatsby']) return 'gatsby';
    if (deps['react']) return 'react';
    if (deps['vue']) return 'vue';
    if (deps['@angular/core']) return 'angular';
    if (deps['svelte']) return 'svelte';
    if (packageJson.bin) return 'cli';
    if (!deps['react'] && !deps['vue'] && !deps['express']) return 'library';

    return 'node-backend';
  }

  /**
   * Detect package manager
   */
  private async detectPackageManager(
    projectPath: string
  ): Promise<ProjectContext['packageManager']> {
    try {
      const { readdir } = await import('fs/promises');
      const files = await readdir(projectPath);

      if (files.includes('pnpm-lock.yaml')) return 'pnpm';
      if (files.includes('yarn.lock')) return 'yarn';
      if (files.includes('bun.lockb')) return 'bun';
      if (files.includes('package-lock.json')) return 'npm';

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Detect frameworks
   */
  private detectFrameworks(packageJson: any): string[] {
    const frameworks: string[] = [];
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const frameworkMap: Record<string, string> = {
      'next': 'Next.js',
      'react': 'React',
      'vue': 'Vue',
      '@angular/core': 'Angular',
      'svelte': 'Svelte',
      'express': 'Express',
      'fastify': 'Fastify',
      'nestjs': 'NestJS',
      'gatsby': 'Gatsby',
    };

    for (const [pkg, name] of Object.entries(frameworkMap)) {
      if (deps[pkg]) {
        frameworks.push(name);
      }
    }

    return frameworks;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(params: {
    packageName: string;
    currentVersion: string;
    latestVersion: string;
    security: SecurityAnalysis;
    quality: QualityAnalysis;
    maintenance: MaintenanceAnalysis;
    breaking: VersionComparison | null;
    bundle: BundleAnalysis | null;
    license: LicenseAnalysis;
    context: ProjectContext;
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Security recommendations
    if (params.security.critical > 0) {
      recommendations.push({
        type: 'security-fix',
        priority: 'critical',
        title: `Critical security vulnerabilities found`,
        description: `${params.security.critical} critical vulnerabilities in ${params.packageName}@${params.currentVersion}`,
        reasoning: [
          `${params.security.vulnerabilities} total vulnerabilities`,
          params.security.hasKnownExploits ? 'Known exploits exist' : '',
          params.security.fixAvailable ? `Fix available in ${params.security.fixedInVersion}` : 'No fix available yet',
        ].filter(Boolean),
        action: params.security.fixAvailable
          ? `Upgrade to ${params.security.fixedInVersion}`
          : 'Consider finding an alternative package',
        estimatedEffort: 'low',
        automatable: true,
      });
    }

    // Upgrade recommendations
    if (params.currentVersion !== params.latestVersion) {
      const isMinor = params.breaking?.isMinor || params.breaking?.isPatch;
      recommendations.push({
        type: 'upgrade',
        priority: params.security.fixAvailable ? 'high' : 'medium',
        title: `Update available: ${params.latestVersion}`,
        description: `Upgrade ${params.packageName} from ${params.currentVersion} to ${params.latestVersion}`,
        reasoning: [
          `${params.breaking?.breakingChanges.length || 0} breaking changes detected`,
          params.bundle ? `Bundle size ${params.bundle.impact.trend} by ${params.bundle.impact.percentage.toFixed(1)}%` : '',
          params.maintenance.isActive ? 'Package is actively maintained' : 'Package maintenance is stale',
        ].filter(Boolean),
        action: isMinor ? 'Safe to upgrade' : 'Review breaking changes before upgrading',
        estimatedEffort: isMinor ? 'trivial' : 'medium',
        automatable: isMinor,
      });
    }

    // Quality recommendations
    if (params.quality.score < 50) {
      recommendations.push({
        type: 'alternative',
        priority: 'low',
        title: 'Low quality score',
        description: `${params.packageName} has a quality score of ${params.quality.score.toFixed(0)}/100`,
        reasoning: [
          !params.quality.hasTests ? 'No tests detected' : '',
          !params.quality.hasDocumentation ? 'Poor documentation' : '',
          !params.quality.hasTypes ? 'No TypeScript definitions' : '',
        ].filter(Boolean),
        action: 'Consider finding a higher-quality alternative',
        estimatedEffort: 'high',
        automatable: false,
      });
    }

    // Maintenance recommendations
    if (params.maintenance.isDeprecated) {
      recommendations.push({
        type: 'alternative',
        priority: 'high',
        title: 'Package is deprecated',
        description: `${params.packageName} has been deprecated by its maintainers`,
        reasoning: [
          'Deprecated packages will not receive updates or security fixes',
          'Find a maintained alternative',
        ],
        action: 'Find and migrate to an alternative package',
        estimatedEffort: 'high',
        automatable: false,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Calculate risk assessment
   */
  private calculateRiskAssessment(params: {
    security: SecurityAnalysis;
    quality: QualityAnalysis;
    maintenance: MaintenanceAnalysis;
    breaking: VersionComparison | null;
    bundle: BundleAnalysis | null;
  }): RiskAssessment {
    const factors: RiskFactor[] = [];
    let score = 0;

    // Security factors
    if (params.security.critical > 0) {
      factors.push({
        factor: 'Critical Security Vulnerabilities',
        impact: 'critical',
        description: `${params.security.critical} critical vulnerabilities`,
        weight: 40,
      });
      score += 40;
    } else if (params.security.high > 0) {
      factors.push({
        factor: 'High Security Vulnerabilities',
        impact: 'high',
        description: `${params.security.high} high-severity vulnerabilities`,
        weight: 25,
      });
      score += 25;
    }

    // Breaking change factors
    if (params.breaking?.isMajor) {
      factors.push({
        factor: 'Major Version Upgrade',
        impact: 'high',
        description: `${params.breaking.breakingChanges.length} breaking changes detected`,
        weight: 20,
      });
      score += 20;
    }

    // Maintenance factors
    if (params.maintenance.isDeprecated) {
      factors.push({
        factor: 'Deprecated Package',
        impact: 'critical',
        description: 'Package is no longer maintained',
        weight: 30,
      });
      score += 30;
    } else if (params.maintenance.daysSinceLastPublish > 730) {
      factors.push({
        factor: 'Stale Package',
        impact: 'medium',
        description: `No updates in ${Math.floor(params.maintenance.daysSinceLastPublish / 365)} years`,
        weight: 15,
      });
      score += 15;
    }

    // Quality factors
    if (params.quality.score < 30) {
      factors.push({
        factor: 'Low Quality Score',
        impact: 'medium',
        description: `Quality score: ${params.quality.score.toFixed(0)}/100`,
        weight: 10,
      });
      score += 10;
    }

    // Bundle size factors
    if (params.bundle && params.bundle.impact.percentage > 50) {
      factors.push({
        factor: 'Large Bundle Size Increase',
        impact: 'medium',
        description: `Bundle size ${params.bundle.impact.trend} by ${params.bundle.impact.percentage.toFixed(1)}%`,
        weight: 10,
      });
      score += 10;
    }

    // Determine overall risk level
    let overall: RiskLevel = 'low';
    if (score >= 60) overall = 'critical';
    else if (score >= 40) overall = 'high';
    else if (score >= 20) overall = 'medium';

    // Generate mitigations
    const mitigations: string[] = [];
    if (params.security.fixAvailable) {
      mitigations.push('Security fixes available in latest version');
    }
    if (params.breaking?.migrationGuides.length) {
      mitigations.push('Migration guides available');
    }
    if (params.quality.hasTests) {
      mitigations.push('Package has test coverage');
    }

    // Red flags
    const redFlags: string[] = [];
    if (params.security.hasKnownExploits) {
      redFlags.push('Known exploits exist for vulnerabilities');
    }
    if (params.maintenance.isDeprecated) {
      redFlags.push('Package is deprecated');
    }
    if (!params.quality.hasTests) {
      redFlags.push('No test coverage');
    }

    // Green flags
    const greenFlags: string[] = [];
    if (params.maintenance.isActive) {
      greenFlags.push('Active maintenance');
    }
    if (params.quality.score >= 70) {
      greenFlags.push('High quality score');
    }
    if (params.quality.hasTypes) {
      greenFlags.push('TypeScript support');
    }

    return {
      overall,
      score: Math.min(score, 100),
      factors,
      mitigations,
      redFlags,
      greenFlags,
    };
  }

  /**
   * Create upgrade plan
   */
  private createUpgradePlan(params: {
    packageName: string;
    currentVersion: string;
    latestVersion: string;
    breaking: VersionComparison | null;
    risk: RiskAssessment;
    context: ProjectContext;
  }): UpgradePlan {
    const steps: UpgradeStep[] = [];

    if (!params.breaking) {
      return {
        recommended: true,
        path: [],
        totalEstimatedTime: '0 minutes',
        canAutomate: true,
        prerequisites: [],
        postUpgradeChecks: [],
      };
    }

    // Create steps for each version in the recommended path
    params.breaking.recommendedPath.forEach((version, index) => {
      const versionBreaking = params.breaking!.breakingChanges.filter(
        (bc) => bc.version === version
      );

      steps.push({
        order: index + 1,
        version,
        description: `Upgrade to ${version}`,
        changes: versionBreaking.map((bc) => bc.description),
        testing: [
          'Run test suite',
          'Test critical user paths',
          'Check for console errors/warnings',
        ],
        estimatedTime: versionBreaking.length > 5 ? '2-4 hours' : '30-60 minutes',
        automated: versionBreaking.length === 0,
      });
    });

    const totalMinutes = steps.reduce((sum, step) => {
      const match = step.estimatedTime.match(/(\d+)/);
      return sum + (match ? parseInt(match[0]) * 60 : 30);
    }, 0);

    const totalHours = Math.floor(totalMinutes / 60);
    const totalEstimatedTime =
      totalHours > 0 ? `${totalHours}-${totalHours + 2} hours` : '30-60 minutes';

    return {
      recommended: params.risk.overall !== 'critical',
      path: steps,
      totalEstimatedTime,
      canAutomate: steps.every((s) => s.automated),
      prerequisites: [
        'Create a new branch',
        'Ensure all tests pass on current version',
        'Back up current package-lock.json',
      ],
      postUpgradeChecks: [
        'Run full test suite',
        'Check bundle size',
        'Review dependency tree for duplicates',
        'Test in staging environment',
      ],
    };
  }

  /**
   * Create rollback strategy
   */
  private createRollbackStrategy(params: {
    packageName: string;
    currentVersion: string;
    latestVersion: string;
    breaking: VersionComparison | null;
    context: ProjectContext;
  }): RollbackStrategy {
    const hasLockfile = params.context.hasLockfile;
    const hasMajorChanges = params.breaking?.isMajor || false;

    const difficulty = hasMajorChanges
      ? hasLockfile
        ? 'moderate'
        : 'hard'
      : hasLockfile
      ? 'easy'
      : 'moderate';

    const steps: string[] = [];

    if (hasLockfile) {
      steps.push('Restore package-lock.json from backup or git');
      steps.push(`Run ${params.context.packageManager} install`);
    } else {
      steps.push(`Run ${params.context.packageManager} install ${params.packageName}@${params.currentVersion}`);
      steps.push('Verify all dependencies are correct versions');
    }

    steps.push('Run tests to verify rollback');
    steps.push('Clear node_modules and reinstall if issues persist');

    return {
      difficulty,
      steps,
      dataLoss: false,
      estimatedTime: difficulty === 'easy' ? '5-10 minutes' : '15-30 minutes',
      notes: [
        hasLockfile ? 'Lockfile makes rollback straightforward' : 'No lockfile - may need to manually verify versions',
        'Consider keeping the upgrade branch for future attempts',
      ],
    };
  }
}
