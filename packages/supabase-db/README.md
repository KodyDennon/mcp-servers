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

- Claude calls **56 database tools** directly
- Perfect for simple operations
- Works with all MCP clients
- Now includes advanced features: caching, templates, monitoring, and more

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
# Database Connection (Required)
POSTGRES_URL_NON_POOLING=postgresql://user:pass@host:5432/db

# Supabase Features (Optional)
OPENAI_API_KEY=sk-...
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_PROJECT_ID=...

# Multi-Transport Support (Phase 2)
MCP_TRANSPORTS=stdio,http,websocket  # Default: stdio
MCP_HTTP_PORT=3000
MCP_WS_PORT=3001
MCP_HOST=localhost

# Performance & Caching (Phase 4)
CACHE_MAX_SIZE=104857600        # 100MB default
CACHE_MAX_ENTRIES=1000
CACHE_DEFAULT_TTL=300000        # 5min default
SLOW_QUERY_THRESHOLD=1000       # 1s default
MAX_SLOW_QUERIES=100

# Rate Limiting (Phase 9)
DEFAULT_RATE_LIMIT_TIER=free    # free, pro, or enterprise

# Multi-Tenancy (Phase 9)
TENANCY_ISOLATION_STRATEGY=schema  # schema, database, or row
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

### Direct Tool Mode (56 Tools)

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

#### Advanced Tools (17 tools) 🆕

**Performance & Caching (Phase 4)**

- `get_cache_stats` - View query cache statistics and hit rates
- `clear_cache` - Clear query cache (all or specific entries)
- `analyze_query` - Analyze query performance with EXPLAIN
- `get_optimization_report` - Get optimization recommendations

**Query Templates (Phase 8)**

- `list_templates` - List available query templates by category
- `get_template` - Get template details and parameters
- `execute_template` - Execute a template with parameters

**Interactive Help (Phase 7)**

- `get_help` - Get contextual help on specific topics
- `search_help` - Search help content
- `start_tour` - Start interactive guided tour

**Rate Limiting (Phase 9)**

- `get_rate_limits` - Check current rate limit status
- `set_client_tier` - Set rate limit tier (free/pro/enterprise)

**Multi-Tenancy (Phase 9)**

- `register_tenant` - Register a new tenant
- `list_tenants` - List all registered tenants

**Plugin System (Phase 5)**

- `list_plugins` - List available plugins
- `enable_plugin` - Enable a plugin
- `disable_plugin` - Disable a plugin

**Metrics Export (Phase 6)**

- `get_metrics` - Export metrics in Prometheus or JSON format

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

---

## 🚀 Enterprise Features (Phases 2-9)

### Phase 2: Universal Compatibility

**Multi-Transport Support** - Connect via multiple protocols simultaneously:

- **stdio** - Traditional MCP over standard input/output
- **HTTP/SSE** - RESTful API with Server-Sent Events for web clients
- **WebSocket** - Full-duplex bidirectional communication

Configure via `MCP_TRANSPORTS` environment variable (e.g., `stdio,http,websocket`).

### Phase 4: Performance & Scalability

**Query Cache** - Intelligent LRU caching with TTL:

- Automatic cache key generation (SHA-256 of SQL + params)
- Size-based eviction (default: 100MB)
- Configurable TTL per query
- Hit rate tracking and statistics

**Query Optimizer** - Automatic performance analysis:

- EXPLAIN ANALYZE integration
- Sequential scan detection
- Missing index suggestions
- Slow query tracking
- Optimization recommendations

### Phase 5: Developer Experience

**Plugin System** - Extensible architecture:

- Event-driven hook system (9 lifecycle hooks)
- Built-in plugins: QueryLogger, PerformanceMonitor, ErrorTracker
- Easy custom plugin development
- Enable/disable plugins at runtime

### Phase 6: Monitoring & Observability

**Metrics Collection** - Comprehensive instrumentation:

- Counter, Gauge, Histogram metric types
- 13 default metrics (HTTP requests, DB queries, cache hits, etc.)
- Prometheus export format
- JSON export format

### Phase 7: Documentation

**Interactive Help System**:

- 7 help topics with examples
- Contextual search
- Guided 6-step tour
- Next topic suggestions

### Phase 8: Advanced Features

**Query Templates** - Pre-built queries for common operations:

- 15 templates across 5 categories
- Analytics: User growth, retention, cohort analysis
- Reporting: Revenue, top products
- Admin: Duplicate detection, orphaned records
- Optimization: Missing indexes, table bloat, unused indexes
- Security: Role permissions, table access audit

### Phase 9: Enterprise Features

**Rate Limiting** - Multi-tier token bucket + sliding window:

- Three tiers: Free (60/min), Pro (300/min), Enterprise (1000/min)
- Burst protection with token bucket
- Sustained rate limits with sliding window
- Per-client tracking

**Multi-Tenancy** - Flexible isolation strategies:

- Schema-based isolation (default)
- Database-based isolation
- Row-level isolation
- Automatic tenant provisioning
- Tenant statistics tracking

---

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
