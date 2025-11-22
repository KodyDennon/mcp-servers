import { DynamicRulesEngine } from "./rules-engine.js";
import { UnifiedOrder } from "../types.js";
import { FedExPlugin } from "../plugins/fedex.js";
import { ShopifyPlugin } from "../plugins/shopify.js";

export class ReturnsOrchestrator {
  private rulesEngine: DynamicRulesEngine;
  private fedex: FedExPlugin;
  private shopify: ShopifyPlugin;

  constructor() {
    this.rulesEngine = new DynamicRulesEngine();
    this.fedex = new FedExPlugin();
    this.shopify = new ShopifyPlugin();
  }

  async checkEligibility(orderId: string, reason?: string) {
    // Fetch order from marketplace
    const order = await this.shopify.getOrder(orderId);
    if (!order) {
      return {
        eligible: false,
        reason: "Order not found",
      };
    }

    // Check time window (e.g., 30 days)
    const orderDate = new Date(order.createdAt);
    const daysSinceOrder =
      (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceOrder > 30) {
      return {
        eligible: false,
        reason: "Return window has expired (30 days)",
      };
    }

    // Evaluate rules
    const evaluation = this.rulesEngine.evaluate({
      order,
      reason,
    });

    return {
      eligible: evaluation.decision !== "reject",
      decision: evaluation.decision,
      explanation: evaluation.explanation,
      rule: evaluation.rule,
    };
  }

  async processReturn(orderId: string, reason?: string) {
    // Step 1: Check eligibility
    const eligibility = await this.checkEligibility(orderId, reason);
    if (!eligibility.eligible) {
      return {
        success: false,
        message: eligibility.reason || eligibility.explanation,
      };
    }

    const order = await this.shopify.getOrder(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const steps: any[] = [];

    // Step 2: Generate return shipping label
    try {
      const label = await this.fedex.createLabel(order);
      steps.push({
        step: "label",
        success: true,
        data: label,
      });
    } catch (error) {
      steps.push({
        step: "label",
        success: false,
        error: (error as Error).message,
      });
    }

    // Step 3: Draft refund (simulated)
    steps.push({
      step: "refund",
      success: true,
      data: {
        amount: order.totalPrice,
        currency: order.currency,
        status: "pending",
        message: "Refund will be processed upon item receipt",
      },
    });

    // Step 4: Update inventory (mark as incoming return)
    steps.push({
      step: "inventory",
      success: true,
      data: {
        status: "incoming_return",
        message: "Inventory will be restocked upon inspection",
      },
    });

    return {
      success: true,
      decision: eligibility.decision,
      steps,
      message: "Return processed successfully",
    };
  }

  getRules() {
    return this.rulesEngine.getRules();
  }

  addRule(rule: any) {
    return this.rulesEngine.addRule(rule);
  }
}
