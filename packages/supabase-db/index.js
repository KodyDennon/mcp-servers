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
import { createClient } from "@supabase/supabase-js";
import { pipeline } from "@xenova/transformers";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Load environment variables from repo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "../..");
dotenv.config({ path: resolve(repoRoot, ".env") });

const { Pool } = pg;

class ConnectionManager {
  constructor() {
    this.connections = {};
    this.activeConnectionId = null;
  }

  async addConnection(connectionString, id = null) {
    const connectionId = id || `conn_${Object.keys(this.connections).length + 1}`;
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on("error", (err) => {
      console.error(`Unexpected database error on connection ${connectionId}:`, err);
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query("SELECT current_database(), current_user, version()");
    client.release();

    this.connections[connectionId] = { pool, info: result.rows[0] };
    if (!this.activeConnectionId) {
      this.activeConnectionId = connectionId;
    }
    return connectionId;
  }

  getConnection(connectionId = null) {
    const id = connectionId || this.activeConnectionId;
    if (!id || !this.connections[id]) {
      throw new Error("No active database connection. Use connectToDatabase to add a connection.");
    }
    return this.connections[id].pool;
  }

  listConnections() {
    return Object.entries(this.connections).map(([id, { info }]) => ({
      id,
      ...info,
      active: id === this.activeConnectionId,
    }));
  }

  switchConnection(connectionId) {
    if (!this.connections[connectionId]) {
      throw new Error(`Connection ${connectionId} not found.`);
    }
    this.activeConnectionId = connectionId;
  }

  async shutdown() {
    for (const { pool } of Object.values(this.connections)) {
      await pool.end();
    }
  }
}

const connectionManager = new ConnectionManager();

// Create Supabase client
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(
  process.env.SUPABASE_URL,
  supabaseKey
);

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

async function getDatabaseSchema(pool) {
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
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      const { rows: constraints } = await client.query(`
        SELECT conname AS constraint_name, contype AS constraint_type, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = ($1)::regclass;
      `, [tableName]);

      schema[tableName] = {
        columns: columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
        })),
        constraints: constraints.map(con => ({
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

async function getLocalSchemaFromMigrations(migrationsDir) {
  const schema = {};
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();

  for (const file of sqlFiles) {
    const filePath = resolve(migrationsDir, file);
    const sql = await fs.readFile(filePath, "utf8");

    // Simplified parsing for CREATE TABLE and ALTER TABLE ADD COLUMN
    const createTableRegex = /CREATE TABLE\s+(?:public\.)?"?(\w+)"?\s*\(([^;]+)\);?/gi;
    let match;
    while ((match = createTableRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnsDef = match[2];
      schema[tableName] = schema[tableName] || { columns: [], constraints: [] };

      const columnRegex = /"?(\w+)"?\s+(\w+)(?:\s+\(([^)]+)\))?(?:\s+NOT NULL)?(?:\s+DEFAULT\s+([^,\s]+))?/gi;
      let colMatch;
      while ((colMatch = columnRegex.exec(columnsDef)) !== null) {
        schema[tableName].columns.push({
          name: colMatch[1],
          type: colMatch[2],
          nullable: !colMatch[0].includes('NOT NULL'),
          default: colMatch[4] || null,
        });
      }
    }

    const addColumnRegex = /ALTER TABLE\s+(?:public\.)?"?(\w+)"?\s+ADD COLUMN\s+"?(\w+)"?\s+(\w+)(?:\s+\(([^)]+)\))?(?:\s+NOT NULL)?(?:\s+DEFAULT\s+([^;]+))?;?/gi;
    while ((match = addColumnRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columnName = match[2];
      const columnType = match[3];
      schema[tableName] = schema[tableName] || { columns: [], constraints: [] };
      schema[tableName].columns.push({
        name: columnName,
        type: columnType,
        nullable: !match[0].includes('NOT NULL'),
        default: match[5] || null,
      });
    }
  }
  return schema;
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
        name: "connectToDatabase",
        description: "Connect to a new database.",
        inputSchema: {
          type: "object",
          properties: {
            connectionString: {
              type: "string",
              description: "The connection string for the database.",
            },
          },
          required: ["connectionString"],
        },
      },
      {
        name: "listConnections",
        description: "List all active database connections.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "switchConnection",
        description: "Switch the active database connection.",
        inputSchema: {
          type: "object",
          properties: {
            connectionId: {
              type: "string",
              description: "The ID of the connection to switch to.",
            },
          },
          required: ["connectionId"],
        },
      },
      {
        name: "query",
        description: "Execute a SQL query on the active database. Supports SELECT, INSERT, UPDATE, DELETE, DDL. Returns up to 1000 rows by default.",
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
      {
        name: "manageAuth",
        description: "Manage Supabase users.",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["createUser", "listUsers", "deleteUser"],
              description: "The action to perform",
            },
            email: {
              type: "string",
              description: "The user's email (for createUser)",
            },
            password: {
              type: "string",
              description: "The user's password (for createUser)",
            },
            userId: {
              type: "string",
              description: "The user's ID (for deleteUser)",
            },
          },
          required: ["action"],
        },
      },
      {
        name: "manageStorage",
        description: "Manage Supabase storage.",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["uploadFile", "downloadFile", "listFiles"],
              description: "The action to perform",
            },
            bucket: {
              type: "string",
              description: "The storage bucket",
            },
            path: {
              type: "string",
              description: "The path to the file",
            },
            content: {
              type: "string",
              description: "The content of the file (for uploadFile)",
            },
          },
          required: ["action", "bucket"],
        },
      },
      {
        name: "vectorSearch",
        description: "Perform a similarity search on a table with a vector column.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: {
              type: "string",
              description: "The name of the table",
            },
            vectorColumn: {
              type: "string",
              description: "The name of the vector column",
            },
            queryVector: {
              type: "array",
              items: {
                type: "number",
              },
              description: "The vector to search for",
            },
            limit: {
              type: "number",
              description: "The maximum number of results to return",
              default: 10,
            },
          },
          required: ["tableName", "vectorColumn", "queryVector"],
        },
      },
      {
        name: "importData",
        description: "Import data into a table from various formats.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: {
              type: "string",
              description: "The name of the table",
            },
            format: {
              type: "string",
              enum: ["csv", "json"],
              description: "The format of the data",
            },
            data: {
              type: "string",
              description: "The data to import",
            },
          },
          required: ["tableName", "format", "data"],
        },
      },
      {
        name: "seedData",
        description: "Seed the database using a pre-defined seed file (e.g., supabase/seed.sql).",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "createEmbeddings",
        description: "Generate and store embeddings for a text column.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: {
              type: "string",
              description: "The name of the table",
            },
            textColumn: {
              type: "string",
              description: "The name of the text column",
            },
            embeddingModel: {
              type: "string",
              description: "The name of the embedding model to use",
              default: "Xenova/all-MiniLM-L6-v2",
            },
            vectorColumn: {
              type: "string",
              description: "The name of the vector column to store the embeddings in",
              default: "embedding",
            },
          },
          required: ["tableName", "textColumn"],
        },
      },
      {
        name: "queryNaturalLanguage",
        description: "Convert natural language queries into SQL.",
        inputSchema: {
          type: "object",
          properties: {
            naturalLanguageQuery: {
              type: "string",
              description: "The natural language query to convert to SQL",
            },
            languageModel: {
              type: "string",
              description: "The name of the language model to use",
              default: "Xenova/LaMini-Flan-T5-783M",
            },
          },
          required: ["naturalLanguageQuery"],
        },
      },
      {
        name: "diffSchema",
        description: "Compare the schema of the local repository with the remote database.",
        inputSchema: {
          type: "object",
          properties: {
            source: {
              type: "string",
              description: "The source of the local schema (e.g., 'supabase/migrations')",
              default: "supabase/migrations",
            },
          },
        },
      },
      {
        name: "generateMigration",
        description: "Generate a new migration file based on the differences between the local and remote schemas.",
        inputSchema: {
          type: "object",
          properties: {
            source: {
              type: "string",
              description: "The source of the local schema (e.g., 'supabase/migrations')",
              default: "supabase/migrations",
            },
            message: {
              type: "string",
              description: "A message for the migration file",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "insertRow",
        description: "Insert a new row into a table.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: {
              type: "string",
              description: "The name of the table",
            },
            data: {
              type: "object",
              description: "The data to insert (key-value pairs)",
            },
          },
          required: ["tableName", "data"],
        },
      },
      {
        name: "updateRow",
        description: "Update an existing row in a table.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: {
              type: "string",
              description: "The name of the table",
            },
            rowId: {
              type: "string",
              description: "The ID of the row to update",
            },
            data: {
              type: "object",
              description: "The data to update (key-value pairs)",
            },
          },
          required: ["tableName", "rowId", "data"],
        },
      },
      {
        name: "deleteRow",
        description: "Delete a row from a table.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: {
              type: "string",
              description: "The name of the table",
            },
            rowId: {
              type: "string",
              description: "The ID of the row to delete",
            },
          },
          required: ["tableName", "rowId"],
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
      case "connectToDatabase": {
        const { connectionString } = args;
        const connectionId = await connectionManager.addConnection(connectionString);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "Connected to new database.",
                  connectionId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "listConnections": {
        const connections = connectionManager.listConnections();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  connections,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "switchConnection": {
        const { connectionId } = args;
        connectionManager.switchConnection(connectionId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Switched to connection ${connectionId}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "diffSchema": {
        const { source = "supabase/migrations" } = args;
        const pool = connectionManager.getConnection();

        let localSchema = {};
        if (source === "supabase/migrations") {
          const migrationsDir = resolve(repoRoot, "supabase/migrations");
          localSchema = await getLocalSchemaFromMigrations(migrationsDir);
        } else {
          throw new Error(`Unsupported schema source: ${source}`);
        }

        const remoteSchema = await getDatabaseSchema(pool);

        const diff = {
          tablesAdded: [],
          tablesRemoved: [],
          tablesChanged: {},
        };

        // Compare tables
        const localTables = Object.keys(localSchema);
        const remoteTables = Object.keys(remoteSchema);

        diff.tablesAdded = localTables.filter(table => !remoteTables.includes(table));
        diff.tablesRemoved = remoteTables.filter(table => !localTables.includes(table));

        for (const tableName of localTables.filter(table => remoteTables.includes(table))) {
          const localTable = localSchema[tableName];
          const remoteTable = remoteSchema[tableName];
          const tableChanges = {
            columnsAdded: [],
            columnsRemoved: [],
            columnsChanged: [],
            constraintsAdded: [],
            constraintsRemoved: [],
            constraintsChanged: [],
          };

          // Compare columns
          const localColumns = localTable.columns.map(c => c.name);
          const remoteColumns = remoteTable.columns.map(c => c.name);

          tableChanges.columnsAdded = localColumns.filter(col => !remoteColumns.includes(col));
          tableChanges.columnsRemoved = remoteColumns.filter(col => !localColumns.includes(col));

          for (const colName of localColumns.filter(col => remoteColumns.includes(col))) {
            const localCol = localTable.columns.find(c => c.name === colName);
            const remoteCol = remoteTable.columns.find(c => c.name === colName);

            if (
              localCol.type !== remoteCol.type ||
              localCol.nullable !== remoteCol.nullable ||
              localCol.default !== remoteCol.default
            ) {
              tableChanges.columnsChanged.push({
                column: colName,
                local: localCol,
                remote: remoteCol,
              });
            }
          }

          // Compare constraints (simplified)
          const localConstraints = localTable.constraints.map(c => c.name);
          const remoteConstraints = remoteTable.constraints.map(c => c.name);

          tableChanges.constraintsAdded = localConstraints.filter(con => !remoteConstraints.includes(con));
          tableChanges.constraintsRemoved = remoteConstraints.filter(con => !localConstraints.includes(con));

          if (
            tableChanges.columnsAdded.length > 0 ||
            tableChanges.columnsRemoved.length > 0 ||
            tableChanges.columnsChanged.length > 0 ||
            tableChanges.constraintsAdded.length > 0 ||
            tableChanges.constraintsRemoved.length > 0
          ) {
            diff.tablesChanged[tableName] = tableChanges;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "Schema diff generated.",
                  diff,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "generateMigration": {
        const { source = "supabase/migrations", message } = args;
        const pool = connectionManager.getConnection();

        let localSchema = {};
        if (source === "supabase/migrations") {
          const migrationsDir = resolve(repoRoot, "supabase/migrations");
          localSchema = await getLocalSchemaFromMigrations(migrationsDir);
        } else {
          throw new Error(`Unsupported schema source: ${source}`);
        }

        const remoteSchema = await getDatabaseSchema(pool);

        const diff = {
          tablesAdded: [],
          tablesRemoved: [],
          tablesChanged: {},
        };

        // Compare tables
        const localTables = Object.keys(localSchema);
        const remoteTables = Object.keys(remoteSchema);

        diff.tablesAdded = localTables.filter(table => !remoteTables.includes(table));
        diff.tablesRemoved = remoteTables.filter(table => !localTables.includes(table));

        for (const tableName of localTables.filter(table => remoteTables.includes(table))) {
          const localTable = localSchema[tableName];
          const remoteTable = remoteSchema[tableName];
          const tableChanges = {
            columnsAdded: [],
            columnsRemoved: [],
            columnsChanged: [],
            constraintsAdded: [],
            constraintsRemoved: [],
            constraintsChanged: [],
          };

          // Compare columns
          const localColumns = localTable.columns.map(c => c.name);
          const remoteColumns = remoteTable.columns.map(c => c.name);

          tableChanges.columnsAdded = localColumns.filter(col => !remoteColumns.includes(col));
          tableChanges.columnsRemoved = remoteColumns.filter(col => !localColumns.includes(col));

          for (const colName of localColumns.filter(col => remoteColumns.includes(col))) {
            const localCol = localTable.columns.find(c => c.name === colName);
            const remoteCol = remoteTable.columns.find(c => c.name === colName);

            if (
              localCol.type !== remoteCol.type ||
              localCol.nullable !== remoteCol.nullable ||
              localCol.default !== remoteCol.default
            ) {
              tableChanges.columnsChanged.push({
                column: colName,
                local: localCol,
                remote: remoteCol,
              });
            }
          }

          // Compare constraints (simplified)
          const localConstraints = localTable.constraints.map(c => c.name);
          const remoteConstraints = remoteTable.constraints.map(c => c.name);

          tableChanges.constraintsAdded = localConstraints.filter(con => !remoteConstraints.includes(con));
          tableChanges.constraintsRemoved = remoteConstraints.filter(con => !localConstraints.includes(con));

          if (
            tableChanges.columnsAdded.length > 0 ||
            tableChanges.columnsRemoved.length > 0 ||
            tableChanges.columnsChanged.length > 0 ||
            tableChanges.constraintsAdded.length > 0 ||
            tableChanges.constraintsRemoved.length > 0
          ) {
            diff.tablesChanged[tableName] = tableChanges;
          }
        }

        let migrationSql = `-- Migration: ${message}\n\n`;

        // Generate SQL for tables added
        for (const tableName of diff.tablesAdded) {
          const table = localSchema[tableName];
          const columnsSql = table.columns.map(col => {
            let colDef = `  ${col.name} ${col.type}`;
            if (!col.nullable) colDef += ` NOT NULL`;
            if (col.default) colDef += ` DEFAULT ${col.default}`;
            return colDef;
          }).join(",\n");
          migrationSql += `CREATE TABLE public.${tableName} (\n${columnsSql}\n);\n\n`;
        }

        // Generate SQL for tables changed
        for (const tableName in diff.tablesChanged) {
          const changes = diff.tablesChanged[tableName];

          for (const col of changes.columnsAdded) {
            const localCol = localSchema[tableName].columns.find(c => c.name === col);
            let colDef = `${localCol.name} ${localCol.type}`;
            if (!localCol.nullable) colDef += ` NOT NULL`;
            if (localCol.default) colDef += ` DEFAULT ${localCol.default}`;
            migrationSql += `ALTER TABLE public.${tableName} ADD COLUMN ${colDef};\n`;
          }
          // TODO: Add logic for columnsRemoved, columnsChanged, constraintsAdded, constraintsRemoved
        }

        const timestamp = new Date().getTime();
        const filename = `${timestamp}_${message.replace(/\s/g, "_")}.sql`;
        const path = resolve(repoRoot, "supabase/migrations", filename);
        await fs.writeFile(path, migrationSql);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Generated new migration file: ${filename}`,
                  path,
                  migrationSql,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "insertRow": {
        const { tableName, data } = args;
        const pool = connectionManager.getConnection();
        const client = await pool.connect();
        try {
          const columns = Object.keys(data);
          const values = Object.values(data);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
          const query = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
          const result = await client.query(query, values);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, message: "Row inserted successfully", row: result.rows[0] },
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

      case "updateRow": {
        const { tableName, rowId, data } = args;
        const pool = connectionManager.getConnection();
        const client = await pool.connect();
        try {
          const columns = Object.keys(data);
          const values = Object.values(data);
          const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(", ");
          const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${columns.length + 1} RETURNING *`;
          const result = await client.query(query, [...values, rowId]);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, message: "Row updated successfully", row: result.rows[0] },
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

      case "deleteRow": {
        const { tableName, rowId } = args;
        const pool = connectionManager.getConnection();
        const client = await pool.connect();
        try {
          const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
          const result = await client.query(query, [rowId]);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, message: "Row deleted successfully", row: result.rows[0] },
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

      case "query": {
        const { sql, rowLimit = 1000, timeout = 60 } = args;
        const warnings = analyzeSQLSafety(sql);

        const pool = connectionManager.getConnection();
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
        const pool = connectionManager.getConnection();
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
        const pool = connectionManager.getConnection();
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
        const pool = connectionManager.getConnection();
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
        const pool = connectionManager.getConnection();
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
        const pool = connectionManager.getConnection();
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
        const pool = connectionManager.getConnection();
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
          const pool = connectionManager.getConnection();
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
        const pool = connectionManager.getConnection();
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
        const pool = connectionManager.getConnection();
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

      case "manageAuth": {
        const { action, email, password, userId } = args;
        let data, error;

        switch (action) {
          case "createUser":
            ({ data, error } = await supabase.auth.admin.createUser({
              email,
              password,
            }));
            break;
          case "listUsers":
            ({ data, error } = await supabase.auth.admin.listUsers());
            break;
          case "deleteUser":
            ({ data, error } = await supabase.auth.admin.deleteUser(userId));
            break;
          default:
            throw new Error(`Unknown auth action: ${action}`);
        }

        if (error) {
          throw new Error(`Supabase auth error: ${error.message}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, data }, null, 2),
            },
          ],
        };
      }

      case "manageStorage": {
        const { action, bucket, path, content } = args;
        let data, error;

        switch (action) {
          case "uploadFile":
            ({ data, error } = await supabase.storage
              .from(bucket)
              .upload(path, content));
            break;
          case "downloadFile":
            ({ data, error } = await supabase.storage
              .from(bucket)
              .download(path));
            break;
          case "listFiles":
            ({ data, error } = await supabase.storage.from(bucket).list());
            break;
          default:
            throw new Error(`Unknown storage action: ${action}`);
        }

        if (error) {
          throw new Error(`Supabase storage error: ${error.message}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, data }, null, 2),
            },
          ],
        };
      }

      case "vectorSearch": {
        const { tableName, vectorColumn, queryVector, limit = 10 } = args;
        const pool = connectionManager.getConnection();
        const client = await pool.connect();
        try {
          const result = await client.query(
            `
            SELECT *
            FROM ${tableName}
            ORDER BY ${vectorColumn} <-> $1
            LIMIT $2
          `,
            [JSON.stringify(queryVector), limit]
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, results: result.rows },
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

      case "importData": {
        const { tableName, format, data } = args;
        const pool = connectionManager.getConnection();
        const client = await pool.connect();
        try {
          if (format === "json") {
            const jsonData = JSON.parse(data);
            const columns = Object.keys(jsonData[0]);
            const values = jsonData.map((row) =>
              columns.map((col) => row[col])
            );
            const query = `
              INSERT INTO ${tableName} (${columns.join(", ")})
              VALUES ${values
                .map(
                  (row) =>
                    `(${row.map((val) => `'${val}'`).join(", ")})`
                )
                .join(", ")}
            `;
            await client.query(query);
          } else if (format === "csv") {
            // This is a simplified CSV parser, assuming no commas in values
            const rows = data.split("\n");
            const columns = rows[0].split(",");
            const values = rows.slice(1).map((row) => row.split(","));
            const query = `
              INSERT INTO ${tableName} (${columns.join(", ")})
              VALUES ${values
                .map(
                  (row) =>
                    `(${row.map((val) => `'${val}'`).join(", ")})`
                )
                .join(", ")}
            `;
            await client.query(query);
          } else {
            throw new Error(`Unsupported data format: ${format}`);
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, message: "Data imported successfully" },
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

      case "seedData": {
        const seedPath = resolve(repoRoot, "supabase/seed.sql");
        try {
          const sql = await fs.readFile(seedPath, "utf8");
          const pool = connectionManager.getConnection();
          const client = await pool.connect();
          try {
            await client.query(sql);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      message: "Database seeded successfully",
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
        } catch (error) {
          throw new Error(`Failed to seed database: ${error.message}`);
        }
      }

      case "createEmbeddings": {
        const {
          tableName,
          textColumn,
          embeddingModel = "Xenova/all-MiniLM-L6-v2",
          vectorColumn = "embedding",
        } = args;

        const pool = connectionManager.getConnection();
        const client = await pool.connect();
        try {
          // Load the embedding model
          const extractor = await pipeline("feature-extraction", embeddingModel);

          // Read the data from the table
          const { rows } = await client.query(
            `SELECT id, ${textColumn} FROM ${tableName}`
          );

          // Generate embeddings for each row
          for (const row of rows) {
            const text = row[textColumn];
            const embedding = await extractor(text, {
              pooling: "mean",
              normalize: true,
            });

            // Alter the table to add the vector column if it doesn't exist
            await client.query(
              `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${vectorColumn} vector(384)`
            );

            // Update the table with the generated embedding
            await client.query(
              `UPDATE ${tableName} SET ${vectorColumn} = $1 WHERE id = $2`,
              [JSON.stringify(Array.from(embedding.data)), row.id]
            );
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Embeddings created successfully for ${rows.length} rows in table ${tableName}`,
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

      case "queryNaturalLanguage": {
        const {
          naturalLanguageQuery,
          languageModel = "Xenova/LaMini-Flan-T5-783M",
        } = args;

        const pool = connectionManager.getConnection();
        const client = await pool.connect();
        try {
          // Get the database schema
          const { rows: tables } = await client.query(`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
          `);

          const schema = tables.reduce((acc, row) => {
            if (!acc[row.table_name]) {
              acc[row.table_name] = [];
            }
            acc[row.table_name].push(`${row.column_name} ${row.data_type}`);
            return acc;
          }, {});

          const schemaString = Object.entries(schema)
            .map(([tableName, columns]) => `Table ${tableName}: ${columns.join(", ")}`)
            .join("\n");

          // Load the language model
          const generator = await pipeline("text2text-generation", languageModel);

          // Construct the prompt
          const prompt = `Given the following database schema:\n${schemaString}\n\nConvert the following natural language query to SQL:\n"${naturalLanguageQuery}"`;

          // Generate the SQL query
          const result = await generator(prompt, { max_length: 512 });
          const sqlQuery = result[0].generated_text;

          // Execute the generated SQL query
          const { rows: queryResult } = await client.query(sqlQuery);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    naturalLanguageQuery,
                    sqlQuery,
                    result: queryResult,
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
    await connectionManager.shutdown();
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
  if (process.env.POSTGRES_URL_NON_POOLING) {
    try {
      const connectionString = process.env.POSTGRES_URL_NON_POOLING?.replace(/\?.*$/, '') || process.env.POSTGRES_URL_NON_POOLING;
      const connId = await connectionManager.addConnection(connectionString, 'default');
      console.error(`✓ Connected to default database: ${connectionManager.connections[connId].info.current_database}`);
    } catch (error) {
      console.error("✗ Failed to connect to default database:", error.message);
      process.exit(1);
    }
  }

  if (!process.env.SUPABASE_URL) {
    console.error("✗ ERROR: SUPABASE_URL environment variable not set");
    console.error("  Please check your .env file or MCP server configuration");
    process.exit(1);
  }
  if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("✗ ERROR: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable not set");
    console.error("  Please check your .env file or MCP server configuration");
    process.exit(1);
  }

  console.error("✓ Environment variables loaded");

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
