export interface SimulatorDevice {
  udid: string;
  name: string;
  runtimeIdentifier: string;
  runtimeDisplayName: string;
  platform?: string;
  osVersion?: string;
  state: string;
  isAvailable: boolean;
  deviceTypeIdentifier?: string;
  availabilityError?: string | null;
}
export declare class SimctlCommandError extends Error {
  readonly command: string[];
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode?: number | null | undefined;
  constructor(
    message: string,
    command: string[],
    stdout: string,
    stderr: string,
    exitCode?: number | null | undefined,
  );
}
export declare class Simctl {
  private readonly executable;
  private readonly defaultArgs;
  constructor(executable?: string, defaultArgs?: string[]);
  private run;
  listDevices(kind?: "available" | "all"): Promise<SimulatorDevice[]>;
  bootDevice(udid: string): Promise<void>;
  shutdownDevice(udid: string | "booted"): Promise<void>;
  openUrl(udid: string | "booted", url: string): Promise<void>;
  takeScreenshot(
    udid: string | "booted",
    outputPath: string,
    format?: "png" | "jpg",
  ): Promise<void>;
  recordVideo(
    udid: string | "booted",
    outputPath: string,
    options?: {
      timeLimit?: number;
    },
  ): Promise<void>;
  installApp(udid: string, appPath: string): Promise<void>;
  uninstallApp(udid: string, bundleId: string): Promise<void>;
  launchApp(udid: string, bundleId: string, args?: string[]): Promise<string>;
  terminateApp(udid: string, bundleId: string): Promise<void>;
}
//# sourceMappingURL=simctl.d.ts.map
