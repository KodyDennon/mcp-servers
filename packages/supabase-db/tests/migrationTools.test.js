import {
  runMigrationTool,
  listMigrationsTool,
  generateMigrationTool,
  seedDataTool,
  handleMigrationToolCall,
} from '../src/tools/migrationTools';

describe('migrationTools', () => {
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
    it('should define runMigrationTool correctly', () => {
      expect(runMigrationTool.name).toBe('runMigration');
      expect(runMigrationTool.description).toBeDefined();
      expect(runMigrationTool.input_schema).toBeDefined();
      expect(runMigrationTool.output_schema).toBeDefined();
    });

    it('should define listMigrationsTool correctly', () => {
      expect(listMigrationsTool.name).toBe('listMigrations');
      expect(listMigrationsTool.description).toBeDefined();
      expect(listMigrationsTool.input_schema).toBeDefined();
      expect(listMigrationsTool.output_schema).toBeDefined();
    });

    it('should define generateMigrationTool correctly', () => {
      expect(generateMigrationTool.name).toBe('generateMigration');
      expect(generateMigrationTool.description).toBeDefined();
      expect(generateMigrationTool.input_schema).toBeDefined();
      expect(generateMigrationTool.output_schema).toBeDefined();
    });

    it('should define seedDataTool correctly', () => {
      expect(seedDataTool.name).toBe('seedData');
      expect(seedDataTool.description).toBeDefined();
      expect(seedDataTool.input_schema).toBeDefined();
      expect(seedDataTool.output_schema).toBeDefined();
    });
  });

  describe('handleMigrationToolCall', () => {
    it('should get connection from connection manager', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await handleMigrationToolCall(
        listMigrationsTool.name,
        {},
        mockConnectionManager
      ).catch(() => {});

      expect(mockConnectionManager.getConnection).toHaveBeenCalled();
    });

    it('should release client even on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      await expect(
        handleMigrationToolCall(listMigrationsTool.name, {}, mockConnectionManager)
      ).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error for unknown tool name', async () => {
      await expect(
        handleMigrationToolCall('unknownTool', {}, mockConnectionManager)
      ).rejects.toThrow('Unknown tool: unknownTool');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
