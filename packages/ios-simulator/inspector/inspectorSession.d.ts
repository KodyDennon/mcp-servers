export declare class InspectorSession {
  private readonly endpoint;
  private readonly timeoutMs;
  private readonly socket;
  private nextCommandId;
  private readonly pending;
  private openPromise;
  constructor(endpoint: string, timeoutMs: number);
  private handleMessage;
  private failPending;
  open(): Promise<void>;
  send<T>(method: string, params?: Record<string, unknown>): Promise<T>;
  dispose(): void;
}
//# sourceMappingURL=inspectorSession.d.ts.map
