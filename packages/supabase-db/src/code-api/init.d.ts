/**
 * Initialization module for Code API
 * Handles singleton instances and initialization
 */
import { ConnectionManager } from '../connectionManager.js';
import { QueryCache } from './cache.js';
import { PrivacyFilter } from './privacy.js';
/**
 * Initialize the code API with a connection manager
 */
export declare function initialize(manager: ConnectionManager): void;
/**
 * Get the connection manager instance
 */
export declare function getConnectionManager(): ConnectionManager;
/**
 * Get the query cache instance
 */
export declare function getQueryCache(): QueryCache;
/**
 * Get the privacy filter instance
 */
export declare function getPrivacyFilter(): PrivacyFilter;
//# sourceMappingURL=init.d.ts.map