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

  // Parse all rows (including header) respecting quoted newlines
  const allRows = parseAllLines(csvData, delimiter, quote, escape);

  if (allRows.length === 0) {
    throw new MCPError("VALIDATION_INVALID_INPUT", "CSV data is empty", {
      hint: "Provide at least a header row",
    });
  }

  // Parse header
  const columns = allRows[0];

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

  for (let i = 1; i < allRows.length; i++) {
    const values = allRows[i];

    // Skip empty rows if configured
    if (skipEmptyLines && values.length === 1 && values[0].trim() === "") {
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

    // Validate column count matches header
    if (values.length !== columns.length) {
      errors.push({
        line: i + 1,
        error: `Column count mismatch. Expected ${columns.length}, got ${values.length}`,
        data: values.join(delimiter),
      });
      continue;
    }

    rows.push(values);
  }

  // If we have too many errors, fail
  if (errors.length > 0 && errors.length === allRows.length - 1) {
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
 * Parse all lines from CSV data, respecting quoted newlines
 *
 * @param {string} csvData - Full CSV string
 * @param {string} delimiter - Field delimiter
 * @param {string} quote - Quote character
 * @param {string} escape - Escape character
 * @returns {array} Array of rows (each row is an array of fields)
 */
function parseAllLines(csvData, delimiter, quote, escape) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < csvData.length) {
    const char = csvData[i];
    const nextChar = csvData[i + 1];

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
      currentRow.push(currentField.trim());
      currentField = "";
      i++;
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      // End of row (handle both \n and \r\n)
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i += char === '\r' ? 2 : 1; // Skip \r\n or just \n
    } else {
      // Regular character (including newlines inside quotes)
      currentField += char;
      i++;
    }
  }

  // Add last field and row if not empty
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
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
