import pino from "pino";
/**
 * Logger configuration and setup
 */
export interface LogContext {
  correlationId?: string;
  packageName?: string;
  operation?: string;
  [key: string]: unknown;
}
declare class Logger {
  private logger;
  private static instance;
  private constructor();
  static getInstance(): Logger;
  /**
   * Generate a correlation ID for request tracing
   */
  static generateCorrelationId(): string;
  /**
   * Create a child logger with context
   */
  child(context: LogContext): pino.Logger;
  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void;
  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void;
  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void;
  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void;
  /**
   * Log trace message
   */
  trace(message: string, context?: LogContext): void;
  /**
   * Time an operation
   */
  time<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext,
  ): Promise<T>;
  /**
   * Get the raw pino logger instance
   */
  getRawLogger(): pino.Logger;
}
export declare const logger: Logger;
export { Logger };
//# sourceMappingURL=logger.d.ts.map
