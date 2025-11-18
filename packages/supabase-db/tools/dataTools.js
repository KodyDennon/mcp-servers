import { z } from "zod";
import { parseCSV, csvToJson } from "../utils/csvParser.js";
import { MCPError, withErrorHandler, validateTableName, validateColumnNames, } from "../utils/errorHandler.js";
export const importDataTool = {
    name: "importData",
    description: "Import data into a table from various formats (CSV or JSON). Supports up to 10,000 rows per batch. Uses secure parameterized queries to prevent SQL injection.",
    input_schema: z.object({
        tableName: z
            .string()
            .min(1)
            .describe("The name of the table to import into"),
        format: z
            .enum(["csv", "json"])
            .describe("The format of the data (csv or json)"),
        data: z.string().min(1).describe("The data to import as a string"),
        batchSize: z
            .number()
            .optional()
            .default(1000)
            .describe("Number of rows to insert per batch (default: 1000)"),
    }),
    output_schema: z.object({
        success: z.boolean(),
        rowsImported: z.number(),
        message: z.string(),
        warnings: z
            .array(z.object({
            line: z.number(),
            error: z.string(),
        }))
            .optional(),
    }),
};
export const insertRowTool = {
    name: "insertRow",
    description: "Insert a new row into a table. Returns the inserted row including any auto-generated fields.",
    input_schema: z.object({
        tableName: z.string().min(1).describe("The name of the table"),
        data: z.record(z.any()).describe("The data to insert as key-value pairs"),
    }),
    output_schema: z.object({
        success: z.boolean(),
        row: z.record(z.any()).optional(),
        error: z
            .object({
            code: z.string(),
            message: z.string(),
            retry: z.boolean(),
            suggested_action: z.string(),
        })
            .optional(),
    }),
};
export const updateRowTool = {
    name: "updateRow",
    description: "Update an existing row in a table by ID. Returns the updated row.",
    input_schema: z.object({
        tableName: z.string().min(1).describe("The name of the table"),
        rowId: z
            .union([z.string(), z.number()])
            .describe("The ID of the row to update"),
        data: z.record(z.any()).describe("The data to update as key-value pairs"),
    }),
    output_schema: z.object({
        success: z.boolean(),
        row: z.record(z.any()).optional(),
        error: z
            .object({
            code: z.string(),
            message: z.string(),
            retry: z.boolean(),
            suggested_action: z.string(),
        })
            .optional(),
    }),
};
export const deleteRowTool = {
    name: "deleteRow",
    description: "Delete a row from a table by ID. Returns the deleted row.",
    input_schema: z.object({
        tableName: z.string().min(1).describe("The name of the table"),
        rowId: z
            .union([z.string(), z.number()])
            .describe("The ID of the row to delete"),
    }),
    output_schema: z.object({
        success: z.boolean(),
        row: z.record(z.any()).optional(),
        error: z
            .object({
            code: z.string(),
            message: z.string(),
            retry: z.boolean(),
            suggested_action: z.string(),
        })
            .optional(),
    }),
};
/**
 * Handle data tool calls with comprehensive error handling and security
 */
export async function handleDataToolCall(toolName, input, connectionManager) {
    const handler = withErrorHandler(async () => {
        const pool = connectionManager.getConnection();
        const client = await pool.connect();
        try {
            switch (toolName) {
                case importDataTool.name:
                    return await handleImportData(client, input);
                case insertRowTool.name:
                    return await handleInsertRow(client, input);
                case updateRowTool.name:
                    return await handleUpdateRow(client, input);
                case deleteRowTool.name:
                    return await handleDeleteRow(client, input);
                default:
                    throw new MCPError("VALIDATION_INVALID_INPUT", `Unknown tool: ${toolName}`, { tool: toolName });
            }
        }
        finally {
            client.release();
        }
    }, { tool: toolName });
    return handler();
}
/**
 * Import data with proper security and batch processing
 */
async function handleImportData(client, input) {
    const { tableName, format, data, batchSize = 1000 } = input;
    // Validate and sanitize table name
    const safeTableName = validateTableName(tableName);
    let parsedData;
    let warnings;
    try {
        if (format === "json") {
            // Parse JSON data
            parsedData = JSON.parse(data);
            if (!Array.isArray(parsedData)) {
                throw new MCPError("VALIDATION_INVALID_INPUT", "JSON data must be an array of objects", {
                    hint: 'Provide data as: [{"col1": "val1", "col2": "val2"}, ...]',
                });
            }
            if (parsedData.length === 0) {
                throw new MCPError("VALIDATION_INVALID_INPUT", "JSON array is empty", {
                    hint: "Provide at least one row to import",
                });
            }
            // Get columns from first row
            const columns = Object.keys(parsedData[0]);
            const safeColumns = validateColumnNames(columns);
            // Extract values
            const rows = parsedData.map((row) => columns.map((col) => row[col]));
            // Import in batches
            const totalRows = await importBatches(client, safeTableName, safeColumns, rows, batchSize);
            return {
                rowsImported: totalRows,
                message: `Successfully imported ${totalRows} rows into ${safeTableName}`,
            };
        }
        else if (format === "csv") {
            // Parse CSV with robust parser
            const parsed = parseCSV(data, {
                maxRows: 10000,
                skipEmptyLines: true,
            });
            const safeColumns = validateColumnNames(parsed.columns);
            warnings = parsed.errors;
            // Import in batches
            const totalRows = await importBatches(client, safeTableName, safeColumns, parsed.rows, batchSize);
            return {
                rowsImported: totalRows,
                message: `Successfully imported ${totalRows} rows into ${safeTableName}`,
                warnings: warnings,
            };
        }
        else {
            throw new MCPError("VALIDATION_INVALID_INPUT", `Unsupported data format: ${format}`, {
                supported_formats: ["csv", "json"],
            });
        }
    }
    catch (error) {
        if (error instanceof MCPError) {
            throw error;
        }
        if (error instanceof SyntaxError && format === "json") {
            throw new MCPError("VALIDATION_INVALID_INPUT", "Invalid JSON format", {
                error: error.message,
                hint: "Check JSON syntax and ensure proper formatting",
            });
        }
        throw error;
    }
}
/**
 * Import data in batches using parameterized queries
 */
