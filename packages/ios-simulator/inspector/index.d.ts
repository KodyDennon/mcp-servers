import type { SimulatorConfig } from "../config.js";
import { SimulatorManager } from "../simulatorManager.js";
import { type WebInspectorTarget } from "./webInspectorProxy.js";
export interface EvaluateOptions {
  targetId: string;
  device?: string;
  expression: string;
  awaitPromise?: boolean;
  returnByValue?: boolean;
}
export interface CaptureScreenshotOptions {
  targetId: string;
  device?: string;
  format?: "png" | "jpeg";
  quality?: number;
}
export declare class InspectorManager {
  private readonly config;
  private readonly simulatorManager;
  private proxy;
  private currentDevice?;
  constructor(config: SimulatorConfig, simulatorManager: SimulatorManager);
  private getProxy;
  listTargets(deviceQuery?: string): Promise<WebInspectorTarget[]>;
  private withSession;
  evaluateRuntime(options: EvaluateOptions): Promise<{
    result: unknown;
    wasThrown: boolean;
    exceptionDetails: {} | null;
  }>;
  capturePageScreenshot(options: CaptureScreenshotOptions): Promise<{
    data: string;
  }>;
  shutdown(): Promise<void>;
}
export type { WebInspectorTarget };
//# sourceMappingURL=index.d.ts.map
