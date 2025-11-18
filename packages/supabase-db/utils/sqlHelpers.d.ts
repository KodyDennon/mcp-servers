export function analyzeSQLSafety(sql: any): string[];
export function formatQueryResult(
  result: any,
  rowLimit?: null,
): {
  rowCount: any;
  rows: any;
  command: any;
};
export function getDatabaseSchema(pool: any): Promise<{}>;
export function getLocalSchemaFromMigrations(migrationsDir: any): Promise<{}>;
//# sourceMappingURL=sqlHelpers.d.ts.map
