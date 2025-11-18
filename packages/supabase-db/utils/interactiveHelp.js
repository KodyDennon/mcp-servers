/**
 * Interactive Help System
 * Provides contextual help and guided tours
 */
import { MCPError } from "./errorHandler.js";
/**
 * Help Topics
 */
export const HelpTopic = {
    GETTING_STARTED: "getting_started",
    DATABASE_CONNECTION: "database_connection",
    QUERYING: "querying",
    SCHEMA_MANAGEMENT: "schema_management",
    PERFORMANCE: "performance",
    TROUBLESHOOTING: "troubleshooting",
    ADVANCED: "advanced",
};
/**
 * Help Content
 */
export const helpContent = {
    getting_started: {
        title: "Getting Started with Supabase DB MCP Server",
        description: "Learn the basics of using the MCP server",
        sections: [
            {
                title: "1. Connect to Database",
                content: `First, ensure you have a Supabase database URL:

POSTGRES_URL_NON_POOLING=postgresql://user:pass@host:5432/db

Then connect using the connectToDatabase tool.`,
                example: {
                    tool: "connectToDatabase",
                    args: {
                        connectionString: "postgresql://...",
                    },
                },
            },
            {
                title: "2. List Tables",
                content: "View all tables in your database",
                example: {
                    tool: "listTables",
                    args: {},
                },
            },
            {
                title: "3. Run Queries",
                content: "Execute SQL queries",
                example: {
                    tool: "query",
                    args: {
                        sql: "SELECT * FROM users LIMIT 10",
                    },
                },
            },
        ],
        next_topics: ["database_connection", "querying"],
    },
    database_connection: {
        title: "Database Connection Management",
        description: "Manage multiple database connections",
        sections: [
            {
                title: "Add Connection",
                content: "You can connect to multiple databases simultaneously",
                example: {
                    tool: "connectToDatabase",
                    args: {
                        connectionString: "postgresql://...",
                        id: "my-db",
                    },
                },
            },
            {
                title: "List Connections",
                content: "View all active connections",
                example: {
                    tool: "listConnections",
                    args: {},
                },
            },
            {
                title: "Switch Connection",
                content: "Switch between different databases",
                example: {
                    tool: "switchConnection",
                    args: {
                        connectionId: "my-db",
                    },
                },
            },
        ],
        next_topics: ["querying", "schema_management"],
    },
    querying: {
        title: "Querying Your Database",
        description: "Execute and optimize SQL queries",
        sections: [
            {
                title: "Basic Queries",
                content: "Run SELECT queries to retrieve data",
                example: {
                    tool: "query",
                    args: {
                        sql: "SELECT * FROM users WHERE active = true",
                    },
                },
            },
            {
                title: "Query Analysis",
                content: "Analyze query performance with EXPLAIN",
                example: {
                    tool: "explainQuery",
                    args: {
                        sql: "SELECT * FROM users WHERE email LIKE '%@example.com'",
                    },
                },
            },
            {
                title: "Transactions",
                content: "Execute multiple queries in a transaction",
                example: {
                    tool: "queryTransaction",
                    args: {
                        queries: [
                            "UPDATE accounts SET balance = balance - 100 WHERE id = 1",
                            "UPDATE accounts SET balance = balance + 100 WHERE id = 2",
                        ],
                    },
                },
            },
        ],
        next_topics: ["performance", "schema_management"],
    },
    schema_management: {
        title: "Schema Management",
        description: "Create and modify database schema",
        sections: [
            {
                title: "View Table Schema",
                content: "Get detailed information about a table",
                example: {
                    tool: "getTableSchema",
                    args: {
                        tableName: "users",
                    },
                },
            },
            {
                title: "Create Table",
                content: "Create a new table",
                example: {
                    tool: "createTable",
                    args: {
                        tableName: "products",
                        columns: [
                            { name: "id", type: "SERIAL PRIMARY KEY" },
                            { name: "name", type: "VARCHAR(255) NOT NULL" },
                            { name: "price", type: "DECIMAL(10,2)" },
                        ],
                    },
                },
            },
            {
                title: "Add Column",
                content: "Add a column to existing table",
                example: {
                    tool: "addColumn",
                    args: {
                        tableName: "products",
                        columnName: "description",
                        columnType: "TEXT",
                    },
                },
            },
        ],
        next_topics: ["querying", "advanced"],
    },
    performance: {
        title: "Performance Optimization",
        description: "Optimize your queries and database",
        sections: [
            {
                title: "Health Check",
                content: "Monitor server and database health",
                example: {
                    tool: "health_check",
                    args: {
                        include_history: true,
                    },
                },
            },
            {
                title: "Connection Stats",
                content: "View connection pool statistics",
                example: {
                    tool: "get_connection_stats",
                    args: {},
                },
            },
            {
                title: "Create Index",
                content: "Speed up queries with indexes",
                example: {
                    tool: "createIndex",
                    args: {
                        tableName: "users",
                        indexName: "idx_users_email",
                        columns: ["email"],
                    },
                },
            },
        ],
        next_topics: ["troubleshooting", "advanced"],
    },
    troubleshooting: {
        title: "Troubleshooting Common Issues",
        description: "Resolve common problems",
        sections: [
            {
                title: "Connection Failed",
                content: `Check your connection string format:

✅ Correct: postgresql://user:pass@host:5432/database
❌ Wrong: postgres://... (should be postgresql://)

Verify:
- Database URL is correct
- Database is accessible from your network
- Credentials are valid`,
            },
            {
                title: "Slow Queries",
                content: `Use explainQuery to analyze performance:

1. Run explainQuery on slow query
2. Look for Sequential Scans
3. Add indexes on WHERE/JOIN columns
4. Consider LIMIT for large result sets`,
            },
            {
                title: "Circuit Breaker Open",
                content: `The circuit breaker protects against cascading failures.

When open:
1. Check database connectivity
2. View recovery stats
3. Manually reset if needed`,
                example: {
                    tool: "reset_circuit_breaker",
                    args: {},
                },
            },
        ],
        next_topics: ["performance", "database_connection"],
    },
    advanced: {
        title: "Advanced Features",
        description: "Leverage advanced capabilities",
        sections: [
            {
                title: "Multi-Transport Support",
                content: `Enable HTTP/WebSocket transports:

MCP_TRANSPORTS=stdio,http,websocket npm start

Access via:
- Stdio: Standard MCP
- HTTP: http://localhost:3000/mcp
- WebSocket: ws://localhost:3001`,
            },
            {
                title: "Rate Limiting",
                content: `Control request rates per client:

- Free tier: 60 req/min, 1000 req/hour
- Pro tier: 300 req/min, 10000 req/hour
- Enterprise: 1000 req/min, 100000 req/hour`,
            },
            {
                title: "Multi-Tenancy",
                content: `Isolate data per tenant:

- Schema isolation (recommended)
- Database isolation
- Row-level isolation`,
            },
        ],
        next_topics: ["getting_started"],
    },
};
/**
 * Interactive Help System
 */
