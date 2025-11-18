/**
 * Tenant
 * Represents a single tenant with isolated resources
 */
export class Tenant {
    constructor(id: any, options?: {});
    id: any;
    name: any;
    schema: any;
    connectionString: any;
    tier: any;
    metadata: any;
    createdAt: Date;
    isActive: boolean;
    stats: {
        queries: number;
        dataTransferred: number;
        lastAccess: null;
    };
    /**
     * Record query execution
     */
    recordQuery(bytesTransferred?: number): void;
    /**
     * Serialize tenant
     */
    toJSON(): {
        id: any;
        name: any;
        schema: any;
        tier: any;
        metadata: any;
        isActive: boolean;
        createdAt: Date;
        stats: {
            queries: number;
            dataTransferred: number;
            lastAccess: null;
        };
    };
}
/**
 * Multi-Tenancy Manager
 * Manages tenant isolation and resource allocation
 */
export class MultiTenancyManager {
    constructor(connectionManager: any, options?: {});
    connectionManager: any;
    tenants: Map<any, any>;
    isolationStrategy: any;
    defaultTier: any;
    /**
     * Register a new tenant
     */
    registerTenant(tenantId: any, options?: {}): Promise<Tenant>;
    /**
     * Provision tenant resources
     */
    provisionTenant(tenant: any): Promise<void>;
    /**
     * Create tenant schema
     */
    createTenantSchema(pool: any, tenant: any): Promise<void>;
    /**
     * Create tenant database (requires superuser)
     */
    createTenantDatabase(tenant: any): Promise<void>;
    /**
     * Get tenant by ID
     */
    getTenant(tenantId: any): any;
    /**
     * Execute query with tenant isolation
     */
    executeQueryForTenant(tenantId: any, sql: any, params?: any[]): Promise<any>;
    /**
     * Execute with schema isolation
     */
    executeWithSchemaIsolation(tenant: any, sql: any, params: any): Promise<{
        result: any;
        release: () => any;
    }>;
    /**
     * Execute with database isolation
     */
    executeWithDatabaseIsolation(tenant: any, sql: any, params: any): Promise<{
        result: any;
        release: () => any;
    }>;
    /**
     * Execute with row-level isolation
     */
    executeWithRowIsolation(tenant: any, sql: any, params: any): Promise<{
        result: any;
        release: () => any;
    }>;
    /**
     * Add tenant filter to SQL (for row-level isolation)
     */
    addTenantFilter(sql: any, tenantId: any): any;
    /**
     * Deactivate tenant
     */
    deactivateTenant(tenantId: any): void;
    /**
     * Activate tenant
     */
    activateTenant(tenantId: any): void;
    /**
     * Delete tenant and clean up resources
     */
    deleteTenant(tenantId: any): Promise<void>;
    /**
     * Drop tenant schema
     */
    dropTenantSchema(tenant: any): Promise<void>;
    /**
     * Drop tenant database
     */
    dropTenantDatabase(tenant: any): Promise<void>;
    /**
     * List all tenants
     */
    listTenants(filter?: {}): any[];
    /**
     * Get tenant statistics
     */
    getTenantStats(tenantId: any): any;
    /**
     * Get all statistics
     */
    getAllStats(): {
        totalTenants: number;
        activeTenants: number;
        isolationStrategy: any;
        tenantsByTier: {};
        topTenants: {
            id: any;
            name: any;
            queries: any;
            dataTransferred: any;
        }[];
    };
    /**
     * Get tenants grouped by tier
     */
    getTenantsByTier(): {};
    /**
     * Get top tenants by queries
     */
    getTopTenants(limit?: number): {
        id: any;
        name: any;
        queries: any;
        dataTransferred: any;
    }[];
}
//# sourceMappingURL=multiTenancy.d.ts.map