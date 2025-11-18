/**
 * Dependency Graph Analysis
 *
 * Analyzes dependency tree structure:
 * - Full dependency tree visualization
 * - Circular dependency detection
 * - Duplicate version detection
 * - Peer dependency conflict resolution
 * - Transitive dependency impact analysis
 * - Critical path identification
 */

import { Logger } from '../utils/logger.js';
import { CacheManager } from '../cache/cache.js';
import { NpmRegistryClient } from '../datasources/npmRegistry.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as semver from 'semver';

const logger = Logger.getInstance();
const cache = CacheManager.getInstance();
const npmClient = NpmRegistryClient.getInstance();

/**
 * Dependency node in the graph
 */
export interface DependencyNode {
  name: string;
  version: string;
  requestedVersion: string; // Version range requested
  depth: number;
  parent: string | null;
  dependencies: Map<string, DependencyNode>;
  devDependency: boolean;
  optional: boolean;
  resolved: string; // Resolved version
}

/**
 * Dependency graph
 */
export interface DependencyGraph {
  root: DependencyNode;
  allNodes: Map<string, DependencyNode[]>; // packageName -> all versions
  totalNodes: number;
  maxDepth: number;
  packageCount: number;
}

/**
 * Circular dependency
 */
export interface CircularDependency {
  cycle: string[]; // Package names in the cycle
  severity: 'warning' | 'error';
  impact: string;
}

/**
 * Duplicate version
 */
export interface DuplicateVersion {
  package: string;
  versions: string[];
  count: number;
  impact: {
    bundleSize: 'low' | 'medium' | 'high';
    runtimeIssues: 'low' | 'medium' | 'high';
  };
  suggestion: string;
}

/**
 * Peer dependency conflict
 */
export interface PeerConflict {
  package: string;
  requiredBy: string;
  requires: string;
  installed: string | null;
  severity: 'warning' | 'error';
  resolution: string;
}

/**
 * Transitive dependency impact
 */
export interface TransitiveImpact {
  package: string;
  affectedBy: string[]; // Direct dependencies that bring this in
  usageCount: number; // How many times it appears in tree
  depth: number; // Minimum depth in tree
  criticalPath: boolean; // Is it on the critical path
}

/**
 * Critical path
 */
export interface CriticalPath {
  packages: string[];
  totalSize: number;
  vulnerabilities: number;
  description: string;
}

/**
 * Graph analysis result
 */
export interface GraphAnalysis {
  graph: DependencyGraph;
  circularDependencies: CircularDependency[];
  duplicateVersions: DuplicateVersion[];
  peerConflicts: PeerConflict[];
  transitiveImpacts: TransitiveImpact[];
  criticalPaths: CriticalPath[];
  statistics: GraphStatistics;
  recommendations: GraphRecommendation[];
}

/**
 * Graph statistics
 */
export interface GraphStatistics {
  totalPackages: number;
  directDependencies: number;
  transitiveDependencies: number;
  maxDepth: number;
  averageDepth: number;
  duplicateCount: number;
  circularCount: number;
  peerConflictCount: number;
}

/**
 * Graph recommendation
 */
export interface GraphRecommendation {
  type: 'dedupe' | 'resolve-peer' | 'remove-circular' | 'update' | 'optimize';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  action: string;
  estimatedImpact: string;
}

/**
 * Dependency Graph Analyzer
 */
export class DependencyGraphAnalyzer {
  private static instance: DependencyGraphAnalyzer;

  private constructor() {}

  static getInstance(): DependencyGraphAnalyzer {
    if (!DependencyGraphAnalyzer.instance) {
      DependencyGraphAnalyzer.instance = new DependencyGraphAnalyzer();
    }
    return DependencyGraphAnalyzer.instance;
  }

  /**
   * Analyze dependency graph
   */
  async analyzeGraph(projectPath: string = process.cwd()): Promise<GraphAnalysis> {
    const correlationId = Logger.generateCorrelationId();

    return await logger.time(
      'analyzeGraph',
      async () => {
        // Build dependency graph
        const graph = await this.buildGraph(projectPath);

        // Detect circular dependencies
        const circularDependencies = this.detectCircularDependencies(graph);

        // Find duplicate versions
        const duplicateVersions = this.findDuplicateVersions(graph);

        // Check peer dependency conflicts
        const peerConflicts = await this.checkPeerConflicts(graph, projectPath);

        // Analyze transitive impacts
        const transitiveImpacts = this.analyzeTransitiveImpacts(graph);

        // Identify critical paths
        const criticalPaths = this.identifyCriticalPaths(graph);

        // Calculate statistics
        const statistics = this.calculateStatistics(graph, {
          duplicateVersions,
          circularDependencies,
          peerConflicts,
        });

        // Generate recommendations
        const recommendations = this.generateRecommendations({
          duplicateVersions,
          circularDependencies,
          peerConflicts,
          transitiveImpacts,
        });

        return {
          graph,
          circularDependencies,
          duplicateVersions,
          peerConflicts,
          transitiveImpacts,
          criticalPaths,
          statistics,
          recommendations,
        };
      },
      { correlationId, operation: 'analyzeGraph' }
    );
  }

