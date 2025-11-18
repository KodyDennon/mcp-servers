import pg from "pg";
import { promises as fs } from "fs";
import { resolve } from "path";
const { Pool } = pg;
// Helper to detect dangerous queries
export function analyzeSQLSafety(sql) {
  const warnings = [];
  const upperSQL = sql.toUpperCase().trim();
  // Check for DELETE without WHERE
  if (upperSQL.includes("DELETE FROM") && !upperSQL.includes("WHERE")) {
    warnings.push(
      "⚠️ DELETE without WHERE clause - this will delete ALL rows!",
    );
  }
  // Check for UPDATE without WHERE
  if (
    upperSQL.includes("UPDATE") &&
    !upperSQL.includes("WHERE") &&
    upperSQL.includes("SET")
  ) {
    warnings.push(
      "⚠️ UPDATE without WHERE clause - this will update ALL rows!",
    );
  }
  // Check for DROP TABLE
  if (upperSQL.includes("DROP TABLE")) {
    warnings.push(
      "⚠️ DROP TABLE detected - this will permanently delete a table!",
    );
  }
  // Check for TRUNCATE
  if (upperSQL.includes("TRUNCATE")) {
    warnings.push("⚠️ TRUNCATE detected - this will delete all rows!");
  }
  return warnings;
}
// Helper to format query results
export function formatQueryResult(result, rowLimit = null) {
  const output = {
    rowCount: result.rowCount,
    rows: result.rows,
    command: result.command,
  };
  if (rowLimit && result.rows.length >= rowLimit) {
    output.warning = `Result limited to ${rowLimit} rows. Use a higher limit or add LIMIT clause for more control.`;
  }
  return output;
}
export async function getDatabaseSchema(pool) {
  const client = await pool.connect();
  try {
    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    const schema = {};
    for (const table of tables) {
      const tableName = table.table_name;
      const { rows: columns } = await client.query(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `,
        [tableName],
      );
      const { rows: constraints } = await client.query(
        `
        SELECT conname AS constraint_name, contype AS constraint_type, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = ($1)::regclass;
      `,
        [tableName],
      );
      schema[tableName] = {
        columns: columns.map((col) => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === "YES",
          default: col.column_default,
        })),
        constraints: constraints.map((con) => ({
          name: con.constraint_name,
          type: con.constraint_type,
          definition: con.definition,
        })),
      };
    }
    return schema;
  } finally {
    client.release();
  }
}
export async function getLocalSchemaFromMigrations(migrationsDir) {
  const schema = {};
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();
  for (const file of sqlFiles) {
    const filePath = resolve(migrationsDir, file);
    const sql = await fs.readFile(filePath, "utf8");
    // Simplified parsing for CREATE TABLE and ALTER TABLE ADD COLUMN
    const createTableRegex =
      /CREATE TABLE\s+(?:public\.)?"?(\w+)"?\s*\(([^;]+)\);?/gi;
    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnsDef = match[2];
      schema[tableName] = schema[tableName] || { columns: [], constraints: [] };
      const columnRegex =
        /"?(\w+)"?\s+(\w+)(?:\s+\(([^)]+)\))?(?:\s+NOT NULL)?(?:\s+DEFAULT\s+([^,\s]+))?/gi;
      let colMatch;
      while ((colMatch = columnRegex.exec(columnsDef)) !== null) {
        schema[tableName].columns.push({
          name: colMatch[1],
          type: colMatch[2],
          nullable: !colMatch[0].includes("NOT NULL"),
          default: colMatch[4] || null,
        });
      }
    }
    const addColumnRegex =
      /ALTER TABLE\s+(?:public\.)?"?(\w+)"?\s+ADD COLUMN\s+"?(\w+)"?\s+(\w+)(?:\s+\(([^)]+)\))?(?:\s+NOT NULL)?(?:\s+DEFAULT\s+([^;]+))?;?/gi;
    while ((match = addColumnRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnName = match[2];
      const columnType = match[3];
      schema[tableName] = schema[tableName] || { columns: [], constraints: [] };
      schema[tableName].columns.push({
        name: columnName,
        type: columnType,
        nullable: !match[0].includes("NOT NULL"),
        default: match[5] || null,
      });
    }
  }
  return schema;
}
//# sourceMappingURL=sqlHelpers.js.map
