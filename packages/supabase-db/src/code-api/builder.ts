/**
 * Composable query builder for code execution mode
 * Build complex SQL queries programmatically
 */

import { query } from './query.js';
import type { QueryResult } from './types.js';

export class QueryBuilder {
  private tableName: string;
  private selectColumns: string[];
  private whereConditions: string[];
  private joinClauses: Array<{ type: string; table: string; on: string }>;
  private orderByColumns: Array<{ column: string; direction: 'ASC' | 'DESC' }>;
  private groupByColumns: string[];
  private havingConditions: string[];
  private limitValue: number | null;
  private offsetValue: number | null;

  constructor(table: string) {
    this.tableName = table;
    this.selectColumns = ['*'];
    this.whereConditions = [];
    this.joinClauses = [];
    this.orderByColumns = [];
    this.groupByColumns = [];
    this.havingConditions = [];
    this.limitValue = null;
    this.offsetValue = null;
  }

  /**
   * Select specific columns
   */
  select(...columns: string[]): this {
    this.selectColumns = columns;
    return this;
  }

  /**
   * Add WHERE condition
   */
  where(condition: string): this {
    this.whereConditions.push(condition);
    return this;
  }

  /**
   * Add OR WHERE condition
   */
  orWhere(condition: string): this {
    if (this.whereConditions.length > 0) {
      const lastCondition = this.whereConditions.pop()!;
      this.whereConditions.push(`(${lastCondition} OR ${condition})`);
    } else {
      this.whereConditions.push(condition);
    }
    return this;
  }

  /**
   * Add JOIN clause
   */
  join(table: string, on: string, type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' = 'INNER'): this {
    this.joinClauses.push({ type, table, on });
    return this;
  }

  /**
   * Add INNER JOIN
   */
  innerJoin(table: string, on: string): this {
    return this.join(table, on, 'INNER');
  }

  /**
   * Add LEFT JOIN
   */
  leftJoin(table: string, on: string): this {
    return this.join(table, on, 'LEFT');
  }

  /**
   * Add RIGHT JOIN
   */
  rightJoin(table: string, on: string): this {
    return this.join(table, on, 'RIGHT');
  }

  /**
   * Add GROUP BY
   */
  groupBy(...columns: string[]): this {
    this.groupByColumns.push(...columns);
    return this;
  }

  /**
   * Add HAVING condition
   */
  having(condition: string): this {
    this.havingConditions.push(condition);
    return this;
  }

  /**
   * Add ORDER BY
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByColumns.push({ column, direction });
    return this;
  }

  /**
   * Add LIMIT
   */
  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  /**
   * Add OFFSET
   */
  offset(value: number): this {
    this.offsetValue = value;
    return this;
  }

  /**
   * Build the SQL query string
   */
  build(): string {
    let sql = `SELECT ${this.selectColumns.join(', ')} FROM ${this.tableName}`;

    // Add JOINs
    if (this.joinClauses.length > 0) {
      sql += ' ' + this.joinClauses
        .map(j => `${j.type} JOIN ${j.table} ON ${j.on}`)
        .join(' ');
    }

    // Add WHERE
    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.join(' AND ');
    }

    // Add GROUP BY
    if (this.groupByColumns.length > 0) {
      sql += ' GROUP BY ' + this.groupByColumns.join(', ');
    }

    // Add HAVING
    if (this.havingConditions.length > 0) {
      sql += ' HAVING ' + this.havingConditions.join(' AND ');
    }

    // Add ORDER BY
    if (this.orderByColumns.length > 0) {
      sql += ' ORDER BY ' + this.orderByColumns
        .map(o => `${o.column} ${o.direction}`)
        .join(', ');
    }

    // Add LIMIT
    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    // Add OFFSET
    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return sql;
  }

  /**
   * Execute the query
   */
  async execute(): Promise<QueryResult> {
    const sql = this.build();
    return await query({ sql });
  }

  /**
   * Get the SQL string (alias for build)
   */
  toString(): string {
    return this.build();
  }

  /**
   * Create a new QueryBuilder instance
   */
  static from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  }
}
