import pino from "pino";
import { nanoid } from "nanoid";

/**
 * Logger configuration and setup
 */

export interface LogContext {
  correlationId?: string;
  packageName?: string;
  operation?: string;
  [key: string]: unknown;
}

class Logger {
  private logger: pino.Logger;
  private static instance: Logger;

  private constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
              },
            }
          : undefined,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Generate a correlation ID for request tracing
   */
  static generateCorrelationId(): string {
    return nanoid(10);
  }

  /**
   * Create a child logger with context
   */
  child(context: LogContext): pino.Logger {
    return this.logger.child(context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(context || {}, message);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const logContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    };
    this.logger.error(logContext, message);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(context || {}, message);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(context || {}, message);
  }

  /**
   * Log trace message
   */
  trace(message: string, context?: LogContext): void {
    this.logger.trace(context || {}, message);
  }

  /**
   * Time an operation
   */
  async time<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    const correlationId = context?.correlationId || Logger.generateCorrelationId();

    this.debug(`Starting: ${label}`, { ...context, correlationId });

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed: ${label}`, { ...context, correlationId, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${label}`, error, { ...context, correlationId, duration });
      throw error;
    }
  }

  /**
   * Get the raw pino logger instance
   */
  getRawLogger(): pino.Logger {
    return this.logger;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
export { Logger };
