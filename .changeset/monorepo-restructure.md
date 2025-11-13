---
"mcp-supabase-db": major
---

Restructure into monorepo for multiple MCP servers

**Breaking Changes:**
- Migrated to pnpm workspaces monorepo structure
- Package now located in `packages/supabase-db/`
- Added Changesets for intelligent versioning across packages

**New Features:**
- Monorepo setup allows for multiple MCP servers in one repository
- Automated versioning and changelog generation with Changesets
- Better organization for future MCP server additions

**Migration:**
Users can upgrade seamlessly as the package name and API remain unchanged. Simply update to v2.0.0:
```bash
npm install mcp-supabase-db@2.0.0
# or
pnpm update mcp-supabase-db
```

No configuration changes required - the package works identically to v1.0.0.
