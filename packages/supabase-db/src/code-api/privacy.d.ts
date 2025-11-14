/**
 * Privacy filter for protecting sensitive data
 * Prevents PII from reaching the LLM context
 */
import type { PrivacyFilterConfig } from './types.js';
export declare class PrivacyFilter {
    private piiFields;
    private defaultStrategy;
    private allowList;
    private tokenCache;
    constructor(config?: PrivacyFilterConfig);
    /**
     * Filter results to protect PII
     */
    filterResults(rows: Record<string, any>[], strategy?: 'tokenize' | 'redact' | 'hash'): Record<string, any>[];
    /**
     * Filter a single row
     */
    filterRow(row: Record<string, any>, strategy?: 'tokenize' | 'redact' | 'hash'): Record<string, any>;
    /**
     * Check if a field name suggests PII
     */
    private isPIIField;
    /**
     * Apply privacy strategy to a value
     */
    private applyStrategy;
    /**
     * Tokenize a value (consistent tokens for same values)
     */
    private tokenize;
    /**
     * Hash a value (one-way)
     */
    private hash;
    /**
     * Add custom PII field
     */
    addPIIField(fieldName: string): void;
    /**
     * Remove PII field
     */
    removePIIField(fieldName: string): void;
    /**
     * Add field to allow list (won't be filtered)
     */
    addToAllowList(fieldName: string): void;
    /**
     * Clear token cache
     */
    clearCache(): void;
}
//# sourceMappingURL=privacy.d.ts.map