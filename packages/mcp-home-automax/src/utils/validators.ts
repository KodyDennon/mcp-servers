/**
 * Input validation utilities for edge case handling
 */

import { Logger, LoggerFactory } from './Logger.js';

const logger = LoggerFactory.getLogger('Validators');

/**
 * Validate and sanitize device ID
 */
export function validateDeviceId(deviceId: unknown): string {
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
export function validateNumericParameter(
  value: unknown,
  name: string,
  min?: number,
  max?: number
): number {
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
export function validateTemperature(temp: unknown): number {
  return validateNumericParameter(temp, 'Temperature', -50, 50);
}

/**
 * Validate brightness parameter
 */
export function validateBrightness(brightness: unknown): number {
  return validateNumericParameter(brightness, 'Brightness', 0, 100);
}

/**
 * Validate position parameter (for covers)
 */
export function validatePosition(position: unknown): number {
  return validateNumericParameter(position, 'Position', 0, 100);
}

/**
 * Validate volume parameter
 */
export function validateVolume(volume: unknown): number {
  return validateNumericParameter(volume, 'Volume', 0, 100);
}

/**
 * Validate boolean parameter
 */
export function validateBoolean(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean') {
    // Try to coerce from string
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === 'on' || lower === '1') return true;
      if (lower === 'false' || lower === 'off' || lower === '0') return false;
    }
    throw new Error(`Invalid ${name}: expected boolean, got ${typeof value}`);
  }
  return value;
}

/**
 * Validate string parameter
 */
export function validateString(value: unknown, name: string, maxLength?: number): string {
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
export function validateUrl(url: unknown, name: string = 'URL'): string {
  const urlString = validateString(url, name);

  try {
    new URL(urlString);
    return urlString;
  } catch (error) {
    throw new Error(`Invalid ${name}: ${urlString} is not a valid URL`);
  }
}

/**
 * Validate MQTT topic
 */
export function validateMqttTopic(topic: unknown): string {
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
export function validateTimeString(time: unknown): string {
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
export function validateDayOfWeek(day: unknown): number {
  const dayNum = validateNumericParameter(day, 'Day of week', 0, 6);
  return Math.floor(dayNum);
}

/**
 * Validate array parameter
 */
export function validateArray<T>(
  value: unknown,
  name: string,
  elementValidator?: (item: unknown, index: number) => T
): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${name}: expected array, got ${typeof value}`);
  }

  if (elementValidator) {
    return value.map((item, index) => {
      try {
        return elementValidator(item, index);
      } catch (error) {
        throw new Error(
          `Invalid element at index ${index} in ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  return value as T[];
}

/**
 * Validate RGB color array
 */
export function validateRgbColor(rgb: unknown): [number, number, number] {
  const arr = validateArray(rgb, 'RGB color');

  if (arr.length !== 3) {
    throw new Error(`RGB color must have exactly 3 values, got ${arr.length}`);
  }

  const [r, g, b] = arr.map((val, i) =>
    validateNumericParameter(val, `RGB[${i}]`, 0, 255)
  );

  return [Math.floor(r), Math.floor(g), Math.floor(b)];
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T = unknown>(
  json: string,
  fallback?: T
): T | undefined {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
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
export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error) => boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
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
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutError: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), timeoutMs)
    ),
  ]);
}

/**
 * Validate and sanitize object properties
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: unknown,
  allowedKeys: string[]
): Partial<T> {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Invalid object: expected object, got ' + typeof obj);
  }

  const sanitized: Record<string, unknown> = {};
  const objRecord = obj as Record<string, unknown>;

  for (const key of allowedKeys) {
    if (key in objRecord) {
      sanitized[key] = objRecord[key];
    }
  }

  return sanitized as Partial<T>;
}
