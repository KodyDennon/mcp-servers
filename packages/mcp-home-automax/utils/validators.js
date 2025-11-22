/**
 * Input validation utilities for edge case handling
 */
import { LoggerFactory } from './Logger.js';
const logger = LoggerFactory.getLogger('Validators');
/**
 * Validate and sanitize device ID
 */
export function validateDeviceId(deviceId) {
    if (typeof deviceId !== 'string') {
        throw new Error(`Invalid device ID type: expected string, got ${typeof deviceId}`);
    }
    if (deviceId.trim().length === 0) {
        throw new Error('Device ID cannot be empty');
    }
    // Sanitize to prevent injection attacks
    const sanitized = deviceId.trim().replace(/[^\w\-:.]/g, '');
    if (sanitized !== deviceId.trim()) {
        logger.warn('Device ID contained invalid characters, sanitized', {
            original: deviceId,
            sanitized,
        });
    }
    return sanitized;
}
/**
 * Validate numeric parameter within range
 */
export function validateNumericParameter(value, name, min, max) {
    if (typeof value !== 'number') {
        throw new Error(`Invalid ${name}: expected number, got ${typeof value}`);
    }
    if (isNaN(value) || !isFinite(value)) {
        throw new Error(`Invalid ${name}: value is NaN or Infinite`);
    }
    if (min !== undefined && value < min) {
        throw new Error(`${name} ${value} is below minimum ${min}`);
    }
    if (max !== undefined && value > max) {
        throw new Error(`${name} ${value} is above maximum ${max}`);
    }
    return value;
}
/**
 * Validate temperature parameter
 */
export function validateTemperature(temp) {
    return validateNumericParameter(temp, 'Temperature', -50, 50);
}
/**
 * Validate brightness parameter
 */
export function validateBrightness(brightness) {
    return validateNumericParameter(brightness, 'Brightness', 0, 100);
}
/**
 * Validate position parameter (for covers)
 */
export function validatePosition(position) {
    return validateNumericParameter(position, 'Position', 0, 100);
}
/**
 * Validate volume parameter
 */
export function validateVolume(volume) {
    return validateNumericParameter(volume, 'Volume', 0, 100);
}
/**
 * Validate boolean parameter
 */
export function validateBoolean(value, name) {
    if (typeof value !== 'boolean') {
        // Try to coerce from string
        if (typeof value === 'string') {
            const lower = value.toLowerCase();
            if (lower === 'true' || lower === 'on' || lower === '1')
                return true;
            if (lower === 'false' || lower === 'off' || lower === '0')
                return false;
        }
        throw new Error(`Invalid ${name}: expected boolean, got ${typeof value}`);
    }
    return value;
}
/**
 * Validate string parameter
 */
export function validateString(value, name, maxLength) {
    if (typeof value !== 'string') {
        throw new Error(`Invalid ${name}: expected string, got ${typeof value}`);
    }
    if (value.trim().length === 0) {
        throw new Error(`${name} cannot be empty`);
    }
    if (maxLength && value.length > maxLength) {
        throw new Error(`${name} exceeds maximum length of ${maxLength}`);
    }
    return value.trim();
}
/**
 * Validate URL parameter
 */
export function validateUrl(url, name = 'URL') {
    const urlString = validateString(url, name);
    try {
        new URL(urlString);
        return urlString;
    }
    catch (error) {
        throw new Error(`Invalid ${name}: ${urlString} is not a valid URL`);
    }
}
/**
 * Validate MQTT topic
 */
export function validateMqttTopic(topic) {
    const topicString = validateString(topic, 'MQTT topic');
    // MQTT topic validation rules
    if (topicString.includes('\0')) {
        throw new Error('MQTT topic cannot contain null characters');
    }
    if (topicString.length > 65535) {
        throw new Error('MQTT topic exceeds maximum length of 65535');
    }
    // Check for invalid wildcard usage
    if (topicString.includes('#') && !topicString.endsWith('#')) {
        throw new Error('MQTT multi-level wildcard # must be at the end');
    }
    return topicString;
}
/**
 * Validate time string in HH:MM format
 */
export function validateTimeString(time) {
    const timeString = validateString(time, 'Time');
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(timeString)) {
        throw new Error(`Invalid time format: ${timeString}. Expected HH:MM (24-hour format)`);
    }
    return timeString;
}
/**
 * Validate day of week (0-6)
 */
export function validateDayOfWeek(day) {
    const dayNum = validateNumericParameter(day, 'Day of week', 0, 6);
    return Math.floor(dayNum);
}
/**
 * Validate array parameter
 */
export function validateArray(value, name, elementValidator) {
    if (!Array.isArray(value)) {
        throw new Error(`Invalid ${name}: expected array, got ${typeof value}`);
    }
    if (elementValidator) {
        return value.map((item, index) => {
            try {
                return elementValidator(item, index);
            }
            catch (error) {
                throw new Error(`Invalid element at index ${index} in ${name}: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    return value;
}
/**
 * Validate RGB color array
 */
export function validateRgbColor(rgb) {
    const arr = validateArray(rgb, 'RGB color');
    if (arr.length !== 3) {
        throw new Error(`RGB color must have exactly 3 values, got ${arr.length}`);
    }
    const [r, g, b] = arr.map((val, i) => validateNumericParameter(val, `RGB[${i}]`, 0, 255));
    return [Math.floor(r), Math.floor(g), Math.floor(b)];
}
/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch (error) {
        logger.warn('Failed to parse JSON', {
            error: error instanceof Error ? error.message : String(error),
            json: json.substring(0, 100),
        });
        return fallback;
    }
}
/**
 * Retry wrapper for async operations
 */
export async function retryAsync(operation, options = {}) {
    const { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2, shouldRetry = () => true, onRetry, } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === maxAttempts || !shouldRetry(lastError)) {
                throw lastError;
            }
            if (onRetry) {
                onRetry(attempt, lastError);
            }
            const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError || new Error('Retry failed');
}
/**
 * Timeout wrapper for async operations
 */
export async function withTimeout(operation, timeoutMs, timeoutError = 'Operation timed out') {
    return Promise.race([
        operation,
        new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutError)), timeoutMs)),
    ]);
}
/**
 * Validate and sanitize object properties
 */
export function sanitizeObject(obj, allowedKeys) {
    if (typeof obj !== 'object' || obj === null) {
        throw new Error('Invalid object: expected object, got ' + typeof obj);
    }
    const sanitized = {};
    const objRecord = obj;
    for (const key of allowedKeys) {
        if (key in objRecord) {
            sanitized[key] = objRecord[key];
        }
    }
    return sanitized;
}
//# sourceMappingURL=validators.js.map