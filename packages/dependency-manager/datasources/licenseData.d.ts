/**
 * License data and compatibility checking using SPDX
 */
export interface LicenseInfo {
  id: string;
  name: string;
  osiApproved: boolean;
  fsfLibre?: boolean;
  deprecated: boolean;
  reference: string;
  detailsUrl: string;
  category:
    | "permissive"
    | "copyleft"
    | "weak-copyleft"
    | "proprietary"
    | "unknown";
  compatible: {
    mit: boolean;
    apache2: boolean;
    gpl3: boolean;
  };
}
export interface LicenseCompatibility {
  license1: string;
  license2: string;
  compatible: boolean;
  reason?: string;
  warnings?: string[];
}
export declare class LicenseDataClient {
  private licenseCategories;
  constructor();
  /**
   * Get detailed information about a license
   */
  getLicenseInfo(licenseId: string): LicenseInfo | null;
  /**
   * Categorize a license
   */
  categorizeLicense(
    licenseId: string,
  ): "permissive" | "copyleft" | "weak-copyleft" | "proprietary" | "unknown";
  /**
   * Check if two licenses are compatible
   */
  isCompatible(license1: string, license2: string): boolean;
  /**
   * Check license compatibility matrix for a project
   */
  checkCompatibility(
    licenses: string[],
    projectLicense?: string,
  ): LicenseCompatibility[];
  /**
   * Parse SPDX license expression
   */
  parseLicenseExpression(expression: string): {
    valid: boolean;
    licenses: string[];
    operators: string[];
    error?: string;
  };
  /**
   * Validate license against allowlist/blocklist
   */
  validateLicense(licenseId: string): {
    allowed: boolean;
    blocked: boolean;
    reason?: string;
  };
  /**
   * Get all licenses by category
   */
  getLicensesByCategory(
    category: "permissive" | "copyleft" | "weak-copyleft" | "proprietary",
  ): string[];
  /**
   * Normalize license ID
   */
  private normalizeLicenseId;
  /**
   * Get license statistics
   */
  getLicenseStats(licenses: string[]): {
    total: number;
    permissive: number;
    copyleft: number;
    weakCopyleft: number;
    proprietary: number;
    unknown: number;
    byLicense: Record<string, number>;
  };
}
export declare const licenseData: LicenseDataClient;
//# sourceMappingURL=licenseData.d.ts.map
