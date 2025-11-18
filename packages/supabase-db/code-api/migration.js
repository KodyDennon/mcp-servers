/**
 * Migration operations for code execution mode
 */
import { query, transaction } from './query.js';
/**
 * Run a migration
 */
export async function runMigration(options) {
    const { name, sql, direction = 'up' } = options;
    await transaction({
        sqlStatements: [
            sql,
            `INSERT INTO migrations (name, direction, executed_at) VALUES ('${name}', '${direction}', NOW())`,
        ],
    });
}
/**
 * List all executed migrations
 */
export async function listMigrations() {
    const result = await query({
        sql: `
      SELECT name, direction, executed_at
      FROM migrations
      ORDER BY executed_at DESC
    `,
    });
    return result.rows;
}
/**
 * Create migrations table if it doesn't exist
 */
export async function initMigrations() {
    await query({
        sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        direction VARCHAR(10) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `,
    });
}
//# sourceMappingURL=migration.js.map