# E-commerce MCP Server

> **Production-ready, intelligent MCP server for e-commerce operations**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

### Dual-Mode Architecture

- **Direct Tool Mode**: Traditional MCP tools for simple, single-step operations
- **Code Execution Mode**: Write TypeScript to execute in a persistent sandbox for complex workflows (90%+ token savings)

### Platform Integrations

- **Shopify**: Products, Orders (Real API implementation)
- **Amazon**: SP-API simulation with realistic data
- **FedEx**: Label generation, Rate quotes, Tracking
- **QuickBooks**: Invoice creation and retrieval

### Intelligent Modules (Algorithmic - No External AI)

- **Smart Returns**: Dynamic rules engine with JSON persistence
- **Inventory Forecasting**: Linear regression for stock-out predictions
- **Customer Segmentation**: RFM analysis (Whale, Loyal, At Risk, New, Lost)

## 📦 Installation

```bash
cd packages/mcp-ecommerce
pnpm install
```

**That's it!** Dependencies installed. ✅

## ⚙️ Setup (2 Minutes)

### Option 1: Interactive Wizard (Easiest!)

```bash
pnpm setup
```

This one command will:

1. ✅ Build the project
2. ✅ Launch a beautiful interactive wizard
3. ✅ Guide you through each platform
4. ✅ Validate Shopify credentials in real-time
5. ✅ Save everything to `.env`

**Works on**: Windows, macOS, Linux - all tested!

### Option 2: Manual `.env` File

Create `.env` in the package directory:

```env
SHOPIFY_SHOP_URL=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
```

Then build:

```bash
pnpm build
```

### Start the Server

```bash
pnpm start
```

Done! The MCP server is now running. 🚀

## 🛠️ Available Tools

### Marketplace (4 tools)

- `list_products` - List products from all enabled marketplaces
- `get_orders` - Get orders from all enabled marketplaces
- `create_shipping_label` - Generate shipping labels
- `create_invoice` - Create invoices for orders

### Code Execution (1 tool)

- `execute_code` - Run TypeScript with access to all plugins

**Example**:

```typescript
const highValueOrders = await shopify.getOrders(100);
const filtered = highValueOrders.filter((o) => o.totalPrice > 500);
fs.writeFile("high_value_customers.json", JSON.stringify(filtered));
return filtered.length;
```

### Smart Returns (3 tools)

- `add_return_rule` - Add dynamic return policy rules
- `check_return_eligibility` - Auto-approve/reject returns
- `process_return` - Complete orchestration (Label + Refund + Inventory)

### Inventory Intelligence (2 tools)

- `get_inventory_forecast` - Forecast stock levels using linear regression
- `get_inventory_alerts` - Get at-risk SKUs

### Customer Intelligence (2 tools)

- `analyze_customers` - Run RFM analysis on orders
- `get_customer_segments` - Get segmented customer lists

**Total: 12 Tools**

## 🏗️ Architecture

```
mcp-ecommerce/
├── src/
│   ├── index.ts              # Main server & tool handlers
│   ├── types.ts              # Unified schemas & interfaces
│   ├── config-manager.ts     # Environment config management
│   ├── plugins/              # Platform integrations
│   │   ├── shopify.ts
│   │   ├── amazon.ts
│   │   ├── fedex.ts
│   │   └── quickbooks.ts
│   ├── code-execution/       # Sandbox & execution engine
│   │   ├── sandbox.ts
│   │   └── manager.ts
│   └── intelligence/         # Algorithmic intelligence
│       ├── rules-engine.ts
│       ├── returns-orchestrator.ts
│       ├── inventory-forecaster.ts
│       └── rfm-analyzer.ts
├── bin/
│   └── setup.ts             # Interactive CLI wizard
├── .data/                   # Persistent workspace (git-ignored)
│   └── return_rules.json    # Dynamic return policies
└── package.json
```

## 🧪 Example Workflows

### 1. Smart Return Processing

```bash
# Check if order is eligible for return
mcp-tool check_return_eligibility --orderId="12345" --reason="damaged"

# Process complete return workflow
mcp-tool process_return --orderId="12345" --reason="damaged"
```

### 2. Inventory Forecasting

```bash
# Get forecast for specific SKU
mcp-tool get_inventory_forecast --sku="PROD-001" --daysAhead=14

# Get all at-risk products
mcp-tool get_inventory_alerts --threshold=7
```

### 3. Customer Segmentation

```bash
# Analyze all customers
mcp-tool analyze_customers

# Get segmented lists
mcp-tool get_customer_segments
```

### 4. Complex Code Execution

```typescript
// Find customers who bought high-value items but haven't returned
const orders = await shopify.getOrders(1000);
const customers = {};

for (const order of orders) {
  if (order.totalPrice > 200) {
    const id = order.customer.id;
    if (!customers[id]) {
      customers[id] = { orders: 0, total: 0 };
    }
    customers[id].orders++;
    customers[id].total += order.totalPrice;
  }
}

fs.writeFile("high_value_customers.json", JSON.stringify(customers));
return Object.keys(customers).length;
```

## 📊 Token Efficiency

Traditional approach (fetching 100 orders):

- Request: ~500 tokens
- Response: ~15,000 tokens (full order data)
- **Total: ~15,500 tokens**

Code execution approach:

- Request: ~800 tokens (including code)
- Response: ~50 tokens (just the count)
- **Total: ~850 tokens**

**Savings: 94.5%** 🎉

## 🔒 Security

- Persistent sandbox with restricted file system access (`.data/` only)
- No external AI API dependencies
- Environment variable-based credential management
- Input validation on all tools

## 🧩 Extending

### Adding a New Plugin

1. Implement the appropriate interface (`MarketplacePlugin`, `LogisticsPlugin`, `AccountingPlugin`)
2. Add to plugin registry in `src/index.ts`
3. Add setup prompts in `bin/setup.ts`

### Adding Intelligence Modules

All intelligence is algorithmic - no external AI required:

- Use TypeScript/JavaScript for logic
- Persist data in `.data/` directory
- Expose via MCP tools

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! This is a production-ready foundation that can be extended with:

- Additional marketplaces (Etsy, Walmart, TikTok Shop)
- More logistics providers (UPS, DHL, USPS)
- Advanced analytics modules
- Real-time inventory sync

---

**Built with ❤️ using the Model Context Protocol**
