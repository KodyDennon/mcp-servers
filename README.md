# MCP Servers Monorepo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)
[![Changesets](https://img.shields.io/badge/versioned%20with-changesets-blue)](https://github.com/changesets/changesets)

A collection of Model Context Protocol (MCP) servers for various integrations and services. This monorepo is managed with pnpm workspaces and uses Changesets for intelligent versioning.

## 📦 Packages

| Package                                   | Version                                                                                                   | Description                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [mcp-supabase-db](./packages/supabase-db) | [![npm](https://img.shields.io/npm/v/mcp-supabase-db.svg)](https://www.npmjs.com/package/mcp-supabase-db) | Supabase/PostgreSQL database access for AI agents |

👉 Need end-user friendly docs? Check the [GitHub Pages site](https://mcpservers.kodydennon.com) (built from `packages/docs-site`) for installation and configuration walkthroughs tailored to the monorepo.

## 🚀 Quick Start

Each package can be installed independently from npm:

```bash
# Install globally
npm install -g mcp-supabase-db

# Or use npx
npx mcp-supabase-db

# Or install in your project
npm install mcp-supabase-db
```

See individual package READMEs for detailed setup instructions.

## 🛠️ Development

This monorepo uses **pnpm workspaces** for package management and **Changesets** for version management.

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

```bash
# Install pnpm if you don't have it
npm install -g pnpm
```

### Setup

```bash
# Clone the repository
git clone https://github.com/KodyDennon/mcp-servers.git
cd mcp-servers

# Install dependencies for all packages
pnpm install

# Run tests across all packages
pnpm test

# Build all packages
pnpm build
```

### Workspace Commands

```bash
# Install a dependency in a specific package
pnpm --filter mcp-supabase-db add some-package

# Run a script in a specific package
pnpm --filter mcp-supabase-db start

# Run a script in all packages
pnpm -r build
```

## 📚 Documentation Site

GitHub Pages serves straight from the `docs/` directory (pure HTML/CSS/JS). To update the site:

1. Edit the relevant file(s) under `docs/` (for example `docs/index.html` or `docs/assets/css/style.css`).
2. Run the workspace formatter to keep styles consistent:
   ```bash
   pnpm lint   # prettier --check
   ```
3. Commit the updated assets and push to `main`. GitHub Pages will redeploy automatically with the custom domain in `docs/CNAME`.

## 📝 Contributing

### Adding a New Package

1. Create a new directory in `packages/`:

   ```bash
   mkdir packages/my-new-mcp-server
   cd packages/my-new-mcp-server
   ```

2. Initialize with `package.json`:

   ```json
   {
     "name": "mcp-my-service",
     "version": "0.0.0",
     "description": "MCP server for My Service",
     "type": "module",
     "main": "index.js",
     "repository": {
       "type": "git",
       "url": "git+https://github.com/KodyDennon/mcp-servers.git",
       "directory": "packages/my-new-mcp-server"
     },
     "license": "MIT"
   }
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

### Making Changes

1. Make your changes to any package

2. Create a changeset to document your changes:

   ```bash
   pnpm changeset
   ```

   This will prompt you to:
   - Select which packages changed
   - Specify if it's a major, minor, or patch change
   - Write a summary of the changes

3. Commit your changes including the changeset:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

### Versioning

Changesets automatically manages versions:

```bash
# Apply changesets and bump versions
pnpm version

# This will:
# - Read all changesets
# - Bump package versions
# - Update CHANGELOG.md files
# - Delete applied changesets
```

### Publishing

```bash
# Build and publish all changed packages to npm
pnpm release

# Or manually:
pnpm build
pnpm changeset publish
```

## 📖 Changeset Types

- **Major** (`major`): Breaking changes - bump from 1.0.0 → 2.0.0
- **Minor** (`minor`): New features - bump from 1.0.0 → 1.1.0
- **Patch** (`patch`): Bug fixes - bump from 1.0.0 → 1.0.1

## 🏗️ Project Structure

```
mcp-servers/
├── .changeset/           # Changesets configuration and pending changesets
├── packages/
│   ├── supabase-db/     # Supabase MCP server package
│   │   ├── index.js
│   │   ├── package.json
│   │   └── README.md
│   └── [future-servers] # Additional MCP servers go here
├── package.json          # Root package.json (private)
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── README.md             # This file
```

## 📄 License

MIT © Kody Dennon

All packages in this monorepo are licensed under the MIT License.

## 🔗 Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Changesets Documentation](https://github.com/changesets/changesets)

---

**Note:** This monorepo uses pnpm. If you're using npm or yarn, please install pnpm first: `npm install -g pnpm`
