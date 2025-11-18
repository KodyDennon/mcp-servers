/**
 * Schema operations for code execution mode
 */
import type { TableSchema, CreateTableOptions, IndexOptions } from "./types.js";
/**
 * List all tables in the database
 */
export declare function listTables(): Promise<string[]>;
/**
 * Get schema for a specific table
 */
export declare function getTableSchema(tableName: string): Promise<TableSchema>;
/**
 * Create a new table
 */
export declare function createTable(options: CreateTableOptions): Promise<void>;
/**
 * Drop a table
 */
export declare function dropTable(
  tableName: string,
  cascade?: boolean,
): Promise<void>;
/**
 * Add a column to a table
 */
export declare function addColumn(
  tableName: string,
  columnName: string,
  columnType: string,
  options?: {
    nullable?: boolean;
    defaultValue?: any;
  },
): Promise<void>;
/**
 * Drop a column from a table
 */
export declare function dropColumn(
  tableName: string,
  columnName: string,
): Promise<void>;
/**
 * Create an index
 */
export declare function createIndex(options: IndexOptions): Promise<void>;
/**
 * List all indexes for a table
 */
export declare function listIndexes(tableName: string): Promise<any[]>;
//# sourceMappingURL=schema.d.ts.map
