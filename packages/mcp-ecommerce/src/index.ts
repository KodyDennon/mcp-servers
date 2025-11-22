#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { EcommercePlugin } from "./types.js";
import { ConfigManager } from "./config-manager.js";

import { ShopifyPlugin } from "./plugins/shopify.js";
import { AmazonPlugin } from "./plugins/amazon.js";
import { FedExPlugin } from "./plugins/fedex.js";
import { QuickBooksPlugin } from "./plugins/quickbooks.js";
import { CodeExecutionManager } from "./code-execution/manager.js";
import { ReturnsOrchestrator } from "./intelligence/returns-orchestrator.js";
import { InventoryForecaster } from "./intelligence/inventory-forecaster.js";
import { RFMAnalyzer } from "./intelligence/rfm-analyzer.js";

// Plugin Registry
const plugins: EcommercePlugin[] = [
  new ShopifyPlugin(),
  new AmazonPlugin(),
  new FedExPlugin(),
  new QuickBooksPlugin(),
];

const server = new Server(
  {
    name: "mcp-ecommerce",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

const config = new ConfigManager();
const codeManager = new CodeExecutionManager();
const returnsOrchestrator = new ReturnsOrchestrator();
const inventoryForecaster = new InventoryForecaster();
const rfmAnalyzer = new RFMAnalyzer();

// Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Marketplace Tools
      {
        name: "list_products",
        description: "List products from all enabled marketplaces",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Max number of products" },
            source: { type: "string", description: "Filter by source" },
          },
        },
      },
      {
        name: "get_orders",
        description: "Get orders from all enabled marketplaces",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Max number of orders" },
            source: { type: "string", description: "Filter by source" },
          },
        },
      },
      {
        name: "execute_code",
        description:
          "Execute a TypeScript script to interact with all plugins efficiently. Use this for complex logic, filtering, or multi-step workflows. Available globals: shopify, amazon, fedex, quickbooks, fs (read/write to .data/).",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The TypeScript code to execute",
            },
          },
          required: ["code"],
        },
      },
      // Logistics Tools
      {
        name: "create_shipping_label",
        description: "Create a shipping label for an order",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "string", description: "ID of the order" },
            carrier: {
              type: "string",
              description: "Carrier name (fedex, ups)",
            },
          },
          required: ["orderId", "carrier"],
        },
      },
      // Accounting Tools
      {
        name: "create_invoice",
        description: "Create an invoice for an order",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "string", description: "ID of the order" },
            platform: {
              type: "string",
              description: "Accounting platform (quickbooks, odoo)",
            },
          },
          required: ["orderId", "platform"],
        },
      },
      // Returns Tools
      {
        name: "add_return_rule",
        description:
          "Add a new return policy rule that will be evaluated for future returns",
        inputSchema: {
          type: "object",
          properties: {
            condition: {
              type: "string",
              description:
                "JavaScript condition (e.g., 'order.totalPrice < 50')",
            },
            action: {
              type: "string",
              enum: ["approve", "reject", "review"],
              description: "Action to take",
            },
            priority: {
              type: "number",
              description: "Rule priority (lower = higher priority)",
            },
            description: {
              type: "string",
              description: "Description of the rule",
            },
          },
          required: ["condition", "action", "priority"],
        },
      },
      {
        name: "check_return_eligibility",
        description:
          "Check if an order is eligible for return and what action should be taken",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "string", description: "Order ID" },
            reason: {
              type: "string",
              description: "Reason for return (optional)",
            },
          },
          required: ["orderId"],
        },
      },
      {
        name: "process_return",
        description:
          "Process a complete return workflow: check eligibility, create label, draft refund, update inventory",
        inputSchema: {
          type: "object",
          properties: {
            orderId: { type: "string", description: "Order ID" },
            reason: {
              type: "string",
              description: "Reason for return (optional)",
            },
          },
          required: ["orderId"],
        },
      },
      // Inventory Intelligence Tools
      {
        name: "get_inventory_forecast",
        description: "Get inventory forecast for a SKU using linear regression",
        inputSchema: {
          type: "object",
          properties: {
            sku: { type: "string", description: "Product SKU" },
            daysAhead: {
              type: "number",
              description: "Number of days to forecast (default: 7)",
            },
          },
          required: ["sku"],
        },
      },
      {
        name: "get_inventory_alerts",
        description: "Get alerts for SKUs at risk of stockout",
        inputSchema: {
          type: "object",
          properties: {
            threshold: {
              type: "number",
              description: "Days threshold for alert (default: 10)",
            },
          },
        },
      },
      // Customer Intelligence Tools
      {
        name: "analyze_customers",
        description: "Run RFM analysis on orders to segment customers",
        inputSchema: {
          type: "object",
          properties: {
            source: {
              type: "string",
              description: "Marketplace source (optional)",
            },
          },
        },
      },
      {
        name: "get_customer_segments",
        description:
          "Get customers grouped by segment (Whale, Loyal, At Risk, New, Lost)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // --- Marketplace Tools ---
  if (name === "list_products") {
    const limit = Number(args?.limit) || 10;
    const source = String(args?.source || "");

    const results = [];
    for (const plugin of plugins) {
      if (
        plugin.isEnabled() &&
        plugin.type === "marketplace" &&
        (!source || plugin.name === source)
      ) {
        try {
          // Cast to MarketplacePlugin safely
          const products = await (plugin as any).getProducts(limit);
          results.push(...products);
        } catch (error) {
          console.error(`Error fetching products from ${plugin.name}:`, error);
        }
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  if (name === "get_orders") {
    const limit = Number(args?.limit) || 10;
    const source = String(args?.source || "");

    const results = [];
    for (const plugin of plugins) {
      if (
        plugin.isEnabled() &&
        plugin.type === "marketplace" &&
        (!source || plugin.name === source)
      ) {
        try {
          const orders = await (plugin as any).getOrders(limit);
          results.push(...orders);
        } catch (error) {
          console.error(`Error fetching orders from ${plugin.name}:`, error);
        }
      }
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  // --- Code Execution Tool ---
  if (name === "execute_code") {
    const code = String(args?.code);
    try {
      const result = await codeManager.executeCode(code);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing code: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // --- Logistics Tools ---
  if (name === "create_shipping_label") {
    const orderId = String(args?.orderId);
    const carrier = String(args?.carrier);

    const plugin = plugins.find(
      (p) => p.name === carrier && p.type === "logistics",
    );
    if (!plugin || !plugin.isEnabled()) {
      throw new Error(`Carrier ${carrier} is not enabled or found`);
    }

    // In a real app, we'd fetch the order first. For now, we'll mock the order object or require it passed in.
    // This is a simplification for the scaffold.
    return {
      content: [
        {
          type: "text",
          text: `Label creation initiated for ${orderId} via ${carrier}`,
        },
      ],
    };
  }

  // --- Accounting Tools ---
  if (name === "create_invoice") {
    const orderId = String(args?.orderId);
    const platform = String(args?.platform);

    const plugin = plugins.find(
      (p) => p.name === platform && p.type === "accounting",
    );
    if (!plugin || !plugin.isEnabled()) {
      throw new Error(
        `Accounting platform ${platform} is not enabled or found`,
      );
    }

    return {
      content: [
        {
          type: "text",
          text: `Invoice creation initiated for ${orderId} via ${platform}`,
        },
      ],
    };
  }

  // --- Returns Tools ---
  if (name === "add_return_rule") {
    const condition = String(args?.condition);
    const action = String(args?.action) as "approve" | "reject" | "review";
    const priority = Number(args?.priority);
    const description = String(args?.description || "");

    const rule = returnsOrchestrator.addRule({
      condition,
      action,
      priority,
      description,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(rule, null, 2),
        },
      ],
    };
  }

  if (name === "check_return_eligibility") {
    const orderId = String(args?.orderId);
    const reason = String(args?.reason || "");

    const result = await returnsOrchestrator.checkEligibility(orderId, reason);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  if (name === "process_return") {
    const orderId = String(args?.orderId);
    const reason = String(args?.reason || "");

    const result = await returnsOrchestrator.processReturn(orderId, reason);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  // --- Inventory Intelligence Tools ---
  if (name === "get_inventory_forecast") {
    const sku = String(args?.sku);
    const daysAhead = Number(args?.daysAhead) || 7;

    const forecast = inventoryForecaster.forecast(sku, daysAhead);
    if (!forecast) {
      return {
        content: [
          {
            type: "text",
            text: "Not enough data to forecast. Need at least 3 historical snapshots.",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(forecast, null, 2),
        },
      ],
    };
  }

  if (name === "get_inventory_alerts") {
    const threshold = Number(args?.threshold) || 10;
    const alerts = inventoryForecaster.getAlerts(threshold);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(alerts, null, 2),
        },
      ],
    };
  }

  // --- Customer Intelligence Tools ---
  if (name === "analyze_customers") {
    const source = String(args?.source || "");

    // Fetch orders from marketplace(s)
    const orders = [];
    for (const plugin of plugins) {
      if (
        plugin.isEnabled() &&
        plugin.type === "marketplace" &&
        (!source || plugin.name === source)
      ) {
        try {
          const pluginOrders = await (plugin as any).getOrders(100);
          orders.push(...pluginOrders);
        } catch (error) {
          console.error(`Error fetching orders from ${plugin.name}:`, error);
        }
      }
    }

    rfmAnalyzer.analyzeOrders(orders);

    return {
      content: [
        {
          type: "text",
          text: `Analyzed ${orders.length} orders. Use get_customer_segments to view results.`,
        },
      ],
    };
  }

  if (name === "get_customer_segments") {
    const segments = rfmAnalyzer.getSegments();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(segments, null, 2),
        },
      ],
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "ecommerce://unified/dashboard",
        name: "E-commerce Dashboard",
        description: "Aggregated statistics from all connected platforms",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "ecommerce://unified/dashboard") {
    const stats = {
      connected_platforms: plugins
        .filter((p) => p.isEnabled())
        .map((p) => p.name),
      total_plugins: plugins.length,
      status: "active",
    };
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }
  throw new Error(`Resource not found: ${request.params.uri}`);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("E-commerce MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
