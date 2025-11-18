/**
 * WebSocket Transport
 * Enables WebSocket transport for real-time bidirectional MCP communication
 */
import { WebSocketServer } from "ws";
import http from "http";
import { MCPError } from "../utils/errorHandler.js";
/**
 * WebSocket Transport
 * Provides real-time bidirectional communication for MCP
 */
export class WebSocketTransport {
    constructor(options = {}) {
        this.port = options.port || 3001;
        this.host = options.host || "localhost";
        this.server = null;
        this.wss = null;
        this.clients = new Map();
        this.heartbeatInterval = options.heartbeatInterval || 30000;
        this.heartbeatTimer = null;
    }
    /**
     * Start WebSocket server
     */
    async start(mcpServer) {
        return new Promise((resolve, reject) => {
            // Create HTTP server for WebSocket upgrade
            this.server = http.createServer((req, res) => {
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end("WebSocket MCP Server");
            });
            // Create WebSocket server
            this.wss = new WebSocketServer({ server: this.server });
            this.wss.on("connection", (ws, req) => {
                this.handleConnection(ws, req, mcpServer);
            });
            this.wss.on("error", (error) => {
                console.error("WebSocket server error:", error);
            });
            this.server.on("error", (error) => {
                reject(error);
            });
            this.server.listen(this.port, this.host, () => {
                console.error(`🔌 WebSocket transport listening on ws://${this.host}:${this.port}`);
                this.startHeartbeat();
                resolve();
            });
        });
    }
    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws, req, mcpServer) {
        const clientId = Math.random().toString(36).substring(7);
        console.error(`WebSocket client connected: ${clientId}`);
        // Store client
        this.clients.set(clientId, {
            ws: ws,
            isAlive: true,
            connectedAt: new Date(),
        });
        // Send welcome message
        ws.send(JSON.stringify({
            type: "connected",
            clientId: clientId,
            server: {
                name: mcpServer.serverInfo?.name || "supabase-db",
                version: mcpServer.serverInfo?.version || "unknown",
            },
        }));
        // Handle messages
        ws.on("message", async (data) => {
            await this.handleMessage(clientId, data, mcpServer);
        });
        // Handle pong (heartbeat response)
        ws.on("pong", () => {
            const client = this.clients.get(clientId);
            if (client) {
                client.isAlive = true;
            }
        });
        // Handle close
        ws.on("close", () => {
            console.error(`WebSocket client disconnected: ${clientId}`);
            this.clients.delete(clientId);
        });
        // Handle error
        ws.on("error", (error) => {
            console.error(`WebSocket client error (${clientId}):`, error);
            this.clients.delete(clientId);
        });
    }
    /**
     * Handle incoming message
     */
    async handleMessage(clientId, data, mcpServer) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case "list_tools":
                    await this.handleListTools(client, message, mcpServer);
                    break;
                case "call_tool":
                    await this.handleCallTool(client, message, mcpServer);
                    break;
                case "ping":
                    this.handlePing(client, message);
                    break;
                case "subscribe":
                    await this.handleSubscribe(client, message, mcpServer);
                    break;
                default:
                    this.sendError(client, message.id, `Unknown message type: ${message.type}`);
            }
        }
        catch (error) {
            this.sendError(client, null, `Failed to parse message: ${error.message}`);
        }
    }
    /**
     * Handle list tools request
     */
    async handleListTools(client, message, mcpServer) {
        try {
            const tools = await mcpServer.listTools();
            client.ws.send(JSON.stringify({
                type: "tools_list",
                id: message.id,
                tools: tools,
            }));
        }
        catch (error) {
            this.sendError(client, message.id, error.message);
        }
    }
    /**
     * Handle call tool request
     */
    async handleCallTool(client, message, mcpServer) {
        try {
            const { tool, arguments: args } = message;
            if (!tool) {
                this.sendError(client, message.id, "Tool name required");
                return;
            }
            const result = await mcpServer.callTool(tool, args || {});
            client.ws.send(JSON.stringify({
                type: "tool_result",
                id: message.id,
                tool: tool,
                result: result,
            }));
            // Broadcast to other clients
            this.broadcast({
                type: "tool_called",
                tool: tool,
                clientId: message.clientId,
                timestamp: new Date().toISOString(),
            }, client.ws);
        }
        catch (error) {
            this.sendError(client, message.id, error.message);
        }
    }
    /**
     * Handle ping request
     */
    handlePing(client, message) {
        client.ws.send(JSON.stringify({
            type: "pong",
            id: message.id,
            timestamp: new Date().toISOString(),
        }));
    }
    /**
     * Handle subscribe request (for real-time updates)
     */
    async handleSubscribe(client, message, mcpServer) {
        const { event } = message;
        if (!event) {
            this.sendError(client, message.id, "Event name required");
            return;
        }
        // Mark client as subscribed to event
        if (!client.subscriptions) {
            client.subscriptions = new Set();
        }
        client.subscriptions.add(event);
        client.ws.send(JSON.stringify({
            type: "subscribed",
            id: message.id,
            event: event,
        }));
    }
    /**
     * Send error to client
     */
    sendError(client, messageId, error) {
        client.ws.send(JSON.stringify({
            type: "error",
            id: messageId,
            error: error,
        }));
    }
    /**
     * Broadcast message to all clients (except sender)
     */
    broadcast(message, excludeWs = null) {
        const data = JSON.stringify(message);
        for (const [clientId, client] of this.clients.entries()) {
            if (client.ws !== excludeWs && client.ws.readyState === 1) {
                // Check if client is subscribed to this event
                if (message.type && client.subscriptions?.has(message.type)) {
                    client.ws.send(data);
                }
                else if (!message.type) {
                    // Broadcast to all if no specific event type
                    client.ws.send(data);
                }
            }
        }
    }
    /**
     * Start heartbeat to detect dead connections
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            for (const [clientId, client] of this.clients.entries()) {
                if (!client.isAlive) {
                    console.error(`WebSocket client timeout: ${clientId}`);
                    client.ws.terminate();
                    this.clients.delete(clientId);
                    continue;
                }
                client.isAlive = false;
                client.ws.ping();
            }
        }, this.heartbeatInterval);
    }
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    /**
     * Get connection statistics
     */
    getStats() {
        return {
            totalConnections: this.clients.size,
            clients: Array.from(this.clients.entries()).map(([id, client]) => ({
                id: id,
                connectedAt: client.connectedAt,
                isAlive: client.isAlive,
                subscriptions: client.subscriptions
                    ? Array.from(client.subscriptions)
                    : [],
            })),
        };
    }
    /**
     * Stop WebSocket server
     */
    async stop() {
        this.stopHeartbeat();
        return new Promise((resolve) => {
            // Close all client connections
            for (const [clientId, client] of this.clients.entries()) {
                client.ws.close(1000, "Server shutting down");
            }
            this.clients.clear();
            if (this.wss) {
                this.wss.close(() => {
                    if (this.server) {
                        this.server.close(() => {
                            console.error("🔌 WebSocket transport stopped");
                            resolve();
                        });
                    }
                    else {
                        resolve();
                    }
                });
            }
            else {
                resolve();
            }
        });
    }
}
//# sourceMappingURL=websocketTransport.js.map