async function importBatches(client, tableName, columns, rows, batchSize) {
    let totalImported = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        // Build parameterized query
        const placeholders = [];
        const values = [];
        let paramIndex = 1;
        for (let rowIdx = 0; rowIdx < batch.length; rowIdx++) {
            const row = batch[rowIdx];
            const rowPlaceholders = [];
            for (let colIdx = 0; colIdx < columns.length; colIdx++) {
                rowPlaceholders.push(`$${paramIndex++}`);
                values.push(row[colIdx]);
            }
            placeholders.push(`(${rowPlaceholders.join(", ")})`);
        }
        // Build and execute safe query with parameterized values
        const query = `
            INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(", ")})
            VALUES ${placeholders.join(", ")}
        `;
        await client.query(query, values);
        totalImported += batch.length;
    }
    return totalImported;
}
/**
 * Insert a single row with proper security
 */
async function handleInsertRow(client, input) {
    const { tableName, data } = input;
    // Validate table name
    const safeTableName = validateTableName(tableName);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new MCPError("VALIDATION_INVALID_INPUT", "Data must be a non-empty object", {
            hint: 'Provide data as: {"column1": "value1", "column2": "value2"}',
        });
    }
    const columns = Object.keys(data);
    if (columns.length === 0) {
        throw new MCPError("VALIDATION_INVALID_INPUT", "Data object is empty", {
            hint: "Provide at least one column-value pair",
        });
    }
    const safeColumns = validateColumnNames(columns);
    const values = Object.values(data);
    // Build parameterized query
    const placeholders = safeColumns.map((_, i) => `$${i + 1}`).join(", ");
    const query = `
        INSERT INTO "${safeTableName}" (${safeColumns.map((c) => `"${c}"`).join(", ")})
        VALUES (${placeholders})
        RETURNING *
    `;
    const result = await client.query(query, values);
    return {
        row: result.rows[0],
        message: `Successfully inserted row into ${safeTableName}`,
    };
}
/**
 * Update a row with proper security
 */
async function handleUpdateRow(client, input) {
    const { tableName, rowId, data } = input;
    // Validate table name
    const safeTableName = validateTableName(tableName);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new MCPError("VALIDATION_INVALID_INPUT", "Data must be a non-empty object", {
            hint: 'Provide data as: {"column1": "value1", "column2": "value2"}',
        });
    }
    const columns = Object.keys(data);
    if (columns.length === 0) {
        throw new MCPError("VALIDATION_INVALID_INPUT", "Data object is empty", {
            hint: "Provide at least one column-value pair to update",
        });
    }
    const safeColumns = validateColumnNames(columns);
    const values = Object.values(data);
    // Build parameterized query
    const setClause = safeColumns
        .map((col, i) => `"${col}" = $${i + 1}`)
        .join(", ");
    const query = `
        UPDATE "${safeTableName}"
        SET ${setClause}
        WHERE id = $${safeColumns.length + 1}
        RETURNING *
    `;
    const result = await client.query(query, [...values, rowId]);
    if (result.rows.length === 0) {
        throw new MCPError("RESOURCE_NOT_FOUND", `Row with id ${rowId} not found in ${safeTableName}`, {
            table: safeTableName,
            row_id: rowId,
            hint: "Verify the row ID exists in the table",
        });
    }
    return {
        row: result.rows[0],
        message: `Successfully updated row ${rowId} in ${safeTableName}`,
    };
}
/**
 * Delete a row with proper security
 */
async function handleDeleteRow(client, input) {
    const { tableName, rowId } = input;
    // Validate table name
    const safeTableName = validateTableName(tableName);
    const query = `
        DELETE FROM "${safeTableName}"
        WHERE id = $1
        RETURNING *
    `;
    const result = await client.query(query, [rowId]);
    if (result.rows.length === 0) {
        throw new MCPError("RESOURCE_NOT_FOUND", `Row with id ${rowId} not found in ${safeTableName}`, {
            table: safeTableName,
            row_id: rowId,
            hint: "Verify the row ID exists in the table",
        });
    }
    return {
        row: result.rows[0],
        message: `Successfully deleted row ${rowId} from ${safeTableName}`,
    };
}
//# sourceMappingURL=dataTools.js.map