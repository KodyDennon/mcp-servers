/**
 * Data Quality Skills
 * Common patterns for data validation and cleaning
 */
/**
 * Find duplicate rows in a table
 */
export declare function findDuplicates(
  tableName: string,
  columns: string[],
): Promise<any[]>;
/**
 * Find NULL values in specified columns
 */
export declare function findNullValues(
  tableName: string,
  columns: string[],
): Promise<Record<string, number>>;
/**
 * Get column statistics
 */
export declare function getColumnStats(
  tableName: string,
  columnName: string,
): Promise<any>;
/**
 * Validate email format in a table
 */
export declare function validateEmails(tableName: string): Promise<any>;
/**
 * Find outliers in numeric column
 */
export declare function findOutliers(
  tableName: string,
  columnName: string,
  threshold?: number,
): Promise<any[]>;
//# sourceMappingURL=dataQuality.d.ts.map
