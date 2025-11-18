/**
 * Custom error types for dependency manager
 */

export class DependencyManagerError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NetworkError extends DependencyManagerError {
  constructor(message: string, details?: unknown) {
    super(message, "NETWORK_ERROR", 503, details);
  }
}

export class PackageNotFoundError extends DependencyManagerError {
  constructor(packageName: string, details?: unknown) {
    super(`Package "${packageName}" not found`, "PACKAGE_NOT_FOUND", 404, details);
  }
}

export class RateLimitError extends DependencyManagerError {
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, details?: unknown) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, details);
    this.retryAfter = retryAfter;
  }
}

export class ConfigurationError extends DependencyManagerError {
  constructor(message: string, details?: unknown) {
    super(message, "CONFIGURATION_ERROR", 400, details);
  }
}

export class CacheError extends DependencyManagerError {
  constructor(message: string, details?: unknown) {
    super(message, "CACHE_ERROR", 500, details);
  }
}

export class ValidationError extends DependencyManagerError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class SecurityAuditError extends DependencyManagerError {
  constructor(message: string, details?: unknown) {
    super(message, "SECURITY_AUDIT_ERROR", 500, details);
  }
}

export class FileSystemError extends DependencyManagerError {
  constructor(message: string, details?: unknown) {
    super(message, "FILESYSTEM_ERROR", 500, details);
  }
}

/**
 * Type guard to check if error is a DependencyManagerError
 */
export function isDependencyManagerError(error: unknown): error is DependencyManagerError {
  return error instanceof DependencyManagerError;
}

/**
 * Extract safe error message for user display
 */
export function getSafeErrorMessage(error: unknown): string {
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
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1 second

  /**
   * Exponential backoff calculation
   */
  static getBackoffDelay(attempt: number): number {
    return Math.min(this.BASE_DELAY * Math.pow(2, attempt), 30000); // Max 30s
  }

  /**
   * Retry with exponential backoff
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      shouldRetry?: (error: unknown) => boolean;
      onRetry?: (attempt: number, error: unknown) => void;
    } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? this.MAX_RETRIES;
    const shouldRetry = options.shouldRetry ?? ((error: unknown) => {
      // Retry on network errors and rate limits
      return error instanceof NetworkError || error instanceof RateLimitError;
    });

    let lastError: unknown;

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
  static async withFallback<T>(
    fn: () => Promise<T>,
    fallback: T | (() => T | Promise<T>)
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (typeof fallback === "function") {
        return await (fallback as () => T | Promise<T>)();
      }
      return fallback;
    }
  }
}
