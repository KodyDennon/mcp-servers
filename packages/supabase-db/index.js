#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Load environment variables from repo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../..");
dotenv.config({ path: resolve(repoRoot, ".env") });

const { Pool } = pg;

// Create PostgreSQL connection pool
// Remove sslmode from connection string if present
const connectionString = process.env.POSTGRES_URL_NON_POOLING?.replace(/\?.*$/, '') || process.env.POSTGRES_URL_NON_POOLING;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

// Helper to detect dangerous queries
function analyzeSQLSafety(sql) {
  const warnings = [];
  const upperSQL = sql.toUpperCase().trim();

  // Check for DELETE without WHERE
  if (upperSQL.includes("DELETE FROM") && !upperSQL.includes("WHERE")) {
    warnings.push("⚠️ DELETE without WHERE clause - this will delete ALL rows!");
  }

  // Check for UPDATE without WHERE
  if (upperSQL.includes("UPDATE") && !upperSQL.includes("WHERE") && upperSQL.includes("SET")) {
    warnings.push("⚠️ UPDATE without WHERE clause - this will update ALL rows!");
  }

  // Check for DROP TABLE
  if (upperSQL.includes("DROP TABLE")) {
    warnings.push("⚠️ DROP TABLE detected - this will permanently delete a table!");
  }

  // Check for TRUNCATE
  if (upperSQL.includes("TRUNCATE")) {
    warnings.push("⚠️ TRUNCATE detected - this will delete all rows!");
  }

  return warnings;
}

