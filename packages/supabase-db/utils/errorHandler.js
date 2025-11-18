/**
 * AI-Agent-Friendly Error Handling Framework
 * Provides structured error responses that help AI agents self-correct and decide next steps
 */
/**
 * Error codes with metadata for AI agent decision-making
 */
export const ErrorCodes = {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS: {
    code: "AUTH_INVALID_CREDENTIALS",
    retry: false,
    category: "authentication",
    suggested_action: "verify_credentials",
  },
  AUTH_MISSING_ENV_VARS: {
    code: "AUTH_MISSING_ENV_VARS",
    retry: false,
    category: "configuration",
    suggested_action: "check_environment_variables",
  },
  AUTH_TOKEN_EXPIRED: {
    code: "AUTH_TOKEN_EXPIRED",
    retry: true,
    category: "authentication",
    suggested_action: "refresh_token",
  },
  // Database Errors
  DB_CONNECTION_FAILED: {
    code: "DB_CONNECTION_FAILED",
    retry: true,
    category: "connection",
    suggested_action: "retry_with_backoff",
  },
  DB_QUERY_FAILED: {
    code: "DB_QUERY_FAILED",
    retry: false,
    category: "query",
    suggested_action: "check_query_syntax",
  },
  DB_TABLE_NOT_FOUND: {
    code: "DB_TABLE_NOT_FOUND",
    retry: false,
    category: "schema",
    suggested_action: "verify_table_exists",
  },
  DB_CONSTRAINT_VIOLATION: {
    code: "DB_CONSTRAINT_VIOLATION",
    retry: false,
    category: "data",
    suggested_action: "check_data_constraints",
  },
  // Validation Errors
  VALIDATION_INVALID_INPUT: {
    code: "VALIDATION_INVALID_INPUT",
    retry: false,
    category: "validation",
    suggested_action: "correct_input_format",
  },
  VALIDATION_MISSING_REQUIRED: {
    code: "VALIDATION_MISSING_REQUIRED",
    retry: false,
    category: "validation",
    suggested_action: "provide_required_fields",
  },
  VALIDATION_SQL_INJECTION: {
    code: "VALIDATION_SQL_INJECTION",
    retry: false,
    category: "security",
    suggested_action: "sanitize_input",
  },
  // Resource Errors
  RESOURCE_NOT_FOUND: {
    code: "RESOURCE_NOT_FOUND",
    retry: false,
    category: "resource",
    suggested_action: "verify_resource_exists",
  },
  RESOURCE_LIMIT_EXCEEDED: {
    code: "RESOURCE_LIMIT_EXCEEDED",
    retry: true,
    category: "limits",
    suggested_action: "reduce_request_size",
  },
  // Network Errors
  NETWORK_TIMEOUT: {
    code: "NETWORK_TIMEOUT",
    retry: true,
    category: "network",
    suggested_action: "retry_with_backoff",
  },
  NETWORK_UNAVAILABLE: {
    code: "NETWORK_UNAVAILABLE",
    retry: true,
    category: "network",
    suggested_action: "check_connectivity",
  },
  // Generic Errors
  INTERNAL_ERROR: {
    code: "INTERNAL_ERROR",
    retry: false,
    category: "internal",
    suggested_action: "report_issue",
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    retry: false,
    category: "unknown",
    suggested_action: "contact_support",
  },
};
/**
 * Create a structured error response for AI agents
 */
export class MCPError extends Error {
  constructor(errorCode, message, details = {}) {
    super(message);
    this.name = "MCPError";
    const metadata = ErrorCodes[errorCode] || ErrorCodes.UNKNOWN_ERROR;
    this.error = {
      code: metadata.code,
      message: message,
      retry: metadata.retry,
      category: metadata.category,
      suggested_action: metadata.suggested_action,
      details: details,
      timestamp: new Date().toISOString(),
    };
  }
  toJSON() {
    return {
      success: false,
      error: this.error,
    };
  }
}
/**
 * Wrap async functions with comprehensive error handling
 */
export function withErrorHandler(fn, context = {}) {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // If it's already an MCPError, just return it
      if (error instanceof MCPError) {
        console.error(`[${context.tool || "Unknown"}] MCPError:`, error.error);
        return error.toJSON();
      }
      // Map common PostgreSQL errors to MCPError
      const mcpError = mapPostgresError(error, context);
      console.error(`[${context.tool || "Unknown"}] Error:`, mcpError.error);
      return mcpError.toJSON();
    }
  };
}
/**
 * Map PostgreSQL errors to structured MCPErrors
 */
