/**
 * Admin operations for code execution mode
 */
import { query } from './query.js';
/**
 * Get database statistics
 */
export async function getDatabaseStats() {
    const result = await query({
        sql: `
      SELECT
        current_database() as database,
        current_user as user,
        version() as version,
        pg_database_size(current_database()) as size_bytes,
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
    `,
    });
    return result.rows[0];
}
/**
 * Get table sizes
 */
export async function getTableSizes() {
    const result = await query({
        sql: `
      SELECT
        table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
    `,
    });
    return result.rows;
}
/**
 * Vacuum analyze database
 */
export async function vacuumAnalyze(tableName) {
    const sql = tableName
        ? `VACUUM ANALYZE "${tableName}"`
        : 'VACUUM ANALYZE';
    await query({ sql });
}
//# sourceMappingURL=admin.js.map