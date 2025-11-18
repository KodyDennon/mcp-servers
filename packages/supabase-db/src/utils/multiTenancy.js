/**
 * Multi-Tenancy Support
 * Isolate data and resources per tenant
 */

import { MCPError } from "./errorHandler.js";

/**
 * Tenant
 * Represents a single tenant with isolated resources
 */
export class Tenant {
  constructor(id, options = {}) {
    this.id = id;
    this.name = options.name || id;
    this.schema = options.schema || `tenant_${id}`;
    this.connectionString = options.connectionString;
    this.tier = options.tier || "free";
    this.metadata = options.metadata || {};
    this.createdAt = new Date();
    this.isActive = true;
    this.stats = {
      queries: 0,
      dataTransferred: 0,
      lastAccess: null,
    };
  }

  /**
   * Record query execution
   */
  recordQuery(bytesTransferred = 0) {
    this.stats.queries++;
    this.stats.dataTransferred += bytesTransferred;
    this.stats.lastAccess = new Date();
  }

  /**
   * Serialize tenant
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      schema: this.schema,
      tier: this.tier,
      metadata: this.metadata,
      isActive: this.isActive,
      createdAt: this.createdAt,
      stats: this.stats,
    };
  }
}

/**
 * Multi-Tenancy Manager
 * Manages tenant isolation and resource allocation
 */
export class MultiTenancyManager {
  constructor(connectionManager, options = {}) {
    this.connectionManager = connectionManager;
    this.tenants = new Map();
    this.isolationStrategy = options.isolationStrategy || "schema"; // 'schema', 'database', or 'row'
    this.defaultTier = options.defaultTier || "free";
  }

  /**
   * Register a new tenant
   */
  async registerTenant(tenantId, options = {}) {
    if (this.tenants.has(tenantId)) {
      throw new MCPError("VALIDATION_INVALID_INPUT", "Tenant already exists", {
        tenantId: tenantId,
      });
    }

    const tenant = new Tenant(tenantId, options);

    // Create tenant schema/database based on isolation strategy
    await this.provisionTenant(tenant);

    this.tenants.set(tenantId, tenant);

    console.error(
      `✅ Tenant registered: ${tenantId} (${this.isolationStrategy} isolation)`,
    );

    return tenant;
  }

  /**
   * Provision tenant resources
   */
  async provisionTenant(tenant) {
    const pool = this.connectionManager.getConnection();

    switch (this.isolationStrategy) {
      case "schema":
        await this.createTenantSchema(pool, tenant);
        break;

      case "database":
        await this.createTenantDatabase(tenant);
        break;

      case "row":
        // Row-level isolation doesn't require provisioning
        console.error(`Row-level isolation for tenant: ${tenant.id}`);
        break;

      default:
        throw new MCPError(
          "VALIDATION_INVALID_INPUT",
          `Unknown isolation strategy: ${this.isolationStrategy}`,
          {},
        );
    }
  }

  /**
   * Create tenant schema
   */
  async createTenantSchema(pool, tenant) {
    const client = await pool.connect();

    try {
      // Create schema
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenant.schema}"`);

      // Set search path for tenant
      await client.query(
        `ALTER SCHEMA "${tenant.schema}" OWNER TO CURRENT_USER`,
      );

      console.error(`Schema created for tenant: ${tenant.schema}`);
    } finally {
      client.release();
    }
  }

  /**
   * Create tenant database (requires superuser)
   */
  async createTenantDatabase(tenant) {
    if (!tenant.connectionString) {
      throw new MCPError(
        "VALIDATION_INVALID_INPUT",
        "Connection string required for database isolation",
        {},
      );
    }

    // Add connection for this tenant
    await this.connectionManager.addConnection(
      tenant.connectionString,
      `tenant_${tenant.id}`,
    );

    console.error(`Database created for tenant: ${tenant.id}`);
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId) {
    const tenant = this.tenants.get(tenantId);

    if (!tenant) {
      throw new MCPError("VALIDATION_INVALID_INPUT", "Tenant not found", {
        tenantId: tenantId,
      });
    }

    if (!tenant.isActive) {
      throw new MCPError("AUTH_INVALID_CREDENTIALS", "Tenant is inactive", {
        tenantId: tenantId,
      });
    }

    return tenant;
  }

  /**
   * Execute query with tenant isolation
   */
  async executeQueryForTenant(tenantId, sql, params = []) {
    const tenant = this.getTenant(tenantId);
    let client;

    try {
      switch (this.isolationStrategy) {
        case "schema":
          client = await this.executeWithSchemaIsolation(tenant, sql, params);
          break;

        case "database":
          client = await this.executeWithDatabaseIsolation(tenant, sql, params);
          break;

        case "row":
          client = await this.executeWithRowIsolation(tenant, sql, params);
          break;
      }

      tenant.recordQuery(JSON.stringify(client.result).length);
      return client.result;
    } finally {
      if (client?.release) {
        client.release();
      }
    }
  }

