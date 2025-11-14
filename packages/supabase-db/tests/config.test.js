import { promises as fs } from 'fs';
import dotenv from 'dotenv';

jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

let getMissingEnvVars;
let ensureEnvironment;
let loadConfig;
let envFileExists;

beforeAll(async () => {
  const configModule = await import('../src/config.js');
  getMissingEnvVars = configModule.getMissingEnvVars;
  ensureEnvironment = configModule.ensureEnvironment;
  loadConfig = configModule.loadConfig;
  envFileExists = configModule.envFileExists;
});

const REQUIRED_VALUES = {
  POSTGRES_URL_NON_POOLING: 'postgresql://user:pass@localhost:5432/postgres',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  SUPABASE_ACCESS_TOKEN: 'access-token',
  SUPABASE_PROJECT_ID: 'project-id',
  OPENAI_API_KEY: 'openai-key',
};

describe('config utilities', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    for (const [key, value] of Object.entries(REQUIRED_VALUES)) {
      process.env[key] = value;
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('reports no missing env vars when all are present', () => {
    expect(getMissingEnvVars()).toEqual([]);
  });

  it('respects alias values when checking required env vars', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SECRET_KEY = 'alias-key';

    expect(getMissingEnvVars()).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('throws a descriptive error when required env vars are missing', async () => {
    delete process.env.POSTGRES_URL_NON_POOLING;

    await expect(ensureEnvironment({ allowInteractive: false })).rejects.toThrow(
      /POSTGRES_URL_NON_POOLING/
    );
  });

  it('passes validation when all required env vars exist', async () => {
    await expect(ensureEnvironment({ allowInteractive: false })).resolves.toBeUndefined();
  });

  it('loads values from mcp-config.json without overwriting existing env vars', async () => {
    delete process.env.OPENAI_API_KEY;
    fs.access.mockResolvedValueOnce();
    fs.readFile.mockResolvedValueOnce(
      JSON.stringify({
        OPENAI_API_KEY: 'file-key',
        SUPABASE_URL: 'https://from-file.supabase.co',
      })
    );

    await loadConfig();

    expect(dotenv.config).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringContaining('.env'),
      })
    );
    expect(process.env.OPENAI_API_KEY).toBe('file-key');
    expect(process.env.SUPABASE_URL).toBe(REQUIRED_VALUES.SUPABASE_URL);
  });

  it('envFileExists mirrors fs access results', async () => {
    fs.access.mockResolvedValueOnce();
    await expect(envFileExists()).resolves.toBe(true);

    fs.access.mockRejectedValueOnce(new Error('missing'));
    await expect(envFileExists()).resolves.toBe(false);
  });
});
