/**
 * Parse CSV data with proper handling of quotes, escapes, and edge cases
 *
 * @param {string} csvData - Raw CSV string
 * @param {object} options - Parsing options
 * @returns {object} Parsed data with columns and rows
 */
export function parseCSV(csvData: string, options?: object): object;
/**
 * Convert parsed CSV data to JSON format
 *
 * @param {object} parsed - Parsed CSV data from parseCSV()
 * @returns {array} Array of objects
 */
export function csvToJson(parsed: object): array;
/**
 * Validate CSV data before import
 *
 * @param {string} csvData - Raw CSV string
 * @param {object} options - Validation options
 * @returns {object} Validation result
 */
export function validateCSV(csvData: string, options?: object): object;
//# sourceMappingURL=csvParser.d.ts.map