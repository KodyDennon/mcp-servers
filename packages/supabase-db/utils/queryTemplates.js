/**
 * Query Templates
 * Pre-built query templates for common operations
 */
/**
 * Template Categories
 */
export const TemplateCategory = {
    ANALYTICS: "analytics",
    REPORTING: "reporting",
    ADMIN: "admin",
    OPTIMIZATION: "optimization",
    SECURITY: "security",
};
/**
 * Query Templates
 */
export const queryTemplates = {
    // Analytics Templates
    user_growth: {
        name: "User Growth Analysis",
        category: TemplateCategory.ANALYTICS,
        description: "Analyze user growth over time",
        sql: `
      SELECT
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as new_users,
        SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', created_at)) as cumulative_users
      FROM {{tableName}}
      WHERE created_at >= {{startDate}}::timestamp
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
      LIMIT {{limit}}
    `,
        params: {
            tableName: { type: "string", required: true, default: "users" },
            startDate: {
                type: "date",
                required: true,
                default: "NOW() - INTERVAL '30 days'",
            },
            limit: { type: "number", required: false, default: 30 },
        },
    },
    active_users_by_period: {
        name: "Active Users by Time Period",
        category: TemplateCategory.ANALYTICS,
        description: "Count active users by hour/day/week/month",
        sql: `
      SELECT
        DATE_TRUNC('{{period}}', last_active_at) as period,
        COUNT(DISTINCT user_id) as active_users
      FROM {{tableName}}
      WHERE last_active_at >= {{startDate}}::timestamp
      GROUP BY period
      ORDER BY period DESC
    `,
        params: {
            tableName: { type: "string", required: true, default: "user_activity" },
            period: {
                type: "enum",
                values: ["hour", "day", "week", "month"],
                default: "day",
            },
            startDate: {
                type: "date",
                required: true,
                default: "NOW() - INTERVAL '7 days'",
            },
        },
    },
    retention_cohort: {
        name: "User Retention Cohort Analysis",
        category: TemplateCategory.ANALYTICS,
        description: "Calculate user retention by cohort",
        sql: `
      WITH cohorts AS (
        SELECT
          user_id,
          DATE_TRUNC('month', created_at) as cohort_month
        FROM {{tableName}}
      ),
      user_activities AS (
        SELECT
          user_id,
          DATE_TRUNC('month', activity_date) as activity_month
        FROM {{activityTable}}
      )
      SELECT
        c.cohort_month,
        DATE_PART('month', AGE(a.activity_month, c.cohort_month)) as months_since_signup,
        COUNT(DISTINCT a.user_id) as active_users,
        COUNT(DISTINCT a.user_id)::float / COUNT(DISTINCT c.user_id) * 100 as retention_rate
      FROM cohorts c
      LEFT JOIN user_activities a ON c.user_id = a.user_id
      WHERE c.cohort_month >= {{startDate}}::timestamp
      GROUP BY c.cohort_month, months_since_signup
      ORDER BY c.cohort_month DESC, months_since_signup
    `,
        params: {
            tableName: { type: "string", required: true, default: "users" },
            activityTable: {
                type: "string",
                required: true,
                default: "user_activity",
            },
            startDate: {
                type: "date",
                required: true,
                default: "NOW() - INTERVAL '6 months'",
            },
        },
    },
    top_revenue_products: {
        name: "Top Revenue Generating Products",
        category: TemplateCategory.REPORTING,
        description: "Find products generating the most revenue",
        sql: `
      SELECT
        p.id,
        p.name,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.quantity) as total_quantity,
        SUM(o.quantity * o.price) as total_revenue,
        AVG(o.price) as avg_price
      FROM {{productsTable}} p
      JOIN {{ordersTable}} o ON p.id = o.product_id
      WHERE o.created_at >= {{startDate}}::timestamp
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT {{limit}}
    `,
        params: {
            productsTable: { type: "string", required: true, default: "products" },
            ordersTable: { type: "string", required: true, default: "orders" },
            startDate: {
                type: "date",
                required: true,
                default: "NOW() - INTERVAL '30 days'",
            },
            limit: { type: "number", required: false, default: 10 },
        },
    },
    daily_revenue: {
        name: "Daily Revenue Report",
        category: TemplateCategory.REPORTING,
        description: "Calculate daily revenue with trends",
        sql: `
      SELECT
        DATE(created_at) as date,
        COUNT(DISTINCT order_id) as total_orders,
        COUNT(DISTINCT customer_id) as unique_customers,
        SUM(amount) as revenue,
        AVG(amount) as avg_order_value,
        SUM(amount) - LAG(SUM(amount)) OVER (ORDER BY DATE(created_at)) as revenue_change
      FROM {{tableName}}
      WHERE created_at >= {{startDate}}::timestamp
        AND status = '{{status}}'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT {{limit}}
    `,
        params: {
            tableName: { type: "string", required: true, default: "orders" },
            startDate: {
                type: "date",
                required: true,
                default: "NOW() - INTERVAL '30 days'",
            },
            status: { type: "string", required: false, default: "completed" },
            limit: { type: "number", required: false, default: 30 },
        },
    },
    duplicate_records: {
        name: "Find Duplicate Records",
        category: TemplateCategory.ADMIN,
        description: "Identify duplicate records by specified columns",
        sql: `
      SELECT
        {{columns}},
        COUNT(*) as duplicate_count,
        ARRAY_AGG(id) as record_ids
      FROM {{tableName}}
      GROUP BY {{columns}}
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
      LIMIT {{limit}}
    `,
        params: {
            tableName: { type: "string", required: true },
            columns: { type: "string", required: true, default: "email" },
            limit: { type: "number", required: false, default: 100 },
        },
    },
    orphaned_records: {
        name: "Find Orphaned Records",
        category: TemplateCategory.ADMIN,
        description: "Find records with missing foreign key references",
        sql: `
      SELECT t1.*
      FROM {{tableName}} t1
      LEFT JOIN {{foreignTable}} t2 ON t1.{{foreignKey}} = t2.id
      WHERE t2.id IS NULL
        AND t1.{{foreignKey}} IS NOT NULL
      LIMIT {{limit}}
    `,
        params: {
            tableName: { type: "string", required: true },
            foreignTable: { type: "string", required: true },
            foreignKey: { type: "string", required: true },
            limit: { type: "number", required: false, default: 100 },
        },
    },
    missing_indexes: {
        name: "Identify Missing Indexes",
        category: TemplateCategory.OPTIMIZATION,
        description: "Find columns that might benefit from indexes",
        sql: `
      SELECT
        schemaname,
        tablename,
        attname as column_name,
        n_distinct,
        correlation,
        CASE
          WHEN n_distinct > 100 AND correlation < 0.1 THEN 'High Priority'
          WHEN n_distinct > 50 THEN 'Medium Priority'
          ELSE 'Low Priority'
        END as index_recommendation
      FROM pg_stats
      WHERE schemaname = '{{schema}}'
        AND tablename = '{{tableName}}'
        AND n_distinct > {{distinctThreshold}}
      ORDER BY n_distinct DESC
    `,
        params: {
            schema: { type: "string", required: false, default: "public" },
            tableName: { type: "string", required: true },
            distinctThreshold: { type: "number", required: false, default: 50 },
        },
    },
    table_bloat: {
        name: "Table Bloat Analysis",
        category: TemplateCategory.OPTIMIZATION,
        description: "Identify tables with significant bloat",
        sql: `
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        round(100 * pg_total_relation_size(schemaname||'.'||tablename) /
          NULLIF(pg_database_size(current_database()), 0), 2) as percent_of_db
      FROM pg_tables
      WHERE schemaname = '{{schema}}'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT {{limit}}
    `,
        params: {
            schema: { type: "string", required: false, default: "public" },
            limit: { type: "number", required: false, default: 20 },
        },
    },
    unused_indexes: {
        name: "Find Unused Indexes",
        category: TemplateCategory.OPTIMIZATION,
        description: "Identify indexes that are never used",
        sql: `
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as size,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = '{{schema}}'
        AND idx_scan < {{scanThreshold}}
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT {{limit}}
    `,
        params: {
            schema: { type: "string", required: false, default: "public" },
            scanThreshold: { type: "number", required: false, default: 10 },
            limit: { type: "number", required: false, default: 20 },
        },
    },
    role_permissions: {
        name: "User Role Permissions Audit",
        category: TemplateCategory.SECURITY,
        description: "Audit database role permissions",
        sql: `
      SELECT
        r.rolname as role_name,
        r.rolsuper as is_superuser,
        r.rolinherit as can_inherit,
        r.rolcreaterole as can_create_role,
        r.rolcreatedb as can_create_db,
        r.rolcanlogin as can_login,
        ARRAY_AGG(m.rolname) as member_of
      FROM pg_roles r
      LEFT JOIN pg_auth_members am ON r.oid = am.member
      LEFT JOIN pg_roles m ON am.roleid = m.oid
      WHERE r.rolname NOT LIKE 'pg_%'
      GROUP BY r.rolname, r.rolsuper, r.rolinherit, r.rolcreaterole, r.rolcreatedb, r.rolcanlogin
      ORDER BY r.rolname
    `,
        params: {},
    },
    table_access_audit: {
        name: "Table Access Permissions",
        category: TemplateCategory.SECURITY,
        description: "Show who has access to each table",
        sql: `
      SELECT
        schemaname,
        tablename,
        tableowner,
        array_agg(DISTINCT privilege_type) as privileges
      FROM information_schema.table_privileges
      WHERE table_schema = '{{schema}}'
      GROUP BY schemaname, tablename, tableowner
      ORDER BY tablename
    `,
        params: {
            schema: { type: "string", required: false, default: "public" },
        },
    },
};
/**
 * Template Engine
 * Compiles and executes query templates
 */
