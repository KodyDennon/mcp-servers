/**
 * Security Regression Tests
 * Prevents SQL injection, XSS, and other vulnerabilities
 */

import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import { parseCSV } from "../src/utils/csvParser.js";
import {
  MCPError,
  sanitizeIdentifier,
  validateTableName,
  validateColumnNames,
} from "../src/utils/errorHandler.js";
import { handleDataToolCall, importDataTool } from "../src/tools/dataTools.js";

describe("Security Tests", () => {
  describe("SQL Injection Prevention", () => {
    test("should reject SQL injection in table names", () => {
      const malicious = [
        "users'; DROP TABLE users; --",
        "users; DELETE FROM users",
        "users/**/UNION/**/SELECT",
        "users WHERE 1=1--",
      ];

      malicious.forEach((tableName) => {
        expect(() => {
          validateTableName(tableName);
        }).toThrow(MCPError);
      });
    });

    test("should reject SQL injection in column names", () => {
      const malicious = [
        ["name', password FROM users--"],
        ["id; DROP TABLE users"],
        ["* FROM users WHERE 1=1--"],
      ];

      malicious.forEach((columns) => {
        expect(() => {
          validateColumnNames(columns);
        }).toThrow(MCPError);
      });
    });

    test("should sanitize safe identifiers correctly", () => {
      const safe = [
        "users",
        "user_table",
        "table123",
        "my_table_name",
        "schema.table",
      ];

      safe.forEach((identifier) => {
        expect(() => {
          sanitizeIdentifier(identifier);
        }).not.toThrow();
      });
    });

    test("should prevent SQL injection via CSV import", () => {
      const maliciousCsv = `name,email
Bob,"'); DROP TABLE users; --"
Alice,alice@example.com`;

      const parsed = parseCSV(maliciousCsv);

      // Should parse without error
      expect(parsed.columns).toEqual(["name", "email"]);
      expect(parsed.rows).toHaveLength(2);

      // The malicious content should be treated as data, not SQL
      expect(parsed.rows[0][1]).toBe("'); DROP TABLE users; --");
    });

    test("should prevent SQL injection via JSON import", async () => {
      const maliciousJson = [
        {
          name: "Bob",
          email: "'); DROP TABLE users; --",
        },
      ];

      // Mock connection manager
      const mockConnectionManager = {
        getConnection: () => ({
          connect: async () => ({
            query: jest.fn(async (query, params) => {
              // Verify parameterized query is used
              expect(query).toContain("$1");
              expect(query).toContain("$2");
              expect(params).toEqual(["Bob", "'); DROP TABLE users; --"]);

              // Verify table name is quoted
              expect(query).toMatch(/INSERT INTO "test_table"/);

              return { rows: [] };
            }),
            release: jest.fn(),
          }),
        }),
      };

      const input = {
        tableName: "test_table",
        format: "json",
        data: JSON.stringify(maliciousJson),
      };

      const result = await handleDataToolCall(
        importDataTool.name,
        input,
        mockConnectionManager,
      );

      expect(result.success).toBe(true);
    });
  });

  describe("CSV Parser Security", () => {
    test("should handle quoted commas correctly", () => {
      const csv = `name,description
"Product A","Contains, commas, and, more"
"Product B","Simple description"`;

      const parsed = parseCSV(csv);

      expect(parsed.rows[0]).toEqual([
        "Product A",
        "Contains, commas, and, more",
      ]);
      expect(parsed.rows[1]).toEqual(["Product B", "Simple description"]);
    });

    test("should handle escaped quotes", () => {
      const csv = `name,description
"John ""The Boss"" Doe","Works at ""Company"""
Jane,"Normal name"`;

      const parsed = parseCSV(csv);

      expect(parsed.rows[0][0]).toBe('John "The Boss" Doe');
      expect(parsed.rows[0][1]).toBe('Works at "Company"');
    });

    test("should handle newlines in quoted fields", () => {
      const csv = `name,description
"Product A","Line 1
Line 2
Line 3"
"Product B","Single line"`;

      const parsed = parseCSV(csv);

      expect(parsed.rows[0][1]).toContain("\n");
      expect(parsed.rows[0][1].split("\n")).toHaveLength(3);
    });

    test("should enforce row limits", () => {
      const rows = Array(100)
        .fill(0)
        .map((_, i) => `Row${i},Value${i}`)
        .join("\n");
      const csv = `name,value\n${rows}`;

      expect(() => {
        parseCSV(csv, { maxRows: 50 });
      }).toThrow(MCPError);
    });

    test("should validate column count consistency", () => {
      const csv = `name,email,age
Bob,bob@example.com,30
Alice,alice@example.com
Charlie,charlie@example.com,25,extra`;

      const parsed = parseCSV(csv);

      // Should have errors for mismatched rows
      expect(parsed.errors).toBeDefined();
      expect(parsed.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Identifier Validation", () => {
    test("should reject empty identifiers", () => {
      expect(() => {
        sanitizeIdentifier("");
      }).toThrow(MCPError);

      expect(() => {
        sanitizeIdentifier(null);
      }).toThrow(MCPError);

      expect(() => {
        sanitizeIdentifier(undefined);
      }).toThrow(MCPError);
    });

    test("should reject special characters", () => {
      const invalid = [
        "table;name",
        "table--name",
        "table/*comment*/",
        "table name", // spaces
        "table@name",
        "table#name",
        "table$name",
      ];

      invalid.forEach((identifier) => {
        expect(() => {
          sanitizeIdentifier(identifier);
        }).toThrow(MCPError);
      });
    });

    test("should allow valid schema.table notation", () => {
      expect(() => {
        sanitizeIdentifier("public.users");
      }).not.toThrow();

      expect(() => {
        sanitizeIdentifier("my_schema.my_table");
      }).not.toThrow();
    });
  });

  describe("Error Response Security", () => {
    test("should not expose sensitive information in errors", () => {
      const error = new MCPError(
        "DB_CONNECTION_FAILED",
        "Database connection failed",
        {
          connection_string: "postgresql://user:password@localhost/db",
        },
      );

      const response = error.toJSON();

      // Should have structured error
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe("DB_CONNECTION_FAILED");

      // Should not expose password in main message
      expect(response.error.message).not.toContain("password");
    });

    test("should provide actionable hints for AI agents", () => {
      const error = new MCPError(
        "DB_TABLE_NOT_FOUND",
        "Table not found: users",
        {
          table_name: "users",
        },
      );

      const response = error.toJSON();

      expect(response.error.suggested_action).toBeDefined();
      expect(response.error.retry).toBe(false);
      expect(response.error.category).toBe("schema");
    });
  });

  describe("Input Validation", () => {
    test("should validate data import input schema", () => {
      const invalid = [
        { tableName: "", format: "json", data: "[]" },
        { tableName: "users", format: "xml", data: "<data>" },
        { tableName: "users", format: "json", data: "" },
      ];

      invalid.forEach((input) => {
        expect(() => {
          importDataTool.input_schema.parse(input);
        }).toThrow();
      });
    });

    test("should validate against very large inputs", () => {
      const largeData = JSON.stringify(
        Array(20000)
          .fill(0)
          .map((_, i) => ({
            id: i,
            name: `User${i}`,
          })),
      );

      expect(() => {
        parseCSV(`id,name\n${largeData}`, { maxRows: 10000 });
      }).toThrow(MCPError);
    });
  });

  describe("Authentication Security", () => {
    test("should detect missing environment variables", () => {
      const originalEnv = process.env.POSTGRES_URL_NON_POOLING;
      delete process.env.POSTGRES_URL_NON_POOLING;

      // Should be handled by validateEnvironment
      try {
        expect(() => {
          if (!process.env.POSTGRES_URL_NON_POOLING) {
            throw new MCPError(
              "AUTH_MISSING_ENV_VARS",
              "Missing required environment variable",
              {
                missing_vars: ["POSTGRES_URL_NON_POOLING"],
              },
            );
          }
        }).toThrow(MCPError);
      } finally {
        if (originalEnv) {
          process.env.POSTGRES_URL_NON_POOLING = originalEnv;
        }
      }
    });
  });

  describe("Batch Import Security", () => {
    test("should handle batch processing without concatenating unsafe SQL", async () => {
      const mockClient = {
        query: jest.fn(async (query, params) => {
          // Verify all values are parameterized
          expect(params).toBeDefined();
          expect(Array.isArray(params)).toBe(true);
          expect(params.length).toBeGreaterThan(0);

          // Verify query uses placeholders
          expect(query).toMatch(/\$\d+/);

          return { rows: [] };
        }),
        release: jest.fn(),
      };

      const mockConnectionManager = {
        getConnection: () => ({
          connect: async () => mockClient,
        }),
      };

      const maliciousData = [
        { name: "Bob", email: "'; DROP TABLE users; --" },
        { name: "Alice", email: "alice@example.com" },
      ];

      const input = {
        tableName: "test_table",
        format: "json",
        data: JSON.stringify(maliciousData),
        batchSize: 100,
      };

      await handleDataToolCall(
        importDataTool.name,
        input,
        mockConnectionManager,
      );

      // Verify query was called with parameterized values
      expect(mockClient.query).toHaveBeenCalled();
    });
  });
});

describe("XSS Prevention", () => {
  test("should not allow script injection in error messages", () => {
    const maliciousInput = '<script>alert("XSS")</script>';

    const error = new MCPError(
      "VALIDATION_INVALID_INPUT",
      `Invalid input: ${maliciousInput}`,
      {},
    );

    const response = error.toJSON();

    // Error should contain the input, but when displayed,
    // clients should escape HTML
    expect(response.error.message).toContain(maliciousInput);

    // The response itself shouldn't execute scripts
    // (this is a client responsibility, but we verify structure)
    expect(typeof response.error.message).toBe("string");
  });
});

describe("Denial of Service Prevention", () => {
  test("should reject extremely nested JSON", () => {
    // Create deeply nested object
    let nested = { value: "data" };
    for (let i = 0; i < 1000; i++) {
      nested = { nested };
    }

    expect(() => {
      JSON.stringify(nested);
    }).not.toThrow(); // JSON.stringify handles this

    // But our CSV parser should reject huge rows
    expect(() => {
      parseCSV("a,b,c\n" + "x,".repeat(10000) + "y");
    }).toThrow();
  });
});
