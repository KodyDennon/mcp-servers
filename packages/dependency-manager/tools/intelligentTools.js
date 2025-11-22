/**
 * Intelligent Analysis Tools
 *
 * MCP tools for Phase 3 intelligent analysis features:
 * - Breaking change detection
 * - AI-ready package analysis
 * - Alternative package suggestions
 * - Dependency graph analysis
 */
import { Logger } from "../utils/logger.js";
import { CacheManager } from "../cache/cache.js";
import { BreakingChangeDetector } from "../analysis/breakingChanges.js";
import { AIAnalysisEngine } from "../analysis/aiAnalysis.js";
import { AlternativeDiscovery } from "../analysis/alternatives.js";
import { DependencyGraphAnalyzer } from "../analysis/dependencyGraph.js";
const logger = Logger.getInstance();
const cache = CacheManager.getInstance();
const breakingDetector = BreakingChangeDetector.getInstance();
const aiAnalysis = AIAnalysisEngine.getInstance();
const alternativeDiscovery = AlternativeDiscovery.getInstance();
const graphAnalyzer = DependencyGraphAnalyzer.getInstance();
/**
 * MCP Tool: Compare package versions for breaking changes
 */
export async function analyzeBreakingChanges(params) {
  const correlationId = Logger.generateCorrelationId();
  logger.info("Analyzing breaking changes", {
    correlationId,
    package: params.package,
    fromVersion: params.fromVersion,
    toVersion: params.toVersion,
  });
  try {
    const comparison = await breakingDetector.compareVersions(
      params.package,
      params.fromVersion,
      params.toVersion,
    );
    // Format output for AI consumption
    const output = [];
    output.push(`# Breaking Change Analysis: ${params.package}`);
    output.push(`\nFrom: ${params.fromVersion} → To: ${params.toVersion}`);
    output.push(`\n## Version Difference`);
    output.push(`- Type: ${comparison.semverDiff || "unknown"}`);
    output.push(`- Major: ${comparison.isMajor ? "Yes" : "No"}`);
    output.push(`- Minor: ${comparison.isMinor ? "Yes" : "No"}`);
    output.push(`- Patch: ${comparison.isPatch ? "Yes" : "No"}`);
    output.push(`- Prerelease: ${comparison.isPrerelease ? "Yes" : "No"}`);
    output.push(`\n## Breaking Changes (${comparison.breakingChanges.length})`);
    if (comparison.breakingChanges.length > 0) {
      for (const change of comparison.breakingChanges) {
        output.push(`\n### ${change.type} (${change.severity})`);
        output.push(`- **Description:** ${change.description}`);
        output.push(`- **Source:** ${change.source}`);
        output.push(`- **Version:** ${change.version}`);
        if (change.affectedAPIs && change.affectedAPIs.length > 0) {
          output.push(`- **Affected APIs:** ${change.affectedAPIs.join(", ")}`);
        }
        if (change.migration) {
          output.push(`- **Migration:** ${change.migration}`);
        }
      }
    } else {
      output.push("\nNo breaking changes detected.");
    }
    output.push(`\n## Migration Guides (${comparison.migrationGuides.length})`);
    for (const guide of comparison.migrationGuides) {
      output.push(`\n### ${guide.from} → ${guide.to}`);
      output.push(`- **Effort:** ${guide.estimatedEffort}`);
      output.push(`- **Automated:** ${guide.automated ? "Yes" : "No"}`);
      if (guide.url) {
        output.push(`- **URL:** ${guide.url}`);
      }
      if (guide.steps.length > 0) {
        output.push(`- **Steps:**`);
        guide.steps.forEach((step, i) => {
          output.push(`  ${i + 1}. ${step}`);
        });
      }
    }
    output.push(`\n## Risk Assessment`);
    output.push(`- **Risk Score:** ${comparison.riskScore}/100`);
    output.push(`\n## Recommended Upgrade Path`);
    if (comparison.recommendedPath.length > 0) {
      output.push(`Upgrade through: ${comparison.recommendedPath.join(" → ")}`);
    } else {
      output.push("Direct upgrade recommended");
    }
    logger.info("Breaking change analysis complete", {
      correlationId,
      package: params.package,
      breakingCount: comparison.breakingChanges.length,
      riskScore: comparison.riskScore,
    });
    return output.join("\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to analyze breaking changes", {
      correlationId,
      package: params.package,
      error: message,
    });
    throw new Error(`Failed to analyze breaking changes: ${message}`);
  }
}
/**
 * MCP Tool: Comprehensive AI-ready package analysis
 */