  /**
   * Build dependency graph from package.json
   */
  private async buildGraph(projectPath: string): Promise<DependencyGraph> {
    const packageJsonPath = join(projectPath, 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

    const allNodes = new Map<string, DependencyNode[]>();
    let totalNodes = 0;
    let maxDepth = 0;

    // Create root node
    const root: DependencyNode = {
      name: packageJson.name || 'root',
      version: packageJson.version || '0.0.0',
      requestedVersion: packageJson.version || '0.0.0',
      depth: 0,
      parent: null,
      dependencies: new Map(),
      devDependency: false,
      optional: false,
      resolved: packageJson.version || '0.0.0',
    };

    // Build graph recursively
    const visited = new Set<string>();

    const buildNode = async (
      parentNode: DependencyNode,
      depName: string,
      versionRange: string,
      depth: number,
      isDev: boolean,
      isOptional: boolean
    ): Promise<void> => {
      // Prevent infinite recursion
      const nodeKey = `${depName}@${versionRange}@${depth}`;
      if (visited.has(nodeKey) || depth > 10) {
        return;
      }
      visited.add(nodeKey);

      try {
        // Resolve version
        const metadata = await npmClient.getPackageMetadata(depName);
        const latestVersion = await npmClient.getLatestVersion(depName);
        const resolvedVersion = semver.validRange(versionRange)
          ? semver.maxSatisfying(
              Object.keys(metadata.versions || {}),
              versionRange
            ) || latestVersion
          : latestVersion;

        const node: DependencyNode = {
          name: depName,
          version: resolvedVersion,
          requestedVersion: versionRange,
          depth,
          parent: parentNode.name,
          dependencies: new Map(),
          devDependency: isDev,
          optional: isOptional,
          resolved: resolvedVersion,
        };

        parentNode.dependencies.set(depName, node);

        // Track all nodes
        if (!allNodes.has(depName)) {
          allNodes.set(depName, []);
        }
        allNodes.get(depName)!.push(node);

        totalNodes++;
        maxDepth = Math.max(maxDepth, depth);

        // Get dependencies of this package
        const versionMetadata = await npmClient.getVersionMetadata(
          depName,
          resolvedVersion
        );

        const deps = versionMetadata.dependencies || {};

        // Recursively build child dependencies (limit depth)
        if (depth < 5) {
          for (const [childName, childVersion] of Object.entries(deps)) {
            await buildNode(
              node,
              childName,
              childVersion as string,
              depth + 1,
              isDev,
              isOptional
            );
          }
        }
      } catch (error) {
        logger.warn('Failed to build node', {
          depName,
          versionRange,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Build from direct dependencies
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};

    for (const [name, version] of Object.entries(deps)) {
      await buildNode(root, name, version as string, 1, false, false);
    }

    for (const [name, version] of Object.entries(devDeps)) {
      if (!deps[name]) {
        // Don't duplicate if already in deps
        await buildNode(root, name, version as string, 1, true, false);
      }
    }

    return {
      root,
      allNodes,
      totalNodes,
      maxDepth,
      packageCount: allNodes.size,
    };
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(graph: DependencyGraph): CircularDependency[] {
    const circular: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const pathStack: string[] = [];

    const dfs = (node: DependencyNode): void => {
      const key = `${node.name}@${node.version}`;

      if (recursionStack.has(node.name)) {
        // Found a cycle
        const cycleStart = pathStack.indexOf(node.name);
        if (cycleStart !== -1) {
          const cycle = [...pathStack.slice(cycleStart), node.name];

          circular.push({
            cycle,
            severity: cycle.length > 3 ? 'error' : 'warning',
            impact: `Circular dependency detected: ${cycle.join(' → ')}`,
          });
        }
        return;
      }

      if (visited.has(key)) {
        return;
      }

      visited.add(key);
      recursionStack.add(node.name);
      pathStack.push(node.name);

      for (const [, childNode] of node.dependencies) {
        dfs(childNode);
      }

      recursionStack.delete(node.name);
      pathStack.pop();
    };

    dfs(graph.root);

    return circular;
  }

  /**
   * Find duplicate versions
   */
  private findDuplicateVersions(graph: DependencyGraph): DuplicateVersion[] {
    const duplicates: DuplicateVersion[] = [];

    for (const [packageName, nodes] of graph.allNodes) {
      const versions = new Set(nodes.map((n) => n.version));

      if (versions.size > 1) {
        const versionArray = Array.from(versions);

        duplicates.push({
          package: packageName,
          versions: versionArray,
          count: versions.size,
          impact: {
            bundleSize: versions.size > 3 ? 'high' : versions.size > 1 ? 'medium' : 'low',
            runtimeIssues: versions.size > 2 ? 'high' : 'low',
          },
          suggestion: `Dedupe ${packageName} to single version (prefer ${versionArray[versionArray.length - 1]})`,
        });
      }
    }

    return duplicates.sort((a, b) => b.count - a.count);
  }

  /**
   * Check peer dependency conflicts
   */
  private async checkPeerConflicts(
    graph: DependencyGraph,
    projectPath: string
  ): Promise<PeerConflict[]> {
    const conflicts: PeerConflict[] = [];

    const checkNode = async (node: DependencyNode): Promise<void> => {
      try {
        const metadata = await npmClient.getVersionMetadata(node.name, node.version);
        const peerDeps = metadata.peerDependencies || {};

        for (const [peerName, peerVersion] of Object.entries(peerDeps)) {
          // Check if peer dependency is satisfied
          const installedNodes = graph.allNodes.get(peerName);

          if (!installedNodes || installedNodes.length === 0) {
            conflicts.push({
              package: node.name,
              requiredBy: node.name,
              requires: `${peerName}@${peerVersion}`,
              installed: null,
              severity: 'error',
              resolution: `Install ${peerName}@${peerVersion}`,
            });
          } else {
            // Check if any installed version satisfies
            const satisfied = installedNodes.some((n) =>
              semver.satisfies(n.version, peerVersion as string)
            );

            if (!satisfied) {
              conflicts.push({
                package: node.name,
                requiredBy: node.name,
                requires: `${peerName}@${peerVersion}`,
                installed: installedNodes[0].version,
                severity: 'warning',
                resolution: `Update ${peerName} to satisfy ${peerVersion}`,
              });
            }
          }
        }

        // Recurse
        for (const [, childNode] of node.dependencies) {
          await checkNode(childNode);
        }
      } catch (error) {
        logger.warn('Failed to check peer conflicts', {
          node: node.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    await checkNode(graph.root);

    return conflicts;
  }

  /**
   * Analyze transitive dependency impacts
   */
  private analyzeTransitiveImpacts(graph: DependencyGraph): TransitiveImpact[] {
    const impacts = new Map<string, TransitiveImpact>();

    const analyzeNode = (node: DependencyNode, directParent: string): void => {
      if (node.depth === 0) return; // Skip root

      if (!impacts.has(node.name)) {
        impacts.set(node.name, {
          package: node.name,
          affectedBy: [],
          usageCount: 0,
          depth: node.depth,
          criticalPath: false,
        });
      }

      const impact = impacts.get(node.name)!;
      impact.usageCount++;
      impact.depth = Math.min(impact.depth, node.depth);

      if (node.depth === 1 && !impact.affectedBy.includes(directParent)) {
        impact.affectedBy.push(directParent);
      }

      // Recurse
      for (const [, childNode] of node.dependencies) {
        analyzeNode(childNode, node.depth === 1 ? node.name : directParent);
      }
    };

    for (const [, childNode] of graph.root.dependencies) {
      analyzeNode(childNode, childNode.name);
    }

    return Array.from(impacts.values()).sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Identify critical paths
   */
  private identifyCriticalPaths(graph: DependencyGraph): CriticalPath[] {
    const paths: CriticalPath[] = [];

    // Find longest paths from root
    const findPaths = (
      node: DependencyNode,
      currentPath: string[]
    ): void => {
      const newPath = [...currentPath, node.name];

      if (node.dependencies.size === 0) {
        // Leaf node - this is a complete path
        if (newPath.length > 3) {
          paths.push({
            packages: newPath,
            totalSize: 0, // Would need bundle size data
            vulnerabilities: 0, // Would need security data
            description: `Dependency chain: ${newPath.join(' → ')}`,
          });
        }
        return;
      }

      // Recurse
      for (const [, childNode] of node.dependencies) {
        findPaths(childNode, newPath);
      }
    };

    findPaths(graph.root, []);

    // Sort by path length (descending)
    return paths.sort((a, b) => b.packages.length - a.packages.length).slice(0, 10);
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(
    graph: DependencyGraph,
    issues: {
      duplicateVersions: DuplicateVersion[];
      circularDependencies: CircularDependency[];
      peerConflicts: PeerConflict[];
    }
  ): GraphStatistics {
    const directDeps = graph.root.dependencies.size;
    const transitiveDeps = graph.totalNodes - directDeps;

    // Calculate average depth
    let totalDepth = 0;
    let nodeCount = 0;

    const sumDepths = (node: DependencyNode): void => {
      totalDepth += node.depth;
      nodeCount++;

      for (const [, childNode] of node.dependencies) {
        sumDepths(childNode);
      }
    };

    sumDepths(graph.root);

    const averageDepth = nodeCount > 0 ? totalDepth / nodeCount : 0;

    return {
      totalPackages: graph.packageCount,
      directDependencies: directDeps,
      transitiveDependencies: transitiveDeps,
      maxDepth: graph.maxDepth,
      averageDepth,
      duplicateCount: issues.duplicateVersions.length,
      circularCount: issues.circularDependencies.length,
      peerConflictCount: issues.peerConflicts.length,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(issues: {
    duplicateVersions: DuplicateVersion[];
    circularDependencies: CircularDependency[];
    peerConflicts: PeerConflict[];
    transitiveImpacts: TransitiveImpact[];
  }): GraphRecommendation[] {
    const recommendations: GraphRecommendation[] = [];

    // Dedupe recommendations
    for (const duplicate of issues.duplicateVersions.slice(0, 5)) {
      if (duplicate.count > 2) {
        recommendations.push({
          type: 'dedupe',
          priority: duplicate.impact.bundleSize === 'high' ? 'high' : 'medium',
          description: `${duplicate.package} has ${duplicate.count} different versions`,
          action: `Run npm dedupe or update dependencies to use consistent versions`,
          estimatedImpact: `Reduce bundle size and potential runtime conflicts`,
        });
      }
    }

    // Circular dependency recommendations
    for (const circular of issues.circularDependencies) {
      recommendations.push({
        type: 'remove-circular',
        priority: circular.severity === 'error' ? 'critical' : 'medium',
        description: `Circular dependency: ${circular.cycle.join(' → ')}`,
        action: 'Refactor code to break the circular dependency',
        estimatedImpact: 'Prevent potential runtime issues and improve maintainability',
      });
    }

    // Peer conflict recommendations
    for (const conflict of issues.peerConflicts.slice(0, 5)) {
      recommendations.push({
        type: 'resolve-peer',
        priority: conflict.severity === 'error' ? 'critical' : 'medium',
        description: `Peer dependency conflict: ${conflict.package} requires ${conflict.requires}`,
        action: conflict.resolution,
        estimatedImpact: 'Prevent runtime errors and warnings',
      });
    }

    // Heavily used transitive dependencies
    const heavyTransitive = issues.transitiveImpacts
      .filter((t) => t.usageCount > 5 && t.depth > 1)
      .slice(0, 3);

    for (const transitive of heavyTransitive) {
      recommendations.push({
        type: 'optimize',
        priority: 'low',
        description: `${transitive.package} is used ${transitive.usageCount} times as a transitive dependency`,
        action: 'Consider making it a direct dependency for better control',
        estimatedImpact: 'Better version control and update management',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Visualize dependency tree as text
   */
  visualizeTree(graph: DependencyGraph, maxDepth: number = 3): string {
    const lines: string[] = [];

    const addNode = (node: DependencyNode, prefix: string, isLast: boolean): void => {
      if (node.depth > maxDepth) return;

      const connector = isLast ? '└── ' : '├── ';
      const line = `${prefix}${connector}${node.name}@${node.version}`;

      lines.push(line);

      const children = Array.from(node.dependencies.values());
      const newPrefix = prefix + (isLast ? '    ' : '│   ');

      children.forEach((child, index) => {
        addNode(child, newPrefix, index === children.length - 1);
      });
    };

    lines.push(`${graph.root.name}@${graph.root.version}`);

    const rootChildren = Array.from(graph.root.dependencies.values());
    rootChildren.forEach((child, index) => {
      addNode(child, '', index === rootChildren.length - 1);
    });

    return lines.join('\n');
  }
}
