# Platform Setup Guide

This guide provides detailed setup instructions for using the Supabase DB MCP Server with different AI tools and platforms.

## Table of Contents

- [Claude Code](#claude-code)
- [Claude Desktop](#claude-desktop)
- [Cursor IDE](#cursor-ide)
- [Gemini CLI](#gemini-cli)
- [Cline (VS Code)](#cline-vs-code)
- [Roo Code (VS Code)](#roo-code-vs-code)
- [Windsurf IDE](#windsurf-ide)
- [OpenAI Codex](#openai-codex)
- [JetBrains IDEs](#jetbrains-ides)
- [Troubleshooting](#troubleshooting)

---

## Claude Code

**Status:** ✅ Fully Supported | **Transport:** stdio

### Quick Start

Use the auto-installer:
```bash
./install.sh
```

Or configure manually:

### Manual Setup

1. **Open MCP Settings:**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Claude Code: Open MCP Settings"
   - Select the command

2. **Add Server Configuration:**

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/supabase-db/index.js"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://user:password@host:5432/database"
      }
    }
  }
}
```

3. **Restart Claude Code:**
   - `Cmd+Shift+P` → "Developer: Reload Window"
   - Or close and reopen the application

### Environment Variables

Claude Code passes only basic environment variables by default. You must explicitly set database credentials in the `env` object.

**Option 1: Reference your .env file**
```json
"env": {
  "POSTGRES_URL_NON_POOLING": "${POSTGRES_URL_NON_POOLING}"
}
```

**Option 2: Hardcode (not recommended for security)**
```json
"env": {
  "POSTGRES_URL_NON_POOLING": "postgresql://..."
}
```

### Verification

1. Start a new conversation
2. Type: "What database tools do you have available?"
3. Claude should list 12 database tools including `query`, `listTables`, etc.

---

## Claude Desktop

**Status:** ✅ Fully Supported | **Transport:** stdio, HTTP/SSE

### Configuration File Location

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### Setup

1. **Create or edit the config file:**

```bash
# macOS
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
notepad %APPDATA%\Claude\claude_desktop_config.json

# Linux
code ~/.config/Claude/claude_desktop_config.json
```

2. **Add server configuration:**

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/supabase-db/index.js"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://user:password@host:5432/database"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

### Verification

Look for the hammer icon (🔨) in the input box - this indicates tools are available.

---

## Cursor IDE

**Status:** ✅ Fully Supported | **Transport:** stdio, SSE | **Limits:** 40 tools max

### Setup

Cursor has a built-in UI for adding MCP servers:

1. **Open Settings:**
   - `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
   - Or File → Preferences → Settings

2. **Navigate to MCP:**
   - Search for "MCP" in settings
   - Or go to: Extensions → MCP Servers

3. **Add Server:**
   - Click "Add MCP Server"
   - Enter name: `supabase-db`
   - Command: `node`
   - Args: `/absolute/path/to/mcp-servers/supabase-db/index.js`
   - Add environment variable: `POSTGRES_URL_NON_POOLING`

### Configuration File (Advanced)

Cursor stores configuration internally, but you can also use:

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/supabase-db/index.js"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://..."
      }
    }
  }
}
```

### Limitations

- **40 tool limit:** This server has 12 tools, so you're fine
- **Resources not yet supported:** This server only uses tools
- **Some environment variable edge cases**

### Verification

In Cursor's AI chat:
- Type: "List available database tools"
- Should see MCP tools available

---

## Gemini CLI

**Status:** ✅ Fully Supported | **Transport:** stdio, SSE, HTTP

### Quick Setup (Recommended)

```bash
gemini mcp add supabase-db \
  --command node \
  --args /absolute/path/to/mcp-servers/supabase-db/index.js \
  --env POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/database
```

### Manual Setup

**Config Location:**
- User: `~/.gemini/settings.json`
- Project: `.gemini/settings.json`

**Edit config file:**

```bash
code ~/.gemini/settings.json
```

**Add configuration:**

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/supabase-db/index.js"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://..."
      }
    }
  }
}
```

### Commands

```bash
# List configured servers
gemini mcp list

# Test server
gemini mcp test supabase-db

# Remove server
gemini mcp remove supabase-db
```

### Verification

```bash
gemini "What database tools are available?"
```

---

## Cline (VS Code)

**Status:** ✅ Fully Supported | **Transport:** stdio, HTTP

### Setup

1. **Install Cline Extension:**
   - Open VS Code
   - Extensions → Search "Cline"
   - Install the extension

2. **Open Cline Settings:**
   - Click Cline icon in sidebar
   - Click settings gear icon
   - Go to "MCP Servers" tab

3. **Add via UI:**
   - Click "Add MCP Server"
   - Fill in details:
     - Name: `supabase-db`
     - Command: `node`
     - Args: `/absolute/path/to/mcp-servers/supabase-db/index.js`
     - Environment variables: Add `POSTGRES_URL_NON_POOLING`

### Configuration File

**Location:** `cline_mcp_settings.json` (in workspace root or user settings)

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/supabase-db/index.js"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://..."
      }
    }
  }
}
```

### Known Issues

- Some users report needing `"type": "stdio"` field (though not standard)
- If tools don't appear, try restarting VS Code

### Verification

In Cline chat:
- Ask: "What database tools do you have?"
- Should list 12 tools

---

## Roo Code (VS Code)

**Status:** ✅ Fully Supported | **Transport:** stdio, HTTP

### Setup

1. **Install Roo Code Extension:**
   - VS Code → Extensions
   - Search "Roo Code"
   - Install

2. **Configuration Locations:**
   - **Global:** `mcp_settings.json` (user settings folder)
   - **Project:** `.roo/mcp.json` (workspace root)

### Global Configuration

**macOS/Linux:**
```bash
code ~/.config/Code/User/mcp_settings.json
```

**Windows:**
```cmd
notepad %APPDATA%\Code\User\mcp_settings.json
```

**Add configuration:**

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/supabase-db/index.js"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://..."
      }
    }
  }
}
```

