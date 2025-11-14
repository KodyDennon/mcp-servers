/**
 * Streaming query execution for large datasets
 * Process data in chunks to avoid memory issues
 */

import { getConnectionManager } from './init.js';
import type { StreamOptions } from './types.js';

/**
 * Stream query results in batches
 *
 * @example
 * for await (const batch of streamQuery('SELECT * FROM large_table')) {
 *   console.log(`Processing ${batch.length} rows...`);
 *   // Process batch without loading all data into memory
 * }
 */
export async function* streamQuery(
  sql: string,
  options: StreamOptions = {}
): AsyncGenerator<Record<string, any>[], void, unknown> {
  const { batchSize = 100, maxRows = Infinity } = options;

  const connectionManager = getConnectionManager();
  const pool = connectionManager.getConnection();
  const client = await pool.connect();

  try {
    // Use a cursor for streaming
    const cursorName = `cursor_${Date.now()}`;
    await client.query('BEGIN');
    await client.query(`DECLARE ${cursorName} CURSOR FOR ${sql}`);

    let totalRows = 0;
    let batch: any[];

    do {
      const result = await client.query(
        `FETCH ${batchSize} FROM ${cursorName}`
      );

      batch = result.rows;

      if (batch.length > 0) {
        totalRows += batch.length;

        // Check if we've hit maxRows
        if (totalRows > maxRows) {
          batch = batch.slice(0, maxRows - (totalRows - batch.length));
          yield batch;
          break;
        }

        yield batch;
      }
    } while (batch.length === batchSize);

    await client.query(`CLOSE ${cursorName}`);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

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
export async function streamAggregate<T, A>(
  sql: string,
  aggregator: (batch: Record<string, any>[], accumulator: A) => A,
  initialValue: A,
  options: StreamOptions = {}
): Promise<A> {
  let accumulator = initialValue;

  for await (const batch of streamQuery(sql, options)) {
    accumulator = aggregator(batch, accumulator);
  }

  return accumulator;
}

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
export async function* streamTransform<T>(
  sql: string,
  transformer: (batch: Record<string, any>[]) => T[],
  options: StreamOptions = {}
): AsyncGenerator<T[], void, unknown> {
  for await (const batch of streamQuery(sql, options)) {
    yield transformer(batch);
  }
}

/**
 * Count rows without loading all data
 *
 * @example
 * const total = await streamCount('SELECT * FROM large_table WHERE active = true');
 */
export async function streamCount(
  sql: string,
  options: StreamOptions = {}
): Promise<number> {
  let count = 0;

  for await (const batch of streamQuery(sql, options)) {
    count += batch.length;
  }

  return count;
}