export async function analyzePackageIntelligent(params) {
  const correlationId = Logger.generateCorrelationId();
  logger.info("Performing intelligent package analysis", {
    correlationId,
    package: params.package,
  });
  try {
    // Use npm client to get current version if not provided
    const { NpmRegistryClient } = await import("../datasources/npmRegistry.js");
    const npmClient = NpmRegistryClient.getInstance();
    const currentVersion =
      params.currentVersion ||
      (await npmClient.getLatestVersion(params.package));
    const analysis = await aiAnalysis.analyzePackage(
      params.package,
      currentVersion,
      params.projectPath,
    );
    // Format output for AI consumption
    const output = [];
    output.push(`# Intelligent Package Analysis: ${params.package}`);
    output.push(
      `\nCurrent: ${analysis.currentVersion} | Latest: ${analysis.latestVersion}`,
    );
    output.push(`\n## Security Analysis`);
    output.push(
      `- **Vulnerabilities:** ${analysis.analysis.security.vulnerabilities}`,
    );
    output.push(`  - Critical: ${analysis.analysis.security.critical}`);
    output.push(`  - High: ${analysis.analysis.security.high}`);
    output.push(`  - Moderate: ${analysis.analysis.security.moderate}`);
    output.push(`  - Low: ${analysis.analysis.security.low}`);
    output.push(
      `- **Known Exploits:** ${analysis.analysis.security.hasKnownExploits ? "Yes ⚠️" : "No"}`,
    );
    output.push(
      `- **Fix Available:** ${analysis.analysis.security.fixAvailable ? `Yes (${analysis.analysis.security.fixedInVersion})` : "No"}`,
    );
    if (analysis.analysis.security.oldestVulnerability) {
      output.push(
        `- **Oldest Vulnerability:** ${analysis.analysis.security.oldestVulnerability.id} (${analysis.analysis.security.oldestVulnerability.ageInDays} days old)`,
      );
    }
    output.push(`\n## Quality Analysis`);
    output.push(
      `- **Score:** ${analysis.analysis.quality.score.toFixed(0)}/100`,
    );
    output.push(
      `- **Has Tests:** ${analysis.analysis.quality.hasTests ? "Yes" : "No"}`,
    );
    output.push(
      `- **Has CI:** ${analysis.analysis.quality.hasCI ? "Yes" : "No"}`,
    );
    output.push(
      `- **Has Documentation:** ${analysis.analysis.quality.hasDocumentation ? "Yes" : "No"}`,
    );
    output.push(
      `- **Has Types:** ${analysis.analysis.quality.hasTypes ? "Yes" : "No"}`,
    );
    output.push(`- **Popularity:**`);
    output.push(
      `  - Downloads: ${analysis.analysis.quality.popularity.downloads.toLocaleString()}`,
    );
    output.push(
      `  - Stars: ${analysis.analysis.quality.popularity.stars.toLocaleString()}`,
    );
    output.push(
      `  - Dependents: ${analysis.analysis.quality.popularity.dependents.toLocaleString()}`,
    );
    output.push(`\n## Maintenance Analysis`);
    output.push(
      `- **Active:** ${analysis.analysis.maintenance.isActive ? "Yes" : "No"}`,
    );
    output.push(
      `- **Deprecated:** ${analysis.analysis.maintenance.isDeprecated ? "Yes ⚠️" : "No"}`,
    );
    output.push(
      `- **Last Publish:** ${analysis.analysis.maintenance.lastPublish} (${analysis.analysis.maintenance.daysSinceLastPublish} days ago)`,
    );
    output.push(
      `- **Release Frequency:** ${analysis.analysis.maintenance.releaseFrequency}`,
    );
    output.push(
      `- **Maintainer Count:** ${analysis.analysis.maintenance.maintainerCount}`,
    );
    output.push(
      `- **Commit Activity:** ${analysis.analysis.maintenance.commitActivity}`,
    );
    if (analysis.analysis.bundle) {
      output.push(`\n## Bundle Analysis`);
      output.push(
        `- **Size:** ${(analysis.analysis.bundle.size / 1024).toFixed(2)} KB`,
      );
      output.push(
        `- **Gzipped:** ${(analysis.analysis.bundle.gzip / 1024).toFixed(2)} KB`,
      );
      output.push(
        `- **Impact:** ${analysis.analysis.bundle.impact.trend} by ${analysis.analysis.bundle.impact.percentage.toFixed(1)}%`,
      );
      output.push(
        `- **Tree Shakeable:** ${analysis.analysis.bundle.treeShakleable ? "Yes" : "No"}`,
      );
      output.push(
        `- **Has Side Effects:** ${analysis.analysis.bundle.hasSideEffects ? "Yes" : "No"}`,
      );
    }
    output.push(`\n## License Analysis`);
    output.push(`- **License:** ${analysis.analysis.license.license}`);
    output.push(`- **Category:** ${analysis.analysis.license.category}`);
    output.push(
      `- **Compatible:** ${analysis.analysis.license.compatible ? "Yes" : "No"}`,
    );
    output.push(
      `- **Changed from Previous:** ${analysis.analysis.license.changedFromPrevious ? "Yes" : "No"}`,
    );
    if (analysis.analysis.license.issues.length > 0) {
      output.push(`- **Issues:**`);
      analysis.analysis.license.issues.forEach((issue) => {
        output.push(`  - ${issue}`);
      });
    }
    output.push(`\n## Risk Assessment`);
    output.push(
      `- **Overall Risk:** ${analysis.riskAssessment.overall.toUpperCase()}`,
    );
    output.push(`- **Risk Score:** ${analysis.riskAssessment.score}/100`);
    if (analysis.riskAssessment.redFlags.length > 0) {
      output.push(`\n### Red Flags`);
      analysis.riskAssessment.redFlags.forEach((flag) => {
        output.push(`- ⚠️ ${flag}`);
      });
    }
    if (analysis.riskAssessment.greenFlags.length > 0) {
      output.push(`\n### Green Flags`);
      analysis.riskAssessment.greenFlags.forEach((flag) => {
        output.push(`- ✓ ${flag}`);
      });
    }
    output.push(`\n## Recommendations (${analysis.recommendations.length})`);
    for (const rec of analysis.recommendations) {
      output.push(`\n### ${rec.title} [${rec.priority.toUpperCase()}]`);
      output.push(`- **Type:** ${rec.type}`);
      output.push(`- **Description:** ${rec.description}`);
      output.push(`- **Action:** ${rec.action}`);
      output.push(`- **Effort:** ${rec.estimatedEffort}`);
      output.push(`- **Automatable:** ${rec.automatable ? "Yes" : "No"}`);
      if (rec.reasoning.length > 0) {
        output.push(`- **Reasoning:**`);
        rec.reasoning.forEach((r) => {
          output.push(`  - ${r}`);
        });
      }
    }
    output.push(`\n## Upgrade Plan`);
    output.push(
      `- **Recommended:** ${analysis.upgradePlan.recommended ? "Yes" : "No"}`,
    );
    output.push(
      `- **Can Automate:** ${analysis.upgradePlan.canAutomate ? "Yes" : "No"}`,
    );
    output.push(
      `- **Total Estimated Time:** ${analysis.upgradePlan.totalEstimatedTime}`,
    );
    if (analysis.upgradePlan.path.length > 0) {
      output.push(`\n### Upgrade Steps`);
      analysis.upgradePlan.path.forEach((step) => {
        output.push(`\n#### Step ${step.order}: ${step.description}`);
        output.push(`- **Version:** ${step.version}`);
        output.push(`- **Estimated Time:** ${step.estimatedTime}`);
        output.push(`- **Automated:** ${step.automated ? "Yes" : "No"}`);
      });
    }
    output.push(`\n## Rollback Strategy`);
    output.push(`- **Difficulty:** ${analysis.rollbackStrategy.difficulty}`);
    output.push(
      `- **Estimated Time:** ${analysis.rollbackStrategy.estimatedTime}`,
    );
    output.push(
      `- **Data Loss:** ${analysis.rollbackStrategy.dataLoss ? "Yes" : "No"}`,
    );
    output.push(`\n## Project Context`);
    output.push(`- **Project Type:** ${analysis.context.projectType}`);
    output.push(`- **Package Manager:** ${analysis.context.packageManager}`);
    output.push(
      `- **Monorepo:** ${analysis.context.isMonorepo ? "Yes" : "No"}`,
    );
    output.push(
      `- **Dependencies:** ${analysis.context.dependencies.total} total (${analysis.context.dependencies.direct} direct)`,
    );
    logger.info("Intelligent package analysis complete", {
      correlationId,
      package: params.package,
      riskLevel: analysis.riskAssessment.overall,
      recommendationCount: analysis.recommendations.length,
    });
    return output.join("\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to perform intelligent analysis", {
      correlationId,
      package: params.package,
      error: message,
    });
    throw new Error(`Failed to perform intelligent analysis: ${message}`);
  }
}
/**
 * MCP Tool: Find alternative packages
 */
