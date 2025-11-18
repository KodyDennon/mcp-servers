import { InspectorSession } from "./inspectorSession.js";
import { WebInspectorProxy, } from "./webInspectorProxy.js";
export class InspectorManager {
    config;
    simulatorManager;
    proxy = null;
    currentDevice;
    constructor(config, simulatorManager) {
        this.config = config;
        this.simulatorManager = simulatorManager;
    }
    async getProxy(deviceUdid) {
        if (!this.proxy || this.currentDevice !== deviceUdid) {
            if (this.proxy) {
                await this.proxy.shutdown();
            }
            this.proxy = new WebInspectorProxy({
                deviceUdid,
                config: this.config,
            });
            this.currentDevice = deviceUdid;
        }
        await this.proxy.ensureStarted();
        return this.proxy;
    }
    async listTargets(deviceQuery) {
        const device = await this.simulatorManager.ensureBooted(deviceQuery);
        const proxy = await this.getProxy(device.udid);
        return proxy.listTargets();
    }
    async withSession(targetId, deviceQuery, initializer) {
        const device = await this.simulatorManager.ensureBooted(deviceQuery);
        const proxy = await this.getProxy(device.udid);
        const targets = await proxy.listTargets();
        const target = targets.find((item) => item.id === targetId);
        if (!target) {
            throw new Error(`Unable to find inspector target ${targetId}`);
        }
        if (!target.webSocketDebuggerUrl) {
            throw new Error(`Target ${targetId} is not debuggable (missing WebSocket endpoint).`);
        }
        const session = new InspectorSession(target.webSocketDebuggerUrl, this.config.inspectorConnectTimeoutMs);
        try {
            await session.open();
            return await initializer(session);
        }
        finally {
            session.dispose();
        }
    }
    async evaluateRuntime(options) {
        return this.withSession(options.targetId, options.device, async (session) => {
            await session.send("Runtime.enable");
            const evaluation = await session.send("Runtime.evaluate", {
                expression: options.expression,
                awaitPromise: options.awaitPromise ?? true,
                returnByValue: options.returnByValue ?? true,
            });
            return {
                result: evaluation.result,
                wasThrown: Boolean(evaluation.exceptionDetails),
                exceptionDetails: evaluation.exceptionDetails ?? null,
            };
        });
    }
    async capturePageScreenshot(options) {
        return this.withSession(options.targetId, options.device, async (session) => {
            await session.send("Page.enable");
            const result = await session.send("Page.captureScreenshot", {
                format: options.format ?? "png",
                quality: options.quality,
            });
            return result;
        });
    }
    async shutdown() {
        if (this.proxy) {
            await this.proxy.shutdown();
            this.proxy = null;
            this.currentDevice = undefined;
        }
    }
}
//# sourceMappingURL=index.js.map