export class InteractiveHelp {
    constructor() {
        this.currentTopic = null;
        this.history = [];
    }
    /**
     * Get help for a topic
     */
    getTopic(topic) {
        const content = helpContent[topic];
        if (!content) {
            throw new MCPError("VALIDATION_INVALID_INPUT", "Help topic not found", {
                topic: topic,
                availableTopics: Object.keys(helpContent),
            });
        }
        this.currentTopic = topic;
        this.history.push(topic);
        return content;
    }
    /**
     * Search help content
     */
    search(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        for (const [topic, content] of Object.entries(helpContent)) {
            const score = this.calculateRelevance(content, lowerQuery);
            if (score > 0) {
                results.push({
                    topic: topic,
                    title: content.title,
                    description: content.description,
                    relevance: score,
                });
            }
        }
        return results.sort((a, b) => b.relevance - a.relevance);
    }
    /**
     * Calculate relevance score
     */
    calculateRelevance(content, query) {
        let score = 0;
        // Check title
        if (content.title.toLowerCase().includes(query)) {
            score += 10;
        }
        // Check description
        if (content.description.toLowerCase().includes(query)) {
            score += 5;
        }
        // Check sections
        for (const section of content.sections) {
            if (section.title.toLowerCase().includes(query)) {
                score += 3;
            }
            if (section.content.toLowerCase().includes(query)) {
                score += 1;
            }
        }
        return score;
    }
    /**
     * Get suggested next topics
     */
    getSuggestedTopics() {
        if (!this.currentTopic) {
            return [HelpTopic.GETTING_STARTED];
        }
        const content = helpContent[this.currentTopic];
        return content.next_topics || [];
    }
    /**
     * List all topics
     */
    listTopics() {
        return Object.entries(helpContent).map(([topic, content]) => ({
            topic: topic,
            title: content.title,
            description: content.description,
        }));
    }
    /**
     * Get help history
     */
    getHistory() {
        return this.history;
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        this.currentTopic = null;
    }
}
/**
 * Interactive Tour
 * Guided walkthrough of features
 */
export class InteractiveTour {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.currentStep = 0;
        this.steps = [
            {
                title: "Welcome to Supabase DB MCP Server!",
                description: "Let's take a quick tour of the main features",
                action: null,
            },
            {
                title: "Step 1: Check Server Health",
                description: "First, let's verify the server is healthy",
                tool: "health_check",
                args: {},
            },
            {
                title: "Step 2: List Tables",
                description: "Now let's see what tables are in your database",
                tool: "listTables",
                args: {},
            },
            {
                title: "Step 3: Run a Query",
                description: "Let's run a simple query to retrieve data",
                tool: "query",
                args: {
                    sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5",
                },
            },
            {
                title: "Step 4: Check Performance",
                description: "View connection pool statistics",
                tool: "get_connection_stats",
                args: {},
            },
            {
                title: "Tour Complete!",
                description: "You've learned the basics. Try exploring the help system for more advanced features.",
                action: null,
            },
        ];
    }
    /**
     * Get current step
     */
    getCurrentStep() {
        return this.steps[this.currentStep];
    }
    /**
     * Move to next step
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            return this.getCurrentStep();
        }
        return null;
    }
    /**
     * Move to previous step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            return this.getCurrentStep();
        }
        return null;
    }
    /**
     * Reset tour
     */
    reset() {
        this.currentStep = 0;
    }
    /**
     * Get progress
     */
    getProgress() {
        return {
            current: this.currentStep + 1,
            total: this.steps.length,
            percent: Math.round(((this.currentStep + 1) / this.steps.length) * 100),
        };
    }
    /**
     * Is tour complete
     */
    isComplete() {
        return this.currentStep === this.steps.length - 1;
    }
}
//# sourceMappingURL=interactiveHelp.js.map