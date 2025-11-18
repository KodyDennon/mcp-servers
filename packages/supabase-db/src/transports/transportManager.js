/**
 * Transport Manager
 * Manages multiple transport protocols simultaneously
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpTransport } from "./httpTransport.js";
import { WebSocketTransport } from "./websocketTransport.js";

/**
 * Transport Manager
 * Coordinates multiple transport protocols
 */
export class TransportManager {
  constructor(options = {}) {
    this.transports = new Map();
    this.server = null;
    this.enabledTransports = options.enabledTransports || ["stdio"];
    this.httpPort = options.httpPort || 3000;
    this.wsPort = options.wsPort || 3001;
    this.host = options.host || "localhost";
  }

  /**
   * Initialize and start all configured transports
   */
  async start(mcpServer) {
    this.server = mcpServer;

    console.error("🚀 Starting transport manager...");
    console.error(`Enabled transports: ${this.enabledTransports.join(", ")}`);

    // Start each enabled transport
    for (const transportType of this.enabledTransports) {
      try {
        await this.startTransport(transportType, mcpServer);
      } catch (error) {
        console.error(`Failed to start ${transportType} transport:`, error);
        // Continue with other transports
      }
    }

    console.error(
      `✅ Transport manager started with ${this.transports.size} transport(s)`,
    );
  }

  /**
   * Start individual transport
   */
  async startTransport(type, mcpServer) {
    switch (type) {
      case "stdio":
        await this.startStdioTransport(mcpServer);
        break;

      case "http":
        await this.startHttpTransport(mcpServer);
        break;

      case "websocket":
      case "ws":
        await this.startWebSocketTransport(mcpServer);
        break;

      default:
        console.error(`Unknown transport type: ${type}`);
    }
  }

  /**
   * Start stdio transport
   */
  async startStdioTransport(mcpServer) {
    const transport = new StdioServerTransport();
    this.transports.set("stdio", transport);

    await mcpServer.connect(transport);
    console.error("📝 Stdio transport started");
  }

  /**
   * Start HTTP/SSE transport
   */
  async startHttpTransport(mcpServer) {
    const transport = new HttpTransport({
      port: this.httpPort,
      host: this.host,
      allowCors: true,
    });

    await transport.start(mcpServer);
    this.transports.set("http", transport);
  }

  /**
   * Start WebSocket transport
   */
  async startWebSocketTransport(mcpServer) {
    const transport = new WebSocketTransport({
      port: this.wsPort,
      host: this.host,
    });

    await transport.start(mcpServer);
    this.transports.set("websocket", transport);
  }

  /**
   * Get transport by type
   */
  getTransport(type) {
    return this.transports.get(type);
  }

  /**
   * Get all active transports
   */
  getActiveTransports() {
    return Array.from(this.transports.keys());
  }

  /**
   * Get transport statistics
   */
  getStats() {
    const stats = {};

    for (const [type, transport] of this.transports.entries()) {
      if (transport.getStats) {
        stats[type] = transport.getStats();
      } else {
        stats[type] = { active: true };
      }
    }

    return stats;
  }

  /**
   * Broadcast message to all transports
   */
  broadcast(message) {
    for (const [type, transport] of this.transports.entries()) {
      if (transport.broadcast) {
        try {
          transport.broadcast(message);
        } catch (error) {
          console.error(`Failed to broadcast to ${type}:`, error);
        }
      }
    }
  }

  /**
   * Stop all transports
   */
  async stop() {
    console.error("Stopping all transports...");

    for (const [type, transport] of this.transports.entries()) {
      try {
        if (transport.stop) {
          await transport.stop();
        }
        console.error(`Stopped ${type} transport`);
      } catch (error) {
        console.error(`Error stopping ${type} transport:`, error);
      }
    }

    this.transports.clear();
    console.error("All transports stopped");
  }
}

/**
 * Parse transport configuration from environment
 */
export function parseTransportConfig() {
  const transports = process.env.MCP_TRANSPORTS || "stdio";
  const httpPort = parseInt(process.env.MCP_HTTP_PORT || "3000");
  const wsPort = parseInt(process.env.MCP_WS_PORT || "3001");
  const host = process.env.MCP_HOST || "localhost";

  return {
    enabledTransports: transports.split(",").map((t) => t.trim()),
    httpPort: httpPort,
    wsPort: wsPort,
    host: host,
  };
}
