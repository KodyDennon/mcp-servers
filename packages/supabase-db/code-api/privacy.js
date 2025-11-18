/**
 * Privacy filter for protecting sensitive data
 * Prevents PII from reaching the LLM context
 */
import crypto from "crypto";
export class PrivacyFilter {
  piiFields;
  defaultStrategy;
  allowList;
  tokenCache;
  constructor(config = {}) {
    this.piiFields = new Set(
      config.piiFields || [
        "email",
        "password",
        "ssn",
        "social_security",
        "phone",
        "phone_number",
        "address",
        "street",
        "credit_card",
        "card_number",
        "cvv",
        "dob",
        "date_of_birth",
        "ip_address",
        "passport",
        "driver_license",
      ],
    );
    this.defaultStrategy = config.strategy || "tokenize";
    this.allowList = new Set(config.allowList || []);
    this.tokenCache = new Map();
  }
  /**
   * Filter results to protect PII
   */
  filterResults(rows, strategy = this.defaultStrategy) {
    return rows.map((row) => this.filterRow(row, strategy));
  }
  /**
   * Filter a single row
   */
  filterRow(row, strategy = this.defaultStrategy) {
    const filtered = {};
    for (const [key, value] of Object.entries(row)) {
      // Skip if in allow list
      if (this.allowList.has(key)) {
        filtered[key] = value;
        continue;
      }
      // Check if field contains PII
      if (this.isPIIField(key)) {
        filtered[key] = this.applyStrategy(value, strategy, key);
      } else {
        filtered[key] = value;
      }
    }
    return filtered;
  }
  /**
   * Check if a field name suggests PII
   */
  isPIIField(fieldName) {
    const normalized = fieldName.toLowerCase();
    // Direct match
    if (this.piiFields.has(normalized)) {
      return true;
    }
    // Partial match (e.g., "user_email", "customer_phone")
    for (const piiField of this.piiFields) {
      if (normalized.includes(piiField)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Apply privacy strategy to a value
   */
  applyStrategy(value, strategy, fieldName) {
    if (value === null || value === undefined) {
      return value;
    }
    const stringValue = String(value);
    switch (strategy) {
      case "tokenize":
        return this.tokenize(stringValue, fieldName);
      case "redact":
        return "[REDACTED]";
      case "hash":
        return this.hash(stringValue);
      default:
        return stringValue;
    }
  }
  /**
   * Tokenize a value (consistent tokens for same values)
   */
  tokenize(value, fieldName) {
    const cacheKey = `${fieldName}:${value}`;
    // Check cache for consistent tokens
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey);
    }
    // Generate token
    const hash = this.hash(value).slice(0, 8);
    const token = `[${fieldName.toUpperCase()}_${hash}]`;
    this.tokenCache.set(cacheKey, token);
    return token;
  }
  /**
   * Hash a value (one-way)
   */
  hash(value) {
    return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
  }
  /**
   * Add custom PII field
   */
  addPIIField(fieldName) {
    this.piiFields.add(fieldName.toLowerCase());
  }
  /**
   * Remove PII field
   */
  removePIIField(fieldName) {
    this.piiFields.delete(fieldName.toLowerCase());
  }
  /**
   * Add field to allow list (won't be filtered)
   */
  addToAllowList(fieldName) {
    this.allowList.add(fieldName);
  }
  /**
   * Clear token cache
   */
  clearCache() {
    this.tokenCache.clear();
  }
}
//# sourceMappingURL=privacy.js.map
