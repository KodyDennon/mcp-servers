/**
 * Wrap async functions with comprehensive error handling
 */
export function withErrorHandler(fn: any, context?: {}): (...args: any[]) => Promise<{
    success: boolean;
    error: {
        code: any;
        message: any;
        retry: any;
        category: any;
        suggested_action: any;
        details: {};
        timestamp: string;
    };
} | {
    success: boolean;
    data: any;
}>;
/**
 * Map PostgreSQL errors to structured MCPErrors
 */
export function mapPostgresError(error: any, context?: {}): MCPError;
/**
 * Validate environment variables and provide helpful errors
 */
export function validateEnvironment(required?: any[]): void;
/**
 * Sanitize SQL identifiers to prevent SQL injection
 */
export function sanitizeIdentifier(identifier: any): string;
/**
 * Validate and sanitize table name
 */
export function validateTableName(tableName: any): string;
/**
 * Validate and sanitize column names
 */
export function validateColumnNames(columns: any): string[];
export namespace ErrorCodes {
    namespace AUTH_INVALID_CREDENTIALS {
        let code: string;
        let retry: boolean;
        let category: string;
        let suggested_action: string;
    }
    namespace AUTH_MISSING_ENV_VARS {
        let code_1: string;
        export { code_1 as code };
        let retry_1: boolean;
        export { retry_1 as retry };
        let category_1: string;
        export { category_1 as category };
        let suggested_action_1: string;
        export { suggested_action_1 as suggested_action };
    }
    namespace AUTH_TOKEN_EXPIRED {
        let code_2: string;
        export { code_2 as code };
        let retry_2: boolean;
        export { retry_2 as retry };
        let category_2: string;
        export { category_2 as category };
        let suggested_action_2: string;
        export { suggested_action_2 as suggested_action };
    }
    namespace DB_CONNECTION_FAILED {
        let code_3: string;
        export { code_3 as code };
        let retry_3: boolean;
        export { retry_3 as retry };
        let category_3: string;
        export { category_3 as category };
        let suggested_action_3: string;
        export { suggested_action_3 as suggested_action };
    }
    namespace DB_QUERY_FAILED {
        let code_4: string;
        export { code_4 as code };
        let retry_4: boolean;
        export { retry_4 as retry };
        let category_4: string;
        export { category_4 as category };
        let suggested_action_4: string;
        export { suggested_action_4 as suggested_action };
    }
    namespace DB_TABLE_NOT_FOUND {
        let code_5: string;
        export { code_5 as code };
        let retry_5: boolean;
        export { retry_5 as retry };
        let category_5: string;
        export { category_5 as category };
        let suggested_action_5: string;
        export { suggested_action_5 as suggested_action };
    }
    namespace DB_CONSTRAINT_VIOLATION {
        let code_6: string;
        export { code_6 as code };
        let retry_6: boolean;
        export { retry_6 as retry };
        let category_6: string;
        export { category_6 as category };
        let suggested_action_6: string;
        export { suggested_action_6 as suggested_action };
    }
    namespace VALIDATION_INVALID_INPUT {
        let code_7: string;
        export { code_7 as code };
        let retry_7: boolean;
        export { retry_7 as retry };
        let category_7: string;
        export { category_7 as category };
        let suggested_action_7: string;
        export { suggested_action_7 as suggested_action };
    }
    namespace VALIDATION_MISSING_REQUIRED {
        let code_8: string;
        export { code_8 as code };
        let retry_8: boolean;
        export { retry_8 as retry };
        let category_8: string;
        export { category_8 as category };
        let suggested_action_8: string;
        export { suggested_action_8 as suggested_action };
    }
    namespace VALIDATION_SQL_INJECTION {
        let code_9: string;
        export { code_9 as code };
        let retry_9: boolean;
        export { retry_9 as retry };
        let category_9: string;
        export { category_9 as category };
        let suggested_action_9: string;
        export { suggested_action_9 as suggested_action };
    }
    namespace RESOURCE_NOT_FOUND {
        let code_10: string;
        export { code_10 as code };
        let retry_10: boolean;
        export { retry_10 as retry };
        let category_10: string;
        export { category_10 as category };
        let suggested_action_10: string;
        export { suggested_action_10 as suggested_action };
    }
    namespace RESOURCE_LIMIT_EXCEEDED {
        let code_11: string;
        export { code_11 as code };
        let retry_11: boolean;
        export { retry_11 as retry };
        let category_11: string;
        export { category_11 as category };
        let suggested_action_11: string;
        export { suggested_action_11 as suggested_action };
    }
    namespace NETWORK_TIMEOUT {
        let code_12: string;
        export { code_12 as code };
        let retry_12: boolean;
        export { retry_12 as retry };
        let category_12: string;
        export { category_12 as category };
        let suggested_action_12: string;
        export { suggested_action_12 as suggested_action };
    }
    namespace NETWORK_UNAVAILABLE {
        let code_13: string;
        export { code_13 as code };
        let retry_13: boolean;
        export { retry_13 as retry };
        let category_13: string;
        export { category_13 as category };
        let suggested_action_13: string;
        export { suggested_action_13 as suggested_action };
    }
    namespace INTERNAL_ERROR {
        let code_14: string;
        export { code_14 as code };
        let retry_14: boolean;
        export { retry_14 as retry };
        let category_14: string;
        export { category_14 as category };
        let suggested_action_14: string;
        export { suggested_action_14 as suggested_action };
    }
    namespace UNKNOWN_ERROR {
        let code_15: string;
        export { code_15 as code };
        let retry_15: boolean;
        export { retry_15 as retry };
        let category_15: string;
        export { category_15 as category };
        let suggested_action_15: string;
        export { suggested_action_15 as suggested_action };
    }
}
/**
 * Create a structured error response for AI agents
 */
export class MCPError extends Error {
    constructor(errorCode: any, message: any, details?: {});
    error: {
        code: any;
        message: any;
        retry: any;
        category: any;
        suggested_action: any;
        details: {};
        timestamp: string;
    };
    toJSON(): {
        success: boolean;
        error: {
            code: any;
            message: any;
            retry: any;
            category: any;
            suggested_action: any;
            details: {};
            timestamp: string;
        };
    };
}
//# sourceMappingURL=errorHandler.d.ts.map