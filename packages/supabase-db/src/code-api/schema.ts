/**
 * Schema operations for code execution mode
 */

import { query } from './query.js';
import { getConnectionManager } from './init.js';
import type { TableSchema, CreateTableOptions, IndexOptions } from './types.js';

/**
 * List all tables in the database
 */
export async function listTables(): Promise<string[]> {
  const result = await query({
    sql: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `,
  });

  return result.rows.map(row => row.table_name);
}

/**
 * Get schema for a specific table
 */
export async function getTableSchema(tableName: string): Promise<TableSchema> {
  const connectionManager = getConnectionManager();
  const pool = connectionManager.getConnection();
  const client = await pool.connect();

  try {
    // Get columns
    const columnsResult = await client.query(
      `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `,
      [tableName]
    );

    // Get constraints
    const constraintsResult = await client.query(
      `
        SELECT conname AS constraint_name, contype AS constraint_type,
               pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = ($1)::regclass
      `,
      [tableName]
    );

    return {
      tableName,
      columns: columnsResult.rows.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default,
      })),
      constraints: constraintsResult.rows.map((con: any) => ({
        name: con.constraint_name,
        type: con.constraint_type,
        definition: con.definition,
      })),
    };
  } finally {
    client.release();
  }
}

/**
 * Create a new table
 */
export async function createTable(options: CreateTableOptions): Promise<void> {
  const { tableName, columns } = options;

  const columnDefs = columns.map(col => {
    let def = `"${col.name}" ${col.type}`;

    if (col.primaryKey) {
      def += ' PRIMARY KEY';
    }

    if (!col.nullable) {
      def += ' NOT NULL';
    }

    if (col.defaultValue !== undefined) {
      def += ` DEFAULT ${col.defaultValue}`;
    }

    return def;
  });

  const sql = `CREATE TABLE "${tableName}" (${columnDefs.join(', ')})`;

  await query({ sql });
}

/**
 * Drop a table
 */
export async function dropTable(tableName: string, cascade: boolean = false): Promise<void> {
  const sql = `DROP TABLE "${tableName}"${cascade ? ' CASCADE' : ''}`;
  await query({ sql });
}

/**
 * Add a column to a table
 */
export async function addColumn(
  tableName: string,
  columnName: string,
  columnType: string,
  options: { nullable?: boolean; defaultValue?: any } = {}
): Promise<void> {
  let sql = `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType}`;

  if (!options.nullable) {
    sql += ' NOT NULL';
  }

  if (options.defaultValue !== undefined) {
    sql += ` DEFAULT ${options.defaultValue}`;
  }

  await query({ sql });
}

/**
 * Drop a column from a table
 */
export async function dropColumn(tableName: string, columnName: string): Promise<void> {
  const sql = `ALTER TABLE "${tableName}" DROP COLUMN "${columnName}"`;
  await query({ sql });
}

/**
 * Create an index
 */
export async function createIndex(options: IndexOptions): Promise<void> {
  const { tableName, indexName, columns, unique = false } = options;

  const sql = `
    CREATE ${unique ? 'UNIQUE ' : ''}INDEX "${indexName}"
    ON "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
  `;

  await query({ sql });
}

/**
 * List all indexes for a table
 */
export async function listIndexes(tableName: string): Promise<any[]> {
  const result = await query({
    sql: `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = '${tableName}'
      AND schemaname = 'public'
    `,
  });

  return result.rows;
}
