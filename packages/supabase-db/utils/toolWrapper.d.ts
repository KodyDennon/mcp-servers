/**
 * Wrap all tool handlers with error handling
 * This ensures consistent error responses across all tools
 *
 * @param {object} handlers - Object containing tool handler functions
 * @returns {object} Wrapped handlers
 */
export function wrapToolHandlers(handlers: object): object;
/**
 * Create a safe tool handler that wraps the original with error handling
 *
 * @param {function} originalHandler - Original tool handler function
 * @param {string} toolName - Name of the tool for logging
 * @returns {function} Wrapped handler
 */
export function createSafeHandler(
  originalHandler: Function,
  toolName: string,
): Function;
/**
 * Wrap an entire tool module with error handling
 *
 * @param {object} module - Tool module with handler function
 * @param {string} handlerName - Name of the handler function (e.g., 'handleQueryToolCall')
 * @returns {object} Module with wrapped handler
 */
export function wrapToolModule(module: object, handlerName?: string): object;
//# sourceMappingURL=toolWrapper.d.ts.map
