import { z } from "zod";
import { analyzeSQLSafety, formatQueryResult, getDatabaseSchema, getLocalSchemaFromMigrations } from "../utils/sqlHelpers.js";
import { resolve } from "path";
export const listTablesTool = {
    name: "listTables",
    description: "Lists all tables in the currently active database connection.",
    input_schema: z.object({}),
    output_schema: z.object({
        tables: z.array(z.string()).describe("An array of table names."),
    }),
};
export const getTableSchemaTool = {
    name: "getTableSchema",
    description: "Retrieves the schema (columns, types, constraints) for a specific table in the active database connection.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table."),
    }),
    output_schema: z.object({
        tableName: z.string().describe("The name of the table."),
        columns: z.array(z.object({
            name: z.string(),
            type: z.string(),
            nullable: z.boolean(),
            default: z.any().nullable(),
        })).describe("Array of column definitions."),
        constraints: z.array(z.object({
            name: z.string(),
            type: z.string(),
            definition: z.string(),
        })).describe("Array of constraint definitions."),
    }),
};
export const listIndexesTool = {
    name: "listIndexes",
    description: "Lists all indexes for a given table in the active database connection.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table."),
    }),
    output_schema: z.object({
        indexes: z.array(z.object({
            name: z.string(),
            definition: z.string(),
        })).describe("Array of index definitions."),
    }),
};
export const listFunctionsTool = {
    name: "listFunctions",
    description: "Lists all stored procedures and functions in the active database connection.",
    input_schema: z.object({}),
    output_schema: z.object({
        functions: z.array(z.object({
            name: z.string(),
            returnType: z.string(),
            arguments: z.string(),
        })).describe("Array of function definitions."),
    }),
};
export const searchSchemaTool = {
    name: "searchSchema",
    description: "Searches the database schema for tables, columns, or functions matching a keyword.",
    input_schema: z.object({
        keyword: z.string().describe("The keyword to search for."),
    }),
    output_schema: z.object({
        results: z.array(z.object({
            type: z.string(),
            name: z.string(),
            details: z.string().optional(),
        })).describe("Array of search results."),
    }),
};
export const createTableTool = {
    name: "createTable",
    description: "Creates a new table in the database. Provide the table name and column definitions.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table to create."),
        columns: z.array(z.object({
            name: z.string().describe("Column name."),
            type: z.string().describe("Column data type (e.g., TEXT, INTEGER, UUID, BOOLEAN, TIMESTAMP WITH TIME ZONE)."),
            isPrimaryKey: z.boolean().optional().describe("True if this column is part of the primary key."),
            isUnique: z.boolean().optional().describe("True if this column must have unique values."),
            isNullable: z.boolean().optional().describe("True if this column can be NULL. Defaults to false."),
            defaultValue: z.string().optional().describe("Default value for the column (e.g., 'uuid_generate_v4()', 'NOW()')."),
        })).describe("Array of column definitions."),
        primaryKey: z.array(z.string()).optional().describe("Optional: Array of column names that form the primary key. If not provided, the first column marked as isPrimaryKey will be used."),
    }),
    output_schema: z.object({
        message: z.string().describe("Confirmation message."),
    }),
};
export const dropTableTool = {
    name: "dropTable",
    description: "Drops an existing table from the database. This action is irreversible.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table to drop."),
        cascade: z.boolean().optional().describe("Optional: Automatically drop objects that depend on the table (e.g., views). Defaults to false."),
    }),
    output_schema: z.object({
        message: z.string().describe("Confirmation message."),
    }),
};
export const addColumnTool = {
    name: "addColumn",
    description: "Adds a new column to an existing table.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table."),
        columnName: z.string().describe("The name of the new column."),
        columnType: z.string().describe("The data type of the new column (e.g., TEXT, INTEGER, UUID, BOOLEAN, TIMESTAMP WITH TIME ZONE)."),
        isNullable: z.boolean().optional().describe("True if this column can be NULL. Defaults to true."),
        defaultValue: z.string().optional().describe("Default value for the column (e.g., 'uuid_generate_v4()', 'NOW()')."),
    }),
    output_schema: z.object({
        message: z.string().describe("Confirmation message."),
    }),
};
export const dropColumnTool = {
    name: "dropColumn",
    description: "Drops a column from an existing table. This action is irreversible.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table."),
        columnName: z.string().describe("The name of the column to drop."),
        cascade: z.boolean().optional().describe("Optional: Automatically drop objects that depend on the column. Defaults to false."),
    }),
    output_schema: z.object({
        message: z.string().describe("Confirmation message."),
    }),
};
export const createIndexTool = {
    name: "createIndex",
    description: "Creates a new index on one or more columns of a table to improve query performance.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table."),
        columns: z.array(z.string()).describe("An array of column names to include in the index."),
        indexName: z.string().optional().describe("Optional: A name for the index. If not provided, one will be generated."),
        isUnique: z.boolean().optional().describe("True to create a unique index. Defaults to false."),
    }),
    output_schema: z.object({
        message: z.string().describe("Confirmation message."),
    }),
};
export const diffSchemaTool = {
    name: "diffSchema",
    description: "Compare the schema of the local repository with the remote database.",
    input_schema: z.object({
        source: z.string().describe("The source of the local schema (e.g., 'supabase/migrations')").default("supabase/migrations"),
    }),
    output_schema: z.object({
        diff: z.any().describe("The diff between the local and remote schemas."),
    }),
};
export async function handleSchemaToolCall(toolName, input, connectionManager) {
    const pool = connectionManager.getConnection();
    const client = await pool.connect();
    try {
        switch (toolName) {
            case listTablesTool.name: {
                const { rows } = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
                return { tables: rows.map((row) => row.table_name) };
            }
            case getTableSchemaTool.name: {
                const { tableName } = input;
                const schema = await getDatabaseSchema(pool);
                if (!schema[tableName]) {
                    throw new Error(`Table '${tableName}' not found.`);
                }
                return { tableName, ...schema[tableName] };
            }
            case listIndexesTool.name: {
                const { tableName } = input;
                const { rows } = await client.query(`SELECT indexname AS name, indexdef AS definition FROM pg_indexes WHERE tablename = $1;`, [tableName]);
                return { indexes: rows };
            }
            case listFunctionsTool.name: {
                const { rows } = await client.query(`
          SELECT proname AS name, prorettype::regtype AS "returnType", pg_get_function_identity_arguments(oid) AS arguments
          FROM pg_proc
          JOIN pg_namespace n ON n.oid = pg_proc.pronamespace
          WHERE n.nspname = 'public'
          ORDER BY proname;
        `);
                return { functions: rows };
            }
            case searchSchemaTool.name: {
                const { keyword } = input;
                const searchResults = [];
                // Search tables
                const { rows: tableRows } = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE $1;`, [`%${keyword}%`]);
                tableRows.forEach(row => searchResults.push({ type: "table", name: row.table_name }));
                // Search columns
                const { rows: columnRows } = await client.query(`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND column_name ILIKE $1;`, [`%${keyword}%`]);
                columnRows.forEach(row => searchResults.push({ type: "column", name: `${row.table_name}.${row.column_name}`, details: `Type: ${row.data_type}` }));
                // Search functions
                const { rows: functionRows } = await client.query(`
          SELECT proname AS name, prorettype::regtype AS "returnType", pg_get_function_identity_arguments(oid) AS arguments
          FROM pg_proc
          JOIN pg_namespace n ON n.oid = pg_proc.pronamespace
          WHERE n.nspname = 'public' AND proname ILIKE $1
          ORDER BY proname;
        `, [`%${keyword}%`]);
                functionRows.forEach(row => searchResults.push({ type: "function", name: row.name, details: `(${row.arguments}) RETURNS ${row.returnType}` }));
                return { results: searchResults };
            }
            case createTableTool.name: {
                const { tableName, columns, primaryKey } = input;
                let columnsSql = columns.map(col => {
                    let colDef = `"${col.name}" ${col.type}`;
                    if (col.isUnique)
                        colDef += " UNIQUE";
                    if (!col.isNullable)
                        colDef += " NOT NULL";
                    if (col.defaultValue)
                        colDef += ` DEFAULT ${col.defaultValue}`;
                    return colDef;
                }).join(", ");
                let pkSql = "";
                if (primaryKey && primaryKey.length > 0) {
                    pkSql = `, PRIMARY KEY (${primaryKey.map(col => `"${col}"`).join(", ")})`;
                }
                else {
                    const pkCol = columns.find(col => col.isPrimaryKey);
                    if (pkCol) {
                        pkSql = `, PRIMARY KEY ("${pkCol.name}")`;
                    }
                }
                const createTableSql = `CREATE TABLE "${tableName}" (${columnsSql}${pkSql});`;
                const warnings = analyzeSQLSafety(createTableSql);
                if (warnings.length > 0) {
                    throw new Error(`Unsafe query detected: ${warnings.join("; ")}`);
                }
                await client.query(createTableSql);
                return { message: `Table '${tableName}' created successfully.` };
            }
            case dropTableTool.name: {
                const { tableName, cascade } = input;
                const dropTableSql = `DROP TABLE "${tableName}" ${cascade ? "CASCADE" : ""};`;
                const warnings = analyzeSQLSafety(dropTableSql);
                if (warnings.length > 0) {
                    throw new Error(`Unsafe query detected: ${warnings.join("; ")}`);
                }
                await client.query(dropTableSql);
                return { message: `Table '${tableName}' dropped successfully.` };
            }
            case addColumnTool.name: {
                const { tableName, columnName, columnType, isNullable = true, defaultValue } = input;
                let colDef = `ADD COLUMN "${columnName}" ${columnType}`;
                if (!isNullable)
                    colDef += " NOT NULL";
                if (defaultValue)
                    colDef += ` DEFAULT ${defaultValue}`;
                const addColumnSql = `ALTER TABLE "${tableName}" ${colDef};`;
                const warnings = analyzeSQLSafety(addColumnSql);
                if (warnings.length > 0) {
                    throw new Error(`Unsafe query detected: ${warnings.join("; ")}`);
                }
                await client.query(addColumnSql);
                return { message: `Column '${columnName}' added to table '${tableName}' successfully.` };
            }
            case dropColumnTool.name: {
                const { tableName, columnName, cascade } = input;
                const dropColumnSql = `ALTER TABLE "${tableName}" DROP COLUMN "${columnName}" ${cascade ? "CASCADE" : ""};`;
                const warnings = analyzeSQLSafety(dropColumnSql);
                if (warnings.length > 0) {
                    throw new Error(`Unsafe query detected: ${warnings.join("; ")}`);
                }
                await client.query(dropColumnSql);
                return { message: `Column '${columnName}' dropped from table '${tableName}' successfully.` };
            }
            case createIndexTool.name: {
                const { tableName, columns, indexName, isUnique = false } = input;
                const cols = columns.map(col => `"${col}"`).join(", ");
                const unique = isUnique ? "UNIQUE" : "";
                const name = indexName ? `"${indexName}"` : `idx_${tableName}_${columns.join("_")}`;
                const createIndexSql = `CREATE ${unique} INDEX ${name} ON "${tableName}" (${cols});`;
                const warnings = analyzeSQLSafety(createIndexSql);
                if (warnings.length > 0) {
                    throw new Error(`Unsafe query detected: ${warnings.join("; ")}`);
                }
                await client.query(createIndexSql);
                return { message: `Index '${name}' created on table '${tableName}' successfully.` };
            }
            case diffSchemaTool.name: {
                const { source = "supabase/migrations" } = input;
                const pool = connectionManager.getConnection();
                let localSchema = {};
                if (source === "supabase/migrations") {
                    const migrationsDir = resolve(process.cwd(), "supabase/migrations");
                    localSchema = await getLocalSchemaFromMigrations(migrationsDir);
                }
                else {
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
                        if (localCol.type !== remoteCol.type ||
                            localCol.nullable !== remoteCol.nullable ||
                            localCol.default !== remoteCol.default) {
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
                    if (tableChanges.columnsAdded.length > 0 ||
                        tableChanges.columnsRemoved.length > 0 ||
                        tableChanges.columnsChanged.length > 0 ||
                        tableChanges.constraintsAdded.length > 0 ||
                        tableChanges.constraintsRemoved.length > 0) {
                        diff.tablesChanged[tableName] = tableChanges;
                    }
                }
                return { diff };
            }
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=schemaTools.js.map