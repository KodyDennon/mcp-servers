import { AccountingPlugin, UnifiedInvoice, UnifiedOrder } from "../types.js";

export class QuickBooksPlugin implements AccountingPlugin {
  name = "quickbooks";
  type = "accounting" as const;

  isEnabled(): boolean {
    return !!process.env.QUICKBOOKS_CLIENT_ID;
  }

  async createInvoice(order: UnifiedOrder): Promise<UnifiedInvoice> {
    // TODO: Implement QuickBooks Online API
    throw new Error("Not implemented");
  }

  async getInvoices(limit: number = 10): Promise<UnifiedInvoice[]> {
    return [];
  }
}
