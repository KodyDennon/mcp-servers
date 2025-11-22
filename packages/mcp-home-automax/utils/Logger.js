/**
 * Centralized logging utility with different log levels
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export class Logger {
    context;
    logLevel;
    constructor(context, logLevel = LogLevel.INFO) {
        this.context = context;
        this.logLevel = logLevel;
    }
    shouldLog(level) {
        return level <= this.logLevel;
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] [${this.context}] ${message}${metaStr}`;
    }
    error(message, error, meta) {
        if (!this.shouldLog(LogLevel.ERROR))
            return;
        const errorDetails = error instanceof Error
            ? { message: error.message, stack: error.stack, ...(typeof meta === 'object' && meta !== null ? meta : {}) }
            : { error, ...(typeof meta === 'object' && meta !== null ? meta : {}) };
        console.error(this.formatMessage('ERROR', message, errorDetails));
    }
    warn(message, meta) {
        if (!this.shouldLog(LogLevel.WARN))
            return;
        console.warn(this.formatMessage('WARN', message, meta));
    }
    info(message, meta) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        console.error(this.formatMessage('INFO', message, meta));
    }
    debug(message, meta) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        console.error(this.formatMessage('DEBUG', message, meta));
    }
    /**
     * Create a child logger with additional context
     */
    child(childContext) {
        return new Logger(`${this.context}:${childContext}`, this.logLevel);
    }
    /**
     * Set log level dynamically
     */
    setLogLevel(level) {
        this.logLevel = level;
    }
}
/**
 * Global logger factory
 */
export class LoggerFactory {
    static globalLogLevel = LogLevel.INFO;
    static setGlobalLogLevel(level) {
        LoggerFactory.globalLogLevel = level;
    }
    static getLogger(context) {
        return new Logger(context, LoggerFactory.globalLogLevel);
    }
    static setLogLevelFromEnv() {
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
//# sourceMappingURL=Logger.js.map