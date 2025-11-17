# 🚀 MCP Servers Monorepo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)
[![Changesets](https://img.shields.io/badge/versioned%20with-changesets-blue)](https://github.com/changesets/changesets)
[![Tests](https://img.shields.io/badge/tests-121%20passing-brightgreen.svg)](https://github.com/KodyDennon/mcp-servers)

A collection of production-ready Model Context Protocol (MCP) servers for AI agent integrations. This professionally maintained monorepo uses pnpm workspaces and Changesets for intelligent versioning.

## ⚡ One-Command Setup

Get started in seconds:

```bash
# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/KodyDennon/mcp-servers/main/setup.sh | bash

# Or clone and run
git clone https://github.com/KodyDennon/mcp-servers.git
cd mcp-servers
./setup.sh          # macOS/Linux
# or
./setup.ps1         # Windows PowerShell
```

This will:

- ✅ Check prerequisites (Node.js >= 20.0.0, pnpm)
- ✅ Install all dependencies
- ✅ Build all packages
- ✅ Run 121 tests to verify everything works
- ✅ Show you next steps

## 📦 Packages

### 🗄️ [mcp-supabase-db](./packages/supabase-db) - v3.2.5

[![npm](https://img.shields.io/npm/v/mcp-supabase-db.svg)](https://www.npmjs.com/package/mcp-supabase-db)
[![116 tests passing](https://img.shields.io/badge/tests-116%20passing-brightgreen.svg)](./packages/supabase-db)

**Full-featured Supabase/PostgreSQL database access for AI agents**

- 🎯 **Dual Mode Operation**: Choose between 35+ direct tools or code execution mode
- 🚀 **98% Token Reduction**: Smart caching and streaming for large datasets
- 🔒 **Privacy-First**: Automatic PII protection and secure connections
- 🧠 **AI-Ready**: Built-in RAG tools, vector search, and semantic queries
- 📊 **13 Pre-Built Skills**: Analytics, data quality, reporting, and more
- ✅ **Production Ready**: 116 passing tests, extensive documentation

**Quick Install:**

```bash
npm install -g mcp-supabase-db
```

---

### 📱 [mcp-ios-simulator](./packages/ios-simulator) - v0.2.0

[![5 tests passing](https://img.shields.io/badge/tests-5%20passing-brightgreen.svg)](./packages/ios-simulator)

**DevTools-like automation for Xcode iPhone Simulator**

- 🎮 **Full Simulator Control**: Boot, shutdown, open URLs, capture screenshots
- 🔍 **WebKit Inspector**: Remote debugging and JavaScript evaluation
- 🤖 **Native Automation**: Tap, swipe, text entry via WebDriverAgent
- 📱 **App Management**: Install, uninstall, and launch iOS apps
- 🎯 **UI Testing**: Hierarchy inspection and element interaction
- 🍎 **macOS Only**: Requires Xcode and ios-webkit-debug-proxy

**Status:** Ready for beta testing (unpublished to npm)

---

👉 **Need end-user friendly docs?** Check the [GitHub Pages site](https://mcpservers.kodydennon.com) for installation and configuration walkthroughs.

## 🚀 Quick Start

### For End Users

Each package can be installed independently from npm:

```bash
# Install globally
npm install -g mcp-supabase-db

# Or use npx (no installation needed)
npx mcp-supabase-db

# Or install in your project
npm install mcp-supabase-db
```

**Platform-Specific Setup Guides:**

- 📖 [Claude Desktop/Code](./packages/supabase-db/examples/)
- 📖 [Cursor IDE](./packages/supabase-db/examples/)
- 📖 [VS Code (Cline/Roo)](./packages/supabase-db/examples/)
- 📖 [Windsurf IDE](./packages/supabase-db/examples/)
- 📖 [JetBrains IDEs](./packages/supabase-db/examples/)

### For Developers

Clone and set up the entire monorepo:

```bash
git clone https://github.com/KodyDennon/mcp-servers.git
cd mcp-servers
./setup.sh  # Installs, builds, and tests everything
```

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

## 🔧 Troubleshooting

### pnpm not found

```bash
npm install -g pnpm
```

### Node version too old

Upgrade to Node.js >= 20.0.0 from [nodejs.org](https://nodejs.org)

### Tests failing

```bash
# Clean install
rm -rf node_modules packages/*/node_modules
pnpm install
pnpm test
```

### Permission errors on macOS/Linux

```bash
chmod +x setup.sh
./setup.sh
```

### Build errors

```bash
# Build packages in order
pnpm build
```

For package-specific issues, check the individual README files:

- [Supabase DB Troubleshooting](./packages/supabase-db/README.md)
- [iOS Simulator Troubleshooting](./packages/ios-simulator/README.md)

## ✨ Why This Monorepo is Awesome

- 🧪 **Battle-Tested**: 121 passing tests across all packages
- 📚 **Extensively Documented**: Multiple guides, examples, and platform-specific configs
- 🔄 **Active Maintenance**: Regular updates, bug fixes, and new features
- 🎯 **Production-Ready**: Already published to npm and used in production
- 🏗️ **Professional Architecture**: Clean code, modular design, TypeScript support
- ⚡ **Developer-Friendly**: One-command setup, automated versioning, CI/CD ready
- 🌍 **Cross-Platform**: Works on macOS, Linux, and Windows
- 🔒 **Secure**: Built-in security features, environment validation, error handling
- 📦 **Monorepo Best Practices**: pnpm workspaces, changesets, lint-staged, husky
- 🚀 **Performance-Focused**: Smart caching, streaming, optimized queries

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
