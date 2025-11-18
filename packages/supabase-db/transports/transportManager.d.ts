/**
 * Parse transport configuration from environment
 */
export function parseTransportConfig(): {
    enabledTransports: string[];
    httpPort: number;
    wsPort: number;
    host: string;
};
/**
 * Transport Manager
 * Coordinates multiple transport protocols
 */
export class TransportManager {
    constructor(options?: {});
    transports: Map<any, any>;
    server: any;
    enabledTransports: any;
    httpPort: any;
    wsPort: any;
    host: any;
    /**
     * Initialize and start all configured transports
     */
    start(mcpServer: any): Promise<void>;
    /**
     * Start individual transport
     */
    startTransport(type: any, mcpServer: any): Promise<void>;
    /**
     * Start stdio transport
     */
    startStdioTransport(mcpServer: any): Promise<void>;
    /**
     * Start HTTP/SSE transport
     */
    startHttpTransport(mcpServer: any): Promise<void>;
    /**
     * Start WebSocket transport
     */
    startWebSocketTransport(mcpServer: any): Promise<void>;
    /**
     * Get transport by type
     */
    getTransport(type: any): any;
    /**
     * Get all active transports
     */
    getActiveTransports(): any[];
    /**
     * Get transport statistics
     */
    getStats(): {};
    /**
     * Broadcast message to all transports
     */
    broadcast(message: any): void;
    /**
     * Stop all transports
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=transportManager.d.ts.map