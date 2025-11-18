import { z } from "zod";
declare const ConfigSchema: any;
export type SimulatorConfig = z.infer<typeof ConfigSchema>;
export declare function loadConfig(): Promise<SimulatorConfig>;
export declare function getConfig(): SimulatorConfig;
export {};
//# sourceMappingURL=config.d.ts.map