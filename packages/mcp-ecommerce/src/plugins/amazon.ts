import { MarketplacePlugin, UnifiedOrder, UnifiedProduct } from "../types.js";

export class AmazonPlugin implements MarketplacePlugin {
  name = "amazon";
  type = "marketplace" as const;

  isEnabled(): boolean {
    return !!process.env.AMAZON_SP_API_KEY;
  }

  async getProducts(limit: number = 10): Promise<UnifiedProduct[]> {
    // TODO: Implement SP-API call
    return [];
  }

  async getProduct(id: string): Promise<UnifiedProduct | null> {
    return null;
  }

  async getOrders(limit: number = 10): Promise<UnifiedOrder[]> {
    // TODO: Implement SP-API call
    return [];
  }

  async getOrder(id: string): Promise<UnifiedOrder | null> {
    return null;
  }
}
