/**
 * Metrics Collection and Monitoring
 * Comprehensive metrics tracking for observability
 */

/**
 * Metric Types
 */
export const MetricType = {
  COUNTER: "counter",
  GAUGE: "gauge",
  HISTOGRAM: "histogram",
  SUMMARY: "summary",
};

/**
 * Metric
 * Individual metric with metadata
 */
class Metric {
  constructor(name, type, help, labels = []) {
    this.name = name;
    this.type = type;
    this.help = help;
    this.labels = labels;
    this.values = new Map();
  }

  /**
   * Get value for label combination
   */
  getValue(labelValues = {}) {
    const key = this.getLabelKey(labelValues);
    return this.values.get(key);
  }

  /**
   * Set value for label combination
   */
  setValue(value, labelValues = {}) {
    const key = this.getLabelKey(labelValues);
    this.values.set(key, value);
  }

  /**
   * Generate key from label values
   */
  getLabelKey(labelValues) {
    if (this.labels.length === 0) return "default";

    const parts = this.labels.map((label) => {
      return `${label}="${labelValues[label] || ""}"`;
    });

    return parts.join(",");
  }

  /**
   * Get all values
   */
  getAllValues() {
    return Array.from(this.values.entries()).map(([key, value]) => ({
      labels: this.parseLabelKey(key),
      value: value,
    }));
  }

  /**
   * Parse label key back to object
   */
  parseLabelKey(key) {
    if (key === "default") return {};

    const labels = {};
    const parts = key.split(",");

    for (const part of parts) {
      const [name, value] = part.split("=");
      labels[name] = value.replace(/"/g, "");
    }

    return labels;
  }
}

/**
 * Counter Metric
 * Monotonically increasing value
 */
export class Counter extends Metric {
  constructor(name, help, labels = []) {
    super(name, MetricType.COUNTER, help, labels);
  }

  inc(labelValues = {}, value = 1) {
    const current = this.getValue(labelValues) || 0;
    this.setValue(current + value, labelValues);
  }
}

/**
 * Gauge Metric
 * Value that can go up or down
 */
export class Gauge extends Metric {
  constructor(name, help, labels = []) {
    super(name, MetricType.GAUGE, help, labels);
  }

  set(value, labelValues = {}) {
    this.setValue(value, labelValues);
  }

  inc(labelValues = {}, value = 1) {
    const current = this.getValue(labelValues) || 0;
    this.setValue(current + value, labelValues);
  }

  dec(labelValues = {}, value = 1) {
    const current = this.getValue(labelValues) || 0;
    this.setValue(current - value, labelValues);
  }
}

/**
 * Histogram Metric
 * Tracks distribution of values
 */
export class Histogram extends Metric {
  constructor(
    name,
    help,
    labels = [],
    buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  ) {
    super(name, MetricType.HISTOGRAM, help, labels);
    this.buckets = buckets.sort((a, b) => a - b);
  }

  observe(value, labelValues = {}) {
    const key = this.getLabelKey(labelValues);
    let histogram = this.getValue(labelValues);

    if (!histogram) {
      histogram = {
        sum: 0,
        count: 0,
        buckets: new Map(this.buckets.map((b) => [b, 0])),
      };
      this.setValue(histogram, labelValues);
    }

    histogram.sum += value;
    histogram.count++;

    // Increment bucket counters
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        histogram.buckets.set(bucket, histogram.buckets.get(bucket) + 1);
      }
    }
  }

  getPercentile(percentile, labelValues = {}) {
    const histogram = this.getValue(labelValues);
    if (!histogram || histogram.count === 0) return 0;

    const target = histogram.count * (percentile / 100);
    let cumulative = 0;

    for (const [bucket, count] of histogram.buckets) {
      cumulative += count;
      if (cumulative >= target) {
        return bucket;
      }
    }

    return this.buckets[this.buckets.length - 1];
  }
}

/**
 * Metrics Registry
 * Central registry for all metrics
 */
export class MetricsRegistry {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  /**
   * Register a metric
   */
  register(metric) {
    if (this.metrics.has(metric.name)) {
      throw new Error(`Metric already registered: ${metric.name}`);
    }

    this.metrics.set(metric.name, metric);
    return metric;
  }

