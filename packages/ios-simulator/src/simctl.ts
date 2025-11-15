import { execFile } from "node:child_process";
import type { ExecFileOptions } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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

interface SimctlDeviceJson {
  availability: string;
  availabilityError?: string | null;
  isAvailable?: boolean;
  name: string;
  state: string;
  udid: string;
  dataPath?: string;
  logPath?: string;
  deviceTypeIdentifier?: string;
  operatingSystemVersion?: string;
  interface?: string;
}

interface SimctlListDevicesResponse {
  devices: Record<string, SimctlDeviceJson[]>;
}

export class SimctlCommandError extends Error {
  constructor(
    message: string,
    public readonly command: string[],
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly exitCode?: number | null,
  ) {
    super(message);
  }
}

function formatRuntime(runtimeId: string) {
  const match = runtimeId.match(/SimRuntime\.([^.]+)\.(.+)/);
  if (!match) {
    return { displayName: runtimeId, platform: undefined, version: undefined };
  }

  const platformTokens = match[1].split("-");
  const versionTokens = match[2].split("-");
  return {
    displayName: `${platformTokens.join(" ")} ${versionTokens.join(".")}`,
    platform: platformTokens.join(" "),
    version: versionTokens.join("."),
  };
}

export class Simctl {
  constructor(
    private readonly executable = "xcrun",
    private readonly defaultArgs: string[] = ["simctl"],
  ) {}

  private async run(
    args: string[],
    options: ExecFileOptions & { encoding?: BufferEncoding } = {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  ): Promise<{ stdout: string; stderr: string }> {
    try {
      const result = await execFileAsync(
        this.executable,
        [...this.defaultArgs, ...args],
        options,
      );
      return {
        stdout: result.stdout?.toString() ?? "",
        stderr: result.stderr?.toString() ?? "",
      };
    } catch (error) {
      const execError = error as NodeJS.ErrnoException & {
        stdout?: string | Buffer;
        stderr?: string | Buffer;
        code?: number;
      };
      throw new SimctlCommandError(
        `simctl command failed: ${args.join(" ")}`,
        args,
        execError.stdout?.toString() ?? "",
        execError.stderr?.toString() ?? "",
        typeof execError.code === "number" ? execError.code : null,
      );
    }
  }

  async listDevices(kind: "available" | "all" = "available") {
    const { stdout } = await this.run(["list", "devices", kind, "--json"]);
    const parsed = JSON.parse(stdout) as SimctlListDevicesResponse;
    const devices: SimulatorDevice[] = [];

    for (const [runtimeIdentifier, deviceList] of Object.entries(
      parsed.devices ?? {},
    )) {
      const runtimeInfo = formatRuntime(runtimeIdentifier);
      for (const device of deviceList) {
        devices.push({
          udid: device.udid,
          name: device.name,
          runtimeIdentifier,
          runtimeDisplayName: runtimeInfo.displayName,
          platform: runtimeInfo.platform,
          osVersion: runtimeInfo.version ?? device.operatingSystemVersion,
          state: device.state,
          isAvailable:
            device.isAvailable ?? device.availability === "(available)",
          deviceTypeIdentifier: device.deviceTypeIdentifier,
          availabilityError: device.availabilityError,
        });
      }
    }

    return devices;
  }

  async bootDevice(udid: string) {
    await this.run(["boot", udid]);
  }

  async shutdownDevice(udid: string | "booted") {
    await this.run(["shutdown", udid]);
  }

  async openUrl(udid: string | "booted", url: string) {
    await this.run(["openurl", udid, url]);
  }

  async takeScreenshot(
    udid: string | "booted",
    outputPath: string,
    format: "png" | "jpg" = "png",
  ) {
    await this.run(["io", udid, "screenshot", outputPath, "--type=" + format]);
  }

  async recordVideo(
    udid: string | "booted",
    outputPath: string,
    options: { timeLimit?: number } = {},
  ) {
    const args = ["io", udid, "recordVideo", outputPath];
    if (options.timeLimit) {
      args.push("--time=" + String(options.timeLimit));
    }
    await this.run(args);
  }

  async installApp(udid: string, appPath: string) {
    await this.run(["install", udid, appPath]);
  }

  async uninstallApp(udid: string, bundleId: string) {
    await this.run(["uninstall", udid, bundleId]);
  }

  async launchApp(udid: string, bundleId: string, args: string[] = []) {
    const { stdout } = await this.run(["launch", udid, bundleId, ...args]);
    return stdout.trim();
  }

  async terminateApp(udid: string, bundleId: string) {
    await this.run(["terminate", udid, bundleId]);
  }
}
