/**
 * Bundle size analysis from Bundlephobia
 */
export interface BundleSizeInfo {
  name: string;
  version: string;
  description: string;
  repository?: string;
  size: number;
  gzip: number;
  dependencyCount: number;
  dependencies?: Array<{
    name: string;
    size: number;
    approximateSize: number;
  }>;
  hasJSModule: boolean;
  hasJSNext: boolean;
  hasSideEffects: boolean;
  isModuleType: boolean;
  ignoredMissingDependencies?: string[];
}
export interface BundleHistory {
  name: string;
  versions: Array<{
    version: string;
    size: number;
    gzip: number;
  }>;
}
export declare class BundleSizeClient {
  private client;
  constructor();
  /**
   * Get bundle size information for a package
   */
  getBundleSize(packageName: string, version?: string): Promise<BundleSizeInfo>;
  /**
   * Get bundle size history for a package
   */
  getBundleHistory(packageName: string, limit?: number): Promise<BundleHistory>;
  /**
   * Compare bundle sizes of multiple packages
   */
  compareBundleSizes(packages: string[]): Promise<
    Array<{
      package: string;
      size: number;
      gzip: number;
      error?: string;
    }>
  >;
  /**
   * Format size for human-readable display
   */
  formatSize(bytes: number): string;
  /**
   * Calculate size impact percentage
   */
  calculateImpact(
    newSize: number,
    oldSize: number,
  ): {
    change: number;
    percentage: number;
    trend: "increased" | "decreased" | "unchanged";
  };
}
export declare const bundleSizeClient: BundleSizeClient;
//# sourceMappingURL=bundleSize.d.ts.map