// Helper to format query results
function formatQueryResult(result, rowLimit = null) {
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

// Server version (sync with package.json)
const SERVER_VERSION = "1.0.0";
const SERVER_NAME = "@kody/supabase-db-mcp-server";

// Create the MCP server
const server = new Server(
  {
    name: "supabase-db",
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query",
        description: "Execute a SQL query on the database. Supports SELECT, INSERT, UPDATE, DELETE, DDL. Returns up to 1000 rows by default.",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "The SQL query to execute",
            },
            rowLimit: {
              type: "number",
              description: "Maximum number of rows to return (default: 1000, use 0 for no limit)",
              default: 1000,
            },
            timeout: {
              type: "number",
              description: "Query timeout in seconds (default: 60)",
              default: 60,
            },
          },
          required: ["sql"],
        },
      },
      {
        name: "queryTransaction",
        description: "Execute multiple SQL queries in a single transaction. All queries succeed together or all fail together.",
        inputSchema: {
          type: "object",
          properties: {
            queries: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of SQL queries to execute in order",
            },
            timeout: {
              type: "number",
              description: "Transaction timeout in seconds (default: 120)",
              default: 120,
            },
          },
          required: ["queries"],
        },
      },
      {
        name: "explainQuery",
        description: "Run EXPLAIN or EXPLAIN ANALYZE on a query to understand its execution plan and performance.",
        inputSchema: {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description: "The SQL query to explain",
            },
            analyze: {
              type: "boolean",
              description: "If true, runs EXPLAIN ANALYZE (actually executes the query). If false, just EXPLAIN.",
              default: false,
            },
            verbose: {
              type: "boolean",
              description: "Include verbose output with additional details",
              default: false,
            },
          },
          required: ["sql"],
        },
      },
      {
        name: "listTables",
        description: "List all tables in the database with their schema, size, and row count.",
        inputSchema: {
          type: "object",
          properties: {
            schema: {
              type: "string",
              description: "Schema name to filter (default: 'public')",
              default: "public",
            },
          },
        },
      },
      {
        name: "getTableSchema",
        description: "Get detailed schema information for a specific table including columns, types, constraints, and indexes.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: {
              type: "string",
              description: "Name of the table",
            },
            schema: {
              type: "string",
              description: "Schema name (default: 'public')",
              default: "public",
            },
          },
          required: ["tableName"],
        },
      },
      {
        name: "listIndexes",
        description: "List all indexes in the database or for a specific table.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: {
              type: "string",
              description: "Optional: filter by table name",
            },
            schema: {
              type: "string",
              description: "Schema name (default: 'public')",
              default: "public",
            },
          },
        },
      },
      {
        name: "listFunctions",
        description: "List all functions, stored procedures, and triggers in the database.",
        inputSchema: {
          type: "object",
          properties: {
            schema: {
              type: "string",
              description: "Schema name (default: 'public')",
              default: "public",
            },
          },
        },
      },
      {
        name: "runMigration",
        description: "Run a specific migration file from the migrations directory.",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Migration filename (relative to packages/db/supabase/migrations/)",
            },
          },
          required: ["filename"],
        },
      },
      {
        name: "listMigrations",
        description: "List all available migration files in the migrations directory.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "getDatabaseStats",
        description: "Get database statistics including size, connection count, and performance metrics.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "createBackup",
        description: "Create a SQL dump backup of the database or specific tables.",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Output filename for the backup (default: backup_TIMESTAMP.sql)",
            },
            tables: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Optional: specific tables to backup (defaults to all)",
            },
          },
        },
      },
      {
        name: "searchSchema",
        description: "Search for tables, columns, or functions by name pattern.",
        inputSchema: {
          type: "object",
          properties: {
            searchTerm: {
              type: "string",
              description: "Search term (supports SQL LIKE patterns with %)",
            },
            searchType: {
              type: "string",
              enum: ["tables", "columns", "functions", "all"],
              description: "What to search for (default: 'all')",
              default: "all",
            },
          },
          required: ["searchTerm"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "query": {
        const { sql, rowLimit = 1000, timeout = 60 } = args;
        const warnings = analyzeSQLSafety(sql);

        const client = await pool.connect();
        try {
          // Set statement timeout
          await client.query(`SET statement_timeout = ${timeout * 1000}`);

          // Execute query with optional row limit
          let finalSQL = sql;
          if (rowLimit > 0 && !sql.toUpperCase().includes("LIMIT")) {
            finalSQL = `${sql} LIMIT ${rowLimit}`;
          }

          const result = await client.query(finalSQL);
          const output = formatQueryResult(result, rowLimit);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    warnings,
                    ...output,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } finally {
          client.release();
        }
      }

      case "queryTransaction": {
        const { queries, timeout = 120 } = args;
        const client = await pool.connect();

        try {
          await client.query(`SET statement_timeout = ${timeout * 1000}`);
          await client.query("BEGIN");

          const results = [];
          for (const sql of queries) {
            const warnings = analyzeSQLSafety(sql);
            const result = await client.query(sql);
            results.push({
              sql,
              warnings,
              rowCount: result.rowCount,
              command: result.command,
            });
          }

          await client.query("COMMIT");

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: "Transaction committed successfully",
                    results,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          await client.query("ROLLBACK");
          throw new Error(`Transaction failed and was rolled back: ${error.message}`);
        } finally {
          client.release();
        }
      }

      case "explainQuery": {
        const { sql, analyze = false, verbose = false } = args;
        const client = await pool.connect();

        try {
          let explainSQL = "EXPLAIN";
          if (analyze) explainSQL += " ANALYZE";
          if (verbose) explainSQL += " VERBOSE";
          explainSQL += ` ${sql}`;

          const result = await client.query(explainSQL);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    plan: result.rows,
                    note: analyze
                      ? "Query was executed (ANALYZE). Results show actual timing and row counts."
                      : "Query was NOT executed. Results show estimated costs only.",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } finally {
          client.release();
        }
      }

      case "listTables": {
        const { schema = "public" } = args;
        const client = await pool.connect();

        try {
          const result = await client.query(
            `
            SELECT
              schemaname,
              tablename,
              pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
              (SELECT COUNT(*) FROM information_schema.columns
               WHERE table_schema = schemaname AND table_name = tablename) as column_count
            FROM pg_tables
            WHERE schemaname = $1
            ORDER BY tablename
          `,
            [schema]
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    tables: result.rows,
                    count: result.rowCount,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } finally {
          client.release();
        }
      }

      case "getTableSchema": {
        const { tableName, schema = "public" } = args;
        const client = await pool.connect();

        try {
          // Get columns
          const columnsResult = await client.query(
            `
            SELECT
              column_name,
              data_type,
              character_maximum_length,
              is_nullable,
              column_default
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position
          `,
            [schema, tableName]
          );

          // Get constraints
          const constraintsResult = await client.query(
            `
            SELECT
              conname as constraint_name,
              contype as constraint_type,
              pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = ($1||'.'||$2)::regclass
          `,
            [schema, tableName]
          );

          // Get indexes
          const indexesResult = await client.query(
            `
            SELECT
              indexname,
              indexdef
            FROM pg_indexes
            WHERE schemaname = $1 AND tablename = $2
          `,
            [schema, tableName]
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    table: tableName,
                    schema: schema,
                    columns: columnsResult.rows,
                    constraints: constraintsResult.rows,
                    indexes: indexesResult.rows,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } finally {
          client.release();
        }
      }

      case "listIndexes": {
        const { tableName, schema = "public" } = args;
        const client = await pool.connect();

        try {
          let query = `
            SELECT
              schemaname,
              tablename,
              indexname,
              indexdef
            FROM pg_indexes
            WHERE schemaname = $1
          `;
          const params = [schema];

          if (tableName) {
            query += ` AND tablename = $2`;
            params.push(tableName);
          }

          query += ` ORDER BY tablename, indexname`;

          const result = await client.query(query, params);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    indexes: result.rows,
                    count: result.rowCount,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } finally {
          client.release();
        }
      }

      case "listFunctions": {
        const { schema = "public" } = args;
        const client = await pool.connect();

        try {
          const result = await client.query(
            `
            SELECT
              routine_name as function_name,
              routine_type as type,
              data_type as return_type
            FROM information_schema.routines
            WHERE routine_schema = $1
            ORDER BY routine_name
          `,
            [schema]
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    functions: result.rows,
                    count: result.rowCount,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } finally {
          client.release();
        }
      }

      case "runMigration": {
        const { filename } = args;
        const migrationPath = resolve(
          repoRoot,
          "packages/db/supabase/migrations",
          filename
        );

        try {
          const sql = await fs.readFile(migrationPath, "utf8");
          const client = await pool.connect();

          try {
            await client.query("BEGIN");
            await client.query(sql);
            await client.query("COMMIT");

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: `Migration ${filename} executed successfully`,
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } catch (error) {
            await client.query("ROLLBACK");
            throw error;
          } finally {
            client.release();
          }
        } catch (error) {
          throw new Error(`Failed to run migration: ${error.message}`);
        }
      }

      case "listMigrations": {
        const migrationsDir = resolve(repoRoot, "packages/db/supabase/migrations");

        try {
          const files = await fs.readdir(migrationsDir);
          const sqlFiles = files
            .filter((f) => f.endsWith(".sql"))
            .sort()
            .map((f) => ({
              filename: f,
              path: `packages/db/supabase/migrations/${f}`,
            }));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    migrations: sqlFiles,
                    count: sqlFiles.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Failed to list migrations: ${error.message}`);
        }
      }

      case "getDatabaseStats": {
        const client = await pool.connect();

        try {
          // Database size
          const sizeResult = await client.query(`
            SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
          `);

          // Connection count
          const connResult = await client.query(`
            SELECT COUNT(*) as active_connections
            FROM pg_stat_activity
            WHERE state = 'active'
          `);

          // Table stats
          const tableStatsResult = await client.query(`
            SELECT
              schemaname,
              COUNT(*) as table_count,
              pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) as total_size
            FROM pg_tables
            WHERE schemaname = 'public'
            GROUP BY schemaname
          `);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    database_size: sizeResult.rows[0].database_size,
                    active_connections: connResult.rows[0].active_connections,
                    table_stats: tableStatsResult.rows,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } finally {
          client.release();
        }
      }

      case "createBackup": {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const { filename = `backup_${timestamp}.sql`, tables = [] } = args;
        const backupPath = resolve(repoRoot, "backups", filename);

        // Ensure backups directory exists
        await fs.mkdir(resolve(repoRoot, "backups"), { recursive: true });

        try {
          // Parse connection string
          const url = new URL(process.env.POSTGRES_URL_NON_POOLING);
          const password = url.password;
          const host = url.hostname;
          const port = url.port || 5432;
          const database = url.pathname.slice(1);
          const user = url.username;

          let command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database}`;

          if (tables.length > 0) {
            command += " " + tables.map((t) => `-t ${t}`).join(" ");
          }

          command += ` > "${backupPath}"`;

          await execAsync(command);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Backup created successfully`,
                    path: backupPath,
                    filename,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Backup failed: ${error.message}`);
        }
      }

      case "searchSchema": {
        const { searchTerm, searchType = "all" } = args;
        const client = await pool.connect();

        try {
          const results = {};

          // Search tables
          if (searchType === "all" || searchType === "tables") {
            const tablesResult = await client.query(
              `
              SELECT schemaname, tablename
              FROM pg_tables
              WHERE tablename LIKE $1
              ORDER BY tablename
            `,
              [searchTerm]
            );
            results.tables = tablesResult.rows;
          }

          // Search columns
          if (searchType === "all" || searchType === "columns") {
            const columnsResult = await client.query(
              `
              SELECT table_schema, table_name, column_name, data_type
              FROM information_schema.columns
              WHERE column_name LIKE $1
              ORDER BY table_name, column_name
            `,
              [searchTerm]
            );
            results.columns = columnsResult.rows;
          }

          // Search functions
          if (searchType === "all" || searchType === "functions") {
            const functionsResult = await client.query(
              `
              SELECT routine_schema, routine_name, routine_type
              FROM information_schema.routines
              WHERE routine_name LIKE $1
              ORDER BY routine_name
            `,
              [searchTerm]
            );
            results.functions = functionsResult.rows;
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    searchTerm,
                    results,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } finally {
          client.release();
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              stack: error.stack,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Graceful shutdown handler
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.error(`\n📡 Received ${signal}, shutting down gracefully...`);

  try {
    await pool.end();
    console.error("✓ Database connections closed");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error during shutdown:", error.message);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("✗ Uncaught exception:", error);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("✗ Unhandled rejection:", reason);
  shutdown("unhandledRejection");
});

// Start the server
async function main() {
  // Startup banner
  console.error("=".repeat(60));
  console.error(`🚀 ${SERVER_NAME}`);
  console.error(`📦 Version: ${SERVER_VERSION}`);
  console.error(`🔌 Transport: stdio`);
  console.error(`🌍 Node: ${process.version}`);
  console.error(`📂 Working Directory: ${process.cwd()}`);
  console.error("=".repeat(60));

  // Check environment variables
  if (!process.env.POSTGRES_URL_NON_POOLING) {
    console.error("✗ ERROR: POSTGRES_URL_NON_POOLING environment variable not set");
    console.error("  Please check your .env file or MCP server configuration");
    process.exit(1);
  }

  console.error("✓ Environment variables loaded");

  // Test database connection
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT current_database(), current_user, version()");
    const dbInfo = result.rows[0];

    console.error(`✓ Connected to database: ${dbInfo.current_database}`);
    console.error(`  User: ${dbInfo.current_user}`);
    console.error(`  PostgreSQL: ${dbInfo.version.split(' ')[1]}`);

    client.release();
  } catch (error) {
    console.error("✗ Failed to connect to database:", error.message);
    console.error("  Connection string:", connectionString?.replace(/:[^:@]+@/, ':****@'));
    process.exit(1);
  }

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("=".repeat(60));
  console.error("✅ Supabase DB MCP Server is ready!");
  console.error("📝 Available tools: 12 (query, transaction, explain, schema tools, etc.)");
  console.error("🔒 Security: Row limits, timeout protection, dangerous query warnings");
  console.error("=".repeat(60));
}

main().catch((error) => {
  console.error("✗ Server startup error:", error);
  process.exit(1);
});
