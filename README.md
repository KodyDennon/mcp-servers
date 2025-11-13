# Supabase Database MCP Server

[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#)

A powerful Model Context Protocol (MCP) server that gives AI agents full access to your Supabase/PostgreSQL database. Execute queries, manage schemas, run migrations, and more - all through natural language.

## ✨ Compatible With

| Platform | Status | Documentation |
|----------|--------|---------------|
| ![Claude](https://img.shields.io/badge/Claude-Code-5B3FFF?logo=anthropic) | ✅ Native | [Setup Guide](#quick-start) |
| ![Claude](https://img.shields.io/badge/Claude-Desktop-5B3FFF?logo=anthropic) | ✅ Native | [PLATFORMS.md](PLATFORMS.md#claude-desktop) |
| ![Cursor](https://img.shields.io/badge/Cursor-IDE-000000?logo=cursor) | ✅ Native | [PLATFORMS.md](PLATFORMS.md#cursor-ide) |
| ![Gemini](https://img.shields.io/badge/Gemini-CLI-4285F4?logo=google) | ✅ Native | [PLATFORMS.md](PLATFORMS.md#gemini-cli) |
| ![Cline](https://img.shields.io/badge/Cline-VSCode-007ACC?logo=visual-studio-code) | ✅ Native | [PLATFORMS.md](PLATFORMS.md#cline-vs-code) |
| ![Roo Code](https://img.shields.io/badge/Roo_Code-VSCode-007ACC?logo=visual-studio-code) | ✅ Native | [PLATFORMS.md](PLATFORMS.md#roo-code-vs-code) |
| ![Windsurf](https://img.shields.io/badge/Windsurf-IDE-00ADD8) | ✅ Native | [PLATFORMS.md](PLATFORMS.md#windsurf-ide) |
| ![Codex](https://img.shields.io/badge/OpenAI-Codex-412991?logo=openai) | ✅ Native | [PLATFORMS.md](PLATFORMS.md#openai-codex) |
| ![JetBrains](https://img.shields.io/badge/JetBrains-IDEs-000000?logo=jetbrains) | ✅ Native (2025.1+) | [PLATFORMS.md](PLATFORMS.md#jetbrains-ides) |

**Transport:** stdio (local) | **Language:** Node.js | **Database:** PostgreSQL/Supabase

---

## 🚀 Quick Start

### Option 1: npm Install (Recommended)

Install the package globally or locally:

```bash
# Global installation (recommended)
npm install -g mcp-supabase-db

# Or local installation in your project
npm install mcp-supabase-db
```

**Configure your AI tool:**

Add to your AI tool's MCP configuration (e.g., Claude Code):

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "npx",
      "args": ["mcp-supabase-db"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://user:password@host:5432/database"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "supabase-db-mcp",
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://user:password@host:5432/database"
      }
    }
  }
}
```

**Restart your AI tool** and verify by asking: *"What database tools are available?"*

See [PLATFORMS.md](PLATFORMS.md) for platform-specific configuration.

### Option 2: Auto-Installer (From Source)

Clone the repository and run the installer:

**macOS/Linux:**
```bash
git clone https://github.com/KodyDennon/mcp-servers.git
cd mcp-servers
./install.sh
```

**Windows:**
```powershell
git clone https://github.com/KodyDennon/mcp-servers.git
cd mcp-servers
.\install.ps1
```

The installer will:
- ✓ Check Node.js version
- ✓ Install dependencies
- ✓ Configure database connection
- ✓ Detect and configure AI tools
- ✓ Test the connection

### Option 3: Manual Setup (From Source)

1. **Clone and install:**
   ```bash
   git clone https://github.com/KodyDennon/mcp-servers.git
   cd mcp-servers
   npm install
   ```

2. **Configure environment:**

   Create or update `.env` in repo root:
   ```bash
   POSTGRES_URL_NON_POOLING="postgresql://user:password@host:5432/database"
   ```

3. **Add to your AI tool:**

   See [PLATFORMS.md](PLATFORMS.md) for platform-specific instructions.

   Example for Claude Code:
   ```json
   {
     "mcpServers": {
       "supabase-db": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-servers/index.js"],
         "env": {
           "POSTGRES_URL_NON_POOLING": "postgresql://..."
         }
       }
     }
   }
   ```

4. **Restart your AI tool**

5. **Verify:**
   Ask your AI: *"What database tools are available?"*

---

## 🛠️ Features

### SQL Operations
- **`query`** - Execute any SQL (SELECT, INSERT, UPDATE, DELETE, DDL)
- **`queryTransaction`** - Run multiple queries atomically with COMMIT/ROLLBACK
- **`explainQuery`** - EXPLAIN/ANALYZE for query optimization

### Schema Management
- **`listTables`** - View all tables with size and column count
- **`getTableSchema`** - Detailed schema (columns, types, constraints, indexes)
- **`listIndexes`** - View database indexes
- **`listFunctions`** - List stored procedures and triggers
- **`searchSchema`** - Find tables/columns/functions by name pattern

### Database Operations
- **`runMigration`** - Execute migration files from `packages/db/supabase/migrations/`
- **`listMigrations`** - See all available migration files
- **`getDatabaseStats`** - Database size, connections, table stats
- **`createBackup`** - Generate SQL dumps (requires `pg_dump`)

### Safety Features
- ⚠️ **Dangerous query warnings** (DELETE/UPDATE without WHERE)
- 🔢 **Row limits** (default: 1000, configurable)
- ⏱️ **Smart timeouts** (60s queries, 120s transactions)
- 🔒 **Connection pooling** with automatic SSL handling

---

## 📖 Documentation

- **[PLATFORMS.md](PLATFORMS.md)** - Detailed setup for all 9 AI platforms
- **[Examples](examples/)** - Platform-specific config examples
- **[Validation](#validation)** - Test your configuration

---

## ✅ Validation

### Run Configuration Validator

```bash
node validate-config.js
```

This checks:
- ✓ Node.js version (>= 18)
- ✓ Dependencies installed
- ✓ Environment variables set
- ✓ Database connection works
- ✓ MCP server starts
- ✓ Detects installed AI tools
- ✓ Validates configurations

### Test Connection Manually

```bash
POSTGRES_URL_NON_POOLING="postgresql://..." node index.js
```

You should see:
```
============================================================
🚀 @kody/supabase-db-mcp-server
📦 Version: 1.0.0
🔌 Transport: stdio
============================================================
✓ Connected to database: postgres
  User: postgres
  PostgreSQL: 15.1
============================================================
✅ Supabase DB MCP Server is ready!
============================================================
```

---

## 🎯 Usage Examples

Once configured, AI agents can interact with your database naturally:

**List Tables:**
> "Show me all tables in the database"

**Query Data:**
> "Get all users created in the last 7 days"

**Schema Inspection:**
> "What's the structure of the posts table?"

**Transactions:**
> "Transfer 100 credits from user A to user B (use a transaction)"

**Migrations:**
> "Run the migration: 20250111190000_add_settings_tables.sql"

**Performance Analysis:**
> "Explain and analyze this query: SELECT * FROM posts WHERE user_id = 123"

**Backups:**
> "Create a backup of the entire database"

---

## 🔒 Security

### Best Practices

1. **Don't hardcode credentials** in config files
2. **Use environment variables** for connection strings
3. **Restrict database permissions** (create limited user)
4. **Use read replicas** for safety (agents can't modify data)
5. **Keep backups** before allowing schema modifications

### Example: Limited User

```sql
CREATE USER mcp_agent WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE your_db TO mcp_agent;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO mcp_agent;
-- Omit DELETE and DDL for safety
```

### Environment Variable Loading

Server loads environment variables in this order:
1. MCP config `env` object (highest priority)
2. `.env` file in repo root
3. System environment variables

---

## 🐛 Troubleshooting

### Server Not Starting

1. Check Node.js version: `node -v` (must be >= 18)
2. Install dependencies: `npm install`
3. Verify paths in config are absolute
4. Run validator: `node validate-config.js`

### Connection Failed

1. Check connection string format: `postgresql://user:pass@host:5432/db`
2. Use **non-pooling** URL (not PgBouncer)
3. Verify Supabase allows your IP (Database Settings → Network)
4. Test with `psql`: `psql "postgresql://..."`

### Tools Not Showing Up

1. Restart AI tool completely (not just reload)
2. Check config file location (see [PLATFORMS.md](PLATFORMS.md))
3. Validate JSON syntax (no trailing commas)
4. Check AI tool logs/console for errors

### Platform-Specific Issues

See [PLATFORMS.md - Troubleshooting](PLATFORMS.md#troubleshooting) for detailed solutions.

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test with validator: `node validate-config.js`
4. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🔗 Links

- **Repository:** https://github.com/KodyDennon/PersonalOF/tree/main/mcp-servers/supabase-db
- **Issues:** https://github.com/KodyDennon/PersonalOF/issues
- **MCP Spec:** https://modelcontextprotocol.io
- **Supabase:** https://supabase.com

---

## 💡 Tips

- Use `query` with `rowLimit: 0` to get all rows (no limit)
- Use `queryTransaction` for multi-step operations that must succeed/fail together
- Use `explainQuery` with `analyze: true` to see actual query performance
- Use `searchSchema` with `%` wildcards: `%user%` matches any table/column with "user"
- Migration files must be in `packages/db/supabase/migrations/` directory

---

**Built with ❤️ using the [Model Context Protocol](https://modelcontextprotocol.io)**
