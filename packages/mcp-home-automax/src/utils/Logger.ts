/**
 * Centralized logging utility with different log levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private context: string;
  private logLevel: LogLevel;

  constructor(context: string, logLevel: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.logLevel = logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.context}] ${message}${metaStr}`;
  }

  error(message: string, error?: Error | unknown, meta?: unknown): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorDetails = error instanceof Error
      ? { message: error.message, stack: error.stack, ...(typeof meta === 'object' && meta !== null ? meta as Record<string, unknown> : {}) }
      : { error, ...(typeof meta === 'object' && meta !== null ? meta as Record<string, unknown> : {}) };

    console.error(this.formatMessage('ERROR', message, errorDetails));
  }

  warn(message: string, meta?: unknown): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage('WARN', message, meta));
  }

  info(message: string, meta?: unknown): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.error(this.formatMessage('INFO', message, meta));
  }

  debug(message: string, meta?: unknown): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.error(this.formatMessage('DEBUG', message, meta));
  }

  /**
   * Create a child logger with additional context
   */
  child(childContext: string): Logger {
    return new Logger(`${this.context}:${childContext}`, this.logLevel);
  }

  /**
   * Set log level dynamically
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

/**
 * Global logger factory
 */
export class LoggerFactory {
  private static globalLogLevel: LogLevel = LogLevel.INFO;

  static setGlobalLogLevel(level: LogLevel): void {
    LoggerFactory.globalLogLevel = level;
  }

  static getLogger(context: string): Logger {
    return new Logger(context, LoggerFactory.globalLogLevel);
  }

  static setLogLevelFromEnv(): void {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLevel) {
      case 'error':
        LoggerFactory.globalLogLevel = LogLevel.ERROR;
        break;
      case 'warn':
        LoggerFactory.globalLogLevel = LogLevel.WARN;
        break;
      case 'info':
        LoggerFactory.globalLogLevel = LogLevel.INFO;
        break;
      case 'debug':
        LoggerFactory.globalLogLevel = LogLevel.DEBUG;
        break;
      default:
        LoggerFactory.globalLogLevel = LogLevel.INFO;
    }
  }
}