export class TemplateEngine {
    constructor() {
        this.templates = new Map();
        // Load default templates
        for (const [id, template] of Object.entries(queryTemplates)) {
            this.templates.set(id, template);
        }
    }
    /**
     * Register a custom template
     */
    registerTemplate(id, template) {
        this.templates.set(id, template);
    }
    /**
     * Get template by ID
     */
    getTemplate(id) {
        return this.templates.get(id);
    }
    /**
     * List all templates
     */
    listTemplates(category = null) {
        let templates = Array.from(this.templates.entries());
        if (category) {
            templates = templates.filter(([id, t]) => t.category === category);
        }
        return templates.map(([id, t]) => ({
            id: id,
            name: t.name,
            category: t.category,
            description: t.description,
        }));
    }
    /**
     * Compile template with parameters
     */
    compile(templateId, params = {}) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        // Validate required parameters
        for (const [paramName, paramDef] of Object.entries(template.params)) {
            if (paramDef.required && !(paramName in params)) {
                throw new Error(`Required parameter missing: ${paramName}`);
            }
        }
        // Replace placeholders
        let sql = template.sql;
        for (const [paramName, paramDef] of Object.entries(template.params)) {
            const value = params[paramName] !== undefined ? params[paramName] : paramDef.default;
            // Replace all occurrences of {{paramName}}
            const placeholder = new RegExp(`{{${paramName}}}`, "g");
            sql = sql.replace(placeholder, value);
        }
        return {
            sql: sql.trim(),
            template: templateId,
            params: params,
        };
    }
    /**
     * Get template parameters
     */
    getTemplateParams(templateId) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        return template.params;
    }
    /**
     * Search templates
     */
    searchTemplates(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        for (const [id, template] of this.templates.entries()) {
            let score = 0;
            if (template.name.toLowerCase().includes(lowerQuery)) {
                score += 10;
            }
            if (template.description.toLowerCase().includes(lowerQuery)) {
                score += 5;
            }
            if (score > 0) {
                results.push({
                    id: id,
                    name: template.name,
                    category: template.category,
                    description: template.description,
                    relevance: score,
                });
            }
        }
        return results.sort((a, b) => b.relevance - a.relevance);
    }
    /**
     * Get templates by category
     */
    getTemplatesByCategory(category) {
        return this.listTemplates(category);
    }
}
//# sourceMappingURL=queryTemplates.js.map