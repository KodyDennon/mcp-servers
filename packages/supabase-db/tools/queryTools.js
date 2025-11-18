import { z } from "zod";
import { analyzeSQLSafety, formatQueryResult } from "../utils/sqlHelpers.js";
export const queryTool = {
  name: "query",
  description:
    "Executes a read-only SQL query against the active database connection. Use this for SELECT statements. Be mindful of performance for large datasets. Do not use for INSERT, UPDATE, DELETE, or DDL statements.",
  input_schema: z.object({
    sql: z.string().describe("The SQL SELECT query to execute."),
    rowLimit: z
      .number()
      .int()
      .optional()
      .describe(
        "Optional: Maximum number of rows to return. Defaults to 100. Set to 0 for no limit.",
      ),
  }),
  output_schema: z.object({
    rowCount: z.number().int().describe("The number of rows returned."),
    rows: z
      .array(z.record(z.any()))
      .describe("The returned rows as an array of objects."),
    command: z.string().describe("The SQL command executed."),
    warning: z
      .string()
      .optional()
      .describe("Any warnings generated during query execution."),
  }),
};
export const queryTransactionTool = {
  name: "queryTransaction",
  description:
    "Executes a series of SQL statements within a single transaction. Use this for INSERT, UPDATE, DELETE, or DDL statements, or any sequence of operations that must be atomic. The transaction will be rolled back if any statement fails. Provide an array of SQL statements.",
  input_schema: z.object({
    sqlStatements: z
      .array(z.string())
      .describe("An array of SQL statements to execute within a transaction."),
  }),
  output_schema: z.object({
    results: z
      .array(
        z.object({
          command: z.string().describe("The SQL command executed."),
          rowCount: z
            .number()
            .int()
            .optional()
            .describe("The number of rows affected, if applicable."),
        }),
      )
      .describe("An array of results for each statement in the transaction."),
  }),
};
export const explainQueryTool = {
  name: "explainQuery",
  description:
    "Provides the execution plan for a given SQL query without actually running it. Useful for optimizing query performance. Works for SELECT, INSERT, UPDATE, DELETE statements.",
  input_schema: z.object({
    sql: z.string().describe("The SQL query to explain."),
  }),
  output_schema: z.object({
    plan: z.string().describe("The query execution plan."),
  }),
};
export async function handleQueryToolCall(toolName, input, connectionManager) {
  const pool = connectionManager.getConnection();
  const client = await pool.connect();
  try {
    switch (toolName) {
      case queryTool.name: {
        const { sql, rowLimit = 100 } = input;
        const warnings = analyzeSQLSafety(sql);
        if (warnings.length > 0) {
          throw new Error(`Unsafe query detected: ${warnings.join("; ")}`);
        }
        const result = await client.query(sql);
        return formatQueryResult(result, rowLimit);
      }
      case queryTransactionTool.name: {
        const { sqlStatements } = input;
        const results = [];
        await client.query("BEGIN");
        try {
          for (const sql of sqlStatements) {
            const warnings = analyzeSQLSafety(sql);
            if (warnings.length > 0) {
              throw new Error(`Unsafe query detected: ${warnings.join("; ")}`);
            }
            const result = await client.query(sql);
            results.push({
              command: result.command,
              rowCount: result.rowCount,
            });
          }
          await client.query("COMMIT");
          return { results };
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }
      case explainQueryTool.name: {
        const { sql } = input;
        const result = await client.query(`EXPLAIN (FORMAT JSON) ${sql}`);
        return { plan: JSON.stringify(result.rows[0]["QUERY PLAN"], null, 2) };
      }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } finally {
    client.release();
  }
}
//# sourceMappingURL=queryTools.js.map
