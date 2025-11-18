/**
 * WebSocket Transport
 * Provides real-time bidirectional communication for MCP
 */
export class WebSocketTransport {
    constructor(options?: {});
    port: any;
    host: any;
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> | null;
    wss: import("ws").Server<typeof import("ws"), typeof http.IncomingMessage> | null;
    clients: Map<any, any>;
    heartbeatInterval: any;
    heartbeatTimer: NodeJS.Timeout | null;
    /**
     * Start WebSocket server
     */
    start(mcpServer: any): Promise<any>;
    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws: any, req: any, mcpServer: any): void;
    /**
     * Handle incoming message
     */
    handleMessage(clientId: any, data: any, mcpServer: any): Promise<void>;
    /**
     * Handle list tools request
     */
    handleListTools(client: any, message: any, mcpServer: any): Promise<void>;
    /**
     * Handle call tool request
     */
    handleCallTool(client: any, message: any, mcpServer: any, ...args: any[]): Promise<void>;
    /**
     * Handle ping request
     */
    handlePing(client: any, message: any): void;
    /**
     * Handle subscribe request (for real-time updates)
     */
    handleSubscribe(client: any, message: any, mcpServer: any): Promise<void>;
    /**
     * Send error to client
     */
    sendError(client: any, messageId: any, error: any): void;
    /**
     * Broadcast message to all clients (except sender)
     */
    broadcast(message: any, excludeWs?: null): void;
    /**
     * Start heartbeat to detect dead connections
     */
    startHeartbeat(): void;
    /**
     * Stop heartbeat
     */
    stopHeartbeat(): void;
    /**
     * Get connection statistics
     */
    getStats(): {
        totalConnections: number;
        clients: {
            id: any;
            connectedAt: any;
            isAlive: any;
            subscriptions: any[];
        }[];
    };
    /**
     * Stop WebSocket server
     */
    stop(): Promise<any>;
}
import http from "http";
//# sourceMappingURL=websocketTransport.d.ts.map