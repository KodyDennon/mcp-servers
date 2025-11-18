/**
 * Migration operations for code execution mode
 */
import type { MigrationOptions } from "./types.js";
/**
 * Run a migration
 */
export declare function runMigration(options: MigrationOptions): Promise<void>;
/**
 * List all executed migrations
 */
export declare function listMigrations(): Promise<any[]>;
/**
 * Create migrations table if it doesn't exist
 */
export declare function initMigrations(): Promise<void>;
//# sourceMappingURL=migration.d.ts.map
