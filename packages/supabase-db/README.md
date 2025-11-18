# Supabase DB MCP Server

> **Full-featured Supabase/PostgreSQL database access for AI agents via Model Context Protocol**

[![Tests](https://img.shields.io/badge/tests-110%20passing-green)](./TESTING.md)
[![Coverage](https://img.shields.io/badge/coverage-35%25-yellow)](./TESTING.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

## ✅ Requirements

- Node.js 20 LTS or later
- npm 10+ (or pnpm 9+)

## 🎯 What's New: Code Execution Mode!

This MCP server now supports **TWO modes of operation**:

### 1. Direct Tool Mode (Traditional MCP)

- Claude calls 35 database tools directly
- Perfect for simple operations
- Works with all MCP clients

### 2. Code Execution Mode (NEW! 🔥)

- **98.7% token reduction** for data operations
- **Privacy-first**: PII stays in sandbox
- **Complex operations**: Multi-step analysis in single code blocks
- **Stateful**: Caching, streaming, saved skills

[📖 Read the full Code Execution Guide →](./CODE_EXECUTION_GUIDE.md)

---

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Choose Your Mode

```bash
# Traditional MCP (Direct Tools)
npm start

# Code Execution Mode - Sandbox (NEW!)
MCP_MODE=code-api CODE_EXECUTION_MODE=sandbox npm start

# Code Execution Mode - Direct (NEW!)
MCP_MODE=code-api CODE_EXECUTION_MODE=direct npm start
```

**Execution Modes Explained:**

- **`sandbox`**: Code runs in Claude Code's sandbox environment (safer, PII-protected, restricted access)
- **`direct`**: Code runs directly on your server (more powerful, full access, requires trust)

### Configuration

Create a `.env` file or use `mcp-config.json`:

```bash
POSTGRES_URL_NON_POOLING=postgresql://user:pass@host:5432/db
OPENAI_API_KEY=sk-...
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_PROJECT_ID=...
```

> The server looks for `.env` relative to the directory you launch it from. Set `MCP_SUPABASE_ROOT=/absolute/path/to/project` if you need to read secrets from a different location (e.g., when running the CLI globally).

---

## 💡 Usage Examples

### Direct Tool Mode

```
Claude: "Show me active users"
→ Calls query tool
→ Returns 1000 rows
→ Claude analyzes
```

### Code Execution Mode

```typescript
import { query } from "./servers/supabase-db/query";
import { DataPipeline } from "./servers/supabase-db/pipeline";

const users = await query({
  sql: "SELECT * FROM users WHERE active = true",
  cache: true,
  privacy: "tokenize", // PII protected!
});

const summary = new DataPipeline(users.rows)
  .groupBy("country")
  .aggregate((users) => ({
    count: users.length,
    avg_age: users.reduce((sum, u) => sum + u.age, 0) / users.length,
  }))
  .result();

return summary; // Only 500 tokens instead of 50,000!
```

---

## 🛠️ Features

### Direct Tool Mode (35 Tools)

#### Connection Management (3 tools)

- `connectToDatabase` - Multi-database support
- `listConnections` - View active connections
- `switchConnection` - Switch between databases

#### Query Operations (3 tools)

- `query` - Execute SELECT queries
- `queryTransaction` - Atomic transactions
- `explainQuery` - Query optimization

#### Schema Management (11 tools)

- `listTables`, `getTableSchema`, `listIndexes`, `listFunctions`
- `createTable`, `dropTable`, `addColumn`, `dropColumn`
- `createIndex`, `searchSchema`, `diffSchema`

#### Data Operations (4 tools)

- `importData`, `insertRow`, `updateRow`, `deleteRow`

#### Migration Tools (4 tools)

- `runMigration`, `listMigrations`, `generateMigration`, `seedData`

#### Admin Tools (4 tools)

- `getDatabaseStats`, `createBackup`, `manageAuth`, `manageStorage`

#### Real-time (1 tool)

- `subscribe` - Real-time updates

#### Edge Functions (3 tools)

- `deployFunction`, `listEdgeFunctions`, `deleteFunction`

#### AI Tools (3 tools)

- `rag` - Retrieval-Augmented Generation
- `indexDirectory`, `indexUrl` - Vector search

#### Monitoring Tools (4 tools) 🆕

- `health_check` - Comprehensive server health diagnostics
- `get_connection_stats` - Connection pool and circuit breaker stats
- `get_recovery_stats` - Auto-recovery statistics
- `reset_circuit_breaker` - Manual circuit breaker reset

### Code Execution Mode (NEW!)

#### Core Modules

- `query` - SQL execution with caching & privacy
- `schema` - Schema inspection & modification
- `data` - CRUD operations
- `migration` - Database migrations
- `admin` - Administrative operations

#### Advanced Features

- **QueryBuilder** - Composable SQL queries
- **DataPipeline** - Transform data efficiently
- **Streaming** - Process huge datasets
- **QueryCache** - Automatic result caching
- **PrivacyFilter** - Automatic PII protection

#### Skills Library

- **User Analytics** - Growth, retention, engagement
- **Data Quality** - Duplicates, nulls, outliers
- **Reporting** - Daily summaries, time series, cohorts

---

## 📊 Performance Comparison

| Feature        | Direct Tools   | Code Execution | Improvement       |
| -------------- | -------------- | -------------- | ----------------- |
| Query 10K rows | 50,000 tokens  | 2,000 tokens   | **96% reduction** |
| PII Protection | ❌ Manual      | ✅ Automatic   | Privacy-first     |
| Result Caching | ❌ None        | ✅ Built-in    | 80%+ hit rate     |
| Multi-step Ops | Multiple calls | Single block   | Simpler           |
| Streaming      | ❌ Load all    | ✅ Incremental | Memory efficient  |

## 🛡️ Reliability & Robustness

Production-grade reliability features ensure stable operation:

- **🏥 Health Monitoring** - Comprehensive diagnostics for database, memory, and response times
- **⚡ Circuit Breaker** - Prevents cascading failures by failing fast when services are unhealthy
- **🔄 Auto-Recovery** - Automatically detects and recovers from connection issues
- **🐕 Connection Watchdog** - Continuously monitors connection health and triggers recovery
- **✨ Graceful Shutdown** - Clean resource cleanup on server termination

**Key Features:**

- Circuit breaker with 3 states (CLOSED, OPEN, HALF_OPEN)
- Automatic recovery from CONNECTION_LOST, TIMEOUT, POOL_EXHAUSTED, and more
- Exponential backoff retry with configurable attempts
- Health check API with historical statistics
- Zero-configuration defaults with full customization options

[📖 Read the Reliability Guide →](./RELIABILITY.md)

---

**Made with ❤️ for the MCP community**

**⭐ Star this repo if you find it useful!**
