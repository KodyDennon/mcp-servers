import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { once } from "node:events";
import type { SimulatorConfig } from "../config.js";
import { delay } from "../utils/time.js";

export interface WebInspectorTarget {
  id: string;
  title: string;
  url: string;
  webSocketDebuggerUrl?: string;
  deviceId?: string;
  type?: string;
  isPaired?: boolean;
  appId?: string;
}

export interface WebInspectorProxyOptions {
  deviceUdid: string;
  config: SimulatorConfig;
}

export class WebInspectorProxy {
  private process: ChildProcessWithoutNullStreams | null = null;
  private ready = false;

  constructor(
    private readonly options: WebInspectorProxyOptions,
    private readonly host = "127.0.0.1",
  ) {}

  private get port() {
    return this.options.config.iosWebkitProxyPort;
  }

  private get baseUrl() {
    return `http://${this.host}:${this.port}`;
  }

  private async waitUntilHealthy() {
    const timeoutAt =
      Date.now() + this.options.config.inspectorConnectTimeoutMs;
    while (Date.now() < timeoutAt) {
      try {
        const response = await fetch(`${this.baseUrl}/json`);
        if (response.ok) {
          this.ready = true;
          return;
        }
      } catch {
        // Swallow until we hit timeout.
      }

      await delay(this.options.config.inspectorReadyPollIntervalMs);
    }

    throw new Error(
      `WebKit inspector proxy did not become ready on port ${this.port}`,
    );
  }

  private async spawnProxy() {
    if (this.process) {
      return;
    }

    const args = ["-c", `${this.options.deviceUdid}:${this.port}`, "-d", "-F"];

    this.process = spawn(this.options.config.iosWebkitProxyBinary, args, {
      stdio: "pipe",
    });

    this.process.stdout.setEncoding("utf8");
    this.process.stderr.setEncoding("utf8");

    this.process.stdout.on("data", (chunk) => {
      console.error(`[webkit-proxy] ${chunk.toString().trimEnd()}`);
    });
    this.process.stderr.on("data", (chunk) => {
      console.error(`[webkit-proxy] ${chunk.toString().trimEnd()}`);
    });

    this.process.on("exit", (code, signal) => {
      console.error(
        `WebKit proxy exited with code ${code ?? "unknown"} signal ${signal ?? "unknown"}`,
      );
      this.process = null;
      this.ready = false;
    });

    await once(this.process, "spawn");
    await this.waitUntilHealthy();
  }

  async ensureStarted() {
    if (this.ready && this.process) {
      return;
    }

    await this.spawnProxy();
  }

  async listTargets(): Promise<WebInspectorTarget[]> {
    await this.ensureStarted();
    const response = await fetch(`${this.baseUrl}/json`);
    if (!response.ok) {
      throw new Error(
        `Failed to read WebKit inspector targets: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as WebInspectorTarget[];
  }

  async shutdown() {
    if (this.process && !this.process.killed) {
      this.process.kill();
    }
    this.process = null;
    this.ready = false;
  }
}
