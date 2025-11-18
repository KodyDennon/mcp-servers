/**
 * Query operations for code execution mode
 */
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
export declare function query(options: QueryOptions): Promise<QueryResult>;
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
export declare function transaction(options: TransactionOptions): Promise<TransactionResult>;
/**
 * Get query execution plan
 *
 * @example
 * const plan = await explain({
 *   sql: 'SELECT * FROM users WHERE active = true'
 * });
 */
export declare function explain(options: {
    sql: string;
}): Promise<{
    plan: string;
}>;
//# sourceMappingURL=query.d.ts.map