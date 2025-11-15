import path from "node:path";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import type { SimulatorConfig } from "./config.js";
import { Simctl, SimulatorDevice } from "./simctl.js";
import { resolveDeviceFromQuery } from "./utils/deviceResolver.js";
import { delay } from "./utils/time.js";

const execFileAsync = promisify(execFile);

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

export class SimulatorManager {
  constructor(
    private readonly config: SimulatorConfig,
    private readonly simctl = new Simctl(),
  ) {}

  async listDevices(includeUnavailable = false) {
    const devices = await this.simctl.listDevices(
      includeUnavailable ? "all" : "available",
    );
    return includeUnavailable
      ? devices
      : devices.filter((device) => device.isAvailable);
  }

  async resolveDevice(query?: string) {
    const devices = await this.listDevices();
    const { device } = resolveDeviceFromQuery(
      devices,
      query,
      this.config.defaultDeviceName,
    );
    return device;
  }

  private async waitForDeviceState(
    udid: string,
    desiredState: string,
  ): Promise<SimulatorDevice> {
    const timeoutAt = Date.now() + this.config.bootTimeoutMs;
    while (Date.now() < timeoutAt) {
      const devices = await this.simctl.listDevices("all");
      const match = devices.find((device) => device.udid === udid);
      if (match && match.state === desiredState) {
        return match;
      }
      await delay(1000);
    }

    throw new Error(
      `Timed out waiting for simulator ${udid} to reach state ${desiredState}`,
    );
  }

  private async ensureSimulatorAppVisible(device: SimulatorDevice) {
    try {
      await execFileAsync("open", [
        "-a",
        "Simulator",
        "--args",
        "-CurrentDeviceUDID",
        device.udid,
      ]);
    } catch (error) {
      console.error("Failed to focus Simulator app:", error);
    }
  }

  async ensureBooted(query?: string) {
    const device = await this.resolveDevice(query);
    if (device.state === "Booted") {
      await this.ensureSimulatorAppVisible(device);
      return device;
    }

    await this.simctl.bootDevice(device.udid);
    const booted = await this.waitForDeviceState(device.udid, "Booted");
    await this.ensureSimulatorAppVisible(booted);
    return booted;
  }

  async shutdown(query?: string) {
    if (query?.trim().toLowerCase() === "booted") {
      await this.simctl.shutdownDevice("booted");
      return { message: "Shut down active simulator" };
    }

    const device = await this.resolveDevice(query);
    await this.simctl.shutdownDevice(device.udid);
    return { device };
  }

  async openUrl(url: string, query?: string): Promise<OpenUrlResult> {
    const device = await this.ensureBooted(query);
    await this.simctl.openUrl(device.udid, url);
    return { device, url };
  }

  async captureScreenshot(
    query?: string,
    format: "png" | "jpg" = "png",
  ): Promise<ScreenshotResult> {
    const device = await this.ensureBooted(query);
    const filename = `simulator-${device.name
      .replace(/\s+/g, "-")
      .toLowerCase()}-${Date.now()}-${randomUUID().slice(0, 8)}.${format}`;
    const filePath = path.join(this.config.screenshotDir, filename);

    await this.simctl.takeScreenshot(device.udid, filePath, format);
    const buffer = await readFile(filePath);

    return {
      device,
      filePath,
      base64: buffer.toString("base64"),
      bytes: buffer.byteLength,
      format,
    };
  }

  async installApp(appPath: string, query?: string) {
    const device = await this.resolveDevice(query);
    await this.simctl.installApp(device.udid, appPath);
    return { device, appPath };
  }

  async uninstallApp(bundleId: string, query?: string) {
    const device = await this.resolveDevice(query);
    await this.simctl.uninstallApp(device.udid, bundleId);
    return { device, bundleId };
  }

  async launchApp(bundleId: string, query?: string, args: string[] = []) {
    const device = await this.ensureBooted(query);
    const output = await this.simctl.launchApp(device.udid, bundleId, args);
    return { device, bundleId, output };
  }

  async terminateApp(bundleId: string, query?: string) {
    const device = await this.resolveDevice(query);
    await this.simctl.terminateApp(device.udid, bundleId);
    return { device, bundleId };
  }
}
