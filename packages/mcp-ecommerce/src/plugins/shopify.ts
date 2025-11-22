import { MarketplacePlugin, UnifiedOrder, UnifiedProduct } from "../types.js";

export class ShopifyPlugin implements MarketplacePlugin {
  name = "shopify";
  type = "marketplace" as const;
  private shopUrl: string;
  private accessToken: string;

  constructor() {
    this.shopUrl = process.env.SHOPIFY_SHOP_URL || "";
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN || "";
  }

  isEnabled(): boolean {
    return !!(this.shopUrl && this.accessToken);
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `https://${this.shopUrl}/admin/api/2024-01/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getProducts(limit: number = 10): Promise<UnifiedProduct[]> {
    const data = await this.fetch(`products.json?limit=${limit}`);

    return data.products.map((p: any) => ({
      id: p.id.toString(),
      source: "shopify",
      title: p.title,
      description: p.body_html,
      sku: p.variants[0]?.sku,
      price: parseFloat(p.variants[0]?.price || "0"),
      currency: "USD", // Defaulting for now, should check shop settings
      inventory: p.variants[0]?.inventory_quantity,
      images: p.images.map((img: any) => img.src),
      url: `https://${this.shopUrl}/products/${p.handle}`,
      metadata: {
        vendor: p.vendor,
        type: p.product_type,
      },
    }));
  }

  async getProduct(id: string): Promise<UnifiedProduct | null> {
    try {
      const data = await this.fetch(`products/${id}.json`);
      const p = data.product;

      return {
        id: p.id.toString(),
        source: "shopify",
        title: p.title,
        description: p.body_html,
        sku: p.variants[0]?.sku,
        price: parseFloat(p.variants[0]?.price || "0"),
        currency: "USD",
        inventory: p.variants[0]?.inventory_quantity,
        images: p.images.map((img: any) => img.src),
        url: `https://${this.shopUrl}/products/${p.handle}`,
      };
    } catch (error) {
      return null;
    }
  }

  async getOrders(limit: number = 10): Promise<UnifiedOrder[]> {
    const data = await this.fetch(`orders.json?limit=${limit}&status=any`);

    return data.orders.map((o: any) => ({
      id: o.id.toString(),
      source: "shopify",
      status: o.financial_status, // or fulfillment_status
      createdAt: o.created_at,
      customer: {
        id: o.customer?.id.toString(),
        email: o.email,
        name: `${o.customer?.first_name} ${o.customer?.last_name}`,
      },
      lineItems: o.line_items.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        sku: item.sku,
      })),
      totalPrice: parseFloat(o.total_price),
      currency: o.currency,
      shippingAddress: {
        address1: o.shipping_address?.address1,
        city: o.shipping_address?.city,
        country: o.shipping_address?.country,
        zip: o.shipping_address?.zip,
      },
    }));
  }

  async getOrder(id: string): Promise<UnifiedOrder | null> {
    try {
      const data = await this.fetch(`orders/${id}.json`);
      const o = data.order;

      return {
        id: o.id.toString(),
        source: "shopify",
        status: o.financial_status,
        createdAt: o.created_at,
        customer: {
          id: o.customer?.id.toString(),
          email: o.email,
          name: `${o.customer?.first_name} ${o.customer?.last_name}`,
        },
        lineItems: o.line_items.map((item: any) => ({
          id: item.id.toString(),
          title: item.title,
          quantity: item.quantity,
          price: parseFloat(item.price),
          sku: item.sku,
        })),
        totalPrice: parseFloat(o.total_price),
        currency: o.currency,
        shippingAddress: {
          address1: o.shipping_address?.address1,
          city: o.shipping_address?.city,
          country: o.shipping_address?.country,
          zip: o.shipping_address?.zip,
        },
      };
    } catch (error) {
      return null;
    }
  }
}
