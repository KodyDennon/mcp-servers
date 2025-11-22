import { z } from "zod";
declare const ConfigSchema: z.ZodObject<
  {
    defaultDeviceName: z.ZodDefault<z.ZodString>;
    screenshotDir: z.ZodDefault<z.ZodString>;
    bootTimeoutMs: z.ZodDefault<z.ZodNumber>;
    iosWebkitProxyBinary: z.ZodDefault<z.ZodString>;
    iosWebkitProxyPort: z.ZodDefault<z.ZodNumber>;
    inspectorConnectTimeoutMs: z.ZodDefault<z.ZodNumber>;
    inspectorReadyPollIntervalMs: z.ZodDefault<z.ZodNumber>;
    webDriverAgentProjectPath: z.ZodDefault<z.ZodString>;
    webDriverAgentDerivedDataPath: z.ZodDefault<z.ZodString>;
    webDriverAgentPort: z.ZodDefault<z.ZodNumber>;
    webDriverAgentStartupTimeoutMs: z.ZodDefault<z.ZodNumber>;
    webDriverAgentSessionTimeoutMs: z.ZodDefault<z.ZodNumber>;
    webDriverAgentDefaultBundleId: z.ZodDefault<z.ZodString>;
    webDriverAgentScheme: z.ZodDefault<z.ZodString>;
  },
  z.core.$strip
>;
export type SimulatorConfig = z.infer<typeof ConfigSchema>;
export declare function loadConfig(): Promise<SimulatorConfig>;
export declare function getConfig(): SimulatorConfig;
export {};
//# sourceMappingURL=config.d.ts.map
