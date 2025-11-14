/**
 * Initialization module for Code API
 * Handles singleton instances and initialization
 */

import { ConnectionManager } from '../connectionManager.js';
import { QueryCache } from './cache.js';
import { PrivacyFilter } from './privacy.js';

// Global instances (singleton pattern for code execution context)
let connectionManager: ConnectionManager | null = null;
let queryCache: QueryCache | null = null;
let privacyFilter: PrivacyFilter | null = null;

/**
 * Initialize the code API with a connection manager
 */
export function initialize(manager: ConnectionManager) {
  connectionManager = manager;
  queryCache = new QueryCache();
  privacyFilter = new PrivacyFilter();
}

/**
 * Get the connection manager instance
 */
export function getConnectionManager(): ConnectionManager {
  if (!connectionManager) {
    throw new Error('Code API not initialized. Call initialize() first.');
  }
  return connectionManager;
}

/**
 * Get the query cache instance
 */
export function getQueryCache(): QueryCache {
  if (!queryCache) {
    throw new Error('Code API not initialized. Call initialize() first.');
  }
  return queryCache;
}

/**
 * Get the privacy filter instance
 */
export function getPrivacyFilter(): PrivacyFilter {
  if (!privacyFilter) {
    throw new Error('Code API not initialized. Call initialize() first.');
  }
  return privacyFilter;
}
