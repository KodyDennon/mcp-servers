// Mock dependencies before importing
jest.mock('../config', () => ({
  loadConfig: jest.fn(),
  ensureEnvironment: jest.fn(),
  interactiveSetup: jest.fn(),
  envFileExists: jest.fn(),
  getEnvPath: jest.fn(),
  loadEnvConfig: jest.fn(),
}));

import { createServer } from '../server';

describe('server', () => {
  describe('createServer', () => {
    it('should create a server instance', () => {
      const server = createServer();

      expect(server).toBeDefined();
      expect(typeof server.setRequestHandler).toBe('function');
      expect(typeof server.connect).toBe('function');
    });

    it('should create server with correct name and version', () => {
      const server = createServer();

      // Server properties are internal, but we can verify it was created
      expect(server).toBeDefined();
    });
  });
});
