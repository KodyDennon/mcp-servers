/**
 * Data operations for code execution mode
 */
import type { DataImportOptions, RowOperation } from "./types.js";
/**
 * Insert a single row
 */
export declare function insertRow(options: RowOperation): Promise<any>;
/**
 * Update a row by ID
 */
export declare function updateRow(options: RowOperation): Promise<any>;
/**
 * Delete a row by ID
 */
export declare function deleteRow(options: RowOperation): Promise<any>;
/**
 * Bulk insert rows
 */
export declare function bulkInsert(
  tableName: string,
  rows: Record<string, any>[],
): Promise<{
  inserted: number;
}>;
/**
 * Import data from CSV or JSON
 */
export declare function importData(options: DataImportOptions): Promise<{
  imported: number;
}>;
/**
 * Upsert (insert or update) a row
 */
export declare function upsert(
  tableName: string,
  data: Record<string, any>,
  conflictColumn?: string,
): Promise<any>;
//# sourceMappingURL=data.d.ts.map
