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
import { Logger } from "../utils/logger.js";
import { CacheManager } from "../cache/cache.js";
import { RateLimiter } from "../ratelimit/limiter.js";
import { NpmRegistryClient } from "../datasources/npmRegistry.js";
import { PackageQualityClient } from "../datasources/packageQuality.js";
import { BundleSizeClient } from "../datasources/bundleSize.js";
import { LicenseDataClient } from "../datasources/licenseData.js";
import { SecurityDataSources } from "../datasources/securitySources.js";
const logger = Logger.getInstance();
const cache = CacheManager.getInstance();
const rateLimiter = RateLimiter.getInstance();
const npmClient = NpmRegistryClient.getInstance();
const qualityClient = PackageQualityClient.getInstance();
const bundleClient = BundleSizeClient.getInstance();
const licenseClient = LicenseDataClient.getInstance();
const securityClient = SecurityDataSources.getInstance();
/**
 * Alternative Package Discovery Engine
 */
export class AlternativeDiscovery {
  static instance;
  constructor() {}
  static getInstance() {
    if (!AlternativeDiscovery.instance) {
      AlternativeDiscovery.instance = new AlternativeDiscovery();
    }
    return AlternativeDiscovery.instance;
  }
  /**
   * Find alternative packages
   */
  async findAlternatives(packageName, options = {}) {
    const correlationId = Logger.generateCorrelationId();
    return await logger.time(
      "findAlternatives",
      async () => {
        const cacheKey = `alternatives:${packageName}:${JSON.stringify(options)}`;
        return await cache.getOrSet(
          cacheKey,
          async () => {
            // Get original package metadata
            const originalMetadata =
              await npmClient.getPackageMetadata(packageName);
            // Extract keywords and description for search
            const keywords = originalMetadata.keywords || [];
            const description = originalMetadata.description || "";
            // Search for similar packages
            const candidates = await this.searchSimilarPackages(
              packageName,
              keywords,
              description,
            );
            // Filter candidates based on options
            const filtered = await this.filterCandidates(candidates, options);
            // Compare each candidate with original
            const alternatives = [];
            for (const candidate of filtered.slice(
              0,
              options.maxResults || 10,
            )) {
              if (candidate === packageName) continue;
              try {
                const alternative = await this.comparePackages(
                  packageName,
                  candidate,
                );
                alternatives.push(alternative);
              } catch (error) {
                logger.warn("Failed to compare package", {
                  original: packageName,
                  candidate,
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }
            // Sort by score (descending)
            alternatives.sort((a, b) => b.score - a.score);
            return alternatives;
          },
          { ttl: 3600000, namespace: "analysis" }, // 1 hour cache
        );
      },
      { correlationId, operation: "findAlternatives", packageName },
    );
  }
  /**
   * Search for similar packages
   */
  async searchSimilarPackages(packageName, keywords, description) {
    const candidates = new Set();
    // Search by each keyword
    for (const keyword of keywords.slice(0, 5)) {
      try {
        const results = await npmClient.searchPackages(keyword, 20);
        results.forEach((r) => candidates.add(r.package.name));
      } catch (error) {
        logger.warn("Failed to search by keyword", { keyword, error });
      }
    }
    // Search by package name components (e.g., "react-router" -> search "router")
    const nameComponents = packageName
      .split(/[-_@/]/)
      .filter((c) => c.length > 3);
    for (const component of nameComponents) {
      try {
        const results = await npmClient.searchPackages(component, 20);
        results.forEach((r) => candidates.add(r.package.name));
      } catch (error) {
        logger.warn("Failed to search by name component", { component, error });
      }
    }
    // Search by description keywords
    const descWords = description
      .split(/\s+/)
      .filter((w) => w.length > 5)
      .slice(0, 3);
    for (const word of descWords) {
      try {
        const results = await npmClient.searchPackages(word, 10);
        results.forEach((r) => candidates.add(r.package.name));
      } catch (error) {
        logger.warn("Failed to search by description word", { word, error });
      }
    }
    return Array.from(candidates);
  }
  /**
   * Filter candidates based on options
   */
  async filterCandidates(candidates, options) {
    const filtered = [];
    for (const candidate of candidates) {
      try {
        const metadata = await npmClient.getPackageMetadata(candidate);
        // Check if deprecated
        if (options.maintainedOnly && metadata.deprecated) {
          continue;
        }
        // Check if has types
        if (options.requireTypes && !metadata.types && !metadata.typings) {
          continue;
        }
        // Check quality score
        if (options.minQualityScore) {
          const quality = await qualityClient.getQualityMetrics(candidate);
          if (quality.final * 100 < options.minQualityScore) {
            continue;
          }
        }
        // Check bundle size
        if (options.maxBundleSize) {
          try {
            const latestVersion = await npmClient.getLatestVersion(candidate);
            const bundleInfo = await bundleClient.getBundleSize(
              candidate,
              latestVersion,
            );
            if (bundleInfo.gzip > options.maxBundleSize) {
              continue;
            }
          } catch {
            // If bundle size check fails, include the candidate
          }
        }
        // Check license category
        if (options.licenseCategory && metadata.license) {
          const category = licenseClient.categorizeLicense(metadata.license);
          if (category !== options.licenseCategory) {
            continue;
          }
        }
        filtered.push(candidate);
      } catch (error) {
        // Skip candidates that fail metadata fetch
        continue;
      }
    }
    return filtered;
  }
  /**
   * Compare two packages
   */
  async comparePackages(originalName, alternativeName) {
    const correlationId = Logger.generateCorrelationId();
    return await logger.time(
      "comparePackages",
      async () => {
        // Fetch all data in parallel
        const [
          originalMeta,
          alternativeMeta,
          originalQuality,
          alternativeQuality,
          originalMaintenance,
          alternativeMaintenance,
        ] = await Promise.all([
          npmClient.getPackageMetadata(originalName),
          npmClient.getPackageMetadata(alternativeName),
          qualityClient.getQualityMetrics(originalName),
          qualityClient.getQualityMetrics(alternativeName),
          qualityClient.getMaintenanceInfo(originalName),
          qualityClient.getMaintenanceInfo(alternativeName),
        ]);
        const originalVersion = await npmClient.getLatestVersion(originalName);
        const alternativeVersion =
          await npmClient.getLatestVersion(alternativeName);
        // Compare popularity
        const popularityComparison = this.comparePopularity(
          originalQuality,
          alternativeQuality,
          originalMeta,
          alternativeMeta,
        );
        // Compare maintenance
        const maintenanceComparison = this.compareMaintenance(
          originalMeta,
          alternativeMeta,
          originalMaintenance,
          alternativeMaintenance,
        );
        // Compare quality
        const qualityComparison = this.compareQuality(
          originalQuality,
          alternativeQuality,
          originalMeta,
          alternativeMeta,
        );
        // Compare bundle size
        const bundleComparison = await this.compareBundle(
          originalName,
          originalVersion,
          alternativeName,
          alternativeVersion,
        );
        // Compare security
        const securityComparison = await this.compareSecurity(
          originalName,
          originalVersion,
          alternativeName,
          alternativeVersion,
        );
        // Compare licenses
        const licenseComparison = this.compareLicenses(
          originalMeta.license || "Unknown",
          alternativeMeta.license || "Unknown",
        );
        // Compare features
        const featureComparison = this.compareFeatures(
          originalMeta,
          alternativeMeta,
        );
        // Calculate migration difficulty
        const migrationDifficulty = this.calculateMigrationDifficulty(
          originalName,
          alternativeName,
          featureComparison,
        );
        // Calculate overall score
        const score = this.calculateAlternativeScore({
          popularity: popularityComparison,
          maintenance: maintenanceComparison,
          quality: qualityComparison,
          bundle: bundleComparison,
          security: securityComparison,
          license: licenseComparison,
          features: featureComparison,
          migration: migrationDifficulty,
        });
        // Generate pros and cons
        const { pros, cons, reasoning } = this.generateProsConsReasoning({
          popularity: popularityComparison,
          maintenance: maintenanceComparison,
          quality: qualityComparison,
          bundle: bundleComparison,
          security: securityComparison,
          license: licenseComparison,
          features: featureComparison,
          migration: migrationDifficulty,
        });
        return {
          name: alternativeName,
          version: alternativeVersion,
          description: alternativeMeta.description || "",
          score,
          comparison: {
            popularity: popularityComparison,
            maintenance: maintenanceComparison,
            quality: qualityComparison,
            bundle: bundleComparison,
            security: securityComparison,
            license: licenseComparison,
            features: featureComparison,
          },
          migrationDifficulty,
          reasoning,
          pros,
          cons,
        };
      },
      {
        correlationId,
        operation: "comparePackages",
        originalName,
        alternativeName,
      },
    );
  }
  /**
   * Compare popularity
   */
  comparePopularity(
    originalQuality,
    alternativeQuality,
    originalMeta,
    alternativeMeta,
  ) {
    const originalDownloads = originalQuality.popularity.downloadsCount || 0;
    const alternativeDownloads =
      alternativeQuality.popularity.downloadsCount || 0;
    const downloadRatio = alternativeDownloads / (originalDownloads || 1);
    const originalStars = originalMeta.repository?.stargazers_count || 0;
    const alternativeStars = alternativeMeta.repository?.stargazers_count || 0;
    const starRatio = alternativeStars / (originalStars || 1);
    const originalDependents = originalQuality.popularity.dependentsCount || 0;
    const alternativeDependents =
      alternativeQuality.popularity.dependentsCount || 0;
    const dependentRatio = alternativeDependents / (originalDependents || 1);
    return {
      downloads: {
        original: originalDownloads,
        alternative: alternativeDownloads,
        winner: this.determineWinner(downloadRatio, 0.9, 1.1),
        ratio: downloadRatio,
      },
      stars: {
        original: originalStars,
        alternative: alternativeStars,
        winner: this.determineWinner(starRatio, 0.9, 1.1),
        ratio: starRatio,
      },
      dependents: {
        original: originalDependents,
        alternative: alternativeDependents,
        winner: this.determineWinner(dependentRatio, 0.9, 1.1),
        ratio: dependentRatio,
      },
    };
  }
  /**
   * Compare maintenance
   */
  compareMaintenance(
    originalMeta,
    alternativeMeta,
    originalMaintenance,
    alternativeMaintenance,
  ) {
    const originalLastPublish = originalMeta.time?.modified || "";
    const alternativeLastPublish = alternativeMeta.time?.modified || "";
    const originalDate = originalLastPublish
      ? new Date(originalLastPublish).getTime()
      : 0;
    const alternativeDate = alternativeLastPublish
      ? new Date(alternativeLastPublish).getTime()
      : 0;
    return {
      lastPublish: {
        original: originalLastPublish,
        alternative: alternativeLastPublish,
        winner:
          alternativeDate > originalDate
            ? "alternative"
            : originalDate > alternativeDate
              ? "original"
              : "tie",
      },
      releaseFrequency: {
        original: this.getReleaseFrequency(
          originalMaintenance.releasesCount || 0,
        ),
        alternative: this.getReleaseFrequency(
          alternativeMaintenance.releasesCount || 0,
        ),
        winner:
          (alternativeMaintenance.releasesCount || 0) >
          (originalMaintenance.releasesCount || 0)
            ? "alternative"
            : (originalMaintenance.releasesCount || 0) >
                (alternativeMaintenance.releasesCount || 0)
              ? "original"
              : "tie",
      },
      isDeprecated: {
        original: !!originalMeta.deprecated,
        alternative: !!alternativeMeta.deprecated,
        winner:
          originalMeta.deprecated && !alternativeMeta.deprecated
            ? "alternative"
            : !originalMeta.deprecated && alternativeMeta.deprecated
              ? "original"
              : "tie",
      },
    };
  }
  /**
   * Compare quality
   */
  compareQuality(
    originalQuality,
    alternativeQuality,
    originalMeta,
    alternativeMeta,
  ) {
    const originalScore = originalQuality.final * 100;
    const alternativeScore = alternativeQuality.final * 100;
    const scoreDiff = alternativeScore - originalScore;
    const originalHasTypes = !!(originalMeta.types || originalMeta.typings);
    const alternativeHasTypes = !!(
      alternativeMeta.types || alternativeMeta.typings
    );
    const originalHasTests = originalQuality.quality.tests > 0;
    const alternativeHasTests = alternativeQuality.quality.tests > 0;
    return {
      score: {
        original: originalScore,
        alternative: alternativeScore,
        winner: this.determineWinner(
          alternativeScore / (originalScore || 1),
          0.95,
          1.05,
        ),
        difference: scoreDiff,
      },
      hasTypes: {
        original: originalHasTypes,
        alternative: alternativeHasTypes,
        winner:
          alternativeHasTypes && !originalHasTypes
            ? "alternative"
            : originalHasTypes && !alternativeHasTypes
              ? "original"
              : "tie",
      },
      hasTests: {
        original: originalHasTests,
        alternative: alternativeHasTests,
        winner:
          alternativeHasTests && !originalHasTests
            ? "alternative"
            : originalHasTests && !alternativeHasTests
              ? "original"
              : "tie",
      },
    };
  }
  /**
   * Compare bundle size
   */
  async compareBundle(
    originalName,
    originalVersion,
    alternativeName,
    alternativeVersion,
  ) {
    try {
      const [originalBundle, alternativeBundle] = await Promise.all([
        bundleClient.getBundleSize(originalName, originalVersion),
        bundleClient.getBundleSize(alternativeName, alternativeVersion),
      ]);
      const sizeDiff = alternativeBundle.size - originalBundle.size;
      const sizeDiffPercent = (sizeDiff / (originalBundle.size || 1)) * 100;
      const gzipDiff = alternativeBundle.gzip - originalBundle.gzip;
      const gzipDiffPercent = (gzipDiff / (originalBundle.gzip || 1)) * 100;
      return {
        size: {
          original: originalBundle.size,
          alternative: alternativeBundle.size,
          winner:
            alternativeBundle.size < originalBundle.size * 0.95
              ? "alternative"
              : originalBundle.size < alternativeBundle.size * 0.95
                ? "original"
                : "tie",
          difference: sizeDiff,
          differencePercent: sizeDiffPercent,
        },
        gzip: {
          original: originalBundle.gzip,
          alternative: alternativeBundle.gzip,
          winner:
            alternativeBundle.gzip < originalBundle.gzip * 0.95
              ? "alternative"
              : originalBundle.gzip < alternativeBundle.gzip * 0.95
                ? "original"
                : "tie",
          difference: gzipDiff,
          differencePercent: gzipDiffPercent,
        },
      };
    } catch (error) {
      logger.warn("Failed to compare bundle sizes", { error });
      return {
        size: {
          original: 0,
          alternative: 0,
          winner: "tie",
          difference: 0,
          differencePercent: 0,
        },
        gzip: {
          original: 0,
          alternative: 0,
          winner: "tie",
          difference: 0,
          differencePercent: 0,
        },
      };
    }
  }
  /**
   * Compare security
   */
  async compareSecurity(
    originalName,
    originalVersion,
    alternativeName,
    alternativeVersion,
  ) {
    try {
      const [originalSecurity, alternativeSecurity] = await Promise.all([
        securityClient.getVulnerabilityReport(originalName, originalVersion),
        securityClient.getVulnerabilityReport(
          alternativeName,
          alternativeVersion,
        ),
      ]);
      return {
        vulnerabilities: {
          original: originalSecurity.summary.total,
          alternative: alternativeSecurity.summary.total,
          winner:
            alternativeSecurity.summary.total < originalSecurity.summary.total
              ? "alternative"
              : originalSecurity.summary.total <
                  alternativeSecurity.summary.total
                ? "original"
                : "tie",
        },
        critical: {
          original: originalSecurity.summary.critical,
          alternative: alternativeSecurity.summary.critical,
          winner:
            alternativeSecurity.summary.critical <
            originalSecurity.summary.critical
              ? "alternative"
              : originalSecurity.summary.critical <
                  alternativeSecurity.summary.critical
                ? "original"
                : "tie",
        },
      };
    } catch (error) {
      logger.warn("Failed to compare security", { error });
      return {
        vulnerabilities: {
          original: 0,
          alternative: 0,
          winner: "tie",
        },
        critical: {
          original: 0,
          alternative: 0,
          winner: "tie",
        },
      };
    }
  }
  /**
   * Compare licenses
   */
  compareLicenses(originalLicense, alternativeLicense) {
    const compatible = licenseClient.isCompatible(
      originalLicense,
      alternativeLicense,
    );
    let note = "";
    if (originalLicense === alternativeLicense) {
      note = "Same license";
    } else if (compatible) {
      note = "Compatible licenses";
    } else {
      note = "License compatibility needs review";
    }
    return {
      original: originalLicense,
      alternative: alternativeLicense,
      compatible,
      note,
    };
  }
  /**
   * Compare features (keyword similarity)
   */
  compareFeatures(originalMeta, alternativeMeta) {
    const originalKeywords = new Set(originalMeta.keywords || []);
    const alternativeKeywords = new Set(alternativeMeta.keywords || []);
    const sharedKeywords = [];
    const uniqueToOriginal = [];
    const uniqueToAlternative = [];
    for (const keyword of originalKeywords) {
      if (alternativeKeywords.has(keyword)) {
        sharedKeywords.push(keyword);
      } else {
        uniqueToOriginal.push(keyword);
      }
    }
    for (const keyword of alternativeKeywords) {
      if (!originalKeywords.has(keyword)) {
        uniqueToAlternative.push(keyword);
      }
    }
    const totalKeywords = originalKeywords.size + alternativeKeywords.size;
    const similarity =
      totalKeywords > 0
        ? ((sharedKeywords.length * 2) / totalKeywords) * 100
        : 0;
    return {
      similarity,
      sharedKeywords,
      uniqueToOriginal,
      uniqueToAlternative,
      likelyCompatible: similarity > 40,
    };
  }
  /**
   * Calculate migration difficulty
   */
  calculateMigrationDifficulty(
    originalName,
    alternativeName,
    featureComparison,
  ) {
    const factors = [];
    let difficultyScore = 0;
    // Feature similarity impact
    if (featureComparison.similarity < 20) {
      factors.push("Very different feature set");
      difficultyScore += 40;
    } else if (featureComparison.similarity < 50) {
      factors.push("Moderate feature differences");
      difficultyScore += 20;
    } else {
      factors.push("Similar feature set");
    }
    // API compatibility (heuristic based on name similarity)
    const nameSimilarity = this.calculateNameSimilarity(
      originalName,
      alternativeName,
    );
    let apiCompatibility = "unknown";
    if (nameSimilarity > 0.7 || featureComparison.similarity > 70) {
      apiCompatibility = "high";
      factors.push("Likely similar API");
    } else if (nameSimilarity > 0.4 || featureComparison.similarity > 40) {
      apiCompatibility = "medium";
      factors.push("API may require adaptation");
      difficultyScore += 15;
    } else {
      apiCompatibility = "low";
      factors.push("Significantly different API");
      difficultyScore += 30;
    }
    // Determine difficulty level
    let level = "easy";
    let estimatedHours = "2-4 hours";
    if (difficultyScore >= 60) {
      level = "very-hard";
      estimatedHours = "40+ hours";
    } else if (difficultyScore >= 40) {
      level = "hard";
      estimatedHours = "20-40 hours";
    } else if (difficultyScore >= 20) {
      level = "moderate";
      estimatedHours = "8-20 hours";
    } else if (difficultyScore >= 10) {
      level = "easy";
      estimatedHours = "4-8 hours";
    } else {
      level = "trivial";
      estimatedHours = "1-2 hours";
    }
    return {
      level,
      estimatedHours,
      factors,
      apiCompatibility,
      hasCodemods: false, // Would require checking for codemods in npm/GitHub
      hasMigrationGuide: false, // Would require checking documentation
    };
  }
  /**
   * Calculate alternative score
   */
  calculateAlternativeScore(params) {
    let score = 50; // Start neutral
    // Quality impact (±20 points)
    score += (params.quality.score.difference / 100) * 20;
    // Security impact (±15 points)
    if (
      params.security.critical.alternative < params.security.critical.original
    ) {
      score += 15;
    } else if (
      params.security.critical.alternative > params.security.critical.original
    ) {
      score -= 15;
    }
    // Bundle size impact (±10 points)
    const bundleDiffPercent = params.bundle.gzip.differencePercent;
    if (bundleDiffPercent < -20) {
      score += 10;
    } else if (bundleDiffPercent > 20) {
      score -= 10;
    }
    // Feature similarity (±15 points)
    score += (params.features.similarity / 100) * 15;
    // Migration difficulty (±10 points)
    const migrationPenalty = {
      trivial: 0,
      easy: -2,
      moderate: -5,
      hard: -8,
      "very-hard": -10,
    };
    score += migrationPenalty[params.migration.level];
    // Maintenance (±10 points)
    if (
      params.maintenance.isDeprecated.alternative &&
      !params.maintenance.isDeprecated.original
    ) {
      score -= 20; // Big penalty for deprecated
    } else if (
      !params.maintenance.isDeprecated.alternative &&
      params.maintenance.isDeprecated.original
    ) {
      score += 20; // Big bonus if original is deprecated
    }
    // License compatibility (±5 points)
    if (!params.license.compatible) {
      score -= 5;
    }
    return Math.max(0, Math.min(100, score));
  }
  /**
   * Generate pros, cons, and reasoning
   */
  generateProsConsReasoning(params) {
    const pros = [];
    const cons = [];
    const reasoning = [];
    // Quality
    if (params.quality.score.winner === "alternative") {
      pros.push(
        `Higher quality score (+${params.quality.score.difference.toFixed(1)} points)`,
      );
      reasoning.push("Better overall package quality");
    } else if (params.quality.score.winner === "original") {
      cons.push(
        `Lower quality score (${params.quality.score.difference.toFixed(1)} points)`,
      );
    }
    // Security
    if (params.security.vulnerabilities.winner === "alternative") {
      pros.push("Fewer security vulnerabilities");
      reasoning.push("More secure option");
    } else if (params.security.vulnerabilities.winner === "original") {
      cons.push("More security vulnerabilities");
    }
    // Bundle size
    if (params.bundle.gzip.winner === "alternative") {
      pros.push(
        `Smaller bundle (${params.bundle.gzip.differencePercent.toFixed(1)}% reduction)`,
      );
      reasoning.push("Better performance impact");
    } else if (params.bundle.gzip.winner === "original") {
      cons.push(
        `Larger bundle (+${params.bundle.gzip.differencePercent.toFixed(1)}%)`,
      );
    }
    // Popularity
    if (params.popularity.downloads.winner === "alternative") {
      pros.push("More popular (higher downloads)");
    } else if (params.popularity.downloads.winner === "original") {
      cons.push("Less popular than original");
    }
    // Feature similarity
    if (params.features.similarity > 60) {
      pros.push(
        `High feature similarity (${params.features.similarity.toFixed(0)}%)`,
      );
      reasoning.push("Likely drop-in replacement");
    } else if (params.features.similarity < 30) {
      cons.push("Significantly different features");
      reasoning.push("May require significant code changes");
    }
    // Migration difficulty
    if (
      params.migration.level === "trivial" ||
      params.migration.level === "easy"
    ) {
      pros.push(`Easy migration (${params.migration.estimatedHours})`);
    } else if (
      params.migration.level === "hard" ||
      params.migration.level === "very-hard"
    ) {
      cons.push(`Difficult migration (${params.migration.estimatedHours})`);
      reasoning.push("Significant development effort required");
    }
    // Maintenance
    if (params.maintenance.isDeprecated.alternative) {
      cons.push("Package is deprecated");
      reasoning.push("Not recommended for new projects");
    } else if (
      params.maintenance.isDeprecated.original &&
      !params.maintenance.isDeprecated.alternative
    ) {
      pros.push("Active maintenance (original is deprecated)");
      reasoning.push("Better long-term choice");
    }
    // TypeScript support
    if (params.quality.hasTypes.winner === "alternative") {
      pros.push("Has TypeScript definitions");
    } else if (params.quality.hasTypes.winner === "original") {
      cons.push("Missing TypeScript definitions");
    }
    return { pros, cons, reasoning };
  }
  /**
   * Helper: Determine winner from ratio
   */
  determineWinner(ratio, lowerThreshold, upperThreshold) {
    if (ratio < lowerThreshold) return "original";
    if (ratio > upperThreshold) return "alternative";
    return "tie";
  }
  /**
   * Helper: Get release frequency label
   */
  getReleaseFrequency(releasesPerYear) {
    if (releasesPerYear > 48) return "very-high";
    if (releasesPerYear > 24) return "high";
    if (releasesPerYear > 12) return "moderate";
    if (releasesPerYear > 4) return "low";
    return "very-low";
  }
  /**
   * Helper: Calculate name similarity (Levenshtein-based)
   */
  calculateNameSimilarity(name1, name2) {
    const len1 = name1.length;
    const len2 = name2.length;
    const maxLen = Math.max(len1, len2);
    if (maxLen === 0) return 1.0;
    const distance = this.levenshteinDistance(
      name1.toLowerCase(),
      name2.toLowerCase(),
    );
    return 1 - distance / maxLen;
  }
  /**
   * Helper: Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }
}
//# sourceMappingURL=alternatives.js.map
