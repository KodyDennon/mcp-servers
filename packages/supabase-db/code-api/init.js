/**
 * Initialization module for Code API
 * Handles singleton instances and initialization
 */
import { QueryCache } from "./cache.js";
import { PrivacyFilter } from "./privacy.js";
// Global instances (singleton pattern for code execution context)
let connectionManager = null;
let queryCache = null;
let privacyFilter = null;
/**
 * Initialize the code API with a connection manager
 */
export function initialize(manager) {
  connectionManager = manager;
  queryCache = new QueryCache();
  privacyFilter = new PrivacyFilter();
}
/**
 * Get the connection manager instance
 */
export function getConnectionManager() {
  if (!connectionManager) {
    throw new Error("Code API not initialized. Call initialize() first.");
  }
  return connectionManager;
}
/**
 * Get the query cache instance
 */
export function getQueryCache() {
  if (!queryCache) {
    throw new Error("Code API not initialized. Call initialize() first.");
  }
  return queryCache;
}
/**
 * Get the privacy filter instance
 */
export function getPrivacyFilter() {
  if (!privacyFilter) {
    throw new Error("Code API not initialized. Call initialize() first.");
  }
  return privacyFilter;
}
//# sourceMappingURL=init.js.map
