/**
 * Supabase DB Code API
 * Main entry point for code execution mode
 *
 * Usage:
 * import { query, cache, pipeline } from './servers/supabase-db';
 *
 * const users = await query({sql: 'SELECT * FROM users'});
 * const filtered = new DataPipeline(users.rows).filter(u => u.active).result();
 */

// Re-export initialization
export { initialize, getConnectionManager, getQueryCache, getPrivacyFilter } from './init.js';

// Re-export all modules
export * from './query.js';
export * from './schema.js';
export * from './data.js';
export * from './migration.js';
export * from './admin.js';
export * from './cache.js';
export * from './privacy.js';
export * from './builder.js';
export * from './pipeline.js';
export * from './streaming.js';
export * from './types.js';

// Convenience exports for common classes
export { QueryBuilder } from './builder.js';
export { DataPipeline } from './pipeline.js';
export { QueryCache } from './cache.js';
export { PrivacyFilter } from './privacy.js';
