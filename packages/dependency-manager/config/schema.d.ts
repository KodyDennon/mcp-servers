import { z } from "zod";
/**
 * Configuration schema using Zod
 */
export declare const CacheConfigSchema: z.ZodObject<
  {
    enabled: z.ZodDefault<z.ZodBoolean>;
    ttl: z.ZodDefault<z.ZodNumber>;
    maxSize: z.ZodDefault<z.ZodNumber>;
    directory: z.ZodOptional<z.ZodString>;
    redis: z.ZodOptional<
      z.ZodObject<
        {
          url: z.ZodOptional<z.ZodString>;
          enabled: z.ZodDefault<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
export declare const RateLimitConfigSchema: z.ZodObject<
  {
    enabled: z.ZodDefault<z.ZodBoolean>;
    maxConcurrent: z.ZodDefault<z.ZodNumber>;
    minTime: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
    reservoir: z.ZodDefault<z.ZodNumber>;
    reservoirRefreshAmount: z.ZodDefault<z.ZodNumber>;
    reservoirRefreshInterval: z.ZodDefault<z.ZodNumber>;
  },
  z.core.$strip
>;
export declare const SecurityConfigSchema: z.ZodObject<
  {
    auditLevel: z.ZodDefault<
      z.ZodEnum<{
        low: "low";
        moderate: "moderate";
        high: "high";
        critical: "critical";
      }>
    >;
    autoFix: z.ZodDefault<z.ZodBoolean>;
    ignoreDevDependencies: z.ZodDefault<z.ZodBoolean>;
  },
  z.core.$strip
>;
export declare const LicenseConfigSchema: z.ZodObject<
  {
    allowlist: z.ZodDefault<z.ZodArray<z.ZodString>>;
    blocklist: z.ZodDefault<z.ZodArray<z.ZodString>>;
    warnOnUnknown: z.ZodDefault<z.ZodBoolean>;
  },
  z.core.$strip
>;
export declare const UpdateConfigSchema: z.ZodObject<
  {
    autoUpdatePatch: z.ZodDefault<z.ZodBoolean>;
    autoUpdateMinor: z.ZodDefault<z.ZodBoolean>;
    groupUpdates: z.ZodDefault<z.ZodBoolean>;
    maxUpdatesPerRun: z.ZodDefault<z.ZodNumber>;
  },
  z.core.$strip
>;
export declare const ConfigSchema: z.ZodObject<
  {
    logLevel: z.ZodDefault<
      z.ZodEnum<{
        error: "error";
        warn: "warn";
        info: "info";
        debug: "debug";
        trace: "trace";
      }>
    >;
    offline: z.ZodDefault<z.ZodBoolean>;
    cache: z.ZodDefault<
      z.ZodObject<
        {
          enabled: z.ZodDefault<z.ZodBoolean>;
          ttl: z.ZodDefault<z.ZodNumber>;
          maxSize: z.ZodDefault<z.ZodNumber>;
          directory: z.ZodOptional<z.ZodString>;
          redis: z.ZodOptional<
            z.ZodObject<
              {
                url: z.ZodOptional<z.ZodString>;
                enabled: z.ZodDefault<z.ZodBoolean>;
              },
              z.core.$strip
            >
          >;
        },
        z.core.$strip
      >
    >;
    rateLimit: z.ZodDefault<
      z.ZodObject<
        {
          enabled: z.ZodDefault<z.ZodBoolean>;
          maxConcurrent: z.ZodDefault<z.ZodNumber>;
          minTime: z.ZodDefault<z.ZodNumber>;
          maxRetries: z.ZodDefault<z.ZodNumber>;
          reservoir: z.ZodDefault<z.ZodNumber>;
          reservoirRefreshAmount: z.ZodDefault<z.ZodNumber>;
          reservoirRefreshInterval: z.ZodDefault<z.ZodNumber>;
        },
        z.core.$strip
      >
    >;
    security: z.ZodDefault<
      z.ZodObject<
        {
          auditLevel: z.ZodDefault<
            z.ZodEnum<{
              low: "low";
              moderate: "moderate";
              high: "high";
              critical: "critical";
            }>
          >;
          autoFix: z.ZodDefault<z.ZodBoolean>;
          ignoreDevDependencies: z.ZodDefault<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    license: z.ZodDefault<
      z.ZodObject<
        {
          allowlist: z.ZodDefault<z.ZodArray<z.ZodString>>;
          blocklist: z.ZodDefault<z.ZodArray<z.ZodString>>;
          warnOnUnknown: z.ZodDefault<z.ZodBoolean>;
        },
        z.core.$strip
      >
    >;
    update: z.ZodDefault<
      z.ZodObject<
        {
          autoUpdatePatch: z.ZodDefault<z.ZodBoolean>;
          autoUpdateMinor: z.ZodDefault<z.ZodBoolean>;
          groupUpdates: z.ZodDefault<z.ZodBoolean>;
          maxUpdatesPerRun: z.ZodDefault<z.ZodNumber>;
        },
        z.core.$strip
      >
    >;
    npm: z.ZodDefault<
      z.ZodObject<
        {
          registry: z.ZodDefault<z.ZodString>;
          token: z.ZodOptional<z.ZodString>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
export type Config = z.infer<typeof ConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type LicenseConfig = z.infer<typeof LicenseConfigSchema>;
export type UpdateConfig = z.infer<typeof UpdateConfigSchema>;
//# sourceMappingURL=schema.d.ts.map
