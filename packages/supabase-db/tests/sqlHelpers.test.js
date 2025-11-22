import { analyzeSQLSafety, formatQueryResult } from "../src/utils/sqlHelpers";

describe("sqlHelpers", () => {
  describe("analyzeSQLSafety", () => {
    it("should return informational warning for safe SELECT query", () => {
      const sql = "SELECT * FROM users WHERE id = 1";
      const warnings = analyzeSQLSafety(sql);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("Note: This tool executes raw SQL");
    });

    it("should warn about DELETE without WHERE", () => {
      const sql = "DELETE FROM users";
      const warnings = analyzeSQLSafety(sql);
      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toContain("DELETE without WHERE");
    });

    it("should not warn about DELETE with WHERE (except info warning)", () => {
      const sql = "DELETE FROM users WHERE id = 1";
      const warnings = analyzeSQLSafety(sql);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("Note: This tool executes raw SQL");
    });

    it("should warn about UPDATE without WHERE", () => {
      const sql = 'UPDATE users SET name = "test"';
      const warnings = analyzeSQLSafety(sql);
      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toContain("UPDATE without WHERE");
    });

    it("should not warn about UPDATE with WHERE (except info warning)", () => {
      const sql = 'UPDATE users SET name = "test" WHERE id = 1';
      const warnings = analyzeSQLSafety(sql);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("Note: This tool executes raw SQL");
    });

    it("should warn about DROP TABLE", () => {
      const sql = "DROP TABLE users";
      const warnings = analyzeSQLSafety(sql);
      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toContain("DROP TABLE");
    });

    it("should warn about TRUNCATE", () => {
      const sql = "TRUNCATE TABLE users";
      const warnings = analyzeSQLSafety(sql);
      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toContain("TRUNCATE");
    });

    it("should detect multiple warnings", () => {
      const sql = "DELETE FROM users; DROP TABLE sessions";
      const warnings = analyzeSQLSafety(sql);
      expect(warnings).toHaveLength(3);
      expect(warnings[0]).toContain("DELETE without WHERE");
      expect(warnings[1]).toContain("DROP TABLE");
    });

    it("should be case insensitive", () => {
      const sql = "delete from users";
      const warnings = analyzeSQLSafety(sql);
      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toContain("DELETE without WHERE");
    });
  });

  describe("formatQueryResult", () => {
    it("should format query result without row limit", () => {
      const mockResult = {
        rowCount: 5,
        rows: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        command: "SELECT",
      };

      const formatted = formatQueryResult(mockResult);

      expect(formatted).toEqual({
        rowCount: 5,
        rows: mockResult.rows,
        command: "SELECT",
      });
      expect(formatted.warning).toBeUndefined();
    });

    it("should add warning when row limit is reached", () => {
      const mockResult = {
        rowCount: 100,
        rows: new Array(100).fill({ id: 1, name: "Test" }),
        command: "SELECT",
      };

      const formatted = formatQueryResult(mockResult, 100);

      expect(formatted.rowCount).toBe(100);
      expect(formatted.warning).toBeDefined();
      expect(formatted.warning).toContain("limited to 100 rows");
    });

    it("should not add warning when row count is below limit", () => {
      const mockResult = {
        rowCount: 50,
        rows: new Array(50).fill({ id: 1, name: "Test" }),
        command: "SELECT",
      };

      const formatted = formatQueryResult(mockResult, 100);

      expect(formatted.warning).toBeUndefined();
    });

    it("should handle null row limit", () => {
      const mockResult = {
        rowCount: 1000,
        rows: new Array(1000).fill({ id: 1, name: "Test" }),
        command: "SELECT",
      };

      const formatted = formatQueryResult(mockResult, null);

      expect(formatted.warning).toBeUndefined();
    });
  });
});
