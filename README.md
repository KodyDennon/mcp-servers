# 🚀 MCP Servers Monorepo

<div align="center">

![MCP Servers](https://img.shields.io/badge/MCP-Servers-blue?style=for-the-badge&logo=server&logoColor=white)

**Production-Ready Integrations for the Model Context Protocol**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=flat-square)](https://pnpm.io/)
[![Tests](https://img.shields.io/badge/tests-121%20passing-brightgreen.svg?style=flat-square)](https://github.com/KodyDennon/mcp-servers)

</div>

---

## 🌟 Overview

This repository houses a collection of professional, battle-tested **Model Context Protocol (MCP)** servers. These servers act as bridges, allowing AI agents (like Claude, Cursor, or custom LLMs) to safely interact with external tools and data.

## 📦 Available Servers

### 🗄️ [Supabase DB Server](./packages/supabase-db)

**The ultimate database tool for AI agents.**

- **Dual Mode**: Simple tools for quick tasks, or sandboxed code execution for complex analysis.
- **Smart**: Built-in caching, PII protection, and RAG capabilities.
- **Fast**: 98% token reduction for large datasets.

### 📱 [iOS Simulator Server](./packages/ios-simulator)

**Control your iPhone Simulator with AI.**

- **Automate**: Boot simulators, install apps, and navigate UI.
- **Test**: Inspect UI hierarchies and run automated tests.
- **Debug**: Access WebKit inspector and logs.

---

## ⚡ Getting Started

### One-Command Setup

Get everything running in seconds with our setup script:

```bash
# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/KodyDennon/mcp-servers/main/setup.sh | bash
```

This will:

1. ✅ Check your environment
2. ✅ Install all dependencies
3. ✅ Build all servers
4. ✅ Run tests to ensure stability

### Manual Setup

If you prefer to do it yourself:

```bash
git clone https://github.com/KodyDennon/mcp-servers.git
cd mcp-servers
npm install -g pnpm
pnpm install
pnpm build
```

---

## 🛠️ For Developers

This monorepo is built with **pnpm workspaces** and **Changesets** for professional package management.

### Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Create a new version/release
pnpm changeset
```

### Adding a New Server

We welcome new additions! To create a new server:

1. Create a directory in `packages/`
2. Add a `package.json`
3. Implement your MCP server
4. Submit a PR!

---

## 📄 License

MIT © Kody Dennon
