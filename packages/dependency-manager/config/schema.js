import { z } from "zod";
/**
 * Configuration schema using Zod
 */
export const CacheConfigSchema = z.object({
  enabled: z.boolean().default(true),
  ttl: z.number().min(0).default(3600000), // 1 hour in ms
  maxSize: z.number().min(0).default(100), // Max items in memory cache
  directory: z.string().optional(),
  redis: z
    .object({
      url: z.string().optional(),
      enabled: z.boolean().default(false),
    })
    .optional(),
});
export const RateLimitConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxConcurrent: z.number().min(1).default(5),
  minTime: z.number().min(0).default(200), // Min time between requests in ms
  maxRetries: z.number().min(0).default(3),
  reservoir: z.number().min(0).default(50), // Token bucket reservoir
  reservoirRefreshAmount: z.number().min(0).default(50),
  reservoirRefreshInterval: z.number().min(0).default(60000), // 1 minute
});
export const SecurityConfigSchema = z.object({
  auditLevel: z
    .enum(["low", "moderate", "high", "critical"])
    .default("moderate"),
  autoFix: z.boolean().default(false),
  ignoreDevDependencies: z.boolean().default(false),
});
export const LicenseConfigSchema = z.object({
  allowlist: z
    .array(z.string())
    .default(["MIT", "Apache-2.0", "BSD-3-Clause", "ISC"]),
  blocklist: z.array(z.string()).default(["GPL-3.0", "AGPL-3.0"]),
  warnOnUnknown: z.boolean().default(true),
});
export const UpdateConfigSchema = z.object({
  autoUpdatePatch: z.boolean().default(false),
  autoUpdateMinor: z.boolean().default(false),
  groupUpdates: z.boolean().default(true),
  maxUpdatesPerRun: z.number().min(0).default(10),
});
export const ConfigSchema = z.object({
  // General settings
  logLevel: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
  offline: z.boolean().default(false),
  // Cache settings
  cache: CacheConfigSchema.default({}),
  // Rate limiting settings
  rateLimit: RateLimitConfigSchema.default({}),
  // Security settings
  security: SecurityConfigSchema.default({}),
  // License settings
  license: LicenseConfigSchema.default({}),
  // Update settings
  update: UpdateConfigSchema.default({}),
  // npm settings
  npm: z
    .object({
      registry: z.string().url().default("https://registry.npmjs.org"),
      token: z.string().optional(),
    })
    .default({}),
});
//# sourceMappingURL=schema.js.map
