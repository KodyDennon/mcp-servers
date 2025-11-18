import path from "node:path";
import os from "node:os";
import { mkdir } from "node:fs/promises";
import { config as loadEnv } from "dotenv";
import { z } from "zod";
loadEnv();
const numberFromEnv = (value) => {
    if (!value?.trim()) {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};
const ConfigSchema = z.object({
    defaultDeviceName: z
        .string()
        .min(1)
        .default("iPhone 15 Pro")
        .describe("Default simulator device to boot when no explicit device is provided."),
    screenshotDir: z
        .string()
        .default(path.join(os.tmpdir(), "mcp-ios-simulator"))
        .describe("Directory where simulator screenshots are written."),
    bootTimeoutMs: z
        .number()
        .int()
        .positive()
        .default(120_000)
        .describe("How long to wait for a simulator to boot before failing."),
    iosWebkitProxyBinary: z
        .string()
        .min(1)
        .default("ios_webkit_debug_proxy")
        .describe("Binary that exposes the WebKit Remote Debugging Protocol for the simulator."),
    iosWebkitProxyPort: z
        .number()
        .int()
        .positive()
        .default(9221)
        .describe("Local port used by the WebKit debug proxy."),
    inspectorConnectTimeoutMs: z
        .number()
        .int()
        .positive()
        .default(8000)
        .describe("How long to wait for inspector WebSocket connections."),
    inspectorReadyPollIntervalMs: z
        .number()
        .int()
        .positive()
        .default(750)
        .describe("How often to poll the inspector endpoint while waiting for it."),
    webDriverAgentProjectPath: z
        .string()
        .min(1)
        .default(path.join(os.homedir(), "WebDriverAgent"))
        .describe("Path to the checked-out WebDriverAgent project (used for native automation)."),
    webDriverAgentDerivedDataPath: z
        .string()
        .min(1)
        .default(path.join(os.tmpdir(), "mcp-ios-simulator-wda"))
        .describe("DerivedData directory used when building WebDriverAgent."),
    webDriverAgentPort: z
        .number()
        .int()
        .positive()
        .default(8100)
        .describe("Base port used by WebDriverAgent HTTP server."),
    webDriverAgentStartupTimeoutMs: z
        .number()
        .int()
        .positive()
        .default(45_000)
        .describe("Timeout while waiting for WebDriverAgent to boot."),
    webDriverAgentSessionTimeoutMs: z
        .number()
        .int()
        .positive()
        .default(15_000)
        .describe("Timeout used for WebDriverAgent HTTP requests."),
    webDriverAgentDefaultBundleId: z
        .string()
        .min(1)
        .default("com.apple.springboard")
        .describe("Default bundle identifier when creating automation sessions."),
    webDriverAgentScheme: z
        .string()
        .min(1)
        .default("WebDriverAgentRunner")
        .describe("Scheme to build when launching WebDriverAgent."),
});
let cachedConfig = null;
export async function loadConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    const parsed = ConfigSchema.parse({
        defaultDeviceName: process.env.IOS_SIM_DEFAULT_DEVICE || undefined,
        screenshotDir: process.env.IOS_SIM_SCREENSHOT_DIR || undefined,
        bootTimeoutMs: numberFromEnv(process.env.IOS_SIM_BOOT_TIMEOUT_MS),
        iosWebkitProxyBinary: process.env.IOS_WEBKIT_DEBUG_PROXY_BINARY || undefined,
        iosWebkitProxyPort: numberFromEnv(process.env.IOS_WEBKIT_DEBUG_PROXY_PORT),
        inspectorConnectTimeoutMs: numberFromEnv(process.env.IOS_WEBKIT_CONNECT_TIMEOUT_MS),
        inspectorReadyPollIntervalMs: numberFromEnv(process.env.IOS_WEBKIT_READY_INTERVAL_MS),
        webDriverAgentProjectPath: process.env.IOS_WDA_PROJECT_PATH || undefined,
        webDriverAgentDerivedDataPath: process.env.IOS_WDA_DERIVED_DATA || undefined,
        webDriverAgentPort: numberFromEnv(process.env.IOS_WDA_PORT),
        webDriverAgentStartupTimeoutMs: numberFromEnv(process.env.IOS_WDA_STARTUP_TIMEOUT_MS),
        webDriverAgentSessionTimeoutMs: numberFromEnv(process.env.IOS_WDA_SESSION_TIMEOUT_MS),
        webDriverAgentDefaultBundleId: process.env.IOS_WDA_DEFAULT_BUNDLE_ID || undefined,
        webDriverAgentScheme: process.env.IOS_WDA_SCHEME || undefined,
    });
    await mkdir(parsed.screenshotDir, { recursive: true });
    await mkdir(parsed.webDriverAgentDerivedDataPath, { recursive: true });
    cachedConfig = parsed;
    return parsed;
}
export function getConfig() {
    if (!cachedConfig) {
        throw new Error("Configuration has not been loaded yet.");
    }
    return cachedConfig;
}
//# sourceMappingURL=config.js.map