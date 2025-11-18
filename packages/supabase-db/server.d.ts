/**
 * Create and configure the MCP server
 */
export function createServer(): any;
/**
 * Initialize and start the server
 */
export function startServer(): Promise<{
  server: any;
  connectionManager: ConnectionManager;
  transport: any;
}>;
import { ConnectionManager } from "./connectionManager.js";
//# sourceMappingURL=server.d.ts.map
