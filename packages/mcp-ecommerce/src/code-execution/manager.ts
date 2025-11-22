import { Sandbox } from "./sandbox.js";
import { ShopifyPlugin } from "../plugins/shopify.js";
import { AmazonPlugin } from "../plugins/amazon.js";
import { FedExPlugin } from "../plugins/fedex.js";
import { QuickBooksPlugin } from "../plugins/quickbooks.js";

export class CodeExecutionManager {
  private sandbox: Sandbox;

  constructor() {
    // Initialize plugins
    const shopify = new ShopifyPlugin();
    const amazon = new AmazonPlugin();
    const fedex = new FedExPlugin();
    const quickbooks = new QuickBooksPlugin();

    // Create sandbox with exposed plugins
    this.sandbox = new Sandbox({
      shopify: {
        getOrders: shopify.getOrders.bind(shopify),
        getProducts: shopify.getProducts.bind(shopify),
        getProduct: shopify.getProduct.bind(shopify),
      },
      amazon: {
        getOrders: amazon.getOrders.bind(amazon),
        getProducts: amazon.getProducts.bind(amazon),
        getProduct: amazon.getProduct.bind(amazon),
      },
      fedex: {
        createLabel: fedex.createLabel.bind(fedex),
        getRates: fedex.getRates.bind(fedex),
        trackShipment: fedex.trackShipment.bind(fedex),
      },
      quickbooks: {
        createInvoice: quickbooks.createInvoice.bind(quickbooks),
        getInvoices: quickbooks.getInvoices.bind(quickbooks),
      },
    });
  }

  async executeCode(code: string) {
    console.log("Executing code in sandbox...");
    return await this.sandbox.execute(code);
  }
}
