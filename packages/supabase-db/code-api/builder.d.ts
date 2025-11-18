/**
 * Composable query builder for code execution mode
 * Build complex SQL queries programmatically
 */
import type { QueryResult } from "./types.js";
export declare class QueryBuilder {
  private tableName;
  private selectColumns;
  private whereConditions;
  private joinClauses;
  private orderByColumns;
  private groupByColumns;
  private havingConditions;
  private limitValue;
  private offsetValue;
  constructor(table: string);
  /**
   * Select specific columns
   */
  select(...columns: string[]): this;
  /**
   * Add WHERE condition
   */
  where(condition: string): this;
  /**
   * Add OR WHERE condition
   */
  orWhere(condition: string): this;
  /**
   * Add JOIN clause
   */
  join(
    table: string,
    on: string,
    type?: "INNER" | "LEFT" | "RIGHT" | "FULL",
  ): this;
  /**
   * Add INNER JOIN
   */
  innerJoin(table: string, on: string): this;
  /**
   * Add LEFT JOIN
   */
  leftJoin(table: string, on: string): this;
  /**
   * Add RIGHT JOIN
   */
  rightJoin(table: string, on: string): this;
  /**
   * Add GROUP BY
   */
  groupBy(...columns: string[]): this;
  /**
   * Add HAVING condition
   */
  having(condition: string): this;
  /**
   * Add ORDER BY
   */
  orderBy(column: string, direction?: "ASC" | "DESC"): this;
  /**
   * Add LIMIT
   */
  limit(value: number): this;
  /**
   * Add OFFSET
   */
  offset(value: number): this;
  /**
   * Build the SQL query string
   */
  build(): string;
  /**
   * Execute the query
   */
  execute(): Promise<QueryResult>;
  /**
   * Get the SQL string (alias for build)
   */
  toString(): string;
  /**
   * Create a new QueryBuilder instance
   */
  static from(table: string): QueryBuilder;
}
//# sourceMappingURL=builder.d.ts.map