export async function findAlternativePackages(params) {
  const correlationId = Logger.generateCorrelationId();
  logger.info("Finding alternative packages", {
    correlationId,
    package: params.package,
  });
  try {
    const alternatives = await alternativeDiscovery.findAlternatives(
      params.package,
      {
        maxResults: params.maxResults || 5,
        minQualityScore: params.minQualityScore,
        requireTypes: params.requireTypes,
        maxBundleSize: params.maxBundleSize,
        maintainedOnly: true,
      },
    );
    // Format output for AI consumption
    const output = [];
    output.push(`# Alternative Packages for ${params.package}`);
    output.push(`\nFound ${alternatives.length} alternatives\n`);
    for (const alt of alternatives) {
      output.push(
        `\n## ${alt.name}@${alt.version} (Score: ${alt.score.toFixed(0)}/100)`,
      );
      output.push(`\n${alt.description}`);
      output.push(
        `\n### Migration Difficulty: ${alt.migrationDifficulty.level.toUpperCase()}`,
      );
      output.push(
        `- **Estimated Effort:** ${alt.migrationDifficulty.estimatedHours}`,
      );
      output.push(
        `- **API Compatibility:** ${alt.migrationDifficulty.apiCompatibility}`,
      );
      if (alt.pros.length > 0) {
        output.push(`\n### Pros`);
        alt.pros.forEach((pro) => {
          output.push(`- ✓ ${pro}`);
        });
      }
      if (alt.cons.length > 0) {
        output.push(`\n### Cons`);
        alt.cons.forEach((con) => {
          output.push(`- ✗ ${con}`);
        });
      }
      output.push(`\n### Comparison`);
      output.push(`\n**Popularity:**`);
      output.push(
        `- Downloads: ${alt.comparison.popularity.downloads.alternative.toLocaleString()} (${alt.comparison.popularity.downloads.winner})`,
      );
      output.push(
        `- Stars: ${alt.comparison.popularity.stars.alternative.toLocaleString()} (${alt.comparison.popularity.stars.winner})`,
      );
      output.push(`\n**Quality:**`);
      output.push(
        `- Score: ${alt.comparison.quality.score.alternative.toFixed(0)}/100 (${alt.comparison.quality.score.winner}, ${alt.comparison.quality.score.difference > 0 ? "+" : ""}${alt.comparison.quality.score.difference.toFixed(1)})`,
      );
      output.push(
        `- TypeScript: ${alt.comparison.quality.hasTypes.alternative ? "Yes" : "No"} (${alt.comparison.quality.hasTypes.winner})`,
      );
      if (alt.comparison.bundle.size.alternative > 0) {
        output.push(`\n**Bundle Size:**`);
        output.push(
          `- Size: ${(alt.comparison.bundle.size.alternative / 1024).toFixed(2)} KB (${alt.comparison.bundle.size.winner})`,
        );
        output.push(
          `- Gzipped: ${(alt.comparison.bundle.gzip.alternative / 1024).toFixed(2)} KB (${alt.comparison.bundle.gzip.winner})`,
        );
      }
      output.push(`\n**Security:**`);
      output.push(
        `- Vulnerabilities: ${alt.comparison.security.vulnerabilities.alternative} (${alt.comparison.security.vulnerabilities.winner})`,
      );
      output.push(
        `- Critical: ${alt.comparison.security.critical.alternative} (${alt.comparison.security.critical.winner})`,
      );
      output.push(`\n**License:**`);
      output.push(
        `- ${alt.comparison.license.alternative} (${alt.comparison.license.note})`,
      );
      output.push(`\n**Features:**`);
      output.push(
        `- Similarity: ${alt.comparison.features.similarity.toFixed(0)}%`,
      );
      output.push(
        `- Likely Compatible: ${alt.comparison.features.likelyCompatible ? "Yes" : "No"}`,
      );
      if (alt.comparison.features.sharedKeywords.length > 0) {
        output.push(
          `- Shared Keywords: ${alt.comparison.features.sharedKeywords.join(", ")}`,
        );
      }
      output.push("\n---");
    }
    logger.info("Alternative package search complete", {
      correlationId,
      package: params.package,
      alternativeCount: alternatives.length,
    });
    return output.join("\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to find alternatives", {
      correlationId,
      package: params.package,
      error: message,
    });
    throw new Error(`Failed to find alternatives: ${message}`);
  }
}
/**
 * MCP Tool: Analyze dependency graph
 */
