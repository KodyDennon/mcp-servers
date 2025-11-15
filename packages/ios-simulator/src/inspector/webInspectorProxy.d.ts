import type { SimulatorConfig } from "../config.js";
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
export declare class WebInspectorProxy {
  private readonly options;
  private readonly host;
  private process;
  private ready;
  constructor(options: WebInspectorProxyOptions, host?: string);
  private get port();
  private get baseUrl();
  private waitUntilHealthy;
  private spawnProxy;
  ensureStarted(): Promise<void>;
  listTargets(): Promise<WebInspectorTarget[]>;
  shutdown(): Promise<void>;
}
//# sourceMappingURL=webInspectorProxy.d.ts.map
