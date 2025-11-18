/**
 * Robust CSV Parser with proper quote/escape handling
 * Replaces naive string.split() approach to prevent data corruption and injection
 */
import { MCPError } from "./errorHandler.js";
/**
 * Parse CSV data with proper handling of quotes, escapes, and edge cases
 *
 * @param {string} csvData - Raw CSV string
 * @param {object} options - Parsing options
 * @returns {object} Parsed data with columns and rows
 */
export function parseCSV(csvData, options = {}) {
  const {
    delimiter = ",",
    quote = '"',
    escape = "\\",
    skipEmptyLines = true,
    maxRows = 10000,
  } = options;
  if (!csvData || typeof csvData !== "string") {
    throw new MCPError(
      "VALIDATION_INVALID_INPUT",
      "CSV data must be a non-empty string",
      {
        hint: "Provide valid CSV data as a string",
      },
    );
  }
  const lines = csvData.split(/\r?\n/);
  if (lines.length === 0) {
    throw new MCPError("VALIDATION_INVALID_INPUT", "CSV data is empty", {
      hint: "Provide at least a header row",
    });
  }
  // Parse header
  const headerLine = lines[0];
  const columns = parseLine(headerLine, delimiter, quote, escape);
  if (columns.length === 0) {
    throw new MCPError(
      "VALIDATION_INVALID_INPUT",
      "CSV header is empty or invalid",
      {
        hint: "Ensure the first row contains column names",
      },
    );
  }
  // Validate column names
  const invalidColumns = columns.filter(
    (col) => !col || typeof col !== "string" || col.trim() === "",
  );
  if (invalidColumns.length > 0) {
    throw new MCPError(
      "VALIDATION_INVALID_INPUT",
      "CSV contains empty or invalid column names",
      {
        columns: columns,
        hint: "All column names must be non-empty strings",
      },
    );
  }
  // Parse data rows
  const rows = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Skip empty lines if configured
    if (skipEmptyLines && line.trim() === "") {
      continue;
    }
    // Check row limit
    if (rows.length >= maxRows) {
      throw new MCPError(
        "RESOURCE_LIMIT_EXCEEDED",
        `CSV exceeds maximum row limit of ${maxRows}`,
        {
          max_rows: maxRows,
          hint: "Split large imports into smaller batches",
        },
      );
    }
    try {
      const values = parseLine(line, delimiter, quote, escape);
      // Validate column count matches header
      if (values.length !== columns.length) {
        errors.push({
          line: i + 1,
          error: `Column count mismatch. Expected ${columns.length}, got ${values.length}`,
          data: line,
        });
        continue;
      }
      rows.push(values);
    } catch (error) {
      errors.push({
        line: i + 1,
        error: error.message,
        data: line,
      });
    }
  }
  // If we have too many errors, fail
  if (errors.length > 0 && errors.length === lines.length - 1) {
    throw new MCPError("VALIDATION_INVALID_INPUT", "Failed to parse CSV data", {
      errors: errors.slice(0, 10), // Only show first 10 errors
      total_errors: errors.length,
      hint: "Check CSV format and ensure proper quoting",
    });
  }
  return {
    columns,
    rows,
    rowCount: rows.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}
/**
 * Parse a single CSV line with proper quote and escape handling
 *
 * @param {string} line - CSV line to parse
 * @param {string} delimiter - Field delimiter
 * @param {string} quote - Quote character
 * @param {string} escape - Escape character
 * @returns {array} Array of field values
 */
function parseLine(line, delimiter, quote, escape) {
  const fields = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    if (char === escape && nextChar === quote && inQuotes) {
      // Escaped quote inside quoted field
      currentField += quote;
      i += 2;
    } else if (char === quote && nextChar === quote && inQuotes) {
      // Double quote escaping
      currentField += quote;
      i += 2;
    } else if (char === quote) {
      // Toggle quote state
      inQuotes = !inQuotes;
      i++;
    } else if (char === delimiter && !inQuotes) {
      // End of field
      fields.push(currentField.trim());
      currentField = "";
      i++;
    } else {
      // Regular character
      currentField += char;
      i++;
    }
  }
  // Add last field
  fields.push(currentField.trim());
  return fields;
}
/**
 * Convert parsed CSV data to JSON format
 *
 * @param {object} parsed - Parsed CSV data from parseCSV()
 * @returns {array} Array of objects
 */
export function csvToJson(parsed) {
  const { columns, rows } = parsed;
  return rows.map((row) => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}
/**
 * Validate CSV data before import
 *
 * @param {string} csvData - Raw CSV string
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
export function validateCSV(csvData, options = {}) {
  try {
    const parsed = parseCSV(csvData, options);
    return {
      valid: true,
      columns: parsed.columns,
      rowCount: parsed.rowCount,
      warnings: parsed.errors,
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof MCPError ? error.error : { message: error.message },
    };
  }
}
//# sourceMappingURL=csvParser.js.map