  /**
   * Get metric by name
   */
  get(name) {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAll() {
    return Array.from(this.metrics.values());
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus() {
    let output = "";

    for (const metric of this.metrics.values()) {
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;

      for (const { labels, value } of metric.getAllValues()) {
        const labelStr =
          Object.keys(labels).length > 0
            ? `{${Object.entries(labels)
                .map(([k, v]) => `${k}="${v}"`)
                .join(",")}}`
            : "";

        if (metric.type === MetricType.HISTOGRAM) {
          const histogram = value;

          // Export buckets
          for (const [bucket, count] of histogram.buckets) {
            output += `${metric.name}_bucket${labelStr.replace("}", `,le="${bucket}"}`)} ${count}\n`;
          }

          output += `${metric.name}_sum${labelStr} ${histogram.sum}\n`;
          output += `${metric.name}_count${labelStr} ${histogram.count}\n`;
        } else {
          output += `${metric.name}${labelStr} ${value}\n`;
        }
      }

      output += "\n";
    }

    return output;
  }

  /**
   * Export metrics in JSON format
   */
  exportJSON() {
    const metrics = {};

    for (const metric of this.metrics.values()) {
      metrics[metric.name] = {
        type: metric.type,
        help: metric.help,
        values: metric.getAllValues(),
      };
    }

    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      metrics: metrics,
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }
}

/**
 * Default Metrics
 * Standard metrics collected automatically
 */
export function createDefaultMetrics(registry) {
  // Request metrics
  const httpRequestsTotal = new Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
  );

  const httpRequestDuration = new Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path"],
  );

  // Database metrics
  const dbQueriesTotal = new Counter(
    "db_queries_total",
    "Total database queries",
    ["operation", "status"],
  );

  const dbQueryDuration = new Histogram(
    "db_query_duration_seconds",
    "Database query duration in seconds",
    ["operation"],
  );

  const dbConnectionsActive = new Gauge(
    "db_connections_active",
    "Number of active database connections",
  );

  const dbConnectionsIdle = new Gauge(
    "db_connections_idle",
    "Number of idle database connections",
  );

  // Cache metrics
  const cacheHits = new Counter("cache_hits_total", "Total cache hits");

  const cacheMisses = new Counter("cache_misses_total", "Total cache misses");

  const cacheSize = new Gauge(
    "cache_size_bytes",
    "Current cache size in bytes",
  );

  // Circuit breaker metrics
  const circuitBreakerState = new Gauge(
    "circuit_breaker_state",
    "Circuit breaker state (0=closed, 1=open, 2=half-open)",
    ["connection"],
  );

  const circuitBreakerFailures = new Counter(
    "circuit_breaker_failures_total",
    "Total circuit breaker failures",
    ["connection"],
  );

  // Recovery metrics
  const recoveryAttempts = new Counter(
    "recovery_attempts_total",
    "Total recovery attempts",
    ["pattern", "success"],
  );

  // Rate limit metrics
  const rateLimitExceeded = new Counter(
    "rate_limit_exceeded_total",
    "Total rate limit exceeded events",
    ["tier", "type"],
  );

  // Register all metrics
  registry.register(httpRequestsTotal);
  registry.register(httpRequestDuration);
  registry.register(dbQueriesTotal);
  registry.register(dbQueryDuration);
  registry.register(dbConnectionsActive);
  registry.register(dbConnectionsIdle);
  registry.register(cacheHits);
  registry.register(cacheMisses);
  registry.register(cacheSize);
  registry.register(circuitBreakerState);
  registry.register(circuitBreakerFailures);
  registry.register(recoveryAttempts);
  registry.register(rateLimitExceeded);

  return {
    httpRequestsTotal,
    httpRequestDuration,
    dbQueriesTotal,
    dbQueryDuration,
    dbConnectionsActive,
    dbConnectionsIdle,
    cacheHits,
    cacheMisses,
    cacheSize,
    circuitBreakerState,
    circuitBreakerFailures,
    recoveryAttempts,
    rateLimitExceeded,
  };
}

/**
 * Metrics Collector
 * Automatically collects system metrics
 */
export class MetricsCollector {
  constructor(registry, options = {}) {
    this.registry = registry;
    this.interval = options.interval || 15000; // 15 seconds
    this.timer = null;
    this.collectors = [];
  }

  /**
   * Add a collector function
   */
  addCollector(collector) {
    this.collectors.push(collector);
  }

  /**
   * Start collecting metrics
   */
  start() {
    if (this.timer) return;

    this.timer = setInterval(async () => {
      for (const collector of this.collectors) {
        try {
          await collector();
        } catch (error) {
          console.error("Error collecting metrics:", error);
        }
      }
    }, this.interval);

    console.error("📊 Metrics collector started");
  }

  /**
   * Stop collecting metrics
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.error("📊 Metrics collector stopped");
    }
  }
}
