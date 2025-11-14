/**
 * Query operations for code execution mode
 */

import { getConnectionManager, getQueryCache, getPrivacyFilter } from './init.js';
import type { QueryOptions, QueryResult, TransactionOptions, TransactionResult } from './types.js';

/**
 * Execute a SQL query
 *
 * @example
 * const users = await query({
 *   sql: 'SELECT * FROM users WHERE active = true',
 *   rowLimit: 100,
 *   cache: true,
 *   privacy: 'tokenize'
 * });
 */
export async function query(options: QueryOptions): Promise<QueryResult> {
  const { sql, rowLimit = 100, cache = false, privacy = 'none' } = options;

  const connectionManager = getConnectionManager();
  const pool = connectionManager.getConnection();
  const client = await pool.connect();

  try {
    // Check cache if enabled
    if (cache) {
      const queryCache = getQueryCache();
      const cached = queryCache.get(sql);
      if (cached) {
        return applyPrivacy(cached, privacy);
      }
    }

    const result = await client.query(sql);

    const queryResult: QueryResult = {
      rowCount: result.rowCount || 0,
      rows: result.rows.slice(0, rowLimit),
      command: result.command,
    };

    if (rowLimit && result.rows.length >= rowLimit) {
      queryResult.warning = `Result limited to ${rowLimit} rows`;
    }

    // Cache result if enabled
    if (cache) {
      const queryCache = getQueryCache();
      queryCache.set(sql, queryResult);
    }

    // Apply privacy filter
    return applyPrivacy(queryResult, privacy);
  } finally {
    client.release();
  }
}

/**
 * Execute multiple SQL statements in a transaction
 *
 * @example
 * const result = await transaction({
 *   sqlStatements: [
 *     "INSERT INTO users (name) VALUES ('Alice')",
 *     "UPDATE stats SET user_count = user_count + 1"
 *   ]
 * });
 */
export async function transaction(options: TransactionOptions): Promise<TransactionResult> {
  const { sqlStatements } = options;

  const connectionManager = getConnectionManager();
  const pool = connectionManager.getConnection();
  const client = await pool.connect();

  try {
    const results: TransactionResult['results'] = [];

    await client.query('BEGIN');

    try {
      for (const sql of sqlStatements) {
        const result = await client.query(sql);
        results.push({
          command: result.command,
          rowCount: result.rowCount || undefined,
        });
      }

      await client.query('COMMIT');
      return { results };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    client.release();
  }
}

/**
 * Get query execution plan
 *
 * @example
 * const plan = await explain({
 *   sql: 'SELECT * FROM users WHERE active = true'
 * });
 */
export async function explain(options: { sql: string }): Promise<{ plan: string }> {
  const { sql } = options;

  const connectionManager = getConnectionManager();
  const pool = connectionManager.getConnection();
  const client = await pool.connect();

  try {
    const result = await client.query(`EXPLAIN (FORMAT JSON) ${sql}`);
    return {
      plan: JSON.stringify(result.rows[0]['QUERY PLAN'], null, 2),
    };
  } finally {
    client.release();
  }
}

/**
 * Apply privacy filter to query results
 */
function applyPrivacy(result: QueryResult, privacy: string): QueryResult {
  if (privacy === 'none') {
    return result;
  }

  const privacyFilter = getPrivacyFilter();

  return {
    ...result,
    rows: privacyFilter.filterResults(result.rows, privacy as any),
  };
}
