/**
 * Default Metrics
 * Standard metrics collected automatically
 */
export function createDefaultMetrics(registry: any): {
    httpRequestsTotal: Counter;
    httpRequestDuration: Histogram;
    dbQueriesTotal: Counter;
    dbQueryDuration: Histogram;
    dbConnectionsActive: Gauge;
    dbConnectionsIdle: Gauge;
    cacheHits: Counter;
    cacheMisses: Counter;
    cacheSize: Gauge;
    circuitBreakerState: Gauge;
    circuitBreakerFailures: Counter;
    recoveryAttempts: Counter;
    rateLimitExceeded: Counter;
};
export namespace MetricType {
    let COUNTER: string;
    let GAUGE: string;
    let HISTOGRAM: string;
    let SUMMARY: string;
}
/**
 * Counter Metric
 * Monotonically increasing value
 */
export class Counter extends Metric {
    constructor(name: any, help: any, labels?: any[]);
    inc(labelValues?: {}, value?: number): void;
}
/**
 * Gauge Metric
 * Value that can go up or down
 */
export class Gauge extends Metric {
    constructor(name: any, help: any, labels?: any[]);
    set(value: any, labelValues?: {}): void;
    inc(labelValues?: {}, value?: number): void;
    dec(labelValues?: {}, value?: number): void;
}
/**
 * Histogram Metric
 * Tracks distribution of values
 */
export class Histogram extends Metric {
    constructor(name: any, help: any, labels?: any[], buckets?: number[]);
    buckets: number[];
    observe(value: any, labelValues?: {}): void;
    getPercentile(percentile: any, labelValues?: {}): any;
}
/**
 * Metrics Registry
 * Central registry for all metrics
 */
export class MetricsRegistry {
    metrics: Map<any, any>;
    startTime: number;
    /**
     * Register a metric
     */
    register(metric: any): any;
    /**
     * Get metric by name
     */
    get(name: any): any;
    /**
     * Get all metrics
     */
    getAll(): any[];
    /**
     * Export metrics in Prometheus format
     */
    exportPrometheus(): string;
    /**
     * Export metrics in JSON format
     */
    exportJSON(): {
        timestamp: string;
        uptime: number;
        metrics: {};
    };
    /**
     * Clear all metrics
     */
    clear(): void;
}
/**
 * Metrics Collector
 * Automatically collects system metrics
 */
export class MetricsCollector {
    constructor(registry: any, options?: {});
    registry: any;
    interval: any;
    timer: NodeJS.Timeout | null;
    collectors: any[];
    /**
     * Add a collector function
     */
    addCollector(collector: any): void;
    /**
     * Start collecting metrics
     */
    start(): void;
    /**
     * Stop collecting metrics
     */
    stop(): void;
}
/**
 * Metric
 * Individual metric with metadata
 */
declare class Metric {
    constructor(name: any, type: any, help: any, labels?: any[]);
    name: any;
    type: any;
    help: any;
    labels: any[];
    values: Map<any, any>;
    /**
     * Get value for label combination
     */
    getValue(labelValues?: {}): any;
    /**
     * Set value for label combination
     */
    setValue(value: any, labelValues?: {}): void;
    /**
     * Generate key from label values
     */
    getLabelKey(labelValues: any): string;
    /**
     * Get all values
     */
    getAllValues(): {
        labels: {};
        value: any;
    }[];
    /**
     * Parse label key back to object
     */
    parseLabelKey(key: any): {};
}
export {};
//# sourceMappingURL=metrics.d.ts.map