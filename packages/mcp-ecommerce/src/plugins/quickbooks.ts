import { AccountingPlugin, UnifiedInvoice, UnifiedOrder } from "../types.js";

export class QuickBooksPlugin implements AccountingPlugin {
  name = "quickbooks";
  type = "accounting" as const;
  private clientId: string;
  private clientSecret: string;
  private realmId: string; // Company ID

  constructor() {
    this.clientId = process.env.QUICKBOOKS_CLIENT_ID || "";
    this.clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || "";
    this.realmId = process.env.QUICKBOOKS_REALM_ID || "";
  }

  isEnabled(): boolean {
    return !!(this.clientId && this.clientSecret && this.realmId);
  }

  private async authenticate() {
    if (!this.isEnabled()) {
      throw new Error("QuickBooks credentials missing");
    }
    // Simulate OAuth2 token refresh
    return "mock_access_token";
  }

  async createInvoice(order: UnifiedOrder): Promise<UnifiedInvoice> {
    await this.authenticate();

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Map UnifiedOrder to Invoice
    return {
      id: `inv_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      customerName: order.customer?.name || "Guest Customer",
      totalAmount: order.totalPrice,
      currency: order.currency,
      status: "draft",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Net 30
      lineItems: order.lineItems.map((item) => ({
        description: item.title,
        quantity: item.quantity,
        amount: item.price * item.quantity,
      })),
    };
  }

  async getInvoices(limit: number = 10): Promise<UnifiedInvoice[]> {
    await this.authenticate();

    // Return mock invoices
    return Array.from({ length: limit }).map((_, i) => ({
      id: `inv_mock_${i}`,
      customerName: `Customer ${i + 1}`,
      totalAmount: 150.0 + i * 10,
      currency: "USD",
      status: i % 2 === 0 ? "paid" : "sent",
      dueDate: new Date().toISOString(),
      lineItems: [
        { description: "Service A", quantity: 1, amount: 100 },
        { description: "Product B", quantity: 2, amount: 50 + i * 5 },
      ],
    }));
  }
}
