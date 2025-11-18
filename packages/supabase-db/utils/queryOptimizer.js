/**
 * Query Optimizer
 * Analyzes and optimizes SQL queries for better performance
 */
import { MCPError } from "./errorHandler.js";
/**
 * Query Optimizer
 * Provides query analysis and optimization suggestions
 */
export class QueryOptimizer {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.slowQueryThreshold = 1000; // 1 second
        this.slowQueries = [];
        this.maxSlowQueries = 100;
    }
    /**
     * Analyze query performance
     */
    async analyzeQuery(sql, params = []) {
        const pool = this.connectionManager.getConnection();
        const client = await pool.connect();
        try {
            // Get query plan
            const explainResult = await client.query(`EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) ${sql}`, params);
            const plan = explainResult.rows[0]["QUERY PLAN"][0];
            const analysis = {
                executionTime: plan["Execution Time"],
                planningTime: plan["Planning Time"],
                totalCost: plan.Plan["Total Cost"],
                rows: plan.Plan["Actual Rows"],
                plan: plan.Plan,
                suggestions: [],
            };
            // Generate optimization suggestions
            analysis.suggestions = this.generateSuggestions(plan, sql);
            return analysis;
        }
        finally {
            client.release();
        }
    }
    /**
     * Generate optimization suggestions
     */
    generateSuggestions(plan, sql) {
        const suggestions = [];
        const planNode = plan.Plan;
        // Check for sequential scans
        if (this.hasSeqScan(planNode)) {
            suggestions.push({
                type: "missing_index",
                severity: "high",
                message: "Query is using sequential scan. Consider adding an index.",
                details: this.findSeqScans(planNode),
            });
        }
        // Check for high row estimates
        if (planNode["Actual Rows"] > 10000) {
            suggestions.push({
                type: "large_dataset",
                severity: "medium",
                message: "Query returns a large number of rows. Consider adding LIMIT or WHERE clauses.",
                rows: planNode["Actual Rows"],
            });
        }
        // Check for missing statistics
        if (planNode["Rows Removed by Filter"]) {
            const filterEfficiency = (planNode["Actual Rows"] /
                (planNode["Actual Rows"] + planNode["Rows Removed by Filter"])) *
                100;
            if (filterEfficiency < 10) {
                suggestions.push({
                    type: "inefficient_filter",
                    severity: "medium",
                    message: "Filter is removing most rows. Consider rewriting the query or adding an index.",
                    efficiency: Math.round(filterEfficiency * 100) / 100,
                });
            }
        }
        // Check for nested loops with large outer relations
        if (planNode["Node Type"] === "Nested Loop" &&
            planNode["Actual Rows"] > 1000) {
            suggestions.push({
                type: "nested_loop",
                severity: "high",
                message: "Nested loop with large outer relation. Consider using hash join or merge join.",
                rows: planNode["Actual Rows"],
            });
        }
        // Check for missing JOIN conditions
        if (sql.toUpperCase().includes("JOIN") &&
            !sql.toUpperCase().includes("ON")) {
            suggestions.push({
                type: "missing_join_condition",
                severity: "critical",
                message: "JOIN without ON clause detected. This may cause a cartesian product.",
            });
        }
        // Check for SELECT *
        if (sql.toUpperCase().includes("SELECT *")) {
            suggestions.push({
                type: "select_star",
                severity: "low",
                message: "Using SELECT * retrieves all columns. Specify only needed columns for better performance.",
            });
        }
        return suggestions;
    }
    /**
     * Check if plan has sequential scans
     */
    hasSeqScan(node) {
        if (node["Node Type"] === "Seq Scan") {
            return true;
        }
        if (node.Plans) {
            for (const childPlan of node.Plans) {
                if (this.hasSeqScan(childPlan)) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Find all sequential scans in plan
     */
    findSeqScans(node, scans = []) {
        if (node["Node Type"] === "Seq Scan") {
            scans.push({
                table: node["Relation Name"],
                alias: node["Alias"],
                rows: node["Actual Rows"],
            });
        }
        if (node.Plans) {
            for (const childPlan of node.Plans) {
                this.findSeqScans(childPlan, scans);
            }
        }
        return scans;
    }
    /**
     * Record slow query
     */
    recordSlowQuery(sql, params, duration, error = null) {
        if (duration >= this.slowQueryThreshold) {
            this.slowQueries.push({
                sql: sql,
                params: params,
                duration: duration,
                timestamp: new Date().toISOString(),
                error: error,
            });
            // Keep only recent slow queries
            if (this.slowQueries.length > this.maxSlowQueries) {
                this.slowQueries.shift();
            }
            console.error(`🐌 Slow query detected (${duration}ms): ${sql.substring(0, 100)}...`);
        }
    }
    /**
     * Get slow query statistics
     */
    getSlowQueryStats() {
        if (this.slowQueries.length === 0) {
            return {
                count: 0,
                queries: [],
            };
        }
        const avgDuration = this.slowQueries.reduce((sum, q) => sum + q.duration, 0) /
            this.slowQueries.length;
        // Find most frequent slow queries
        const queryFrequency = new Map();
        for (const query of this.slowQueries) {
            const key = query.sql.substring(0, 100); // Use first 100 chars as key
            queryFrequency.set(key, (queryFrequency.get(key) || 0) + 1);
        }
        const mostFrequent = Array.from(queryFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([sql, count]) => ({ sql, count }));
        return {
            count: this.slowQueries.length,
            avgDuration: Math.round(avgDuration),
            threshold: this.slowQueryThreshold,
            mostFrequent: mostFrequent,
            recent: this.slowQueries.slice(-10),
        };
    }
    /**
     * Suggest indexes based on slow queries
     */
    suggestIndexes() {
        const suggestions = [];
        const tableColumns = new Map();
        // Analyze slow queries for common patterns
        for (const query of this.slowQueries) {
            const sql = query.sql.toUpperCase();
            // Simple pattern matching for WHERE clauses
            const whereMatch = sql.match(/WHERE\s+(\w+)\.(\w+)\s*[=<>]/);
            if (whereMatch) {
                const [, table, column] = whereMatch;
                const key = `${table}.${column}`;
                tableColumns.set(key, (tableColumns.get(key) || 0) + 1);
            }
            // Pattern matching for JOIN conditions
            const joinMatch = sql.match(/JOIN\s+(\w+)\s+ON\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)/);
            if (joinMatch) {
                const [, table, col1, col2] = joinMatch;
                tableColumns.set(`${table}.${col1}`, (tableColumns.get(`${table}.${col1}`) || 0) + 1);
            }
        }
        // Generate index suggestions for frequently used columns
        for (const [tableCol, frequency] of tableColumns.entries()) {
            if (frequency >= 3) {
                // Appears in at least 3 slow queries
                const [table, column] = tableCol.split(".");
                suggestions.push({
                    table: table.toLowerCase(),
                    column: column.toLowerCase(),
                    frequency: frequency,
                    sql: `CREATE INDEX idx_${table.toLowerCase()}_${column.toLowerCase()} ON ${table.toLowerCase()}(${column.toLowerCase()});`,
                });
            }
        }
        return suggestions;
    }
    /**
     * Check if query is cacheable
     */
    isCacheable(sql) {
        const upperSql = sql.toUpperCase().trim();
        // Only cache SELECT queries
        if (!upperSql.startsWith("SELECT")) {
            return false;
        }
        // Don't cache queries with volatile functions
        const volatileFunctions = [
            "NOW()",
            "CURRENT_TIMESTAMP",
            "CURRENT_DATE",
            "CURRENT_TIME",
            "RANDOM()",
            "CLOCK_TIMESTAMP()",
        ];
        for (const func of volatileFunctions) {
            if (upperSql.includes(func)) {
                return false;
            }
        }
        // Don't cache queries with FOR UPDATE/FOR SHARE
        if (upperSql.includes("FOR UPDATE") || upperSql.includes("FOR SHARE")) {
            return false;
        }
        return true;
    }
    /**
     * Estimate query cost
     */
    async estimateQueryCost(sql, params = []) {
        const pool = this.connectionManager.getConnection();
        const client = await pool.connect();
        try {
            const explainResult = await client.query(`EXPLAIN (FORMAT JSON) ${sql}`, params);
            const plan = explainResult.rows[0]["QUERY PLAN"][0];
            return {
                totalCost: plan.Plan["Total Cost"],
                startupCost: plan.Plan["Startup Cost"],
                estimatedRows: plan.Plan["Plan Rows"],
                estimatedWidth: plan.Plan["Plan Width"],
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * Get query optimization report
     */
    getOptimizationReport() {
        return {
            slowQueries: this.getSlowQueryStats(),
            indexSuggestions: this.suggestIndexes(),
            threshold: this.slowQueryThreshold,
            totalQueriesAnalyzed: this.slowQueries.length,
        };
    }
    /**
     * Clear slow query history
     */
    clearHistory() {
        this.slowQueries = [];
    }
}
//# sourceMappingURL=queryOptimizer.js.map