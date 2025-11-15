# Configuration Examples

This directory contains example configuration files for different AI tools and platforms.

## How to Use

1. **Find your platform's example file**
2. **Copy the configuration**
3. **Update the paths** (replace `/path/to/repo/...` with your actual path)
4. **Add your database connection string** (replace `postgresql://user:password@host:5432/database`)
5. **Paste into your platform's config file** (see locations below)

### Where the Files Live After Install

- **Global install:** `$(npm root -g)/mcp-supabase-db/examples`
- **Project install:** `<your-project>/node_modules/mcp-supabase-db/examples`

> Ask your agent to open any file directly, e.g.  
> `open $(npm root -g)/mcp-supabase-db/examples/claude-desktop.json`

---

## Configuration File Locations

### Claude Code

- Open Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Win/Linux)
- Search: "Claude Code: Open MCP Settings"
- Paste config from: `claude-code.json`

### Claude Desktop

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

Use config from: `claude-desktop.json`

### Cursor IDE

- Settings → MCP Servers → Add Server
- Or use internal config (not file-based)
- Reference: `cursor.json`

### Gemini CLI

**Config location:**

```
~/.gemini/settings.json
```

Recommended command (ready for copy/paste):

```bash
gemini mcp add supabase-db \
  --command npx \
  --args "-y mcp-supabase-db" \
  --env POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/database \
  --env SUPABASE_URL=https://your-project.supabase.co \
  --env SUPABASE_SERVICE_ROLE_KEY=service-role-key \
  --env SUPABASE_ACCESS_TOKEN=dashboard-or-personal-access-token \
  --env SUPABASE_PROJECT_ID=project-ref \
  --env OPENAI_API_KEY=sk-... \
  --env MCP_MODE=tools
```

Use config from: `gemini-cli.json`

### Cline (VS Code)

**Config location:**

```
./cline_mcp_settings.json (workspace root)
```

Or use Cline UI: Settings → MCP Servers

Use config from: `cline.json`

### Roo Code (VS Code)

**Global config:**

- macOS/Linux: `~/.config/Code/User/mcp_settings.json`
- Windows: `%APPDATA%\Code\User\mcp_settings.json`

**Project config:**

```
.roo/mcp.json (workspace root)
```

Use config from: `roo-code.json`

### Windsurf IDE

**Config location:**

- macOS: `~/.codeium/windsurf/mcp_config.json`
- Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`
- Linux: `~/.codeium/windsurf/mcp_config.json`

Use config from: `windsurf.json`

### OpenAI Codex

**Config location:**

```
~/.codex/config.toml
```

**Note:** Codex uses TOML format, not JSON!

Use config from: `codex.toml`

### JetBrains IDEs

**Config location (varies by IDE):**

- macOS: `~/Library/Application Support/JetBrains/[IDE]/[version]/mcp-settings.json`
- Windows: `%APPDATA%\JetBrains\[IDE][version]\mcp-settings.json`
- Linux: `~/.config/JetBrains/[IDE][version]/mcp-settings.json`

Or use UI: Settings → Tools → AI Assistant → MCP

Use config from: `jetbrains.json`

---

## Important Notes

### Update the Path (if you don't use `npx`)

Every example defaults to `npx mcp-supabase-db`, which resolves the binary for you.

If you prefer running the built file directly, replace the `command/args` block with your absolute path. Use the snippet below to discover it:

```bash
# macOS/Linux
cd /path/to/mcp-servers/packages/supabase-db
pwd

# Windows (PowerShell)
Resolve-Path .\packages\supabase-db
```

Append `/index.js` (or `\index.js`) if you go this route.

### Environment Variables

The bundled files already include the recommended Supabase + OpenAI variables:

```json
"env": {
  "POSTGRES_URL_NON_POOLING": "postgresql://user:password@host:5432/database",
  "SUPABASE_URL": "https://your-project.supabase.co",
  "SUPABASE_SERVICE_ROLE_KEY": "service-role-key",
  "SUPABASE_ACCESS_TOKEN": "dashboard-or-personal-access-token",
  "SUPABASE_PROJECT_ID": "project-ref",
  "OPENAI_API_KEY": "sk-...",
  "MCP_MODE": "tools"
}
```

Still want to load from `.env`? Set `MCP_SUPABASE_ROOT` to the folder that contains your `.env` file and remove the sensitive values from the config.

### Get Your Connection String

**Supabase Dashboard:**

1. Project Settings → Database
2. Copy "Connection string"
3. **Important:** Use "Session" mode or "Direct connection"
4. **Don't use:** "Transaction" mode (PgBouncer) - it doesn't support some operations

Format:

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

---

## Testing Your Configuration

After adding the config:

1. **Restart your AI tool completely**
2. **Start a new conversation**
3. **Ask:** "What database tools are available?"
4. **You should see:** 12 tools listed (query, listTables, etc.)

If it doesn't work:

1. **Run validator:**

   ```bash
   node validate-config.js
   ```

2. **Check:**
   - JSON syntax (no trailing commas!)
   - Paths are absolute (not relative)
   - Connection string is correct
   - Environment variables are set

3. **See:** [PLATFORMS.md](../PLATFORMS.md#troubleshooting) for detailed troubleshooting

---

## Quick Start Alternative

Instead of manual configuration, use the auto-installer:

**macOS/Linux:**

```bash
./install.sh
```

**Windows:**

```powershell
.\install.ps1
```

The installer will:

- Detect installed AI tools
- Prompt for connection string
- Automatically configure each tool
- Test the connection
- Show you what was configured

---

## Need Help?

- **Full setup guide:** [PLATFORMS.md](../PLATFORMS.md)
- **Main README:** [README.md](../README.md)
- **Validator:** `node validate-config.js`
- **Issues:** https://github.com/KodyDennon/PersonalOF/issues