### Project Configuration

Create `.roo/mcp.json` in your workspace:

```bash
mkdir -p .roo
code .roo/mcp.json
```

Same configuration format as above.

### Priority

Project config (`.roo/mcp.json`) takes precedence over global config.

### Verification

Open Roo Code sidebar and check for available tools.

---

## Windsurf IDE

**Status:** ✅ Fully Supported | **Transport:** stdio, HTTP | **Limits:** 100 tools max

### Configuration File Location

**macOS:**
```
~/.codeium/windsurf/mcp_config.json
```

**Windows:**
```
%USERPROFILE%\.codeium\windsurf\mcp_config.json
```

**Linux:**
```
~/.codeium/windsurf/mcp_config.json
```

### Setup

1. **Edit config file:**

```bash
# macOS/Linux
code ~/.codeium/windsurf/mcp_config.json

# Windows
notepad %USERPROFILE%\.codeium\windsurf\mcp_config.json
```

2. **Add configuration:**

Windsurf uses the exact same schema as Claude Desktop:

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/supabase-db/index.js"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://..."
      }
    }
  }
}
```

3. **Restart Windsurf**

### Features

- 100 tool limit (this server has 12)
- Follows Claude Desktop schema exactly
- No UI for configuration (file-based only)

### Verification

In Windsurf chat, ask: "Show me the database tools"

---

## OpenAI Codex

**Status:** ✅ Fully Supported | **Transport:** stdio, Streamable HTTP | **OAuth:** Supported

### Configuration File Location

**All Platforms:**
```
~/.codex/config.toml
```

### Setup

1. **Install Codex CLI:**

```bash
# Install via pip
pip install openai-codex

# Or download from GitHub
```

2. **Edit config:**

```bash
codex mcp add supabase-db
```

Or manually edit `~/.codex/config.toml`:

```toml
[mcpServers.supabase-db]
command = "node"
args = ["/absolute/path/to/mcp-servers/supabase-db/index.js"]

[mcpServers.supabase-db.env]
POSTGRES_URL_NON_POOLING = "postgresql://..."
```

### Commands

```bash
# List servers
codex mcp list

