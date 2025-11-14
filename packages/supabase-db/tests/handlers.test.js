import { getAllTools, registerListToolsHandler, registerCallToolHandler } from '../src/handlers';

describe('handlers', () => {
  describe('getAllTools', () => {
    it('should return an array of all tools', () => {
      const tools = getAllTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should return tools with required properties', () => {
      const tools = getAllTools();

      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        // Tools can have either input_schema (zod) or parameters (raw schema)
        const hasInputSchema = tool.input_schema !== undefined || tool.parameters !== undefined;
        expect(hasInputSchema).toBe(true);
      });
    });

    it('should include connection tools', () => {
      const tools = getAllTools();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).toContain('connectToDatabase');
      expect(toolNames).toContain('listConnections');
      expect(toolNames).toContain('switchConnection');
    });

    it('should include query tools', () => {
      const tools = getAllTools();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).toContain('query');
      expect(toolNames).toContain('queryTransaction');
      expect(toolNames).toContain('explainQuery');
    });

    it('should include schema tools', () => {
      const tools = getAllTools();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).toContain('listTables');
      expect(toolNames).toContain('getTableSchema');
    });

    it('should not have duplicate tool names', () => {
      const tools = getAllTools();
      const toolNames = tools.map(t => t.name);
      const uniqueNames = new Set(toolNames);

      // Check for duplicates and log them if found
      if (toolNames.length !== uniqueNames.size) {
        const duplicates = toolNames.filter((name, index) => toolNames.indexOf(name) !== index);
        console.log('Duplicate tool names:', duplicates);
      }

      expect(toolNames.length).toBe(uniqueNames.size);
    });
  });

  describe('registerListToolsHandler', () => {
    it('should register handler on server', () => {
      const mockServer = {
        setRequestHandler: jest.fn(),
      };

      registerListToolsHandler(mockServer);

      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(1);
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Function)
      );
    });

    it('should return all tools when handler is called', async () => {
      const mockServer = {
        setRequestHandler: jest.fn(),
      };

      registerListToolsHandler(mockServer);

      const handler = mockServer.setRequestHandler.mock.calls[0][1];
      const result = await handler();

      expect(result).toHaveProperty('tools');
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);
    });

    it('should return tools with correct structure', async () => {
      const mockServer = {
        setRequestHandler: jest.fn(),
      };

      registerListToolsHandler(mockServer);

      const handler = mockServer.setRequestHandler.mock.calls[0][1];
      const result = await handler();

      result.tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        // Note: Some tools might have different schema structures
        // Just verify the basic structure is present
      });
    });
  });

  describe('registerCallToolHandler', () => {
    let mockServer;
    let mockConnectionManager;

    beforeEach(() => {
      mockServer = {
        setRequestHandler: jest.fn(),
      };

      mockConnectionManager = {
        getConnection: jest.fn(),
        addConnection: jest.fn(),
        listConnections: jest.fn(),
        switchConnection: jest.fn(),
        connections: {},
      };
    });

    it('should register handler on server', () => {
      registerCallToolHandler(mockServer, mockConnectionManager);

      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(1);
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Function)
      );
    });

    it('should handle unknown tool gracefully', async () => {
      registerCallToolHandler(mockServer, mockConnectionManager);

      const handler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = {
        params: {
          name: 'unknownTool',
          arguments: {},
        },
      };

      const result = await handler(request);

      expect(result).toHaveProperty('content');
      expect(result.content[0].type).toBe('text');
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('Unknown tool: unknownTool');
    });

    it('should handle tool errors gracefully', async () => {
      // Mock getConnection to throw an error
      mockConnectionManager.getConnection.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      registerCallToolHandler(mockServer, mockConnectionManager);

      const handler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = {
        params: {
          name: 'query',
          arguments: { sql: 'SELECT * FROM users' },
        },
      };

      const result = await handler(request);

      expect(result).toHaveProperty('content');
      expect(result.content[0].type).toBe('text');
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toContain('Connection failed');
      expect(response.stack).toBeDefined();
    });

    it('should call connection tools handler for connection tools', async () => {
      mockConnectionManager.listConnections.mockReturnValue([]);

      registerCallToolHandler(mockServer, mockConnectionManager);

      const handler = mockServer.setRequestHandler.mock.calls[0][1];
      const request = {
        params: {
          name: 'listConnections',
          arguments: {},
        },
      };

      await handler(request);

      expect(mockConnectionManager.listConnections).toHaveBeenCalled();
    });
  });
});
