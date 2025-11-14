/**
 * Reporting Skills
 * Common patterns for generating reports and summaries
 */
import { query } from '../query.js';
import { DataPipeline } from '../pipeline.js';
import { streamAggregate } from '../streaming.js';
/**
 * Generate daily summary report
 */
export async function getDailySummary(date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const [users, orders, revenue] = await Promise.all([
        query({
            sql: `
        SELECT COUNT(*) as count
        FROM users
        WHERE DATE(created_at) = '${targetDate}'
      `,
            cache: true,
        }),
        query({
            sql: `
        SELECT COUNT(*) as count
        FROM orders
        WHERE DATE(created_at) = '${targetDate}'
      `,
            cache: true,
        }),
        query({
            sql: `
        SELECT SUM(total) as amount
        FROM orders
        WHERE DATE(created_at) = '${targetDate}'
      `,
            cache: true,
        }),
    ]);
    return {
        date: targetDate,
        new_users: users.rows[0].count,
        new_orders: orders.rows[0].count,
        revenue: revenue.rows[0].amount || 0,
    };
}
/**
 * Generate top N report
 */
export async function getTopN(tableName, valueColumn, groupBy, n = 10) {
    const sql = `
    SELECT
      "${groupBy}",
      SUM("${valueColumn}") as total
    FROM "${tableName}"
    GROUP BY "${groupBy}"
    ORDER BY total DESC
    LIMIT ${n}
  `;
    const result = await query({ sql, cache: true });
    return result.rows;
}
/**
 * Generate time series report
 */
export async function getTimeSeries(tableName, dateColumn, valueColumn, days = 30) {
    const sql = `
    SELECT
      DATE("${dateColumn}") as date,
      COUNT(*) as count,
      SUM("${valueColumn}") as total
    FROM "${tableName}"
    WHERE "${dateColumn}" > NOW() - INTERVAL '${days} days'
    GROUP BY DATE("${dateColumn}")
    ORDER BY date
  `;
    const result = await query({ sql, cache: true });
    return result.rows;
}
/**
 * Generate cohort report (streaming for large datasets)
 */
export async function getCohortReport(tableName) {
    return await streamAggregate(`SELECT * FROM "${tableName}" ORDER BY created_at`, (batch, accumulator) => {
        const pipeline = new DataPipeline(batch);
        // Process batch and aggregate
        const cohorts = pipeline
            .groupBy(row => {
            const date = new Date(row.created_at);
            return `${date.getFullYear()}-${date.getMonth() + 1}`;
        })
            .result();
        // Merge with accumulator
        cohorts.forEach((cohort) => {
            if (!accumulator[cohort.key]) {
                accumulator[cohort.key] = { count: 0, items: [] };
            }
            accumulator[cohort.key].count += cohort.items.length;
        });
        return accumulator;
    }, {});
}
//# sourceMappingURL=reporting.js.map