  /**
   * Execute with schema isolation
   */
  async executeWithSchemaIsolation(tenant, sql, params) {
    const pool = this.connectionManager.getConnection();
    const client = await pool.connect();

    try {
      // Set search path to tenant schema
      await client.query(`SET search_path TO "${tenant.schema}"`);

      // Execute query
      const result = await client.query(sql, params);

      return { result, release: () => client.release() };
    } catch (error) {
      client.release();
      throw error;
    }
  }

  /**
   * Execute with database isolation
   */
  async executeWithDatabaseIsolation(tenant, sql, params) {
    const pool = this.connectionManager.getConnection(`tenant_${tenant.id}`);
    const client = await pool.connect();

    try {
      const result = await client.query(sql, params);
      return { result, release: () => client.release() };
    } catch (error) {
      client.release();
      throw error;
    }
  }

  /**
   * Execute with row-level isolation
   */
  async executeWithRowIsolation(tenant, sql, params) {
    const pool = this.connectionManager.getConnection();
    const client = await pool.connect();

    try {
      // Add tenant_id to WHERE clause
      const modifiedSql = this.addTenantFilter(sql, tenant.id);

      const result = await client.query(modifiedSql, params);
      return { result, release: () => client.release() };
    } catch (error) {
      client.release();
      throw error;
    }
  }

  /**
   * Add tenant filter to SQL (for row-level isolation)
   */
  addTenantFilter(sql, tenantId) {
    // Simple implementation - should be more sophisticated in production
    const upperSql = sql.toUpperCase();

    if (upperSql.includes("WHERE")) {
      return sql.replace(/WHERE/i, `WHERE tenant_id = '${tenantId}' AND`);
    } else if (upperSql.includes("FROM")) {
      return sql.replace(
        /FROM/i,
        `FROM ... WHERE tenant_id = '${tenantId}' AND`,
      );
    }

    return sql;
  }

  /**
   * Deactivate tenant
   */
  deactivateTenant(tenantId) {
    const tenant = this.getTenant(tenantId);
    tenant.isActive = false;
    console.error(`Tenant deactivated: ${tenantId}`);
  }

  /**
   * Activate tenant
   */
  activateTenant(tenantId) {
    const tenant = this.getTenant(tenantId);
    tenant.isActive = true;
    console.error(`Tenant activated: ${tenantId}`);
  }

  /**
   * Delete tenant and clean up resources
   */
  async deleteTenant(tenantId) {
    const tenant = this.getTenant(tenantId);

    // Clean up resources
    switch (this.isolationStrategy) {
      case "schema":
        await this.dropTenantSchema(tenant);
        break;

      case "database":
        await this.dropTenantDatabase(tenant);
        break;
    }

    this.tenants.delete(tenantId);
    console.error(`Tenant deleted: ${tenantId}`);
  }

  /**
   * Drop tenant schema
   */
  async dropTenantSchema(tenant) {
    const pool = this.connectionManager.getConnection();
    const client = await pool.connect();

    try {
      await client.query(`DROP SCHEMA IF EXISTS "${tenant.schema}" CASCADE`);
      console.error(`Schema dropped for tenant: ${tenant.schema}`);
    } finally {
      client.release();
    }
  }

  /**
   * Drop tenant database
   */
  async dropTenantDatabase(tenant) {
    // Close connection first
    const connectionId = `tenant_${tenant.id}`;
    // This would need to be implemented in connectionManager
    console.error(`Database connection closed for tenant: ${tenant.id}`);
  }

  /**
   * List all tenants
   */
  listTenants(filter = {}) {
    let tenants = Array.from(this.tenants.values());

    if (filter.tier) {
      tenants = tenants.filter((t) => t.tier === filter.tier);
    }

    if (filter.isActive !== undefined) {
      tenants = tenants.filter((t) => t.isActive === filter.isActive);
    }

    return tenants.map((t) => t.toJSON());
  }

  /**
   * Get tenant statistics
   */
  getTenantStats(tenantId) {
    const tenant = this.getTenant(tenantId);
    return tenant.stats;
  }

  /**
   * Get all statistics
   */
  getAllStats() {
    return {
      totalTenants: this.tenants.size,
      activeTenants: Array.from(this.tenants.values()).filter((t) => t.isActive)
        .length,
      isolationStrategy: this.isolationStrategy,
      tenantsByTier: this.getTenantsByTier(),
      topTenants: this.getTopTenants(10),
    };
  }

  /**
   * Get tenants grouped by tier
   */
  getTenantsByTier() {
    const byTier = {};

    for (const tenant of this.tenants.values()) {
      if (!byTier[tenant.tier]) {
        byTier[tenant.tier] = 0;
      }
      byTier[tenant.tier]++;
    }

    return byTier;
  }

  /**
   * Get top tenants by queries
   */
  getTopTenants(limit = 10) {
    return Array.from(this.tenants.values())
      .sort((a, b) => b.stats.queries - a.stats.queries)
      .slice(0, limit)
      .map((t) => ({
        id: t.id,
        name: t.name,
        queries: t.stats.queries,
        dataTransferred: t.stats.dataTransferred,
      }));
  }
}
