/**
 * Custom error types for dependency manager
 */
export class DependencyManagerError extends Error {
  code;
  statusCode;
  details;
  constructor(message, code, statusCode, details) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
export class NetworkError extends DependencyManagerError {
  constructor(message, details) {
    super(message, "NETWORK_ERROR", 503, details);
  }
}
export class PackageNotFoundError extends DependencyManagerError {
  constructor(packageName, details) {
    super(
      `Package "${packageName}" not found`,
      "PACKAGE_NOT_FOUND",
      404,
      details,
    );
  }
}
export class RateLimitError extends DependencyManagerError {
  retryAfter;
  constructor(message, retryAfter, details) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, details);
    this.retryAfter = retryAfter;
  }
}
export class ConfigurationError extends DependencyManagerError {
  constructor(message, details) {
    super(message, "CONFIGURATION_ERROR", 400, details);
  }
}
export class CacheError extends DependencyManagerError {
  constructor(message, details) {
    super(message, "CACHE_ERROR", 500, details);
  }
}
export class ValidationError extends DependencyManagerError {
  constructor(message, details) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}
export class SecurityAuditError extends DependencyManagerError {
  constructor(message, details) {
    super(message, "SECURITY_AUDIT_ERROR", 500, details);
  }
}
export class FileSystemError extends DependencyManagerError {
  constructor(message, details) {
    super(message, "FILESYSTEM_ERROR", 500, details);
  }
}
/**
 * Type guard to check if error is a DependencyManagerError
 */
export function isDependencyManagerError(error) {
  return error instanceof DependencyManagerError;
}
/**
 * Extract safe error message for user display
 */
export function getSafeErrorMessage(error) {
  if (isDependencyManagerError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  static MAX_RETRIES = 3;
  static BASE_DELAY = 1000; // 1 second
  /**
   * Exponential backoff calculation
   */
  static getBackoffDelay(attempt) {
    return Math.min(this.BASE_DELAY * Math.pow(2, attempt), 30000); // Max 30s
  }
  /**
   * Retry with exponential backoff
   */
  static async withRetry(fn, options = {}) {
    const maxRetries = options.maxRetries ?? this.MAX_RETRIES;
    const shouldRetry =
      options.shouldRetry ??
      ((error) => {
        // Retry on network errors and rate limits
        return error instanceof NetworkError || error instanceof RateLimitError;
      });
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries || !shouldRetry(error)) {
          throw error;
        }
        const delay = this.getBackoffDelay(attempt);
        if (options.onRetry) {
          options.onRetry(attempt + 1, error);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }
  /**
   * Graceful degradation wrapper
   */
  static async withFallback(fn, fallback) {
    try {
      return await fn();
    } catch (error) {
      if (typeof fallback === "function") {
        return await fallback();
      }
      return fallback;
    }
  }
}
//# sourceMappingURL=errors.js.map