# Test server
codex mcp test supabase-db

# Remove server
codex mcp remove supabase-db
```

### Note on TOML Format

Unlike other tools, Codex uses TOML instead of JSON. Key differences:
- Use `[mcpServers.name]` instead of `"name": {}`
- Use `=` instead of `:`
- Arrays use `[]` syntax

### Verification

```bash
codex "What database tools are available?"
```

---

## JetBrains IDEs

**Status:** ✅ Fully Supported (2025.1+) | **Transport:** stdio, SSE

**Supported IDEs:**
- IntelliJ IDEA
- PyCharm
- WebStorm
- PhpStorm
- GoLand
- RubyMine
- CLion
- Rider
- DataGrip
- All JetBrains 2025.1+ versions

### Setup

1. **Open Settings:**
   - `Cmd+,` (Mac) or `Ctrl+Alt+S` (Windows/Linux)
   - Or File → Settings

2. **Navigate to AI Assistant:**
   - Settings → Tools → AI Assistant → MCP

3. **Add Server:**
   - Click "+" to add new server
   - Name: `supabase-db`
   - Command: `node`
   - Arguments: `/absolute/path/to/mcp-servers/supabase-db/index.js`
   - Environment variables: Add `POSTGRES_URL_NON_POOLING`

4. **Apply and Restart IDE**

### Configuration File (Advanced)

JetBrains stores MCP config in IDE-specific locations:

**macOS:**
```
~/Library/Application Support/JetBrains/[IDE]/[version]/mcp-settings.json
```

**Windows:**
```
%APPDATA%\JetBrains\[IDE][version]\mcp-settings.json
```

**Linux:**
```
~/.config/JetBrains/[IDE][version]/mcp-settings.json
```

Example: `~/Library/Application Support/JetBrains/IntelliJIdea2025.1/mcp-settings.json`

**Format:**

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/supabase-db/index.js"],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://..."
      }
    }
  }
}
```

### Verification

- Open AI Assistant panel
- Ask about available tools
- Should see database tools listed

---

## Troubleshooting

### Common Issues

#### Server Not Appearing

**Cause:** Configuration file not found or invalid JSON

**Solution:**
1. Run validation tool:
   ```bash
   cd /path/to/mcp-servers/supabase-db
   node validate-config.js
   ```
2. Check JSON syntax (no trailing commas, proper quotes)
3. Verify file path is correct
4. Restart the AI tool

#### Connection Refused

**Cause:** Environment variable not set or incorrect

**Solution:**
1. Check `POSTGRES_URL_NON_POOLING` is in `env` object:
   ```json
   "env": {
     "POSTGRES_URL_NON_POOLING": "postgresql://..."
   }
   ```
2. Test connection manually:
   ```bash
   POSTGRES_URL_NON_POOLING="postgresql://..." node index.js
   ```
3. Look for error messages in startup logs

#### Database Connection Failed

**Cause:** Wrong connection string or firewall

**Solution:**
1. Test with `psql`:
   ```bash
   psql "postgresql://user:password@host:5432/database"
   ```
2. Check Supabase firewall allows your IP
3. Verify SSL settings (use non-pooling URL)
4. Check password and username are correct

#### Tools Not Showing Up

**Cause:** Wrong transport or tool limit exceeded

**Solution:**
1. Verify transport is `stdio` (not HTTP)
2. Check tool limits:
   - Cursor: 40 tools max (this server has 12)
   - Windsurf: 100 tools max
   - Others: Usually unlimited
3. Restart the AI tool completely

#### Environment Variables Not Loading

**Cause:** Platform doesn't pass system env vars

**Solution:**
Always use explicit `env` object in config:
```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "node",
      "args": [...],
      "env": {
        "POSTGRES_URL_NON_POOLING": "postgresql://..."
      }
    }
  }
}
```

Don't rely on system environment variables being inherited.

#### Path Issues (Windows)

**Cause:** Backslashes in paths or spaces in names

