# Supabase DB MCP Server

<div align="center">

![Supabase MCP Server](https://img.shields.io/badge/Supabase-MCP_Server-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

**The Ultimate Database Tool for AI Agents**

[![Tests](https://img.shields.io/badge/tests-116%20passing-green?style=flat-square)](./TESTING.md)
[![Coverage](https://img.shields.io/badge/coverage-35%25-yellow?style=flat-square)](./TESTING.md)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)
[![Version](https://img.shields.io/npm/v/mcp-supabase-db?style=flat-square)](https://www.npmjs.com/package/mcp-supabase-db)

</div>

---

## 🚀 Overview

**mcp-supabase-db** is a powerful Model Context Protocol (MCP) server that gives your AI agents safe, controlled, and supercharged access to Supabase and PostgreSQL databases.

Whether you need simple queries or complex data analysis, this server has you covered with **two distinct modes of operation**.

### ✨ Key Features

- **🔌 Dual Mode Operation**: Choose between simple tools or powerful code execution.
- **🛡️ Privacy-First**: Automatic PII protection keeps sensitive user data safe.
- **⚡ High Performance**: Smart caching and streaming for handling large datasets.
- **🧠 AI-Ready**: Built-in RAG tools and vector search for intelligent applications.
- **📊 Enterprise Grade**: Rate limiting, multi-tenancy, and comprehensive monitoring.

---

## 🎯 Two Ways to Run

### 1. Direct Tool Mode (Traditional)

_Best for: Simple queries, admin tasks, and direct database manipulation._

Your agent gets **56 specific tools** to interact with the database:

- `query`: Run SQL queries
- `listTables`: See your database structure
- `createBackup`: Secure your data
- ...and 53 more!

### 2. Code Execution Mode (Advanced) 🔥

_Best for: Data analysis, complex reporting, and keeping token costs low._

Your agent writes and executes **sandboxed TypeScript code** to process data.

- **98% Cheaper**: Process 10k rows for the cost of 500 tokens.
- **Safer**: Data stays in the sandbox; only the results leave.
- **Smarter**: Perform complex aggregations and transformations in one go.

[📖 **Read the Code Execution Guide**](./CODE_EXECUTION_GUIDE.md)

---

## 🏁 Quick Start

### Prerequisites

- Node.js 20+
- A Supabase project (or any PostgreSQL database)

### Installation

```bash
npm install -g mcp-supabase-db
```

### Configuration

Create a `.env` file with your database connection:

```bash
# Required: Your Database Connection String
POSTGRES_URL_NON_POOLING=postgresql://postgres:password@db.example.com:5432/postgres

# Optional: Supabase API (for Edge Functions & Auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Start the Server

**Option 1: Traditional Mode (Direct Tools)**

```bash
mcp-supabase-db
```

**Option 2: Code Execution Mode**

```bash
MCP_MODE=code-api mcp-supabase-db
```

---

## 💡 Usage Examples

### Scenario: "Who are my most active users?"

#### In Direct Tool Mode:

1. Agent calls `query("SELECT * FROM users")` -> **Returns 10,000 rows (Huge token cost!)**
2. Agent analyzes rows one by one.
3. Agent calculates result.

#### In Code Execution Mode:

Agent writes a single script:

```typescript
import { query } from "mcp-supabase-db/tools";

// Fetch and aggregate in one step
const result = await query(`
  SELECT country, COUNT(*) as user_count 
  FROM users 
  WHERE last_login > NOW() - INTERVAL '30 days'
  GROUP BY country
  ORDER BY user_count DESC
`);

return result; // Returns just 5 lines of text! (Tiny token cost)
```

---

## 🛠️ Feature Breakdown

| Feature                |  Direct Tool Mode   | Code Execution Mode |
| :--------------------- | :-----------------: | :-----------------: |
| **SQL Queries**        |         ✅          |         ✅          |
| **Schema Inspection**  |         ✅          |         ✅          |
| **Data Modification**  |         ✅          |         ✅          |
| **Migrations**         |         ✅          |         ✅          |
| **Complex Logic**      | ❌ (Multiple steps) | ✅ (Single script)  |
| **Token Efficiency**   |       📉 Low        |       📈 High       |
| **Privacy Protection** |      ⚠️ Manual      |    🛡️ Automatic     |

### 📚 Available Tools (Direct Mode)

<details>
<summary><strong>Click to expand full tool list</strong></summary>

#### 🔌 Connection

- `connectToDatabase`, `listConnections`, `switchConnection`

#### 🔍 Query & Schema

- `query`, `queryTransaction`, `explainQuery`
- `listTables`, `getTableSchema`, `searchSchema`

#### 📝 Data Operations

- `insertRow`, `updateRow`, `deleteRow`, `importData`

#### 🧠 AI & Vector

- `rag` (Retrieval Augmented Generation)
- `indexDirectory`, `indexUrl`

#### ⚙️ Admin & Monitoring

- `getDatabaseStats`, `createBackup`
- `health_check`, `get_cache_stats`

</details>

---

## 🛡️ Enterprise Features

This server is built for production:

- **Caching**: Frequently run queries are cached automatically.
- **Circuit Breaker**: Protects your database from overload.
- **Rate Limiting**: Controls how fast agents can make requests.
- **Multi-Tenancy**: Safe for SaaS applications with schema isolation.

[📖 **Read the Reliability Guide**](./RELIABILITY.md)

---

## 🤝 Contributing

We love contributions! Please see our [Contributing Guide](../../README.md#contributing) for details.

---

<div align="center">
  Made with ❤️ for the MCP Community
</div>
