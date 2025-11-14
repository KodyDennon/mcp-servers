import {
  connectToDatabaseTool,
  listConnectionsTool,
  switchConnectionTool,
  handleConnectionToolCall,
} from '../src/tools/connectionTools';
import { ConnectionManager } from '../src/connectionManager';

// Mock ConnectionManager
jest.mock('../src/connectionManager');

describe('connectionTools', () => {
  let mockConnectionManager;

  beforeEach(() => {
    mockConnectionManager = {
      addConnection: jest.fn(),
      listConnections: jest.fn(),
      switchConnection: jest.fn(),
      connections: {},
    };
    jest.clearAllMocks();
  });

  describe('Tool Definitions', () => {
    it('should define connectToDatabaseTool correctly', () => {
      expect(connectToDatabaseTool.name).toBe('connectToDatabase');
      expect(connectToDatabaseTool.description).toBeDefined();
      expect(connectToDatabaseTool.input_schema).toBeDefined();
      expect(connectToDatabaseTool.output_schema).toBeDefined();
    });

    it('should define listConnectionsTool correctly', () => {
      expect(listConnectionsTool.name).toBe('listConnections');
      expect(listConnectionsTool.description).toBeDefined();
      expect(listConnectionsTool.input_schema).toBeDefined();
      expect(listConnectionsTool.output_schema).toBeDefined();
    });

    it('should define switchConnectionTool correctly', () => {
      expect(switchConnectionTool.name).toBe('switchConnection');
      expect(switchConnectionTool.description).toBeDefined();
      expect(switchConnectionTool.input_schema).toBeDefined();
      expect(switchConnectionTool.output_schema).toBeDefined();
    });
  });

  describe('handleConnectionToolCall', () => {
    describe('connectToDatabase', () => {
      it('should connect to database with connection string', async () => {
        const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
        const connectionId = 'conn_1';
        const mockConnectionInfo = {
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0',
        };

        mockConnectionManager.addConnection.mockResolvedValue(connectionId);
        mockConnectionManager.connections[connectionId] = {
          info: mockConnectionInfo,
        };

        const result = await handleConnectionToolCall(
          connectToDatabaseTool.name,
          { connectionString },
          mockConnectionManager
        );

        expect(mockConnectionManager.addConnection).toHaveBeenCalledWith(
          connectionString,
          undefined
        );
        expect(result).toEqual({
          connectionId,
          database: 'testdb',
          user: 'user',
          version: 'PostgreSQL 14.0',
        });
      });

      it('should connect to database with custom connection ID', async () => {
        const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
        const customId = 'my-custom-id';
        const mockConnectionInfo = {
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0',
        };

        mockConnectionManager.addConnection.mockResolvedValue(customId);
        mockConnectionManager.connections[customId] = {
          info: mockConnectionInfo,
        };

        const result = await handleConnectionToolCall(
          connectToDatabaseTool.name,
          { connectionString, connectionId: customId },
          mockConnectionManager
        );

        expect(mockConnectionManager.addConnection).toHaveBeenCalledWith(
          connectionString,
          customId
        );
        expect(result.connectionId).toBe(customId);
      });

      it('should handle connection errors', async () => {
        const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

        mockConnectionManager.addConnection.mockRejectedValue(
          new Error('Connection failed')
        );

        await expect(
          handleConnectionToolCall(
            connectToDatabaseTool.name,
            { connectionString },
            mockConnectionManager
          )
        ).rejects.toThrow('Connection failed');
      });
    });

    describe('listConnections', () => {
      it('should return list of connections', async () => {
        const mockConnections = [
          {
            id: 'conn_1',
            current_database: 'db1',
            current_user: 'user1',
            version: 'PostgreSQL 14.0',
            active: true,
          },
          {
            id: 'conn_2',
            current_database: 'db2',
            current_user: 'user2',
            version: 'PostgreSQL 15.0',
            active: false,
          },
        ];

        mockConnectionManager.listConnections.mockReturnValue(mockConnections);

        const result = await handleConnectionToolCall(
          listConnectionsTool.name,
          {},
          mockConnectionManager
        );

        expect(mockConnectionManager.listConnections).toHaveBeenCalled();
        expect(result).toEqual(mockConnections);
      });

      it('should return empty array when no connections', async () => {
        mockConnectionManager.listConnections.mockReturnValue([]);

        const result = await handleConnectionToolCall(
          listConnectionsTool.name,
          {},
          mockConnectionManager
        );

        expect(result).toEqual([]);
      });
    });

    describe('switchConnection', () => {
      it('should switch to specified connection', async () => {
        const connectionId = 'conn_2';
        const mockConnectionInfo = {
          current_database: 'db2',
          current_user: 'user2',
          version: 'PostgreSQL 15.0',
        };

        mockConnectionManager.connections[connectionId] = {
          info: mockConnectionInfo,
        };

        const result = await handleConnectionToolCall(
          switchConnectionTool.name,
          { connectionId },
          mockConnectionManager
        );

        expect(mockConnectionManager.switchConnection).toHaveBeenCalledWith(
          connectionId
        );
        expect(result).toEqual({
          connectionId,
          database: 'db2',
          user: 'user2',
        });
      });

      it('should handle switching to nonexistent connection', async () => {
        const connectionId = 'nonexistent';

        mockConnectionManager.switchConnection.mockImplementation(() => {
          throw new Error(`Connection ${connectionId} not found.`);
        });

        await expect(
          handleConnectionToolCall(
            switchConnectionTool.name,
            { connectionId },
            mockConnectionManager
          )
        ).rejects.toThrow('Connection nonexistent not found.');
      });
    });

    describe('Unknown Tool', () => {
      it('should throw error for unknown tool name', async () => {
        await expect(
          handleConnectionToolCall(
            'unknownTool',
            {},
            mockConnectionManager
          )
        ).rejects.toThrow('Unknown tool: unknownTool');
      });
    });
  });
});
