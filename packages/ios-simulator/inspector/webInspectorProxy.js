import { spawn } from "node:child_process";
import { once } from "node:events";
import { delay } from "../utils/time.js";
export class WebInspectorProxy {
  options;
  host;
  process = null;
  ready = false;
  constructor(options, host = "127.0.0.1") {
    this.options = options;
    this.host = host;
  }
  get port() {
    return this.options.config.iosWebkitProxyPort;
  }
  get baseUrl() {
    return `http://${this.host}:${this.port}`;
  }
  async waitUntilHealthy() {
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
  async spawnProxy() {
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
  async listTargets() {
    await this.ensureStarted();
    const response = await fetch(`${this.baseUrl}/json`);
    if (!response.ok) {
      throw new Error(
        `Failed to read WebKit inspector targets: ${response.status} ${response.statusText}`,
      );
    }
    return await response.json();
  }
  async shutdown() {
    if (this.process && !this.process.killed) {
      this.process.kill();
    }
    this.process = null;
    this.ready = false;
  }
}
//# sourceMappingURL=webInspectorProxy.js.map
