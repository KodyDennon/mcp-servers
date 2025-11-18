/**
 * Tool Wrapper Utility
 * Wraps existing tool handlers with comprehensive error handling and logging
 */

import { withErrorHandler } from "./errorHandler.js";

/**
 * Wrap all tool handlers with error handling
 * This ensures consistent error responses across all tools
 *
 * @param {object} handlers - Object containing tool handler functions
 * @returns {object} Wrapped handlers
 */
export function wrapToolHandlers(handlers) {
  const wrapped = {};

  for (const [name, handler] of Object.entries(handlers)) {
    if (typeof handler === "function") {
      wrapped[name] = withErrorHandler(handler, { tool: name });
    } else {
      wrapped[name] = handler;
    }
  }

  return wrapped;
}

/**
 * Create a safe tool handler that wraps the original with error handling
 *
 * @param {function} originalHandler - Original tool handler function
 * @param {string} toolName - Name of the tool for logging
 * @returns {function} Wrapped handler
 */
export function createSafeHandler(originalHandler, toolName) {
  return async (input, connectionManager) => {
    const handler = withErrorHandler(
      async () => {
        return await originalHandler(input, connectionManager);
      },
      { tool: toolName },
    );

    return handler();
  };
}

/**
 * Wrap an entire tool module with error handling
 *
 * @param {object} module - Tool module with handler function
 * @param {string} handlerName - Name of the handler function (e.g., 'handleQueryToolCall')
 * @returns {object} Module with wrapped handler
 */
export function wrapToolModule(module, handlerName = "handler") {
  const wrappedModule = { ...module };

  if (module[handlerName] && typeof module[handlerName] === "function") {
    const originalHandler = module[handlerName];

    wrappedModule[handlerName] = async (toolName, input, connectionManager) => {
      const safeHandler = withErrorHandler(
        async () => {
          return await originalHandler(toolName, input, connectionManager);
        },
        { tool: toolName, handler: handlerName },
      );

      return safeHandler();
    };
  }

  return wrappedModule;
}
