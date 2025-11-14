/**
 * Data transformation pipeline for code execution mode
 * Chain operations for efficient data processing
 */

type Predicate<T> = (item: T) => boolean;
type Transform<T, U> = (item: T) => U;
type Aggregator<T, U> = (items: T[]) => U;
type Comparator<T> = (a: T, b: T) => number;

export class DataPipeline<T = any> {
  private data: T[];
  private operations: string[];

  constructor(data: T[]) {
    this.data = Array.isArray(data) ? [...data] : [];
    this.operations = [];
  }

  /**
   * Filter data by predicate
   */
  filter(predicate: Predicate<T>): DataPipeline<T> {
    this.data = this.data.filter(predicate);
    this.operations.push('filter');
    return this;
  }

  /**
   * Transform each item
   */
  map<U>(transform: Transform<T, U>): DataPipeline<U> {
    const result = this.data.map(transform);
    this.operations.push('map');
    return new DataPipeline(result) as any;
  }

  /**
   * Group by key function or property name
   */
  groupBy(keyOrFn: string | ((item: T) => string)): DataPipeline<{ key: string; items: T[] }> {
    const groups = new Map<string, T[]>();

    const getKey = typeof keyOrFn === 'function'
      ? keyOrFn
      : (item: T) => String((item as any)[keyOrFn]);

    for (const item of this.data) {
      const key = getKey(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    const result = Array.from(groups.entries()).map(([key, items]) => ({
      key,
      items,
    }));

    this.operations.push('groupBy');
    return new DataPipeline(result) as any;
  }

  /**
   * Aggregate grouped data
   */
  aggregate<U>(aggregator: Aggregator<T, U>): DataPipeline<U> {
    if (!Array.isArray(this.data) || this.data.length === 0) {
      return new DataPipeline([]) as any;
    }

    // Check if data is grouped (has items property)
    const firstItem: any = this.data[0];
    if (firstItem && typeof firstItem === 'object' && 'items' in firstItem) {
      const result = (this.data as any).map((group: any) => ({
        key: group.key,
        value: aggregator(group.items),
      }));
      this.operations.push('aggregate');
      return new DataPipeline(result) as any;
    }

    // Single aggregation
    const result = [aggregator(this.data)];
    this.operations.push('aggregate');
    return new DataPipeline(result) as any;
  }

  /**
   * Sort data
   */
  sort(comparatorOrKey: Comparator<T> | string, direction: 'asc' | 'desc' = 'asc'): DataPipeline<T> {
    const comparator = typeof comparatorOrKey === 'function'
      ? comparatorOrKey
      : (a: T, b: T) => {
          const aVal = (a as any)[comparatorOrKey];
          const bVal = (b as any)[comparatorOrKey];
          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
          return 0;
        };

    this.data.sort(comparator);
    this.operations.push('sort');
    return this;
  }

  /**
   * Take first N items
   */
  take(count: number): DataPipeline<T> {
    this.data = this.data.slice(0, count);
    this.operations.push('take');
    return this;
  }

  /**
   * Skip first N items
   */
  skip(count: number): DataPipeline<T> {
    this.data = this.data.slice(count);
    this.operations.push('skip');
    return this;
  }

  /**
   * Get distinct items
   */
  distinct(keyOrFn?: string | ((item: T) => any)): DataPipeline<T> {
    if (!keyOrFn) {
      this.data = Array.from(new Set(this.data));
    } else {
      const seen = new Set();
      const getKey = typeof keyOrFn === 'function'
        ? keyOrFn
        : (item: T) => (item as any)[keyOrFn];

      this.data = this.data.filter(item => {
        const key = JSON.stringify(getKey(item));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    this.operations.push('distinct');
    return this;
  }

  /**
   * Flatten nested arrays
   */
  flatten<U>(): DataPipeline<U> {
    const result = (this.data as any).flat();
    this.operations.push('flatten');
    return new DataPipeline(result);
  }

  /**
   * Count items
   */
  count(): number {
    return this.data.length;
  }

  /**
   * Sum numeric values
   */
  sum(key?: string): number {
    if (!key) {
      return (this.data as any).reduce((sum: number, val: number) => sum + val, 0);
    }
    return this.data.reduce((sum, item) => sum + ((item as any)[key] || 0), 0);
  }

  /**
   * Average numeric values
   */
  average(key?: string): number {
    if (this.data.length === 0) return 0;
    return this.sum(key) / this.data.length;
  }

  /**
   * Min value
   */
  min(key?: string): T | number {
    if (this.data.length === 0) return 0;
    if (!key) {
      return Math.min(...(this.data as any));
    }
    return Math.min(...this.data.map(item => (item as any)[key]));
  }

  /**
   * Max value
   */
  max(key?: string): T | number {
    if (this.data.length === 0) return 0;
    if (!key) {
      return Math.max(...(this.data as any));
    }
    return Math.max(...this.data.map(item => (item as any)[key]));
  }

  /**
   * Find first item matching predicate
   */
  find(predicate: Predicate<T>): T | undefined {
    return this.data.find(predicate);
  }

  /**
   * Check if any item matches predicate
   */
  some(predicate: Predicate<T>): boolean {
    return this.data.some(predicate);
  }

  /**
   * Check if all items match predicate
   */
  every(predicate: Predicate<T>): boolean {
    return this.data.every(predicate);
  }

  /**
   * Get final result
   */
  result(): T[] {
    return this.data;
  }

  /**
   * Get operations log
   */
  getOperations(): string[] {
    return this.operations;
  }

  /**
   * Create a new pipeline from data
   */
  static from<T>(data: T[]): DataPipeline<T> {
    return new DataPipeline(data);
  }
}