export async function analyzeDependencyGraph(params) {
  const correlationId = Logger.generateCorrelationId();
  logger.info("Analyzing dependency graph", {
    correlationId,
    projectPath: params.projectPath || process.cwd(),
  });
  try {
    const analysis = await graphAnalyzer.analyzeGraph(params.projectPath);
    // Format output for AI consumption
    const output = [];
    output.push(`# Dependency Graph Analysis`);
    output.push(`\n## Statistics`);
    output.push(`- **Total Packages:** ${analysis.statistics.totalPackages}`);
    output.push(
      `- **Direct Dependencies:** ${analysis.statistics.directDependencies}`,
    );
    output.push(
      `- **Transitive Dependencies:** ${analysis.statistics.transitiveDependencies}`,
    );
    output.push(`- **Max Depth:** ${analysis.statistics.maxDepth}`);
    output.push(
      `- **Average Depth:** ${analysis.statistics.averageDepth.toFixed(2)}`,
    );
    output.push(
      `- **Duplicate Versions:** ${analysis.statistics.duplicateCount}`,
    );
    output.push(
      `- **Circular Dependencies:** ${analysis.statistics.circularCount}`,
    );
    output.push(
      `- **Peer Conflicts:** ${analysis.statistics.peerConflictCount}`,
    );
    if (analysis.circularDependencies.length > 0) {
      output.push(
        `\n## Circular Dependencies (${analysis.circularDependencies.length})`,
      );
      analysis.circularDependencies.forEach((circular, i) => {
        output.push(`\n### ${i + 1}. ${circular.severity.toUpperCase()}`);
        output.push(`- **Cycle:** ${circular.cycle.join(" → ")}`);
        output.push(`- **Impact:** ${circular.impact}`);
      });
    }
    if (analysis.duplicateVersions.length > 0) {
      output.push(
        `\n## Duplicate Versions (${analysis.duplicateVersions.length})`,
      );
      analysis.duplicateVersions.slice(0, 10).forEach((dup) => {
        output.push(`\n### ${dup.package} (${dup.count} versions)`);
        output.push(`- **Versions:** ${dup.versions.join(", ")}`);
        output.push(`- **Bundle Impact:** ${dup.impact.bundleSize}`);
        output.push(`- **Runtime Impact:** ${dup.impact.runtimeIssues}`);
        output.push(`- **Suggestion:** ${dup.suggestion}`);
      });
    }
    if (analysis.peerConflicts.length > 0) {
      output.push(
        `\n## Peer Dependency Conflicts (${analysis.peerConflicts.length})`,
      );
      analysis.peerConflicts.slice(0, 10).forEach((conflict) => {
        output.push(
          `\n### ${conflict.package} (${conflict.severity.toUpperCase()})`,
        );
        output.push(`- **Requires:** ${conflict.requires}`);
        output.push(
          `- **Installed:** ${conflict.installed || "Not installed"}`,
        );
        output.push(`- **Resolution:** ${conflict.resolution}`);
      });
    }
    if (analysis.transitiveImpacts.length > 0) {
      output.push(`\n## Top Transitive Dependencies (by usage)`);
      analysis.transitiveImpacts.slice(0, 10).forEach((impact, i) => {
        output.push(`\n### ${i + 1}. ${impact.package}`);
        output.push(`- **Usage Count:** ${impact.usageCount}`);
        output.push(`- **Depth:** ${impact.depth}`);
        output.push(`- **Affected By:** ${impact.affectedBy.join(", ")}`);
        output.push(
          `- **Critical Path:** ${impact.criticalPath ? "Yes" : "No"}`,
        );
      });
    }
    if (analysis.criticalPaths.length > 0) {
      output.push(`\n## Critical Paths (${analysis.criticalPaths.length})`);
      analysis.criticalPaths.slice(0, 5).forEach((path, i) => {
        output.push(`\n### Path ${i + 1} (${path.packages.length} packages)`);
        output.push(`- **Chain:** ${path.packages.join(" → ")}`);
      });
    }
    output.push(`\n## Recommendations (${analysis.recommendations.length})`);
    analysis.recommendations.forEach((rec) => {
      output.push(
        `\n### ${rec.type.toUpperCase()} [${rec.priority.toUpperCase()}]`,
      );
      output.push(`- **Description:** ${rec.description}`);
      output.push(`- **Action:** ${rec.action}`);
      output.push(`- **Impact:** ${rec.estimatedImpact}`);
    });
    if (params.maxDepth) {
      output.push(`\n## Dependency Tree (max depth: ${params.maxDepth})`);
      output.push("```");
      output.push(graphAnalyzer.visualizeTree(analysis.graph, params.maxDepth));
      output.push("```");
    }
    logger.info("Dependency graph analysis complete", {
      correlationId,
      totalPackages: analysis.statistics.totalPackages,
      issueCount:
        analysis.circularDependencies.length +
        analysis.duplicateVersions.length +
        analysis.peerConflicts.length,
    });
    return output.join("\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to analyze dependency graph", {
      correlationId,
      error: message,
    });
    throw new Error(`Failed to analyze dependency graph: ${message}`);
  }
}
/**
 * Get intelligent analysis tool definitions for MCP
 */
