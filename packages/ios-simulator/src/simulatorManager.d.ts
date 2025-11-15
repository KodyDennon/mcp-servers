import type { SimulatorConfig } from "./config.js";
import { Simctl, SimulatorDevice } from "./simctl.js";
export interface ScreenshotResult {
  device: SimulatorDevice;
  filePath: string;
  format: "png" | "jpg";
  base64: string;
  bytes: number;
}
export interface OpenUrlResult {
  device: SimulatorDevice;
  url: string;
}
export declare class SimulatorManager {
  private readonly config;
  private readonly simctl;
  constructor(config: SimulatorConfig, simctl?: Simctl);
  listDevices(includeUnavailable?: boolean): Promise<SimulatorDevice[]>;
  resolveDevice(query?: string): Promise<SimulatorDevice>;
  private waitForDeviceState;
  private ensureSimulatorAppVisible;
  ensureBooted(query?: string): Promise<SimulatorDevice>;
  shutdown(query?: string): Promise<
    | {
        message: string;
        device?: undefined;
      }
    | {
        device: SimulatorDevice;
        message?: undefined;
      }
  >;
  openUrl(url: string, query?: string): Promise<OpenUrlResult>;
  captureScreenshot(
    query?: string,
    format?: "png" | "jpg",
  ): Promise<ScreenshotResult>;
  installApp(
    appPath: string,
    query?: string,
  ): Promise<{
    device: SimulatorDevice;
    appPath: string;
  }>;
  uninstallApp(
    bundleId: string,
    query?: string,
  ): Promise<{
    device: SimulatorDevice;
    bundleId: string;
  }>;
  launchApp(
    bundleId: string,
    query?: string,
    args?: string[],
  ): Promise<{
    device: SimulatorDevice;
    bundleId: string;
    output: string;
  }>;
  terminateApp(
    bundleId: string,
    query?: string,
  ): Promise<{
    device: SimulatorDevice;
    bundleId: string;
  }>;
}
//# sourceMappingURL=simulatorManager.d.ts.map
