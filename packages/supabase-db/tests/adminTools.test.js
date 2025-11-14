import {
  getDatabaseStatsTool,
  createBackupTool,
  manageAuthTool,
  manageStorageTool,
  handleAdminToolCall,
} from '../src/tools/adminTools';

describe('adminTools', () => {
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
    it('should define getDatabaseStatsTool correctly', () => {
      expect(getDatabaseStatsTool.name).toBe('getDatabaseStats');
      expect(getDatabaseStatsTool.description).toBeDefined();
      expect(getDatabaseStatsTool.input_schema).toBeDefined();
      expect(getDatabaseStatsTool.output_schema).toBeDefined();
    });

    it('should define createBackupTool correctly', () => {
      expect(createBackupTool.name).toBe('createBackup');
      expect(createBackupTool.description).toBeDefined();
      expect(createBackupTool.input_schema).toBeDefined();
      expect(createBackupTool.output_schema).toBeDefined();
    });

    it('should define manageAuthTool correctly', () => {
      expect(manageAuthTool.name).toBe('manageAuth');
      expect(manageAuthTool.description).toBeDefined();
      expect(manageAuthTool.input_schema).toBeDefined();
      expect(manageAuthTool.output_schema).toBeDefined();
    });

    it('should define manageStorageTool correctly', () => {
      expect(manageStorageTool.name).toBe('manageStorage');
      expect(manageStorageTool.description).toBeDefined();
      expect(manageStorageTool.input_schema).toBeDefined();
      expect(manageStorageTool.output_schema).toBeDefined();
    });
  });

  describe('handleAdminToolCall', () => {
    it('should get connection from connection manager', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await handleAdminToolCall(
        getDatabaseStatsTool.name,
        {},
        mockConnectionManager
      ).catch(() => {});

      expect(mockConnectionManager.getConnection).toHaveBeenCalled();
      expect(mockPool.connect).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      await expect(
        handleAdminToolCall(getDatabaseStatsTool.name, {}, mockConnectionManager)
      ).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error for unknown tool name', async () => {
      await expect(
        handleAdminToolCall('unknownTool', {}, mockConnectionManager)
      ).rejects.toThrow('Unknown tool: unknownTool');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
