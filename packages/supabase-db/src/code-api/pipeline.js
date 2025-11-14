/**
 * Data transformation pipeline for code execution mode
 * Chain operations for efficient data processing
 */
export class DataPipeline {
    data;
    operations;
    constructor(data) {
        this.data = Array.isArray(data) ? [...data] : [];
        this.operations = [];
    }
    /**
     * Filter data by predicate
     */
    filter(predicate) {
        this.data = this.data.filter(predicate);
        this.operations.push('filter');
        return this;
    }
    /**
     * Transform each item
     */
    map(transform) {
        const result = this.data.map(transform);
        this.operations.push('map');
        return new DataPipeline(result);
    }
    /**
     * Group by key function or property name
     */
    groupBy(keyOrFn) {
        const groups = new Map();
        const getKey = typeof keyOrFn === 'function'
            ? keyOrFn
            : (item) => String(item[keyOrFn]);
        for (const item of this.data) {
            const key = getKey(item);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        }
        const result = Array.from(groups.entries()).map(([key, items]) => ({
            key,
            items,
        }));
        this.operations.push('groupBy');
        return new DataPipeline(result);
    }
    /**
     * Aggregate grouped data
     */
    aggregate(aggregator) {
        if (!Array.isArray(this.data) || this.data.length === 0) {
            return new DataPipeline([]);
        }
        // Check if data is grouped (has items property)
        const firstItem = this.data[0];
        if (firstItem && typeof firstItem === 'object' && 'items' in firstItem) {
            const result = this.data.map((group) => ({
                key: group.key,
                value: aggregator(group.items),
            }));
            this.operations.push('aggregate');
            return new DataPipeline(result);
        }
        // Single aggregation
        const result = [aggregator(this.data)];
        this.operations.push('aggregate');
        return new DataPipeline(result);
    }
    /**
     * Sort data
     */
    sort(comparatorOrKey, direction = 'asc') {
        const comparator = typeof comparatorOrKey === 'function'
            ? comparatorOrKey
            : (a, b) => {
                const aVal = a[comparatorOrKey];
                const bVal = b[comparatorOrKey];
                if (aVal < bVal)
                    return direction === 'asc' ? -1 : 1;
                if (aVal > bVal)
                    return direction === 'asc' ? 1 : -1;
                return 0;
            };
        this.data.sort(comparator);
        this.operations.push('sort');
        return this;
    }
    /**
     * Take first N items
     */
    take(count) {
        this.data = this.data.slice(0, count);
        this.operations.push('take');
        return this;
    }
    /**
     * Skip first N items
     */
    skip(count) {
        this.data = this.data.slice(count);
        this.operations.push('skip');
        return this;
    }
    /**
     * Get distinct items
     */
    distinct(keyOrFn) {
        if (!keyOrFn) {
            this.data = Array.from(new Set(this.data));
        }
        else {
            const seen = new Set();
            const getKey = typeof keyOrFn === 'function'
                ? keyOrFn
                : (item) => item[keyOrFn];
            this.data = this.data.filter(item => {
                const key = JSON.stringify(getKey(item));
                if (seen.has(key))
                    return false;
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
    flatten() {
        const result = this.data.flat();
        this.operations.push('flatten');
        return new DataPipeline(result);
    }
    /**
     * Count items
     */
    count() {
        return this.data.length;
    }
    /**
     * Sum numeric values
     */
    sum(key) {
        if (!key) {
            return this.data.reduce((sum, val) => sum + val, 0);
        }
        return this.data.reduce((sum, item) => sum + (item[key] || 0), 0);
    }
    /**
     * Average numeric values
     */
    average(key) {
        if (this.data.length === 0)
            return 0;
        return this.sum(key) / this.data.length;
    }
    /**
     * Min value
     */
    min(key) {
        if (this.data.length === 0)
            return 0;
        if (!key) {
            return Math.min(...this.data);
        }
        return Math.min(...this.data.map(item => item[key]));
    }
    /**
     * Max value
     */
    max(key) {
        if (this.data.length === 0)
            return 0;
        if (!key) {
            return Math.max(...this.data);
        }
        return Math.max(...this.data.map(item => item[key]));
    }
    /**
     * Find first item matching predicate
     */
    find(predicate) {
        return this.data.find(predicate);
    }
    /**
     * Check if any item matches predicate
     */
    some(predicate) {
        return this.data.some(predicate);
    }
    /**
     * Check if all items match predicate
     */
    every(predicate) {
        return this.data.every(predicate);
    }
    /**
     * Get final result
     */
    result() {
        return this.data;
    }
    /**
     * Get operations log
     */
    getOperations() {
        return this.operations;
    }
    /**
     * Create a new pipeline from data
     */
    static from(data) {
        return new DataPipeline(data);
    }
}
//# sourceMappingURL=pipeline.js.map