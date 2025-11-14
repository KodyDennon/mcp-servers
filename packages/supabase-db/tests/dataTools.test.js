import {
  importDataTool,
  insertRowTool,
  updateRowTool,
  deleteRowTool,
  handleDataToolCall,
} from '../src/tools/dataTools';

describe('dataTools', () => {
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
    it('should define importDataTool correctly', () => {
      expect(importDataTool.name).toBe('importData');
      expect(importDataTool.description).toBeDefined();
      expect(importDataTool.input_schema).toBeDefined();
      expect(importDataTool.output_schema).toBeDefined();
    });

    it('should define insertRowTool correctly', () => {
      expect(insertRowTool.name).toBe('insertRow');
      expect(insertRowTool.description).toBeDefined();
      expect(insertRowTool.input_schema).toBeDefined();
      expect(insertRowTool.output_schema).toBeDefined();
    });

    it('should define updateRowTool correctly', () => {
      expect(updateRowTool.name).toBe('updateRow');
      expect(updateRowTool.description).toBeDefined();
      expect(updateRowTool.input_schema).toBeDefined();
      expect(updateRowTool.output_schema).toBeDefined();
    });

    it('should define deleteRowTool correctly', () => {
      expect(deleteRowTool.name).toBe('deleteRow');
      expect(deleteRowTool.description).toBeDefined();
      expect(deleteRowTool.input_schema).toBeDefined();
      expect(deleteRowTool.output_schema).toBeDefined();
    });
  });

  describe('handleDataToolCall', () => {
    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      await expect(
        handleDataToolCall(
          insertRowTool.name,
          { tableName: 'users', data: { name: 'Alice' } },
          mockConnectionManager
        )
      ).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should get connection from connection manager', async () => {
      await handleDataToolCall(
        insertRowTool.name,
        { tableName: 'users', data: { name: 'Alice' } },
        mockConnectionManager
      ).catch(() => {});

      expect(mockConnectionManager.getConnection).toHaveBeenCalled();
      expect(mockPool.connect).toHaveBeenCalled();
    });

    it('should throw error for unknown tool name', async () => {
      await expect(
        handleDataToolCall('unknownTool', {}, mockConnectionManager)
      ).rejects.toThrow('Unknown tool: unknownTool');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
