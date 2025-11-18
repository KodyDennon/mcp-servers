/**
 * Reporting Skills
 * Common patterns for generating reports and summaries
 */
/**
 * Generate daily summary report
 */
export declare function getDailySummary(date?: string): Promise<any>;
/**
 * Generate top N report
 */
export declare function getTopN(
  tableName: string,
  valueColumn: string,
  groupBy: string,
  n?: number,
): Promise<any[]>;
/**
 * Generate time series report
 */
export declare function getTimeSeries(
  tableName: string,
  dateColumn: string,
  valueColumn: string,
  days?: number,
): Promise<any[]>;
/**
 * Generate cohort report (streaming for large datasets)
 */
export declare function getCohortReport(tableName: string): Promise<any>;
//# sourceMappingURL=reporting.d.ts.map
