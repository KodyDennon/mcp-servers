# Supabase DB MCP Server

> Production-ready Model Context Protocol server for Supabase/PostgreSQL, delivered from the `mcp-servers` monorepo.

The Supabase DB MCP server lives under `packages/supabase-db/` and ships 35 direct database tools plus an advanced code-execution surface for AI agents such as Claude Code, Cursor, Gemini CLI, Cline, and Windsurf. This page walks through installation, configuration, and day-two operations whether you want to ship the npm package or run the workspace copy directly.

---

## Repository Layout

```
mcp-servers/
├── packages/
│   └── supabase-db/      # Supabase MCP server sources, tests, docs
├── docs/                 # GitHub Pages site (this file)
└── README.md             # Monorepo overview
```

Because this is a workspace, always run commands from the repository root unless otherwise noted.

---

## Requirements

- Node.js **20 LTS** or newer
- npm 10+ or pnpm 9+
- Supabase project with service-role credentials
- Optional: OpenAI API key for RAG/AI helper tools

---

## Installation Options

### 1. From npm (recommended for deployment)

```bash
npm install -g mcp-supabase-db
# or scaffold in a project
npm install mcp-supabase-db
```

The CLI exposes `supabase-db-mcp`:

```bash
supabase-db-mcp  # starts in direct mode by default
```

### 2. From the monorepo workspace (development)

```bash
git clone https://github.com/KodyDennon/mcp-servers.git
cd mcp-servers
pnpm install
pnpm --filter mcp-supabase-db build
pnpm --filter mcp-supabase-db start
```

Use `npm` instead of `pnpm` if you prefer, but always `cd packages/supabase-db` before running package scripts.

---

## Configuration

The server loads configuration in this order:

1. `.env` file located at the current working directory (override with `MCP_SUPABASE_ROOT`)
2. `mcp-config.json` (same directory)
3. Environment variables inherited from the shell or MCP client

### Required Variables

| Variable | Description |
| --- | --- |
| `POSTGRES_URL_NON_POOLING` | Direct PostgreSQL connection URI (non-pooled) |
| `SUPABASE_URL` | `https://<project>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (alias: `SUPABASE_SECRET_KEY`) |
| `SUPABASE_ACCESS_TOKEN` | Dashboard access token for management APIs |
| `SUPABASE_PROJECT_ID` | Project reference (15-character string) |
| `OPENAI_API_KEY` | Needed for RAG/indexing/AI helpers |

Create `.env` at repo root or set `MCP_SUPABASE_ROOT=/absolute/path/to/mcp-servers` when running the global CLI so the config loader knows where to look.

---

## Running Modes

| Mode | Env | Description |
| --- | --- | --- |
| Direct tools | _default_ | 35 MCP tools for schema, data, migration, admin, subscriptions, etc. |
| Code execution | `MCP_MODE=code-api` | Claude Code-style flow with caching, streaming, stored skills |
| Sandbox vs Direct | `CODE_EXECUTION_MODE=sandbox|direct` | Run inside Claude sandbox or local process |

Examples:

```bash
# Direct tools
supabase-db-mcp

# Code execution sandbox
MCP_MODE=code-api CODE_EXECUTION_MODE=sandbox supabase-db-mcp
```

---

## Testing & Quality Gates

Inside `packages/supabase-db/`:

```bash
npm test        # Builds TS, runs Jest with coverage gates
npm run build   # TypeScript -> dist (uses project tsconfig)
npm audit --production
```

The test suite uses mocked Supabase/OpenAI clients and enforces global coverage thresholds. Config tests load the ESM module via Babel/Jest so regressions in env handling are caught before release.

---

## Publishing Workflow

1. Make changes under `packages/supabase-db/`
2. Run `pnpm changeset` (monorepo versioning)
3. `pnpm build && pnpm test`
4. `pnpm release` (or `pnpm changeset publish`)

See `PUBLISHING_GUIDE.md` in the package directory for detailed release automation steps.

---

## Support & Links

- npm: [`mcp-supabase-db`](https://www.npmjs.com/package/mcp-supabase-db)
- Repo: [github.com/KodyDennon/mcp-servers](https://github.com/KodyDennon/mcp-servers)
- Protocol: [modelcontextprotocol.io](https://modelcontextprotocol.io/)

Open issues or pull requests in the monorepo if you need new tools, client configs, or documentation updates.

