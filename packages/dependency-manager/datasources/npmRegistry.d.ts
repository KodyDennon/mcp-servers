/**
 * Enhanced npm registry client with caching and rate limiting
 */
export interface PackageMetadata {
  name: string;
  version: string;
  description?: string;
  license?: string;
  repository?: {
    type: string;
    url: string;
  };
  homepage?: string;
  bugs?: {
    url: string;
  };
  maintainers?: Array<{
    name: string;
    email: string;
  }>;
  keywords?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  dist?: {
    tarball: string;
    shasum: string;
    integrity?: string;
    unpackedSize?: number;
  };
  time?: {
    created: string;
    modified: string;
    [version: string]: string;
  };
  "dist-tags"?: {
    latest: string;
    [tag: string]: string;
  };
}
export interface PackageDownloads {
  downloads: number;
  start: string;
  end: string;
  package: string;
}
export interface PackageQualityScore {
  final: number;
  detail: {
    quality: number;
    popularity: number;
    maintenance: number;
  };
}
export declare class NpmRegistryClient {
  private client;
  private downloadsClient;
  constructor();
  /**
   * Get full package metadata
   */
  getPackageMetadata(packageName: string): Promise<PackageMetadata>;
  /**
   * Get specific version metadata
   */
  getVersionMetadata(
    packageName: string,
    version: string,
  ): Promise<PackageMetadata>;
  /**
   * Get package download stats
   */
  getDownloads(
    packageName: string,
    period?: "last-day" | "last-week" | "last-month" | "last-year",
  ): Promise<PackageDownloads>;
  /**
   * Search packages
   */
  searchPackages(
    query: string,
    options?: {
      size?: number;
      quality?: number;
      popularity?: number;
      maintenance?: number;
    },
  ): Promise<
    Array<{
      package: PackageMetadata;
      score: PackageQualityScore;
      searchScore: number;
    }>
  >;
  /**
   * Get all versions of a package
   */
  getAllVersions(packageName: string): Promise<string[]>;
  /**
   * Get latest version
   */
  getLatestVersion(packageName: string): Promise<string>;
  /**
   * Check if package exists
   */
  packageExists(packageName: string): Promise<boolean>;
}
export declare const npmRegistry: NpmRegistryClient;
//# sourceMappingURL=npmRegistry.d.ts.map
