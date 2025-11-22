# Quick Start Guide

Get up and running in 2 minutes! 🚀

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)

## Installation

```bash
# Navigate to the package
cd packages/mcp-ecommerce

# Install dependencies
pnpm install
```

## Setup

### Option 1: Interactive Wizard (Recommended)

```bash
pnpm setup
```

This will:

1. Build the project
2. Launch an interactive wizard
3. Guide you through connecting platforms
4. Validate credentials (for Shopify)
5. Save everything to `.env`

### Option 2: Manual .env File

Create `.env` in the package root:

```env
# Shopify (Required for testing)
SHOPIFY_SHOP_URL=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx

# Optional platforms
AMAZON_SELLER_ID=xxxxx
AMAZON_ACCESS_KEY_ID=xxxxx
AMAZON_SECRET_ACCESS_KEY=xxxxx
AMAZON_REGION=us-east-1

FEDEX_API_KEY=xxxxx
FEDEX_SECRET_KEY=xxxxx
FEDEX_ACCOUNT_NUMBER=xxxxx

QUICKBOOKS_CLIENT_ID=xxxxx
QUICKBOOKS_CLIENT_SECRET=xxxxx
QUICKBOOKS_REALM_ID=xxxxx
```

Then build:

```bash
pnpm build
```

## Running

```bash
# Start the MCP server
pnpm start
```

The server will run on stdio and wait for MCP client connections.

## Platform-Specific Setup

### Windows

```powershell
# Use PowerShell or Command Prompt
cd packages\mcp-ecommerce
pnpm install
pnpm setup
```

### macOS/Linux

```bash
cd packages/mcp-ecommerce
pnpm install
pnpm setup
```

## Troubleshooting

### "Cannot find module" errors

```bash
pnpm rebuild
```

### Permission issues (macOS/Linux)

```bash
chmod +x bin/setup.ts
```

### Windows line ending issues

```bash
git config core.autocrlf true
```

## What's Next?

See the main [README.md](./README.md) for:

- Tool documentation
- Usage examples
- Architecture overview
- Advanced features

## Getting Credentials

### Shopify

1. Go to Settings > Apps and sales channels
2. Click "Develop apps"
3. Create a new app
4. Configure Admin API scopes (read_products, read_orders)
5. Install app and copy access token

### Amazon

1. Register for Amazon SP-API in Seller Central
2. Create IAM credentials in AWS
3. Note your Seller ID from Seller Central

### FedEx

1. Sign up at [FedEx Developer Center](https://developer.fedex.com/)
2. Create a project
3. Get API credentials

### QuickBooks

1. Create app at [QuickBooks Developer](https://developer.intuit.com/)
2. Get OAuth 2.0 credentials
3. Note your Company ID (Realm ID)

---

Need help? Check the [main README](./README.md) or open an issue!
