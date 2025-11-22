import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
export class SimctlCommandError extends Error {
  command;
  stdout;
  stderr;
  exitCode;
  constructor(message, command, stdout, stderr, exitCode) {
    super(message);
    this.command = command;
    this.stdout = stdout;
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}
function formatRuntime(runtimeId) {
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
  executable;
  defaultArgs;
  constructor(executable = "xcrun", defaultArgs = ["simctl"]) {
    this.executable = executable;
    this.defaultArgs = defaultArgs;
  }
  async run(
    args,
    options = {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  ) {
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
      const execError = error;
      throw new SimctlCommandError(
        `simctl command failed: ${args.join(" ")}`,
        args,
        execError.stdout?.toString() ?? "",
        execError.stderr?.toString() ?? "",
        typeof execError.code === "number" ? execError.code : null,
      );
    }
  }
  async listDevices(kind = "available") {
    const { stdout } = await this.run(["list", "devices", kind, "--json"]);
    const parsed = JSON.parse(stdout);
    const devices = [];
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
  async bootDevice(udid) {
    await this.run(["boot", udid]);
  }
  async shutdownDevice(udid) {
    await this.run(["shutdown", udid]);
  }
  async openUrl(udid, url) {
    await this.run(["openurl", udid, url]);
  }
  async takeScreenshot(udid, outputPath, format = "png") {
    await this.run(["io", udid, "screenshot", outputPath, "--type=" + format]);
  }
  async recordVideo(udid, outputPath, options = {}) {
    const args = ["io", udid, "recordVideo", outputPath];
    if (options.timeLimit) {
      args.push("--time=" + String(options.timeLimit));
    }
    await this.run(args);
  }
  async installApp(udid, appPath) {
    await this.run(["install", udid, appPath]);
  }
  async uninstallApp(udid, bundleId) {
    await this.run(["uninstall", udid, bundleId]);
  }
  async launchApp(udid, bundleId, args = []) {
    const { stdout } = await this.run(["launch", udid, bundleId, ...args]);
    return stdout.trim();
  }
  async terminateApp(udid, bundleId) {
    await this.run(["terminate", udid, bundleId]);
  }
}
//# sourceMappingURL=simctl.js.map