**Solution:**
Use forward slashes and quotes:
```json
"args": ["C:/absolute/path/to/mcp-servers/supabase-db/index.js"]
```

Or escape backslashes:
```json
"args": ["C:\\Users\\kody\\path\\to\\index.js"]
```

#### Node Not Found

**Cause:** Node.js not in PATH or wrong version

**Solution:**
1. Check Node.js is installed:
   ```bash
   node --version  # Should be v18+
   ```
2. Use absolute path to node:
   ```json
   "command": "/usr/local/bin/node"
   ```
   Find node path:
   ```bash
   which node  # macOS/Linux
   where node  # Windows
   ```

### Platform-Specific Issues

#### Claude Code: "Server Failed to Start"

1. Check MCP settings syntax
2. Look at logs: Help → Toggle Developer Tools → Console
3. Try absolute paths for all arguments

#### Cursor: "MCP Server Timeout"

1. Increase timeout in settings
2. Check server starts independently: `node index.js`
3. Look for errors in Cursor logs

#### Gemini CLI: "Command Not Found"

1. Verify gemini CLI is installed: `which gemini`
2. Check config location: `~/.gemini/settings.json`
3. Test directly: `gemini mcp test supabase-db`

#### Cline: Tools Not Loading

1. Try adding `"type": "stdio"` to config
2. Restart VS Code (not just reload)
3. Check Cline output panel for errors

#### Windsurf: Silent Failure

1. Config must be valid JSON (trailing commas break it)
2. Restart Windsurf completely
3. Check Windsurf logs in Developer Tools

### Getting Help

If you're still stuck:

1. **Run validator:**
   ```bash
   node validate-config.js
   ```

2. **Test server manually:**
   ```bash
   POSTGRES_URL_NON_POOLING="postgresql://..." node index.js
   ```
   Should see startup banner and "Server is ready!"

3. **Check logs:**
   - Most tools have developer consoles
   - Look for MCP-related errors
   - Check for connection errors

4. **File an issue:**
   - GitHub: https://github.com/KodyDennon/PersonalOF/issues
   - Include: Platform, config file, error messages

---

## Environment Variable Reference

### Required

- `POSTGRES_URL_NON_POOLING` - PostgreSQL connection string (non-pooling)

### Format

```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://postgres:mypassword@db.example.supabase.co:5432/postgres
```

### Where to Get

**Supabase Dashboard:**
1. Go to Project Settings → Database
2. Copy "Connection string" under "Connection pooling"
3. Change mode from "Transaction" to "Session"
4. Or use "Direct connection" string

**Important:** Use **non-pooling** connection string. Pooling connections (PgBouncer) don't support some DDL operations.

---

## Security Best Practices

### Don't Hardcode Credentials

❌ **Bad:**
```json
"env": {
  "POSTGRES_URL_NON_POOLING": "postgresql://postgres:secret123@..."
}
```

✅ **Better:**
Use environment variable substitution (if supported):
```json
"env": {
  "POSTGRES_URL_NON_POOLING": "${POSTGRES_URL_NON_POOLING}"
}
```

✅ **Best:**
Server loads from `.env` file automatically. Just ensure `.env` is in repo root:
```bash
# In .env file
POSTGRES_URL_NON_POOLING="postgresql://..."
```

Then config can omit `env` if server is in same repo.

### Restrict Database Permissions

Create a limited user for MCP:

```sql
CREATE USER mcp_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE your_db TO mcp_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO mcp_user;
-- Don't grant DELETE or DDL for safety
```

Then use this user in connection string.

### Use Read Replicas

For safety, point MCP server to a read replica:
- Agents can query but not modify
- Main database stays protected
- Supabase Pro plans include replicas

---

## Next Steps

After setup:

1. **Test the connection:**
   ```bash
   node validate-config.js
   ```

2. **Try a query:**
   Ask your AI: "List all tables in the database"

3. **Explore tools:**
   Ask: "What database tools are available?"

4. **Check examples:**
   See `/examples` folder for sample queries

Need more help? Check the [main README](README.md) or [file an issue](https://github.com/KodyDennon/PersonalOF/issues).
