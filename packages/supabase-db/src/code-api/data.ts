/**
 * Data operations for code execution mode
 */

import { query, transaction } from './query.js';
import type { DataImportOptions, RowOperation } from './types.js';

/**
 * Insert a single row
 */
export async function insertRow(options: RowOperation): Promise<any> {
  const { tableName, data } = options;

  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `
    INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await query({ sql });
  return result.rows[0];
}

/**
 * Update a row by ID
 */
export async function updateRow(options: RowOperation): Promise<any> {
  const { tableName, rowId, data } = options;

  if (!rowId) {
    throw new Error('rowId is required for update operation');
  }

  const columns = Object.keys(data);
  const values = Object.values(data);
  const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');

  const sql = `
    UPDATE "${tableName}"
    SET ${setClause}
    WHERE id = $${values.length + 1}
    RETURNING *
  `;

  const result = await query({ sql });
  return result.rows[0];
}

/**
 * Delete a row by ID
 */
export async function deleteRow(options: RowOperation): Promise<any> {
  const { tableName, rowId } = options;

  if (!rowId) {
    throw new Error('rowId is required for delete operation');
  }

  const sql = `
    DELETE FROM "${tableName}"
    WHERE id = $1
    RETURNING *
  `;

  const result = await query({ sql });
  return result.rows[0];
}

/**
 * Bulk insert rows
 */
export async function bulkInsert(
  tableName: string,
  rows: Record<string, any>[]
): Promise<{ inserted: number }> {
  if (rows.length === 0) {
    return { inserted: 0 };
  }

  const columns = Object.keys(rows[0]);
  const valuesClauses: string[] = [];
  const allValues: any[] = [];

  rows.forEach((row, rowIndex) => {
    const placeholders = columns.map((_, colIndex) =>
      `$${rowIndex * columns.length + colIndex + 1}`
    );
    valuesClauses.push(`(${placeholders.join(', ')})`);
    allValues.push(...columns.map(col => row[col]));
  });

  const sql = `
    INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
    VALUES ${valuesClauses.join(', ')}
  `;

  const result = await query({ sql });
  return { inserted: result.rowCount };
}

/**
 * Import data from CSV or JSON
 */
export async function importData(options: DataImportOptions): Promise<{ imported: number }> {
  const { tableName, format, data } = options;

  let rows: Record<string, any>[];

  if (format === 'json') {
    rows = JSON.parse(data);
  } else if (format === 'csv') {
    // Simple CSV parser
    const lines = data.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, any> = {};
      headers.forEach((header, i) => {
        row[header] = values[i];
      });
      return row;
    });
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  const result = await bulkInsert(tableName, rows);
  return { imported: result.inserted };
}

/**
 * Upsert (insert or update) a row
 */
export async function upsert(
  tableName: string,
  data: Record<string, any>,
  conflictColumn: string = 'id'
): Promise<any> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const updateSet = columns
    .filter(col => col !== conflictColumn)
    .map(col => `"${col}" = EXCLUDED."${col}"`)
    .join(', ');

  const sql = `
    INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
    VALUES (${placeholders})
    ON CONFLICT ("${conflictColumn}")
    DO UPDATE SET ${updateSet}
    RETURNING *
  `;

  const result = await query({ sql });
  return result.rows[0];
}
