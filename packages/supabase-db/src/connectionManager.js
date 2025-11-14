import pg from "pg";

const { Pool } = pg;

export class ConnectionManager {
  constructor() {
    this.connections = {};
    this.activeConnectionId = null;
  }

  async addConnection(connectionString, id = null) {
    const connectionId = id || `conn_${Object.keys(this.connections).length + 1}`;
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on("error", (err) => {
      console.error(`Unexpected database error on connection ${connectionId}:`, err);
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query("SELECT current_database(), current_user, version()");
    client.release();

    this.connections[connectionId] = { pool, info: result.rows[0] };
    if (!this.activeConnectionId) {
      this.activeConnectionId = connectionId;
    }
    return connectionId;
  }

  getConnection(connectionId = null) {
    const id = connectionId || this.activeConnectionId;
    if (!id || !this.connections[id]) {
      throw new Error("No active database connection. Use connectToDatabase to add a connection.");
    }
    return this.connections[id].pool;
  }

  listConnections() {
    return Object.entries(this.connections).map(([id, { info }]) => ({
      id,
      ...info,
      active: id === this.activeConnectionId,
    }));
  }

  switchConnection(connectionId) {
    if (!this.connections[connectionId]) {
      throw new Error(`Connection ${connectionId} not found.`);
    }
    this.activeConnectionId = connectionId;
  }

  async shutdown() {
    for (const { pool } of Object.values(this.connections)) {
      await pool.end();
    }
  }
}
