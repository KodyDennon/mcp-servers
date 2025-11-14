import { ConnectionManager } from '../src/connectionManager';
import pg from 'pg';

// Mock pg module
jest.mock('pg', () => {
  const mockPool = {
    connect: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };

  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('ConnectionManager', () => {
  let connectionManager;
  let mockClient;

  beforeEach(() => {
    connectionManager = new ConnectionManager();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with empty connections and no active connection', () => {
      expect(connectionManager.connections).toEqual({});
      expect(connectionManager.activeConnectionId).toBeNull();
    });
  });

  describe('addConnection', () => {
    it('should add a new connection with generated ID', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
      mockClient.query.mockResolvedValue({
        rows: [{
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0'
        }]
      });

      const mockPool = new pg.Pool();
      mockPool.connect.mockResolvedValue(mockClient);

      const connectionId = await connectionManager.addConnection(connectionString);

      expect(connectionId).toBe('conn_1');
      expect(pg.Pool).toHaveBeenCalledWith({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT current_database(), current_user, version()');
      expect(mockClient.release).toHaveBeenCalled();
      expect(connectionManager.activeConnectionId).toBe('conn_1');
    });

    it('should add a new connection with custom ID', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
      const customId = 'my-custom-id';
      mockClient.query.mockResolvedValue({
        rows: [{
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0'
        }]
      });

      const mockPool = new pg.Pool();
      mockPool.connect.mockResolvedValue(mockClient);

      const connectionId = await connectionManager.addConnection(connectionString, customId);

      expect(connectionId).toBe(customId);
      expect(connectionManager.activeConnectionId).toBe(customId);
    });

    it('should not change active connection when adding second connection', async () => {
      const connectionString1 = 'postgresql://user:pass@localhost:5432/db1';
      const connectionString2 = 'postgresql://user:pass@localhost:5432/db2';

      mockClient.query.mockResolvedValue({
        rows: [{
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0'
        }]
      });

      const mockPool = new pg.Pool();
      mockPool.connect.mockResolvedValue(mockClient);

      const id1 = await connectionManager.addConnection(connectionString1);
      const id2 = await connectionManager.addConnection(connectionString2);

      expect(id1).toBe('conn_1');
      expect(id2).toBe('conn_2');
      expect(connectionManager.activeConnectionId).toBe('conn_1');
    });

    it('should handle connection errors', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
      const mockPool = new pg.Pool();
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(connectionManager.addConnection(connectionString))
        .rejects.toThrow('Connection failed');
    });

    it('should register error handler on pool', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
      mockClient.query.mockResolvedValue({
        rows: [{
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0'
        }]
      });

      const mockPool = new pg.Pool();
      mockPool.connect.mockResolvedValue(mockClient);

      await connectionManager.addConnection(connectionString);

      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('getConnection', () => {
    it('should return the active connection pool', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
      mockClient.query.mockResolvedValue({
        rows: [{
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0'
        }]
      });

      const mockPool = new pg.Pool();
      mockPool.connect.mockResolvedValue(mockClient);

      await connectionManager.addConnection(connectionString);
      const pool = connectionManager.getConnection();

      expect(pool).toBe(mockPool);
    });

    it('should return specific connection by ID', async () => {
      const connectionString1 = 'postgresql://user:pass@localhost:5432/db1';
      const connectionString2 = 'postgresql://user:pass@localhost:5432/db2';

      mockClient.query.mockResolvedValue({
        rows: [{
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0'
        }]
      });

      const mockPool1 = new pg.Pool();
      const mockPool2 = new pg.Pool();
      mockPool1.connect.mockResolvedValue(mockClient);
      mockPool2.connect.mockResolvedValue(mockClient);

      // Mock Pool to return different instances
      pg.Pool.mockImplementationOnce(() => mockPool1)
              .mockImplementationOnce(() => mockPool2);

      const id1 = await connectionManager.addConnection(connectionString1);
      const id2 = await connectionManager.addConnection(connectionString2);

      const pool2 = connectionManager.getConnection(id2);
      expect(pool2).toBe(mockPool2);
    });

    it('should throw error when no active connection exists', () => {
      expect(() => connectionManager.getConnection())
        .toThrow('No active database connection. Use connectToDatabase to add a connection.');
    });

    it('should throw error when specified connection does not exist', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
      mockClient.query.mockResolvedValue({
        rows: [{
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0'
        }]
      });

      const mockPool = new pg.Pool();
      mockPool.connect.mockResolvedValue(mockClient);

      await connectionManager.addConnection(connectionString);

      expect(() => connectionManager.getConnection('nonexistent'))
        .toThrow('No active database connection. Use connectToDatabase to add a connection.');
    });
  });

  describe('listConnections', () => {
    it('should return empty array when no connections exist', () => {
      const connections = connectionManager.listConnections();
      expect(connections).toEqual([]);
    });

    it('should return all connections with active flag', async () => {
      const connectionString1 = 'postgresql://user:pass@localhost:5432/db1';
      const connectionString2 = 'postgresql://user:pass@localhost:5432/db2';

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            current_database: 'db1',
            current_user: 'user1',
            version: 'PostgreSQL 14.0'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            current_database: 'db2',
            current_user: 'user2',
            version: 'PostgreSQL 15.0'
          }]
        });

      const mockPool1 = new pg.Pool();
      const mockPool2 = new pg.Pool();
      mockPool1.connect.mockResolvedValue(mockClient);
      mockPool2.connect.mockResolvedValue(mockClient);

      pg.Pool.mockImplementationOnce(() => mockPool1)
              .mockImplementationOnce(() => mockPool2);

      await connectionManager.addConnection(connectionString1);
      await connectionManager.addConnection(connectionString2);

      const connections = connectionManager.listConnections();

      expect(connections).toHaveLength(2);
      expect(connections[0]).toMatchObject({
        id: 'conn_1',
        current_database: 'db1',
        current_user: 'user1',
        version: 'PostgreSQL 14.0',
        active: true,
      });
      expect(connections[1]).toMatchObject({
        id: 'conn_2',
        current_database: 'db2',
        current_user: 'user2',
        version: 'PostgreSQL 15.0',
        active: false,
      });
    });
  });

  describe('switchConnection', () => {
    it('should switch active connection', async () => {
      const connectionString1 = 'postgresql://user:pass@localhost:5432/db1';
      const connectionString2 = 'postgresql://user:pass@localhost:5432/db2';

      mockClient.query.mockResolvedValue({
        rows: [{
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0'
        }]
      });

      const mockPool1 = new pg.Pool();
      const mockPool2 = new pg.Pool();
      mockPool1.connect.mockResolvedValue(mockClient);
      mockPool2.connect.mockResolvedValue(mockClient);

      pg.Pool.mockImplementationOnce(() => mockPool1)
              .mockImplementationOnce(() => mockPool2);

      const id1 = await connectionManager.addConnection(connectionString1);
      const id2 = await connectionManager.addConnection(connectionString2);

      expect(connectionManager.activeConnectionId).toBe(id1);

      connectionManager.switchConnection(id2);

      expect(connectionManager.activeConnectionId).toBe(id2);
    });

    it('should throw error when switching to nonexistent connection', () => {
      expect(() => connectionManager.switchConnection('nonexistent'))
        .toThrow('Connection nonexistent not found.');
    });
  });

  describe('shutdown', () => {
    it('should close all connection pools', async () => {
      const connectionString1 = 'postgresql://user:pass@localhost:5432/db1';
      const connectionString2 = 'postgresql://user:pass@localhost:5432/db2';

      mockClient.query.mockResolvedValue({
        rows: [{
          current_database: 'testdb',
          current_user: 'user',
          version: 'PostgreSQL 14.0'
        }]
      });

      const mockPool1 = new pg.Pool();
      const mockPool2 = new pg.Pool();
      mockPool1.connect.mockResolvedValue(mockClient);
      mockPool2.connect.mockResolvedValue(mockClient);
      mockPool1.end.mockResolvedValue();
      mockPool2.end.mockResolvedValue();

      pg.Pool.mockImplementationOnce(() => mockPool1)
              .mockImplementationOnce(() => mockPool2);

      await connectionManager.addConnection(connectionString1);
      await connectionManager.addConnection(connectionString2);

      await connectionManager.shutdown();

      expect(mockPool1.end).toHaveBeenCalled();
      expect(mockPool2.end).toHaveBeenCalled();
    });

    it('should handle shutdown with no connections', async () => {
      await expect(connectionManager.shutdown()).resolves.not.toThrow();
    });
  });
});
