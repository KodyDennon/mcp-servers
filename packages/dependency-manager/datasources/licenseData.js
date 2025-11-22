import spdxLicenses from "spdx-license-list/full.js";
import { parse as parseSpdx } from "spdx-expression-parse";
import { satisfies } from "spdx-satisfies";
import { logger, Logger } from "../utils/logger.js";
import { config } from "../config/manager.js";
export class LicenseDataClient {
  licenseCategories;
  constructor() {
    // License categorization
    this.licenseCategories = {
      permissive: [
        "MIT",
        "Apache-2.0",
        "BSD-2-Clause",
        "BSD-3-Clause",
        "ISC",
        "0BSD",
        "BlueOak-1.0.0",
        "Unlicense",
      ],
      copyleft: [
        "GPL-2.0",
        "GPL-2.0-only",
        "GPL-3.0",
        "GPL-3.0-only",
        "AGPL-3.0",
        "AGPL-3.0-only",
      ],
      "weak-copyleft": [
        "LGPL-2.1",
        "LGPL-2.1-only",
        "LGPL-3.0",
        "LGPL-3.0-only",
        "MPL-2.0",
        "EPL-1.0",
        "EPL-2.0",
        "CDDL-1.0",
        "CDDL-1.1",
      ],
      proprietary: ["UNLICENSED", "BUSL-1.1"],
    };
  }
  /**
   * Get detailed information about a license
   */
  getLicenseInfo(licenseId) {
    const correlationId = Logger.generateCorrelationId();
    try {
      // Normalize license ID
      const normalized = this.normalizeLicenseId(licenseId);
      // Check if it's in SPDX list
      const spdxLicense = spdxLicenses[normalized];
      if (!spdxLicense) {
        logger.debug("License not found in SPDX", {
          correlationId,
          license: licenseId,
        });
        return null;
      }
      const category = this.categorizeLicense(normalized);
      return {
        id: normalized,
        name: spdxLicense.name,
        osiApproved: spdxLicense.osiApproved || false,
        fsfLibre: spdxLicense.fsfLibre,
        deprecated: spdxLicense.isDeprecatedLicenseId || false,
        reference: spdxLicense.reference,
        detailsUrl: spdxLicense.detailsUrl || spdxLicense.reference,
        category,
        compatible: {
          mit: this.isCompatible(normalized, "MIT"),
          apache2: this.isCompatible(normalized, "Apache-2.0"),
          gpl3: this.isCompatible(normalized, "GPL-3.0"),
        },
      };
    } catch (error) {
      logger.warn("Failed to get license info", {
        correlationId,
        license: licenseId,
        error,
      });
      return null;
    }
  }
  /**
   * Categorize a license
   */
  categorizeLicense(licenseId) {
    for (const [category, licenses] of Object.entries(this.licenseCategories)) {
      if (licenses.includes(licenseId)) {
        return category;
      }
    }
    return "unknown";
  }
  /**
   * Check if two licenses are compatible
   */
  isCompatible(license1, license2) {
    try {
      // Same license is always compatible
      if (license1 === license2) return true;
      // Permissive licenses are usually compatible with everything
      const cat1 = this.categorizeLicense(license1);
      const cat2 = this.categorizeLicense(license2);
      if (cat1 === "permissive" && cat2 === "permissive") return true;
      if (cat1 === "permissive" && cat2 === "weak-copyleft") return true;
      if (cat1 === "permissive" && cat2 === "copyleft") return true;
      // Weak copyleft with permissive
      if (cat1 === "weak-copyleft" && cat2 === "permissive") return true;
      // GPL is not compatible with most things
      if (cat1 === "copyleft" || cat2 === "copyleft") {
        return license1 === license2;
      }
      // Try SPDX satisfies
      try {
        return satisfies(license1, license2);
      } catch {
        return false;
      }
    } catch (error) {
      logger.debug("License compatibility check failed", {
        license1,
        license2,
        error,
      });
      return false;
    }
  }
  /**
   * Check license compatibility matrix for a project
   */
  checkCompatibility(licenses, projectLicense) {
    const correlationId = Logger.generateCorrelationId();
    const results = [];
    logger.debug("Checking license compatibility", {
      correlationId,
      licenses: licenses.length,
      projectLicense,
    });
    if (projectLicense) {
      // Check all dependencies against project license
      for (const depLicense of licenses) {
        const compatible = this.isCompatible(depLicense, projectLicense);
        results.push({
          license1: depLicense,
          license2: projectLicense,
          compatible,
          reason: compatible ? undefined : "License conflict",
          warnings: compatible
            ? undefined
            : [
                `${depLicense} may not be compatible with project license ${projectLicense}`,
              ],
        });
      }
    } else {
      // Check pairwise compatibility
      for (let i = 0; i < licenses.length; i++) {
        for (let j = i + 1; j < licenses.length; j++) {
          const compatible = this.isCompatible(licenses[i], licenses[j]);
          if (!compatible) {
            results.push({
              license1: licenses[i],
              license2: licenses[j],
              compatible: false,
              reason: "Potential license conflict",
              warnings: [
                `${licenses[i]} and ${licenses[j]} may not be compatible`,
              ],
            });
          }
        }
      }
    }
    return results;
  }
  /**
   * Parse SPDX license expression
   */
  parseLicenseExpression(expression) {
    try {
      const parsed = parseSpdx(expression);
      const licenses = [];
      const operators = [];
      const traverse = (node) => {
        if (node.license) {
          licenses.push(node.license);
        }
        if (node.conjunction) {
          operators.push(node.conjunction);
          if (node.left) traverse(node.left);
          if (node.right) traverse(node.right);
        }
      };
      traverse(parsed);
      return {
        valid: true,
        licenses: [...new Set(licenses)],
        operators: [...new Set(operators)],
      };
    } catch (error) {
      return {
        valid: false,
        licenses: [],
        operators: [],
        error: error.message,
      };
    }
  }
  /**
   * Validate license against allowlist/blocklist
   */
  validateLicense(licenseId) {
    const licenseConfig = config.get("license");
    const normalized = this.normalizeLicenseId(licenseId);
    const allowed =
      licenseConfig.allowlist.length === 0 ||
      licenseConfig.allowlist.includes(normalized);
    const blocked = licenseConfig.blocklist.includes(normalized);
    let reason;
    if (blocked) {
      reason = `License ${normalized} is in blocklist`;
    } else if (!allowed) {
      reason = `License ${normalized} is not in allowlist`;
    }
    return {
      allowed: allowed && !blocked,
      blocked,
      reason,
    };
  }
  /**
   * Get all licenses by category
   */
  getLicensesByCategory(category) {
    return this.licenseCategories[category] || [];
  }
  /**
   * Normalize license ID
   */
  normalizeLicenseId(licenseId) {
    // Remove common prefixes/suffixes
    let normalized = licenseId.trim();
    // Handle OR expressions - take first license
    if (normalized.includes(" OR ")) {
      normalized = normalized.split(" OR ")[0].trim();
    }
    // Handle AND expressions - validation would need both
    if (normalized.includes(" AND ")) {
      normalized = normalized.split(" AND ")[0].trim();
    }
    // Remove parentheses
    normalized = normalized.replace(/[()]/g, "");
    return normalized;
  }
  /**
   * Get license statistics
   */
  getLicenseStats(licenses) {
    const stats = {
      total: licenses.length,
      permissive: 0,
      copyleft: 0,
      weakCopyleft: 0,
      proprietary: 0,
      unknown: 0,
      byLicense: {},
    };
    for (const license of licenses) {
      const normalized = this.normalizeLicenseId(license);
      const category = this.categorizeLicense(normalized);
      // Update category counts
      if (category === "permissive") stats.permissive++;
      else if (category === "copyleft") stats.copyleft++;
      else if (category === "weak-copyleft") stats.weakCopyleft++;
      else if (category === "proprietary") stats.proprietary++;
      else stats.unknown++;
      // Update per-license counts
      stats.byLicense[normalized] = (stats.byLicense[normalized] || 0) + 1;
    }
    return stats;
  }
}
// Export singleton instance
export const licenseData = new LicenseDataClient();
//# sourceMappingURL=licenseData.js.map
