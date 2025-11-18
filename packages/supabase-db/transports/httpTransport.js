/**
 * HTTP/SSE Transport
 * Enables HTTP and Server-Sent Events transport for MCP
 */
import http from "http";
import { MCPError } from "../utils/errorHandler.js";
/**
 * HTTP/SSE Transport
 * Provides REST API and Server-Sent Events for MCP communication
 */
export class HttpTransport {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.host = options.host || "localhost";
        this.server = null;
        this.clients = new Map(); // SSE clients
        this.requestHandlers = new Map();
        this.allowCors = options.allowCors !== false;
        this.apiPrefix = options.apiPrefix || "/mcp";
    }
    /**
     * Start HTTP server
     */
    async start(mcpServer) {
        return new Promise((resolve, reject) => {
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res, mcpServer);
            });
            this.server.on("error", (error) => {
                reject(error);
            });
            this.server.listen(this.port, this.host, () => {
                console.error(`🌐 HTTP transport listening on http://${this.host}:${this.port}`);
                resolve();
            });
        });
    }
    /**
     * Handle incoming HTTP request
     */
    async handleRequest(req, res, mcpServer) {
        // CORS headers
        if (this.allowCors) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            if (req.method === "OPTIONS") {
                res.writeHead(200);
                res.end();
                return;
            }
        }
        const url = new URL(req.url, `http://${req.headers.host}`);
        // Routes
        if (url.pathname === `${this.apiPrefix}/health`) {
            return this.handleHealth(req, res);
        }
        if (url.pathname === `${this.apiPrefix}/tools`) {
            return this.handleListTools(req, res, mcpServer);
        }
        if (url.pathname === `${this.apiPrefix}/call`) {
            return this.handleCallTool(req, res, mcpServer);
        }
        if (url.pathname === `${this.apiPrefix}/events`) {
            return this.handleSSE(req, res);
        }
        if (url.pathname === `${this.apiPrefix}/info`) {
            return this.handleInfo(req, res, mcpServer);
        }
        // 404
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
    }
    /**
     * Health check endpoint
     */
    handleHealth(req, res) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            status: "healthy",
            transport: "http",
            timestamp: new Date().toISOString(),
        }));
    }
    /**
     * Server info endpoint
     */
    handleInfo(req, res, mcpServer) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            name: mcpServer.serverInfo?.name || "supabase-db",
            version: mcpServer.serverInfo?.version || "unknown",
            transport: "http/sse",
            endpoints: {
                health: `${this.apiPrefix}/health`,
                tools: `${this.apiPrefix}/tools`,
                call: `${this.apiPrefix}/call`,
                events: `${this.apiPrefix}/events`,
                info: `${this.apiPrefix}/info`,
            },
        }));
    }
    /**
     * List tools endpoint
     */
    async handleListTools(req, res, mcpServer) {
        try {
            const tools = await mcpServer.listTools();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(tools));
        }
        catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                error: error.message,
            }));
        }
    }
    /**
     * Call tool endpoint
     */
    async handleCallTool(req, res, mcpServer) {
        if (req.method !== "POST") {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
        }
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", async () => {
            try {
                const { tool, arguments: args } = JSON.parse(body);
                if (!tool) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Tool name required" }));
                    return;
                }
                const result = await mcpServer.callTool(tool, args || {});
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(result));
                // Broadcast to SSE clients
                this.broadcast({
                    type: "tool_called",
                    tool: tool,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    error: error.message,
                }));
            }
        });
    }
    /**
     * Server-Sent Events endpoint
     */
    handleSSE(req, res) {
        const clientId = Math.random().toString(36).substring(7);
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });
        // Send initial connection event
        res.write(`data: ${JSON.stringify({ type: "connected", clientId })}\n\n`);
        // Store client
        this.clients.set(clientId, res);
        // Remove client on disconnect
        req.on("close", () => {
            this.clients.delete(clientId);
        });
    }
    /**
     * Broadcast event to all SSE clients
     */
    broadcast(event) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        for (const [clientId, res] of this.clients.entries()) {
            try {
                res.write(data);
            }
            catch (error) {
                // Client disconnected, remove it
                this.clients.delete(clientId);
            }
        }
    }
    /**
     * Stop HTTP server
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                // Close all SSE connections
                for (const [clientId, res] of this.clients.entries()) {
                    res.end();
                }
                this.clients.clear();
                this.server.close(() => {
                    console.error("🌐 HTTP transport stopped");
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
}
//# sourceMappingURL=httpTransport.js.map