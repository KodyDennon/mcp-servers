import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access } from "node:fs/promises";
import { WebDriverClient } from "./webDriverClient.js";
import { delay } from "../utils/time.js";
export class AutomationManager {
    config;
    simulatorManager;
    contexts = new Map();
    constructor(config, simulatorManager) {
        this.config = config;
        this.simulatorManager = simulatorManager;
    }
    getProjectFile() {
        return path.join(this.config.webDriverAgentProjectPath, "WebDriverAgent.xcodeproj");
    }
    async waitForStatus(client) {
        const timeoutAt = Date.now() + this.config.webDriverAgentStartupTimeoutMs;
        while (Date.now() < timeoutAt) {
            try {
                await client.status();
                return;
            }
            catch {
                await delay(1000);
            }
        }
        throw new Error("Timed out waiting for WebDriverAgent to become available.");
    }
    async ensureAgent(device) {
        const existing = this.contexts.get(device.udid);
        if (existing && existing.process.exitCode === null) {
            return existing;
        }
        const port = existing?.port ?? this.config.webDriverAgentPort + this.contexts.size;
        const projectFile = this.getProjectFile();
        await access(projectFile).catch(() => {
            throw new Error(`WebDriverAgent.xcodeproj was not found at ${projectFile}. Set IOS_WDA_PROJECT_PATH to your WebDriverAgent checkout.`);
        });
        const args = [
            "-project",
            projectFile,
            "-scheme",
            this.config.webDriverAgentScheme,
            "-destination",
            `id=${device.udid}`,
            "-derivedDataPath",
            this.config.webDriverAgentDerivedDataPath,
            "test",
        ];
        const child = spawn("xcodebuild", args, {
            env: {
                ...process.env,
                USE_PORT: String(port),
            },
            stdio: "pipe",
        });
        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");
        child.stdout.on("data", (chunk) => console.error(`[wda:${device.name}] ${chunk.toString().trimEnd()}`));
        child.stderr.on("data", (chunk) => console.error(`[wda:${device.name}:err] ${chunk.toString().trimEnd()}`));
        child.on("exit", (code, signal) => {
            console.error(`WebDriverAgent exited for ${device.name} (code=${code ?? "unknown"} signal=${signal ?? "unknown"})`);
            this.contexts.delete(device.udid);
        });
        await once(child, "spawn");
        const client = new WebDriverClient("127.0.0.1", port, this.config.webDriverAgentSessionTimeoutMs);
        await this.waitForStatus(client);
        const context = {
            device,
            port,
            process: child,
            client,
        };
        this.contexts.set(device.udid, context);
        return context;
    }
    async ensureSession(device, bundleId) {
        const context = await this.ensureAgent(device);
        const desiredBundle = bundleId ?? this.config.webDriverAgentDefaultBundleId;
        if (context.session && context.session.bundleId === desiredBundle) {
            return context;
        }
        if (context.session) {
            await context.client.deleteSession(context.session.id).catch(() => { });
        }
        const sessionId = await context.client.createSession(desiredBundle);
        context.session = { id: sessionId, bundleId: desiredBundle };
        return context;
    }
    formatResult(device) {
        return {
            name: device.name,
            udid: device.udid,
            runtime: device.runtimeDisplayName,
            state: device.state,
        };
    }
    async tap(options) {
        const device = await this.simulatorManager.ensureBooted(options.device);
        const context = await this.ensureSession(device, options.bundleId);
        await context.client.tap(context.session.id, {
            x: options.x,
            y: options.y,
            duration: options.durationMs ? options.durationMs / 1000 : 0,
        });
        return { device: this.formatResult(device) };
    }
    async swipe(options) {
        const device = await this.simulatorManager.ensureBooted(options.device);
        const context = await this.ensureSession(device, options.bundleId);
        await context.client.swipe(context.session.id, {
            fromX: options.fromX,
            fromY: options.fromY,
            toX: options.toX,
            toY: options.toY,
            duration: options.durationMs ? options.durationMs / 1000 : 0.25,
        });
        return { device: this.formatResult(device) };
    }
    async typeText(options) {
        const device = await this.simulatorManager.ensureBooted(options.device);
        const context = await this.ensureSession(device, options.bundleId);
        await context.client.typeText(context.session.id, options.text);
        return { device: this.formatResult(device) };
    }
    async pressButton(options) {
        const device = await this.simulatorManager.ensureBooted(options.device);
        const context = await this.ensureSession(device, options.bundleId);
        await context.client.pressButton(context.session.id, options.button);
        return { device: this.formatResult(device) };
    }
    async getHierarchy(options) {
        const device = await this.simulatorManager.ensureBooted(options.device);
        const context = await this.ensureSession(device, options.bundleId);
        const source = await context.client.getPageSource(context.session.id);
        return {
            device: this.formatResult(device),
            hierarchy: source,
        };
    }
    async launchViaWebDriver(bundleId, deviceQuery, args = []) {
        const device = await this.simulatorManager.ensureBooted(deviceQuery);
        const context = await this.ensureSession(device);
        await context.client.launchApp(context.session.id, bundleId, args);
        return { device: this.formatResult(device) };
    }
    async terminateViaWebDriver(bundleId, deviceQuery) {
        const device = await this.simulatorManager.ensureBooted(deviceQuery);
        const context = await this.ensureSession(device);
        await context.client.terminateApp(context.session.id, bundleId);
        return { device: this.formatResult(device) };
    }
    async shutdown() {
        for (const context of this.contexts.values()) {
            try {
                if (context.session) {
                    await context.client.deleteSession(context.session.id);
                }
            }
            catch {
                // Ignore
            }
            context.process.kill();
        }
        this.contexts.clear();
    }
}
//# sourceMappingURL=automationManager.js.map