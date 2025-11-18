/**
 * Data transformation pipeline for code execution mode
 * Chain operations for efficient data processing
 */
type Predicate<T> = (item: T) => boolean;
type Transform<T, U> = (item: T) => U;
type Aggregator<T, U> = (items: T[]) => U;
type Comparator<T> = (a: T, b: T) => number;
export declare class DataPipeline<T = any> {
    private data;
    private operations;
    constructor(data: T[]);
    /**
     * Filter data by predicate
     */
    filter(predicate: Predicate<T>): DataPipeline<T>;
    /**
     * Transform each item
     */
    map<U>(transform: Transform<T, U>): DataPipeline<U>;
    /**
     * Group by key function or property name
     */
    groupBy(keyOrFn: string | ((item: T) => string)): DataPipeline<{
        key: string;
        items: T[];
    }>;
    /**
     * Aggregate grouped data
     */
    aggregate<U>(aggregator: Aggregator<T, U>): DataPipeline<U>;
    /**
     * Sort data
     */
    sort(comparatorOrKey: Comparator<T> | string, direction?: 'asc' | 'desc'): DataPipeline<T>;
    /**
     * Take first N items
     */
    take(count: number): DataPipeline<T>;
    /**
     * Skip first N items
     */
    skip(count: number): DataPipeline<T>;
    /**
     * Get distinct items
     */
    distinct(keyOrFn?: string | ((item: T) => any)): DataPipeline<T>;
    /**
     * Flatten nested arrays
     */
    flatten<U>(): DataPipeline<U>;
    /**
     * Count items
     */
    count(): number;
    /**
     * Sum numeric values
     */
    sum(key?: string): number;
    /**
     * Average numeric values
     */
    average(key?: string): number;
    /**
     * Min value
     */
    min(key?: string): T | number;
    /**
     * Max value
     */
    max(key?: string): T | number;
    /**
     * Find first item matching predicate
     */
    find(predicate: Predicate<T>): T | undefined;
    /**
     * Check if any item matches predicate
     */
    some(predicate: Predicate<T>): boolean;
    /**
     * Check if all items match predicate
     */
    every(predicate: Predicate<T>): boolean;
    /**
     * Get final result
     */
    result(): T[];
    /**
     * Get operations log
     */
    getOperations(): string[];
    /**
     * Create a new pipeline from data
     */
    static from<T>(data: T[]): DataPipeline<T>;
}
export {};
//# sourceMappingURL=pipeline.d.ts.map