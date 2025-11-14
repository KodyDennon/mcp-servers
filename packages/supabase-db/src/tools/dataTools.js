
import { z } from "zod";

export const importDataTool = {
    name: "importData",
    description: "Import data into a table from various formats.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table"),
        format: z.enum(["csv", "json"]).describe("The format of the data"),
        data: z.string().describe("The data to import"),
    }),
    output_schema: z.object({
        message: z.string(),
    }),
};

export const insertRowTool = {
    name: "insertRow",
    description: "Insert a new row into a table.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table"),
        data: z.object({}).describe("The data to insert (key-value pairs)"),
    }),
    output_schema: z.object({
        row: z.any(),
    }),
};

export const updateRowTool = {
    name: "updateRow",
    description: "Update an existing row in a table.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table"),
        rowId: z.string().describe("The ID of the row to update"),
        data: z.object({}).describe("The data to update (key-value pairs)"),
    }),
    output_schema: z.object({
        row: z.any(),
    }),
};

export const deleteRowTool = {
    name: "deleteRow",
    description: "Delete a row from a table.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table"),
        rowId: z.string().describe("The ID of the row to delete"),
    }),
    output_schema: z.object({
        row: z.any(),
    }),
};

export async function handleDataToolCall(toolName, input, connectionManager) {
    const pool = connectionManager.getConnection();
    const client = await pool.connect();
    try {
        switch (toolName) {
            case importDataTool.name: {
                const { tableName, format, data } = input;
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
                return { message: "Data imported successfully" };
            }
            case insertRowTool.name: {
                const { tableName, data } = input;
                const columns = Object.keys(data);
                const values = Object.values(data);
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
                const query = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
                const result = await client.query(query, values);
                return { row: result.rows[0] };
            }
            case updateRowTool.name: {
                const { tableName, rowId, data } = input;
                const columns = Object.keys(data);
                const values = Object.values(data);
                const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(", ");
                const query = `UPDATE "${tableName}" SET ${setClause} WHERE id = $${columns.length + 1} RETURNING *`;
                const result = await client.query(query, [...values, rowId]);
                return { row: result.rows[0] };
            }
            case deleteRowTool.name: {
                const { tableName, rowId } = input;
                const query = `DELETE FROM "${tableName}" WHERE id = $1 RETURNING *`;
                const result = await client.query(query, [rowId]);
                return { row: result.rows[0] };
            }
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    } finally {
        client.release();
    }
}
