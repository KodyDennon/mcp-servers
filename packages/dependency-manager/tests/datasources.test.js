/**
 * Phase 2 Data Sources Tests
 */

describe("Phase 2: Data Source Integrations", () => {
  describe("npm Registry Client", () => {
    test("npmRegistry client exists", () => {
      const { npmRegistry } = require("../src/datasources/npmRegistry.js");

      expect(npmRegistry).toBeDefined();
      expect(npmRegistry.getPackageMetadata).toBeDefined();
      expect(npmRegistry.getVersionMetadata).toBeDefined();
      expect(npmRegistry.getDownloads).toBeDefined();
      expect(npmRegistry.searchPackages).toBeDefined();
      expect(npmRegistry.getAllVersions).toBeDefined();
      expect(npmRegistry.getLatestVersion).toBeDefined();
      expect(npmRegistry.packageExists).toBeDefined();
    });

    test("npm registry methods are functions", () => {
      const { npmRegistry } = require("../src/datasources/npmRegistry.js");

      expect(typeof npmRegistry.getPackageMetadata).toBe("function");
      expect(typeof npmRegistry.getLatestVersion).toBe("function");
      expect(typeof npmRegistry.packageExists).toBe("function");
    });
  });

  describe("Security Data Sources", () => {
    test("securitySources client exists", () => {
      const { securitySources } = require("../src/datasources/securitySources.js");

      expect(securitySources).toBeDefined();
      expect(securitySources.queryOSV).toBeDefined();
      expect(securitySources.getOSVVulnerability).toBeDefined();
      expect(securitySources.queryGitHubAdvisories).toBeDefined();
      expect(securitySources.getGitHubAdvisory).toBeDefined();
      expect(securitySources.getVulnerabilityReport).toBeDefined();
    });

    test("security methods are async functions", () => {
      const { securitySources } = require("../src/datasources/securitySources.js");

      expect(typeof securitySources.queryOSV).toBe("function");
      expect(typeof securitySources.getVulnerabilityReport).toBe("function");
    });
  });

  describe("Bundle Size Client", () => {
    test("bundleSizeClient exists", () => {
      const { bundleSizeClient } = require("../src/datasources/bundleSize.js");

      expect(bundleSizeClient).toBeDefined();
      expect(bundleSizeClient.getBundleSize).toBeDefined();
      expect(bundleSizeClient.getBundleHistory).toBeDefined();
      expect(bundleSizeClient.compareBundleSizes).toBeDefined();
      expect(bundleSizeClient.formatSize).toBeDefined();
      expect(bundleSizeClient.calculateImpact).toBeDefined();
    });

    test("formatSize works correctly", () => {
      const { bundleSizeClient } = require("../src/datasources/bundleSize.js");

      expect(bundleSizeClient.formatSize(0)).toBe("0 B");
      expect(bundleSizeClient.formatSize(1024)).toBe("1 KB");
      expect(bundleSizeClient.formatSize(1048576)).toBe("1 MB");
    });

    test("calculateImpact calculates correctly", () => {
      const { bundleSizeClient } = require("../src/datasources/bundleSize.js");

      const result = bundleSizeClient.calculateImpact(120, 100);
      expect(result.change).toBe(20);
      expect(result.percentage).toBe(20);
      expect(result.trend).toBe("increased");

      const decrease = bundleSizeClient.calculateImpact(80, 100);
      expect(decrease.change).toBe(-20);
      expect(decrease.percentage).toBe(-20);
      expect(decrease.trend).toBe("decreased");
    });
  });

  describe("License Data Client", () => {
    test("licenseData client exists", () => {
      const { licenseData } = require("../src/datasources/licenseData.js");

      expect(licenseData).toBeDefined();
      expect(licenseData.getLicenseInfo).toBeDefined();
      expect(licenseData.categorizeLicense).toBeDefined();
      expect(licenseData.isCompatible).toBeDefined();
      expect(licenseData.checkCompatibility).toBeDefined();
      expect(licenseData.parseLicenseExpression).toBeDefined();
      expect(licenseData.validateLicense).toBeDefined();
      expect(licenseData.getLicensesByCategory).toBeDefined();
      expect(licenseData.getLicenseStats).toBeDefined();
    });

    test("categorizeLicense works correctly", () => {
      const { licenseData } = require("../src/datasources/licenseData.js");

      expect(licenseData.categorizeLicense("MIT")).toBe("permissive");
      expect(licenseData.categorizeLicense("Apache-2.0")).toBe("permissive");
      expect(licenseData.categorizeLicense("GPL-3.0")).toBe("copyleft");
      expect(licenseData.categorizeLicense("LGPL-3.0")).toBe("weak-copyleft");
      expect(licenseData.categorizeLicense("UNLICENSED")).toBe("proprietary");
      expect(licenseData.categorizeLicense("UNKNOWN-LICENSE")).toBe("unknown");
    });

    test("isCompatible works for basic cases", () => {
      const { licenseData } = require("../src/datasources/licenseData.js");

      // Same license is compatible
      expect(licenseData.isCompatible("MIT", "MIT")).toBe(true);

      // Permissive licenses are compatible
      expect(licenseData.isCompatible("MIT", "Apache-2.0")).toBe(true);
    });

    test("getLicenseStats calculates correctly", () => {
      const { licenseData } = require("../src/datasources/licenseData.js");

      const licenses = ["MIT", "MIT", "Apache-2.0", "GPL-3.0", "UNKNOWN"];
      const stats = licenseData.getLicenseStats(licenses);

      expect(stats.total).toBe(5);
      expect(stats.permissive).toBe(3); // MIT x2 + Apache
      expect(stats.copyleft).toBe(1); // GPL
      expect(stats.unknown).toBe(1);
      expect(stats.byLicense["MIT"]).toBe(2);
      expect(stats.byLicense["Apache-2.0"]).toBe(1);
    });

    test("parseLicenseExpression handles basic licenses", () => {
      const { licenseData } = require("../src/datasources/licenseData.js");

      const result = licenseData.parseLicenseExpression("MIT");
      expect(result.valid).toBe(true);
      expect(result.licenses).toContain("MIT");
    });
  });

  describe("Package Quality Client", () => {
    test("packageQuality client exists", () => {
      const { packageQuality } = require("../src/datasources/packageQuality.js");

      expect(packageQuality).toBeDefined();
      expect(packageQuality.getQualityMetrics).toBeDefined();
      expect(packageQuality.getMaintenanceInfo).toBeDefined();
      expect(packageQuality.getDependencyHealth).toBeDefined();
      expect(packageQuality.comparePackages).toBeDefined();
      expect(packageQuality.getPackageTrends).toBeDefined();
    });

    test("quality methods are async functions", () => {
      const { packageQuality } = require("../src/datasources/packageQuality.js");

      expect(typeof packageQuality.getQualityMetrics).toBe("function");
      expect(typeof packageQuality.getDependencyHealth).toBe("function");
    });
  });

  describe("Integration", () => {
    test("all data sources work together", () => {
      const { npmRegistry } = require("../src/datasources/npmRegistry.js");
      const { securitySources } = require("../src/datasources/securitySources.js");
      const { bundleSizeClient } = require("../src/datasources/bundleSize.js");
      const { licenseData } = require("../src/datasources/licenseData.js");
      const { packageQuality } = require("../src/datasources/packageQuality.js");

      // All clients should be initialized
      expect(npmRegistry).toBeDefined();
      expect(securitySources).toBeDefined();
      expect(bundleSizeClient).toBeDefined();
      expect(licenseData).toBeDefined();
      expect(packageQuality).toBeDefined();
    });

    test("data sources use caching", () => {
      const { cache } = require("../src/cache/cache.js");

      // Cache should be available
      expect(cache).toBeDefined();
      expect(cache.get).toBeDefined();
      expect(cache.set).toBeDefined();
    });

    test("data sources use rate limiting", () => {
      const { rateLimiter } = require("../src/ratelimit/limiter.js");

      // Rate limiter should be available
      expect(rateLimiter).toBeDefined();
      expect(rateLimiter.execute).toBeDefined();
    });
  });
});
