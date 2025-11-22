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
/**
 * Dependency node in the graph
 */
export interface DependencyNode {
  name: string;
  version: string;
  requestedVersion: string;
  depth: number;
  parent: string | null;
  dependencies: Map<string, DependencyNode>;
  devDependency: boolean;
  optional: boolean;
  resolved: string;
}
/**
 * Dependency graph
 */
export interface DependencyGraph {
  root: DependencyNode;
  allNodes: Map<string, DependencyNode[]>;
  totalNodes: number;
  maxDepth: number;
  packageCount: number;
}
/**
 * Circular dependency
 */
export interface CircularDependency {
  cycle: string[];
  severity: "warning" | "error";
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
    bundleSize: "low" | "medium" | "high";
    runtimeIssues: "low" | "medium" | "high";
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
  severity: "warning" | "error";
  resolution: string;
}
/**
 * Transitive dependency impact
 */
export interface TransitiveImpact {
  package: string;
  affectedBy: string[];
  usageCount: number;
  depth: number;
  criticalPath: boolean;
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
  type: "dedupe" | "resolve-peer" | "remove-circular" | "update" | "optimize";
  priority: "critical" | "high" | "medium" | "low";
  description: string;
  action: string;
  estimatedImpact: string;
}
/**
 * Dependency Graph Analyzer
 */
export declare class DependencyGraphAnalyzer {
  private static instance;
  private constructor();
  static getInstance(): DependencyGraphAnalyzer;
  /**
   * Analyze dependency graph
   */
  analyzeGraph(projectPath?: string): Promise<GraphAnalysis>;
  /**
   * Build dependency graph from package.json
   */
  private buildGraph;
  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies;
  /**
   * Find duplicate versions
   */
  private findDuplicateVersions;
  /**
   * Check peer dependency conflicts
   */
  private checkPeerConflicts;
  /**
   * Analyze transitive dependency impacts
   */
  private analyzeTransitiveImpacts;
  /**
   * Identify critical paths
   */
  private identifyCriticalPaths;
  /**
   * Calculate statistics
   */
  private calculateStatistics;
  /**
   * Generate recommendations
   */
  private generateRecommendations;
  /**
   * Visualize dependency tree as text
   */
  visualizeTree(graph: DependencyGraph, maxDepth?: number): string;
}
//# sourceMappingURL=dependencyGraph.d.ts.map
