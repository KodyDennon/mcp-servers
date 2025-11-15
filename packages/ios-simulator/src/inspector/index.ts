import type { SimulatorConfig } from "../config.js";
import { SimulatorManager } from "../simulatorManager.js";
import { InspectorSession } from "./inspectorSession.js";
import {
  WebInspectorProxy,
  type WebInspectorTarget,
} from "./webInspectorProxy.js";

export interface EvaluateOptions {
  targetId: string;
  device?: string;
  expression: string;
  awaitPromise?: boolean;
  returnByValue?: boolean;
}

export interface CaptureScreenshotOptions {
  targetId: string;
  device?: string;
  format?: "png" | "jpeg";
  quality?: number;
}

export class InspectorManager {
  private proxy: WebInspectorProxy | null = null;
  private currentDevice?: string;

  constructor(
    private readonly config: SimulatorConfig,
    private readonly simulatorManager: SimulatorManager,
  ) {}

  private async getProxy(deviceUdid: string) {
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

  async listTargets(deviceQuery?: string) {
    const device = await this.simulatorManager.ensureBooted(deviceQuery);
    const proxy = await this.getProxy(device.udid);
    return proxy.listTargets();
  }

  private async withSession<T>(
    targetId: string,
    deviceQuery: string | undefined,
    initializer: (session: InspectorSession) => Promise<T>,
  ): Promise<T> {
    const device = await this.simulatorManager.ensureBooted(deviceQuery);
    const proxy = await this.getProxy(device.udid);
    const targets = await proxy.listTargets();

    const target = targets.find((item) => item.id === targetId);
    if (!target) {
      throw new Error(`Unable to find inspector target ${targetId}`);
    }

    if (!target.webSocketDebuggerUrl) {
      throw new Error(
        `Target ${targetId} is not debuggable (missing WebSocket endpoint).`,
      );
    }

    const session = new InspectorSession(
      target.webSocketDebuggerUrl,
      this.config.inspectorConnectTimeoutMs,
    );

    try {
      await session.open();
      return await initializer(session);
    } finally {
      session.dispose();
    }
  }

  async evaluateRuntime(options: EvaluateOptions) {
    return this.withSession(
      options.targetId,
      options.device,
      async (session) => {
        await session.send("Runtime.enable");
        const evaluation = await session.send<{
          result?: unknown;
          exceptionDetails?: unknown;
        }>("Runtime.evaluate", {
          expression: options.expression,
          awaitPromise: options.awaitPromise ?? true,
          returnByValue: options.returnByValue ?? true,
        });

        return {
          result: evaluation.result,
          wasThrown: Boolean(evaluation.exceptionDetails),
          exceptionDetails: evaluation.exceptionDetails ?? null,
        };
      },
    );
  }

  async capturePageScreenshot(options: CaptureScreenshotOptions) {
    return this.withSession(
      options.targetId,
      options.device,
      async (session) => {
        await session.send("Page.enable");
        const result = await session.send<{ data: string }>(
          "Page.captureScreenshot",
          {
            format: options.format ?? "png",
            quality: options.quality,
          },
        );
        return result;
      },
    );
  }

  async shutdown() {
    if (this.proxy) {
      await this.proxy.shutdown();
      this.proxy = null;
      this.currentDevice = undefined;
    }
  }
}

export type { WebInspectorTarget };
