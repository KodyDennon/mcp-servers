# Configuration Examples

This directory contains example configuration files for different AI tools and platforms.

## How to Use

1. **Find your platform's example file**
2. **Copy the configuration**
3. **Update the paths** (replace `/path/to/repo/...` with your actual path)
4. **Add your database connection string** (replace `postgresql://user:password@host:5432/database`)
5. **Paste into your platform's config file** (see locations below)

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

Or use command:
```bash
gemini mcp add supabase-db \
  --command node \
  --args /path/to/index.js \
  --env POSTGRES_URL_NON_POOLING=postgresql://...
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

### Update the Path
All examples use:
```
/absolute/path/to/mcp-servers/supabase-db/index.js
```

**You must change this to your actual path!**

**Find your path:**
```bash
# macOS/Linux
cd /path/to/mcp-servers/supabase-db
pwd
# Copy the output and append /index.js

# Windows
cd C:\path\to\mcp-servers\supabase-db
cd
# Copy the output and append \index.js (or use forward slashes)
```

### Environment Variables

**Option 1: In config (explicit)**
```json
"env": {
  "POSTGRES_URL_NON_POOLING": "postgresql://actual-connection-string"
}
```

**Option 2: From .env file (automatic)**
If `.env` exists in repo root, server loads it automatically.
You can omit the `env` object or use a variable reference:
```json
"env": {
  "POSTGRES_URL_NON_POOLING": "${POSTGRES_URL_NON_POOLING}"
}
```
(Variable substitution support varies by platform)

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
