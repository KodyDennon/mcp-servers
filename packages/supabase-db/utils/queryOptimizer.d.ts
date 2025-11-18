/**
 * Query Optimizer
 * Provides query analysis and optimization suggestions
 */
export class QueryOptimizer {
    constructor(connectionManager: any);
    connectionManager: any;
    slowQueryThreshold: number;
    slowQueries: any[];
    maxSlowQueries: number;
    /**
     * Analyze query performance
     */
    analyzeQuery(sql: any, params?: any[]): Promise<{
        executionTime: any;
        planningTime: any;
        totalCost: any;
        rows: any;
        plan: any;
        suggestions: never[];
    }>;
    /**
     * Generate optimization suggestions
     */
    generateSuggestions(plan: any, sql: any): ({
        type: string;
        severity: string;
        message: string;
        details: any[];
        rows?: undefined;
        efficiency?: undefined;
    } | {
        type: string;
        severity: string;
        message: string;
        rows: any;
        details?: undefined;
        efficiency?: undefined;
    } | {
        type: string;
        severity: string;
        message: string;
        efficiency: number;
        details?: undefined;
        rows?: undefined;
    } | {
        type: string;
        severity: string;
        message: string;
        details?: undefined;
        rows?: undefined;
        efficiency?: undefined;
    })[];
    /**
     * Check if plan has sequential scans
     */
    hasSeqScan(node: any): boolean;
    /**
     * Find all sequential scans in plan
     */
    findSeqScans(node: any, scans?: any[]): any[];
    /**
     * Record slow query
     */
    recordSlowQuery(sql: any, params: any, duration: any, error?: null): void;
    /**
     * Get slow query statistics
     */
    getSlowQueryStats(): {
        count: number;
        queries: never[];
        avgDuration?: undefined;
        threshold?: undefined;
        mostFrequent?: undefined;
        recent?: undefined;
    } | {
        count: number;
        avgDuration: number;
        threshold: number;
        mostFrequent: {
            sql: any;
            count: any;
        }[];
        recent: any[];
        queries?: undefined;
    };
    /**
     * Suggest indexes based on slow queries
     */
    suggestIndexes(): {
        table: any;
        column: any;
        frequency: any;
        sql: string;
    }[];
    /**
     * Check if query is cacheable
     */
    isCacheable(sql: any): boolean;
    /**
     * Estimate query cost
     */
    estimateQueryCost(sql: any, params?: any[]): Promise<{
        totalCost: any;
        startupCost: any;
        estimatedRows: any;
        estimatedWidth: any;
    }>;
    /**
     * Get query optimization report
     */
    getOptimizationReport(): {
        slowQueries: {
            count: number;
            queries: never[];
            avgDuration?: undefined;
            threshold?: undefined;
            mostFrequent?: undefined;
            recent?: undefined;
        } | {
            count: number;
            avgDuration: number;
            threshold: number;
            mostFrequent: {
                sql: any;
                count: any;
            }[];
            recent: any[];
            queries?: undefined;
        };
        indexSuggestions: {
            table: any;
            column: any;
            frequency: any;
            sql: string;
        }[];
        threshold: number;
        totalQueriesAnalyzed: number;
    };
    /**
     * Clear slow query history
     */
    clearHistory(): void;
}
//# sourceMappingURL=queryOptimizer.d.ts.map