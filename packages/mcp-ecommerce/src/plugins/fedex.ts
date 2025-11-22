import { LogisticsPlugin, UnifiedOrder, UnifiedShipment } from "../types.js";

export class FedExPlugin implements LogisticsPlugin {
  name = "fedex";
  type = "logistics" as const;

  isEnabled(): boolean {
    return !!process.env.FEDEX_API_KEY;
  }

  async createLabel(order: UnifiedOrder): Promise<UnifiedShipment> {
    // TODO: Implement FedEx Ship API
    throw new Error("Not implemented");
  }

  async getRates(order: UnifiedOrder): Promise<any[]> {
    return [];
  }

  async trackShipment(trackingNumber: string): Promise<string> {
    return "pending";
  }
}
