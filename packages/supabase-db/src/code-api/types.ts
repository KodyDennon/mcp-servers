/**
 * TypeScript definitions for Supabase DB Code API
 * Used when MCP server runs in code execution mode
 */

export interface ConnectionOptions {
  connectionString: string;
  connectionId?: string;
}

export interface ConnectionInfo {
  connectionId: string;
  database: string;
  user: string;
  version: string;
  active: boolean;
}

export interface QueryOptions {
  sql: string;
  rowLimit?: number;
  cache?: boolean;
  privacy?: 'none' | 'tokenize' | 'redact' | 'hash';
}

export interface QueryResult {
  rowCount: number;
  rows: Record<string, any>[];
  command: string;
  warning?: string;
}

export interface TransactionOptions {
  sqlStatements: string[];
}

export interface TransactionResult {
  results: Array<{
    command: string;
    rowCount?: number;
  }>;
}

export interface TableSchema {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    default: any;
  }>;
  constraints: Array<{
    name: string;
    type: string;
    definition: string;
  }>;
}

export interface CreateTableOptions {
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    defaultValue?: any;
    primaryKey?: boolean;
  }>;
}

export interface IndexOptions {
  tableName: string;
  indexName: string;
  columns: string[];
  unique?: boolean;
}

export interface MigrationOptions {
  name: string;
  sql: string;
  direction?: 'up' | 'down';
}

export interface DataImportOptions {
  tableName: string;
  format: 'csv' | 'json';
  data: string;
}

export interface RowOperation {
  tableName: string;
  data: Record<string, any>;
  rowId?: string;
}

export interface BackupOptions {
  format?: 'sql' | 'custom' | 'tar';
  compress?: boolean;
  path?: string;
}

export interface PrivacyFilterConfig {
  piiFields?: string[];
  strategy?: 'tokenize' | 'redact' | 'hash';
  allowList?: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

export interface StreamOptions {
  batchSize?: number;
  maxRows?: number;
}

export interface PipelineStep<T = any> {
  type: 'filter' | 'map' | 'groupBy' | 'aggregate' | 'sort' | 'limit';
  fn: (data: T) => any;
}

export interface SkillMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
  tags?: string[];
}

export interface SandboxConfig {
  executionMode: 'sandbox' | 'direct';  // NEW: Choose execution environment
  allowedModules: string[];
  resourceLimits: {
    maxMemory: string;
    maxQueryTime: number;
    maxResults: number;
  };
  dataProtection: {
    piiFields: string[];
    redactionStrategy: 'tokenize' | 'redact' | 'hash';
    allowExport: boolean;
  };
  allowedOperations: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
}

// Re-export common types
export type { ConnectionManager } from '../connectionManager.js';
