import {
  queryTool,
  queryTransactionTool,
  explainQueryTool,
  handleQueryToolCall,
} from '../src/tools/queryTools';
import * as sqlHelpers from '../src/utils/sqlHelpers';

// Mock the sqlHelpers module
jest.mock('../src/utils/sqlHelpers');

describe('queryTools', () => {
  let mockConnectionManager;
  let mockPool;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
    };

    mockConnectionManager = {
      getConnection: jest.fn().mockReturnValue(mockPool),
    };

    // Setup default mock implementations
    sqlHelpers.analyzeSQLSafety.mockReturnValue([]);
    sqlHelpers.formatQueryResult.mockImplementation((result, limit) => ({
      rowCount: result.rowCount,
      rows: result.rows,
      command: result.command,
    }));

    jest.clearAllMocks();
  });

  describe('Tool Definitions', () => {
    it('should define queryTool correctly', () => {
      expect(queryTool.name).toBe('query');
      expect(queryTool.description).toBeDefined();
      expect(queryTool.input_schema).toBeDefined();
      expect(queryTool.output_schema).toBeDefined();
    });

    it('should define queryTransactionTool correctly', () => {
      expect(queryTransactionTool.name).toBe('queryTransaction');
      expect(queryTransactionTool.description).toBeDefined();
      expect(queryTransactionTool.input_schema).toBeDefined();
      expect(queryTransactionTool.output_schema).toBeDefined();
    });

    it('should define explainQueryTool correctly', () => {
      expect(explainQueryTool.name).toBe('explainQuery');
      expect(explainQueryTool.description).toBeDefined();
      expect(explainQueryTool.input_schema).toBeDefined();
      expect(explainQueryTool.output_schema).toBeDefined();
    });
  });

  describe('handleQueryToolCall', () => {
    describe('query', () => {
      it('should execute a safe SELECT query', async () => {
        const sql = 'SELECT * FROM users WHERE id = 1';
        const mockResult = {
          rowCount: 1,
          rows: [{ id: 1, name: 'Alice' }],
          command: 'SELECT',
        };

        mockClient.query.mockResolvedValue(mockResult);

        const result = await handleQueryToolCall(
          queryTool.name,
          { sql },
          mockConnectionManager
        );

        expect(mockConnectionManager.getConnection).toHaveBeenCalled();
        expect(mockPool.connect).toHaveBeenCalled();
        expect(sqlHelpers.analyzeSQLSafety).toHaveBeenCalledWith(sql);
        expect(mockClient.query).toHaveBeenCalledWith(sql);
        expect(sqlHelpers.formatQueryResult).toHaveBeenCalledWith(mockResult, 100);
        expect(mockClient.release).toHaveBeenCalled();
      });

      it('should execute query with custom row limit', async () => {
        const sql = 'SELECT * FROM users';
        const rowLimit = 50;
        const mockResult = {
          rowCount: 50,
          rows: new Array(50).fill({ id: 1, name: 'Test' }),
          command: 'SELECT',
        };

        mockClient.query.mockResolvedValue(mockResult);

        await handleQueryToolCall(
          queryTool.name,
          { sql, rowLimit },
          mockConnectionManager
        );

        expect(sqlHelpers.formatQueryResult).toHaveBeenCalledWith(mockResult, rowLimit);
      });

      it('should throw error for unsafe query', async () => {
        const sql = 'DELETE FROM users';
        sqlHelpers.analyzeSQLSafety.mockReturnValue(['Unsafe query']);

        await expect(
          handleQueryToolCall(queryTool.name, { sql }, mockConnectionManager)
        ).rejects.toThrow('Unsafe query detected: Unsafe query');

        expect(mockClient.query).not.toHaveBeenCalled();
        expect(mockClient.release).toHaveBeenCalled();
      });

      it('should release client even on error', async () => {
        const sql = 'SELECT * FROM users';
        mockClient.query.mockRejectedValue(new Error('Query failed'));

        await expect(
          handleQueryToolCall(queryTool.name, { sql }, mockConnectionManager)
        ).rejects.toThrow('Query failed');

        expect(mockClient.release).toHaveBeenCalled();
      });
    });

    describe('queryTransaction', () => {
      it('should execute multiple statements in transaction', async () => {
        const sqlStatements = [
          'INSERT INTO users (name) VALUES ("Alice")',
          'UPDATE users SET active = true WHERE name = "Alice"',
        ];

        mockClient.query
          .mockResolvedValueOnce({ command: 'BEGIN' })
          .mockResolvedValueOnce({ command: 'INSERT', rowCount: 1 })
          .mockResolvedValueOnce({ command: 'UPDATE', rowCount: 1 })
          .mockResolvedValueOnce({ command: 'COMMIT' });

        const result = await handleQueryToolCall(
          queryTransactionTool.name,
          { sqlStatements },
          mockConnectionManager
        );

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith(sqlStatements[0]);
        expect(mockClient.query).toHaveBeenCalledWith(sqlStatements[1]);
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(result).toEqual({
          results: [
            { command: 'INSERT', rowCount: 1 },
            { command: 'UPDATE', rowCount: 1 },
          ],
        });
        expect(mockClient.release).toHaveBeenCalled();
      });

      it('should rollback transaction on error', async () => {
        const sqlStatements = [
          'INSERT INTO users (name) VALUES ("Alice")',
          'INVALID SQL',
        ];

        mockClient.query
          .mockResolvedValueOnce({ command: 'BEGIN' })
          .mockResolvedValueOnce({ command: 'INSERT', rowCount: 1 })
          .mockRejectedValueOnce(new Error('Syntax error'))
          .mockResolvedValueOnce({ command: 'ROLLBACK' });

        await expect(
          handleQueryToolCall(
            queryTransactionTool.name,
            { sqlStatements },
            mockConnectionManager
          )
        ).rejects.toThrow('Syntax error');

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
      });

      it('should reject unsafe statements in transaction', async () => {
        const sqlStatements = [
          'INSERT INTO users (name) VALUES ("Alice")',
          'DELETE FROM sessions',
        ];

        sqlHelpers.analyzeSQLSafety
          .mockReturnValueOnce([])
          .mockReturnValueOnce(['Unsafe query']);

        mockClient.query.mockResolvedValueOnce({ command: 'BEGIN' })
                        .mockResolvedValueOnce({ command: 'INSERT', rowCount: 1 })
                        .mockResolvedValueOnce({ command: 'ROLLBACK' });

        await expect(
          handleQueryToolCall(
            queryTransactionTool.name,
            { sqlStatements },
            mockConnectionManager
          )
        ).rejects.toThrow('Unsafe query detected: Unsafe query');

        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
      });
    });

    describe('explainQuery', () => {
      it('should return query execution plan', async () => {
        const sql = 'SELECT * FROM users WHERE id = 1';
        const mockPlan = {
          'Plan': {
            'Node Type': 'Seq Scan',
            'Relation Name': 'users',
          },
        };

        mockClient.query.mockResolvedValue({
          rows: [{ 'QUERY PLAN': mockPlan }],
        });

        const result = await handleQueryToolCall(
          explainQueryTool.name,
          { sql },
          mockConnectionManager
        );

        expect(mockClient.query).toHaveBeenCalledWith(`EXPLAIN (FORMAT JSON) ${sql}`);
        expect(result).toEqual({
          plan: JSON.stringify(mockPlan, null, 2),
        });
        expect(mockClient.release).toHaveBeenCalled();
      });

      it('should handle complex queries', async () => {
        const sql = `
          SELECT u.*, p.title
          FROM users u
          LEFT JOIN posts p ON u.id = p.user_id
          WHERE u.active = true
        `;
        const mockPlan = {
          'Plan': {
            'Node Type': 'Hash Join',
          },
        };

        mockClient.query.mockResolvedValue({
          rows: [{ 'QUERY PLAN': mockPlan }],
        });

        const result = await handleQueryToolCall(
          explainQueryTool.name,
          { sql },
          mockConnectionManager
        );

        expect(result.plan).toBeDefined();
        expect(mockClient.release).toHaveBeenCalled();
      });
    });

    describe('Unknown Tool', () => {
      it('should throw error for unknown tool name', async () => {
        await expect(
          handleQueryToolCall('unknownTool', {}, mockConnectionManager)
        ).rejects.toThrow('Unknown tool: unknownTool');

        expect(mockClient.release).toHaveBeenCalled();
      });
    });
  });
});
