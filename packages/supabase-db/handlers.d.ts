/**
 * Get all available tools
 */
export function getAllTools(): {
  name: string;
  description: string;
  input_schema: any;
  output_schema: any;
}[];
/**
 * Register the list tools handler
 */
export function registerListToolsHandler(server: any): void;
/**
 * Register the call tool handler
 */
export function registerCallToolHandler(
  server: any,
  connectionManager: any,
): void;
/**
 * Register all handlers
 */
export function registerHandlers(server: any, connectionManager: any): void;
//# sourceMappingURL=handlers.d.ts.map
