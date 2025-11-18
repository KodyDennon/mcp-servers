/**
 * HTTP/SSE Transport
 * Provides REST API and Server-Sent Events for MCP communication
 */
export class HttpTransport {
    constructor(options?: {});
    port: any;
    host: any;
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null;
    clients: Map<any, any>;
    requestHandlers: Map<any, any>;
    allowCors: boolean;
    apiPrefix: any;
    /**
     * Start HTTP server
     */
    start(mcpServer: any): Promise<any>;
    /**
     * Handle incoming HTTP request
     */
    handleRequest(req: any, res: any, mcpServer: any): Promise<void>;
    /**
     * Health check endpoint
     */
    handleHealth(req: any, res: any): void;
    /**
     * Server info endpoint
     */
    handleInfo(req: any, res: any, mcpServer: any): void;
    /**
     * List tools endpoint
     */
    handleListTools(req: any, res: any, mcpServer: any): Promise<void>;
    /**
     * Call tool endpoint
     */
    handleCallTool(req: any, res: any, mcpServer: any): Promise<void>;
    /**
     * Server-Sent Events endpoint
     */
    handleSSE(req: any, res: any): void;
    /**
     * Broadcast event to all SSE clients
     */
    broadcast(event: any): void;
    /**
     * Stop HTTP server
     */
    stop(): Promise<any>;
}
import http from "http";
//# sourceMappingURL=httpTransport.d.ts.map