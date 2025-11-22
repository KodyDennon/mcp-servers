export declare class WebDriverClient {
    private readonly host;
    private readonly port;
    private readonly timeoutMs;
    constructor(host: string, port: number, timeoutMs: number);
    private get baseUrl();
    private request;
    status(): Promise<{
        status: number;
    }>;
    createSession(bundleId: string): Promise<string>;
    deleteSession(sessionId: string): Promise<void>;
    tap(sessionId: string, options: {
        x: number;
        y: number;
        duration?: number;
    }): Promise<void>;
    swipe(sessionId: string, options: {
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
        duration?: number;
    }): Promise<void>;
    typeText(sessionId: string, text: string): Promise<void>;
    pressButton(sessionId: string, button: string): Promise<void>;
    getPageSource(sessionId: string): Promise<string>;
    launchApp(sessionId: string, bundleId: string, args?: string[]): Promise<void>;
    terminateApp(sessionId: string, bundleId: string): Promise<void>;
}
//# sourceMappingURL=webDriverClient.d.ts.map