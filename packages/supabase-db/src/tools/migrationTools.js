import { z } from "zod";
import { promises as fs } from "fs";
import { resolve } from "path";
import { getLocalSchemaFromMigrations, getDatabaseSchema } from "../utils/sqlHelpers.js";

export const runMigrationTool = {
    name: "runMigration",
    description: "Run a specific migration file from the migrations directory.",
    input_schema: z.object({
        filename: z.string().describe("Migration filename (relative to packages/db/supabase/migrations/)"),
    }),
    output_schema: z.object({
        message: z.string(),
    }),
};

export const listMigrationsTool = {
    name: "listMigrations",
    description: "List all available migration files in the migrations directory.",
    input_schema: z.object({}),
    output_schema: z.object({
        migrations: z.array(z.object({
            filename: z.string(),
            path: z.string(),
        })),
    }),
};

export const generateMigrationTool = {
    name: "generateMigration",
    description: "Generate a new migration file based on the differences between the local and remote schemas.",
    input_schema: z.object({
        source: z.string().describe("The source of the local schema (e.g., 'supabase/migrations')").default("supabase/migrations"),
        message: z.string().describe("A message for the migration file"),
    }),
    output_schema: z.object({
        filename: z.string(),
        path: z.string(),
        migrationSql: z.string(),
    }),
};

export const seedDataTool = {
    name: "seedData",
    description: "Seed the database using a pre-defined seed file (e.g., supabase/seed.sql).",
    input_schema: z.object({}),
    output_schema: z.object({
        message: z.string(),
    }),
};

export async function handleMigrationToolCall(toolName, input, connectionManager) {
    const pool = connectionManager.getConnection();
    const client = await pool.connect();
    const repoRoot = resolve(process.cwd(), "../..");
    try {
        switch (toolName) {
            case runMigrationTool.name: {
                const { filename } = input;
                const migrationPath = resolve(
                    repoRoot,
                    "packages/db/supabase/migrations",
                    filename
                );
                const sql = await fs.readFile(migrationPath, "utf8");
                await client.query("BEGIN");
                await client.query(sql);
                await client.query("COMMIT");
                return { message: `Migration ${filename} executed successfully` };
            }
            case listMigrationsTool.name: {
                const migrationsDir = resolve(repoRoot, "packages/db/supabase/migrations");
                const files = await fs.readdir(migrationsDir);
                const sqlFiles = files
                    .filter((f) => f.endsWith(".sql"))
                    .sort()
                    .map((f) => ({
                        filename: f,
                        path: `packages/db/supabase/migrations/${f}`,
                    }));
                return { migrations: sqlFiles };
            }
            case generateMigrationTool.name: {
                const { source = "supabase/migrations", message } = input;
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
                for (const tableName of diff.tablesAdded) {
                    const table = localSchema[tableName];
                    const columnsSql = table.columns.map(col => {
                        let colDef = `  "${col.name}" ${col.type}`;
                        if (!col.nullable) colDef += ` NOT NULL`;
                        if (col.default) colDef += ` DEFAULT ${col.default}`;
                        return colDef;
                    }).join(",\n");
                    migrationSql += `CREATE TABLE public.\"${tableName}\" (\n${columnsSql}\n);

`;
                }
                for (const tableName in diff.tablesChanged) {
                    const changes = diff.tablesChanged[tableName];
                    for (const col of changes.columnsAdded) {
                        const localCol = localSchema[tableName].columns.find(c => c.name === col);
                        let colDef = `"${localCol.name}" ${localCol.type}`;
                        if (!localCol.nullable) colDef += ` NOT NULL`;
                        if (localCol.default) colDef += ` DEFAULT ${localCol.default}`;
                        migrationSql += `ALTER TABLE public.\"${tableName}\" ADD COLUMN ${colDef};
`;
                    }
                }
                const timestamp = new Date().getTime();
                const filename = `${timestamp}_${message.replace(/\s/g, "_")}.sql`;
                const path = resolve(repoRoot, "supabase/migrations", filename);
                await fs.writeFile(path, migrationSql);
                return { filename, path, migrationSql };
            }
            case seedDataTool.name: {
                const seedPath = resolve(repoRoot, "supabase/seed.sql");
                const sql = await fs.readFile(seedPath, "utf8");
                await client.query(sql);
                return { message: "Database seeded successfully" };
            }
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    } finally {
        client.release();
    }
}
