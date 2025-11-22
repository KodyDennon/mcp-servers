/**
 * Centralized error handling utilities for MCP tools
 */
import { LoggerFactory } from './Logger.js';
const logger = LoggerFactory.getLogger('ErrorHandler');
/**
 * Error types for better error classification
 */
export var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "VALIDATION_ERROR";
    ErrorType["NOT_FOUND"] = "NOT_FOUND";
    ErrorType["NETWORK"] = "NETWORK_ERROR";
    ErrorType["TIMEOUT"] = "TIMEOUT";
    ErrorType["PERMISSION"] = "PERMISSION_DENIED";
    ErrorType["INTERNAL"] = "INTERNAL_ERROR";
    ErrorType["CONFIG"] = "CONFIGURATION_ERROR";
    ErrorType["DEVICE_OFFLINE"] = "DEVICE_OFFLINE";
})(ErrorType || (ErrorType = {}));
/**
 * Custom error class with error type
 */
export class McpError extends Error {
    type;
    details;
    constructor(type, message, details) {
        super(message);
        this.type = type;
        this.details = details;
        this.name = 'McpError';
    }
}
/**
 * Format error for user-friendly display
 */
export function formatError(error, context) {
    if (error instanceof McpError) {
        const contextStr = context ? `[${context}] ` : '';
        const detailsStr = error.details
            ? `\nDetails: ${JSON.stringify(error.details, null, 2)}`
            : '';
        return `${contextStr}${error.type}: ${error.message}${detailsStr}`;
    }
    if (error instanceof Error) {
        const contextStr = context ? `[${context}] ` : '';
        return `${contextStr}Error: ${error.message}`;
    }
    return `Unknown error: ${String(error)}`;
}
/**
 * Create error response for MCP tools
 */
export function createErrorResponse(error, toolName) {
    const errorMessage = formatError(error, toolName);
    logger.error(`Tool ${toolName} failed`, error instanceof Error ? error : undefined, {
        toolName,
        errorType: error instanceof McpError ? error.type : 'UNKNOWN',
    });
    return {
        content: [
            {
                type: 'text',
                text: errorMessage,
            },
        ],
        isError: true,
    };
}
/**
 * Wrap async tool handler with error handling
 */
export function wrapToolHandler(toolName, handler) {
    return async (args) => {
        try {
            logger.debug(`Tool ${toolName} called`, { args });
            const result = await handler(args);
            logger.debug(`Tool ${toolName} completed`, {
                hasError: result.isError || false,
            });
            return result;
        }
        catch (error) {
            return createErrorResponse(error, toolName);
        }
    };
}
/**
 * Validate required arguments
 */
export function validateRequiredArgs(args, requiredKeys, toolName) {
    for (const key of requiredKeys) {
        if (!(key in args) || args[key] === undefined || args[key] === null) {
            throw new McpError(ErrorType.VALIDATION, `Missing required argument: ${String(key)}`, { toolName, requiredKeys });
        }
    }
}
/**
 * Create not found error
 */
export function notFoundError(resourceType, resourceId) {
    return new McpError(ErrorType.NOT_FOUND, `${resourceType} not found: ${resourceId}`, { resourceType, resourceId });
}
/**
 * Create validation error
 */
export function validationError(field, message, value) {
    return new McpError(ErrorType.VALIDATION, `${field}: ${message}`, {
        field,
        value,
    });
}
/**
 * Create network error
 */
export function networkError(message, details) {
    return new McpError(ErrorType.NETWORK, message, details);
}
/**
 * Create timeout error
 */
export function timeoutError(operation, timeoutMs) {
    return new McpError(ErrorType.TIMEOUT, `${operation} timed out after ${timeoutMs}ms`, { operation, timeoutMs });
}
/**
 * Safely execute async operation with timeout and error handling
 */
export async function safeExecute(operation, options) {
    const { operationName, timeoutMs = 30000, retries = 0, onError } = options;
    try {
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (timeoutMs > 0) {
                    return await Promise.race([
                        operation(),
                        new Promise((_, reject) => setTimeout(() => reject(timeoutError(operationName, timeoutMs)), timeoutMs)),
                    ]);
                }
                else {
                    return await operation();
                }
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < retries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    logger.warn(`${operationName} failed, retrying in ${delay}ms`, {
                        attempt: attempt + 1,
                        maxAttempts: retries + 1,
                        error: lastError.message,
                    });
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        if (lastError) {
            if (onError) {
                onError(lastError);
            }
            throw lastError;
        }
        throw new Error(`${operationName} failed with unknown error`);
    }
    catch (error) {
        logger.error(`${operationName} failed`, error);
        throw error;
    }
}
/**
 * Check if error is retryable
 */
export function isRetryableError(error) {
    if (error instanceof McpError) {
        return [
            ErrorType.NETWORK,
            ErrorType.TIMEOUT,
            ErrorType.DEVICE_OFFLINE,
        ].includes(error.type);
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (message.includes('timeout') ||
            message.includes('network') ||
            message.includes('connection') ||
            message.includes('econnrefused') ||
            message.includes('enotfound'));
    }
    return false;
}
/**
 * Create a safe wrapper for any async function
 */
export function createSafeWrapper(fn, context) {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            logger.error(`${context} failed`, error);
            throw error;
        }
    };
}
//# sourceMappingURL=errorHandler.js.map