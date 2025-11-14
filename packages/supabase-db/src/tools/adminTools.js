
import { z } from "zod";
import { promises as fs } from "fs";
import { resolve } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { supabase } from "../supabaseClient.js";

const execAsync = promisify(exec);

export const getDatabaseStatsTool = {
    name: "getDatabaseStats",
    description: "Get database statistics including size, connection count, and performance metrics.",
    input_schema: z.object({}),
    output_schema: z.object({
        database_size: z.string(),
        active_connections: z.string(),
        table_stats: z.any(),
    }),
};

export const createBackupTool = {
    name: "createBackup",
    description: "Create a SQL dump backup of the database or specific tables.",
    input_schema: z.object({
        filename: z.string().optional().describe("Output filename for the backup (default: backup_TIMESTAMP.sql)"),
        tables: z.array(z.string()).optional().describe("Optional: specific tables to backup (defaults to all)"),
    }),
    output_schema: z.object({
        path: z.string(),
        filename: z.string(),
    }),
};

export const manageAuthTool = {
    name: "manageAuth",
    description: "Manage Supabase users.",
    input_schema: z.object({
        action: z.enum(["createUser", "listUsers", "deleteUser"]),
        email: z.string().optional(),
        password: z.string().optional(),
        userId: z.string().optional(),
    }),
    output_schema: z.object({
        data: z.any(),
    }),
};

export const manageStorageTool = {
    name: "manageStorage",
    description: "Manage Supabase storage.",
    input_schema: z.object({
        action: z.enum(["uploadFile", "downloadFile", "listFiles"]),
        bucket: z.string(),
        path: z.string().optional(),
        content: z.string().optional(),
    }),
    output_schema: z.object({
        data: z.any(),
    }),
};

export async function handleAdminToolCall(toolName, input, connectionManager) {
    const pool = connectionManager.getConnection();
    const client = await pool.connect();
    const repoRoot = resolve(process.cwd(), "../..");
    try {
        switch (toolName) {
            case getDatabaseStatsTool.name: {
                const sizeResult = await client.query(`
                    SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
                `);
                const connResult = await client.query(`
                    SELECT COUNT(*) as active_connections
                    FROM pg_stat_activity
                    WHERE state = 'active'
                `);
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
                    database_size: sizeResult.rows[0].database_size,
                    active_connections: connResult.rows[0].active_connections,
                    table_stats: tableStatsResult.rows,
                };
            }
            case createBackupTool.name: {
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const { filename = `backup_${timestamp}.sql`, tables = [] } = input;
                const backupPath = resolve(repoRoot, "backups", filename);
                await fs.mkdir(resolve(repoRoot, "backups"), { recursive: true });
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
                return { path: backupPath, filename };
            }
            case manageAuthTool.name: {
                const { action, email, password, userId } = input;
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
                }
                if (error) {
                    throw new Error(`Supabase auth error: ${error.message}`);
                }
                return { data };
            }
            case manageStorageTool.name: {
                const { action, bucket, path, content } = input;
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
                }
                if (error) {
                    throw new Error(`Supabase storage error: ${error.message}`);
                }
                return { data };
            }
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    } finally {
        client.release();
    }
}
