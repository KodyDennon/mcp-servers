/**
 * Streaming query execution for large datasets
 * Process data in chunks to avoid memory issues
 */
import type { StreamOptions } from "./types.js";
/**
 * Stream query results in batches
 *
 * @example
 * for await (const batch of streamQuery('SELECT * FROM large_table')) {
 *   console.log(`Processing ${batch.length} rows...`);
 *   // Process batch without loading all data into memory
 * }
 */
export declare function streamQuery(
  sql: string,
  options?: StreamOptions,
): AsyncGenerator<Record<string, any>[], void, unknown>;
/**
 * Stream and aggregate results on-the-fly
 *
 * @example
 * const stats = await streamAggregate(
 *   'SELECT * FROM orders',
 *   (batch, accumulator) => {
 *     accumulator.count += batch.length;
 *     accumulator.total += batch.reduce((sum, o) => sum + o.amount, 0);
 *     return accumulator;
 *   },
 *   { count: 0, total: 0 }
 * );
 */
export declare function streamAggregate<T, A>(
  sql: string,
  aggregator: (batch: Record<string, any>[], accumulator: A) => A,
  initialValue: A,
  options?: StreamOptions,
): Promise<A>;
/**
 * Stream and transform results
 *
 * @example
 * for await (const transformed of streamTransform(
 *   'SELECT * FROM users',
 *   batch => batch.filter(u => u.active).map(u => ({ id: u.id, name: u.name }))
 * )) {
 *   console.log(transformed);
 * }
 */
export declare function streamTransform<T>(
  sql: string,
  transformer: (batch: Record<string, any>[]) => T[],
  options?: StreamOptions,
): AsyncGenerator<T[], void, unknown>;
/**
 * Count rows without loading all data
 *
 * @example
 * const total = await streamCount('SELECT * FROM large_table WHERE active = true');
 */
export declare function streamCount(
  sql: string,
  options?: StreamOptions,
): Promise<number>;
//# sourceMappingURL=streaming.d.ts.map
