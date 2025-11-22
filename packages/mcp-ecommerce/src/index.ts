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

import { ShopifyPlugin } from "./plugins/shopify.js";
import { AmazonPlugin } from "./plugins/amazon.js";
import { FedExPlugin } from "./plugins/fedex.js";
import { QuickBooksPlugin } from "./plugins/quickbooks.js";

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