export function mapPostgresError(error, context = {}) {
  const errorMessage = error.message || "";
  const errorCode = error.code;
  // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
  switch (errorCode) {
    case "28P01": // invalid_password
    case "28000": // invalid_authorization_specification
      return new MCPError(
        "AUTH_INVALID_CREDENTIALS",
        "Database authentication failed. Check your credentials.",
        {
          postgres_code: errorCode,
          hint: "Verify POSTGRES_URL_NON_POOLING environment variable",
          docs_url:
            "https://github.com/KodyDennon/mcp-servers/tree/main/packages/supabase-db#setup",
        },
      );
    case "42P01": // undefined_table
      return new MCPError(
        "DB_TABLE_NOT_FOUND",
        `Table not found: ${context.tableName || "unknown"}`,
        {
          postgres_code: errorCode,
          table_name: context.tableName,
          suggested_action: "Use listTables tool to see available tables",
        },
      );
    case "23505": // unique_violation
    case "23503": // foreign_key_violation
    case "23502": // not_null_violation
    case "23514": // check_violation
      return new MCPError(
        "DB_CONSTRAINT_VIOLATION",
        `Database constraint violation: ${errorMessage}`,
        {
          postgres_code: errorCode,
          constraint_type: getConstraintType(errorCode),
          hint: "Check your data against table constraints",
        },
      );
    case "42601": // syntax_error
    case "42804": // datatype_mismatch
      return new MCPError(
        "DB_QUERY_FAILED",
        `SQL syntax error: ${errorMessage}`,
        {
          postgres_code: errorCode,
          query: context.query,
          hint: "Check SQL syntax and data types",
        },
      );
    case "53300": // too_many_connections
      return new MCPError(
        "DB_CONNECTION_FAILED",
        "Too many database connections. Please retry.",
        {
          postgres_code: errorCode,
          retry_after_ms: 1000,
          hint: "The connection pool is full. Retry after a short delay.",
        },
      );
    case "08006": // connection_failure
    case "08003": // connection_does_not_exist
    case "08000": // connection_exception
      return new MCPError(
        "DB_CONNECTION_FAILED",
        "Database connection failed. Please check your connection settings.",
        {
          postgres_code: errorCode,
          retry_after_ms: 2000,
          hint: "Verify POSTGRES_URL_NON_POOLING is correct and database is accessible",
        },
      );
    case "57014": // query_canceled
      return new MCPError(
        "NETWORK_TIMEOUT",
        "Query execution timeout. Try reducing the query scope.",
        {
          postgres_code: errorCode,
          retry: true,
          hint: "Add LIMIT clause or filter results",
        },
      );
    default:
      // Check for common error patterns
      if (errorMessage.includes("timeout")) {
        return new MCPError(
          "NETWORK_TIMEOUT",
          "Operation timed out. Please retry.",
          {
            original_error: errorMessage,
            retry_after_ms: 2000,
          },
        );
      }
      if (
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("ENOTFOUND")
      ) {
        return new MCPError(
          "DB_CONNECTION_FAILED",
          "Cannot connect to database. Check your connection URL.",
          {
            original_error: errorMessage,
            hint: "Verify POSTGRES_URL_NON_POOLING environment variable",
          },
        );
      }
      if (errorMessage.includes("permission denied")) {
        return new MCPError(
          "AUTH_INVALID_CREDENTIALS",
          "Permission denied. Check database user permissions.",
          {
            original_error: errorMessage,
            hint: "Ensure database user has required permissions",
          },
        );
      }
      // Generic error fallback
      return new MCPError(
        "INTERNAL_ERROR",
        errorMessage || "An unexpected error occurred",
        {
          original_error: errorMessage,
          stack: error.stack,
          context: context,
        },
      );
  }
}
/**
 * Get human-readable constraint type
 */
function getConstraintType(code) {
  const types = {
    23505: "unique_constraint",
    23503: "foreign_key",
    23502: "not_null",
    23514: "check_constraint",
  };
  return types[code] || "unknown";
}
/**
 * Validate environment variables and provide helpful errors
 */
export function validateEnvironment(required = []) {
  const missing = required.filter((varName) => !process.env[varName]);
  if (missing.length > 0) {
    throw new MCPError(
      "AUTH_MISSING_ENV_VARS",
      `Missing required environment variables: ${missing.join(", ")}`,
      {
        missing_vars: missing,
        hint: "Add these to your .env file or environment configuration",
        example: missing.reduce((acc, varName) => {
          acc[varName] = getEnvVarExample(varName);
          return acc;
        }, {}),
        docs_url:
          "https://github.com/KodyDennon/mcp-servers/tree/main/packages/supabase-db#setup",
      },
    );
  }
}
/**
 * Get example values for common environment variables
 */
function getEnvVarExample(varName) {
  const examples = {
    POSTGRES_URL_NON_POOLING: "postgresql://user:password@host:5432/database",
    SUPABASE_URL: "https://xxxxx.supabase.co",
    SUPABASE_SECRET_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  };
  return examples[varName] || "<your-value-here>";
}
/**
 * Sanitize SQL identifiers to prevent SQL injection
 */
export function sanitizeIdentifier(identifier) {
  if (!identifier || typeof identifier !== "string") {
    throw new MCPError(
      "VALIDATION_INVALID_INPUT",
      "Invalid identifier provided",
      {
        identifier: identifier,
        hint: "Identifier must be a non-empty string",
      },
    );
  }
  // Check for SQL injection patterns
  const dangerous =
    /[;\-\-\/\*]|(\bDROP\b|\bDELETE\b|\bTRUNCATE\b|\bEXEC\b|\bEXECUTE\b)/i;
  if (dangerous.test(identifier)) {
    throw new MCPError(
      "VALIDATION_SQL_INJECTION",
      "Potentially dangerous SQL detected in identifier",
      {
        identifier: identifier,
        hint: "Use only alphanumeric characters, underscores, and dots",
      },
    );
  }
  // Remove any quotes and validate format
  const cleaned = identifier.replace(/['"]/g, "");
  // Validate format: alphanumeric, underscores, dots only
  if (!/^[a-zA-Z0-9_\.]+$/.test(cleaned)) {
    throw new MCPError(
      "VALIDATION_INVALID_INPUT",
      "Invalid identifier format",
      {
        identifier: identifier,
        hint: "Use only alphanumeric characters, underscores, and dots",
      },
    );
  }
  return cleaned;
}
/**
 * Validate and sanitize table name
 */
export function validateTableName(tableName) {
  return sanitizeIdentifier(tableName);
}
/**
 * Validate and sanitize column names
 */
export function validateColumnNames(columns) {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new MCPError("VALIDATION_INVALID_INPUT", "Invalid columns array", {
      hint: "Columns must be a non-empty array of strings",
    });
  }
  return columns.map((col) => sanitizeIdentifier(col));
}
//# sourceMappingURL=errorHandler.js.map
