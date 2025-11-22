/**
 * Custom error types for dependency manager
 */
export declare class DependencyManagerError extends Error {
  readonly code: string;
  readonly statusCode?: number;
  readonly details?: unknown;
  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: unknown,
  );
}
export declare class NetworkError extends DependencyManagerError {
  constructor(message: string, details?: unknown);
}
export declare class PackageNotFoundError extends DependencyManagerError {
  constructor(packageName: string, details?: unknown);
}
export declare class RateLimitError extends DependencyManagerError {
  readonly retryAfter?: number;
  constructor(message: string, retryAfter?: number, details?: unknown);
}
export declare class ConfigurationError extends DependencyManagerError {
  constructor(message: string, details?: unknown);
}
export declare class CacheError extends DependencyManagerError {
  constructor(message: string, details?: unknown);
}
export declare class ValidationError extends DependencyManagerError {
  constructor(message: string, details?: unknown);
}
export declare class SecurityAuditError extends DependencyManagerError {
  constructor(message: string, details?: unknown);
}
export declare class FileSystemError extends DependencyManagerError {
  constructor(message: string, details?: unknown);
}
/**
 * Type guard to check if error is a DependencyManagerError
 */
export declare function isDependencyManagerError(
  error: unknown,
): error is DependencyManagerError;
/**
 * Extract safe error message for user display
 */
export declare function getSafeErrorMessage(error: unknown): string;
/**
 * Error recovery strategies
 */
export declare class ErrorRecovery {
  private static readonly MAX_RETRIES;
  private static readonly BASE_DELAY;
  /**
   * Exponential backoff calculation
   */
  static getBackoffDelay(attempt: number): number;
  /**
   * Retry with exponential backoff
   */
  static withRetry<T>(
    fn: () => Promise<T>,
    options?: {
      maxRetries?: number;
      shouldRetry?: (error: unknown) => boolean;
      onRetry?: (attempt: number, error: unknown) => void;
    },
  ): Promise<T>;
  /**
   * Graceful degradation wrapper
   */
  static withFallback<T>(
    fn: () => Promise<T>,
    fallback: T | (() => T | Promise<T>),
  ): Promise<T>;
}
//# sourceMappingURL=errors.d.ts.map
