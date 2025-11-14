import {
  listTablesTool,
  getTableSchemaTool,
  listIndexesTool,
  listFunctionsTool,
  searchSchemaTool,
  createTableTool,
  dropTableTool,
  addColumnTool,
  dropColumnTool,
  createIndexTool,
  diffSchemaTool,
  handleSchemaToolCall,
} from '../src/tools/schemaTools';

describe('schemaTools', () => {
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

    jest.clearAllMocks();
  });

  describe('Tool Definitions', () => {
    const tools = [
      { tool: listTablesTool, name: 'listTables' },
      { tool: getTableSchemaTool, name: 'getTableSchema' },
      { tool: listIndexesTool, name: 'listIndexes' },
      { tool: listFunctionsTool, name: 'listFunctions' },
      { tool: searchSchemaTool, name: 'searchSchema' },
      { tool: createTableTool, name: 'createTable' },
      { tool: dropTableTool, name: 'dropTable' },
      { tool: addColumnTool, name: 'addColumn' },
      { tool: dropColumnTool, name: 'dropColumn' },
      { tool: createIndexTool, name: 'createIndex' },
      { tool: diffSchemaTool, name: 'diffSchema' },
    ];

    tools.forEach(({ tool, name }) => {
      it(`should define ${name} correctly`, () => {
        expect(tool.name).toBe(name);
        expect(tool.description).toBeDefined();
        expect(tool.input_schema).toBeDefined();
        expect(tool.output_schema).toBeDefined();
      });
    });
  });

  describe('handleSchemaToolCall', () => {
    it('should get connection from connection manager', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await handleSchemaToolCall(
        listTablesTool.name,
        {},
        mockConnectionManager
      ).catch(() => {});

      expect(mockConnectionManager.getConnection).toHaveBeenCalled();
      expect(mockPool.connect).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      await expect(
        handleSchemaToolCall(listTablesTool.name, {}, mockConnectionManager)
      ).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error for unknown tool name', async () => {
      await expect(
        handleSchemaToolCall('unknownTool', {}, mockConnectionManager)
      ).rejects.toThrow('Unknown tool: unknownTool');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