export function getIntelligentTools() {
  return [
    {
      name: "deps_analyze_breaking",
      description: "Analyze breaking changes between two package versions",
      inputSchema: {
        type: "object",
        properties: {
          package: {
            type: "string",
            description: 'Package name (e.g., "react")',
          },
          fromVersion: {
            type: "string",
            description: 'Current/from version (e.g., "17.0.2")',
          },
          toVersion: {
            type: "string",
            description: 'Target/to version (e.g., "18.2.0")',
          },
        },
        required: ["package", "fromVersion", "toVersion"],
      },
    },
    {
      name: "deps_analyze_intelligent",
      description:
        "Perform comprehensive AI-ready analysis of a package (security, quality, maintenance, bundle, license, risk assessment, recommendations)",
      inputSchema: {
        type: "object",
        properties: {
          package: {
            type: "string",
            description: 'Package name (e.g., "express")',
          },
          currentVersion: {
            type: "string",
            description: "Current version (optional, defaults to latest)",
          },
          projectPath: {
            type: "string",
            description:
              "Path to project directory (optional, defaults to cwd)",
          },
        },
        required: ["package"],
      },
    },
    {
      name: "deps_find_alternatives",
      description: "Find alternative packages with detailed comparison",
      inputSchema: {
        type: "object",
        properties: {
          package: {
            type: "string",
            description: "Package name to find alternatives for",
          },
          maxResults: {
            type: "number",
            description:
              "Maximum number of alternatives to return (default: 5)",
          },
          minQualityScore: {
            type: "number",
            description: "Minimum quality score (0-100, optional)",
          },
          requireTypes: {
            type: "boolean",
            description: "Require TypeScript definitions (optional)",
          },
          maxBundleSize: {
            type: "number",
            description: "Maximum bundle size in bytes (optional)",
          },
        },
        required: ["package"],
      },
    },
    {
      name: "deps_analyze_graph",
      description:
        "Analyze dependency graph for circular dependencies, duplicates, peer conflicts, and transitive impacts",
      inputSchema: {
        type: "object",
        properties: {
          projectPath: {
            type: "string",
            description:
              "Path to project directory (optional, defaults to cwd)",
          },
          maxDepth: {
            type: "number",
            description: "Maximum depth for tree visualization (optional)",
          },
        },
      },
    },
  ];
}
/**
 * Handle intelligent tool calls
 */
export async function handleIntelligentToolCall(name, args) {
  try {
    let result;
    switch (name) {
      case "deps_analyze_breaking":
        result = await analyzeBreakingChanges({
          package: args.package,
          fromVersion: args.fromVersion,
          toVersion: args.toVersion,
        });
        break;
      case "deps_analyze_intelligent":
        result = await analyzePackageIntelligent({
          package: args.package,
          currentVersion: args.currentVersion,
          projectPath: args.projectPath,
        });
        break;
      case "deps_find_alternatives":
        result = await findAlternativePackages({
          package: args.package,
          maxResults: args.maxResults,
          minQualityScore: args.minQualityScore,
          requireTypes: args.requireTypes,
          maxBundleSize: args.maxBundleSize,
        });
        break;
      case "deps_analyze_graph":
        result = await analyzeDependencyGraph({
          projectPath: args.projectPath,
          maxDepth: args.maxDepth,
        });
        break;
      default:
        throw new Error(`Unknown intelligent tool: ${name}`);
    }
    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
//# sourceMappingURL=intelligentTools.js.map
