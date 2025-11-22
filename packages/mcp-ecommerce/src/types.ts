import { z } from "zod";

// Unified Product Schema
export const UnifiedProductSchema = z.object({
  id: z.string(),
  source: z.enum(["shopify", "amazon", "etsy", "woo", "walmart", "tiktok"]),
  title: z.string(),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number(),
  currency: z.string(),
  inventory: z.number().optional(),
  images: z.array(z.string()).optional(),
  url: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type UnifiedProduct = z.infer<typeof UnifiedProductSchema>;

// Unified Order Schema
export const UnifiedOrderSchema = z.object({
  id: z.string(),
  source: z.enum(["shopify", "amazon", "etsy", "woo", "walmart", "tiktok"]),
  status: z.string(),
  createdAt: z.string(),
  customer: z
    .object({
      id: z.string().optional(),
      email: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  lineItems: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      quantity: z.number(),
      price: z.number(),
      sku: z.string().optional(),
    }),
  ),
  totalPrice: z.number(),
  currency: z.string(),
  shippingAddress: z
    .object({
      address1: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
});

export type UnifiedOrder = z.infer<typeof UnifiedOrderSchema>;

// Unified Shipment Schema (Logistics)
export const UnifiedShipmentSchema = z.object({
  id: z.string(),
  trackingNumber: z.string(),
  carrier: z.string(),
  status: z.enum(["pending", "shipped", "delivered", "exception"]),
  labelUrl: z.string().optional(),
  rate: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .optional(),
});

export type UnifiedShipment = z.infer<typeof UnifiedShipmentSchema>;

// Unified Invoice Schema (Accounting)
export const UnifiedInvoiceSchema = z.object({
  id: z.string(),
  orderId: z.string().optional(),
  customerName: z.string(),
  totalAmount: z.number(),
  currency: z.string(),
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  dueDate: z.string(),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      amount: z.number(),
    }),
  ),
});

export type UnifiedInvoice = z.infer<typeof UnifiedInvoiceSchema>;

// Plugin Interfaces
export interface BasePlugin {
  name: string;
  type: "marketplace" | "logistics" | "accounting";
  isEnabled(): boolean;
}

export interface MarketplacePlugin extends BasePlugin {
  type: "marketplace";
  getProducts(limit?: number): Promise<UnifiedProduct[]>;
  getProduct(id: string): Promise<UnifiedProduct | null>;
  getOrders(limit?: number): Promise<UnifiedOrder[]>;
  getOrder(id: string): Promise<UnifiedOrder | null>;
}

export interface LogisticsPlugin extends BasePlugin {
  type: "logistics";
  createLabel(order: UnifiedOrder): Promise<UnifiedShipment>;
  getRates(order: UnifiedOrder): Promise<any[]>;
  trackShipment(trackingNumber: string): Promise<string>;
}

export interface AccountingPlugin extends BasePlugin {
  type: "accounting";
  createInvoice(order: UnifiedOrder): Promise<UnifiedInvoice>;
  getInvoices(limit?: number): Promise<UnifiedInvoice[]>;
}

export type EcommercePlugin =
  | MarketplacePlugin
  | LogisticsPlugin
  | AccountingPlugin;
