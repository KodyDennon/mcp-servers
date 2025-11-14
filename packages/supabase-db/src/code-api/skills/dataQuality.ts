/**
 * Data Quality Skills
 * Common patterns for data validation and cleaning
 */

import { query } from '../query.js';
import { DataPipeline } from '../pipeline.js';

/**
 * Find duplicate rows in a table
 */
export async function findDuplicates(
  tableName: string,
  columns: string[]
): Promise<any[]> {
  const columnsList = columns.map(c => `"${c}"`).join(', ');

  const sql = `
    SELECT ${columnsList}, COUNT(*) as duplicate_count
    FROM "${tableName}"
    GROUP BY ${columnsList}
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC
  `;

  const result = await query({ sql });
  return result.rows;
}

/**
 * Find NULL values in specified columns
 */
export async function findNullValues(
  tableName: string,
  columns: string[]
): Promise<Record<string, number>> {
  const nullChecks = columns.map(
    col => `COUNT(CASE WHEN "${col}" IS NULL THEN 1 END) as "${col}_nulls"`
  ).join(', ');

  const sql = `SELECT ${nullChecks} FROM "${tableName}"`;

  const result = await query({ sql });
  return result.rows[0];
}

/**
 * Get column statistics
 */
export async function getColumnStats(
  tableName: string,
  columnName: string
): Promise<any> {
  const sql = `
    SELECT
      COUNT(*) as total_rows,
      COUNT("${columnName}") as non_null_rows,
      COUNT(DISTINCT "${columnName}") as distinct_values,
      COUNT(CASE WHEN "${columnName}" IS NULL THEN 1 END) as null_count
    FROM "${tableName}"
  `;

  const result = await query({ sql });
  return result.rows[0];
}

/**
 * Validate email format in a table
 */
export async function validateEmails(tableName: string): Promise<any> {
  const sql = `
    SELECT email,
      CASE
        WHEN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        THEN 'valid'
        ELSE 'invalid'
      END as status
    FROM "${tableName}"
    WHERE email IS NOT NULL
  `;

  const result = await query({ sql, privacy: 'tokenize' });

  return new DataPipeline(result.rows)
    .groupBy('status')
    .aggregate(emails => ({
      count: emails.length,
      sample: emails.slice(0, 5).map((e: any) => e.email),
    }))
    .result();
}

/**
 * Find outliers in numeric column
 */
export async function findOutliers(
  tableName: string,
  columnName: string,
  threshold: number = 3
): Promise<any[]> {
  const sql = `
    WITH stats AS (
      SELECT
        AVG("${columnName}") as mean,
        STDDEV("${columnName}") as stddev
      FROM "${tableName}"
      WHERE "${columnName}" IS NOT NULL
    )
    SELECT t.*,
      (t."${columnName}" - s.mean) / s.stddev as z_score
    FROM "${tableName}" t, stats s
    WHERE ABS((t."${columnName}" - s.mean) / s.stddev) > ${threshold}
  `;

  const result = await query({ sql });
  return result.rows;
}
