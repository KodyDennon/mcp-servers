import { UnifiedOrder } from "../types.js";

interface CustomerMetrics {
  customerId: string;
  recency: number; // Days since last purchase
  frequency: number; // Number of purchases
  monetary: number; // Total spend
  rfmScore: number; // Combined score
  segment: "Whale" | "Loyal" | "At Risk" | "New" | "Lost";
}

export class RFMAnalyzer {
  private customers: Map<string, CustomerMetrics> = new Map();

  analyzeOrders(orders: UnifiedOrder[]) {
    const customerOrders = new Map<string, UnifiedOrder[]>();

    // Group orders by customer
    for (const order of orders) {
      const customerId =
        order.customer?.id || order.customer?.email || "unknown";
      if (!customerOrders.has(customerId)) {
        customerOrders.set(customerId, []);
      }
      customerOrders.get(customerId)!.push(order);
    }

    // Calculate RFM for each customer
    const now = Date.now();

    for (const [customerId, custOrders] of customerOrders.entries()) {
      const sortedOrders = custOrders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Recency: days since last order
      const lastOrderDate = new Date(sortedOrders[0].createdAt).getTime();
      const recency = Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24));

      // Frequency: number of orders
      const frequency = custOrders.length;

      // Monetary: total spend
      const monetary = custOrders.reduce((sum, o) => sum + o.totalPrice, 0);

      // Calculate RFM score (1-5 for each dimension)
      const rScore = this.scoreRecency(recency);
      const fScore = this.scoreFrequency(frequency);
      const mScore = this.scoreMonetary(monetary);

      const rfmScore = (rScore + fScore + mScore) / 3;

      // Segment based on RFM
      const segment = this.determineSegment(rScore, fScore, mScore);

      this.customers.set(customerId, {
        customerId,
        recency,
        frequency,
        monetary,
        rfmScore,
        segment,
      });
    }
  }

  private scoreRecency(days: number): number {
    if (days <= 30) return 5;
    if (days <= 60) return 4;
    if (days <= 90) return 3;
    if (days <= 180) return 2;
    return 1;
  }

  private scoreFrequency(orders: number): number {
    if (orders >= 10) return 5;
    if (orders >= 5) return 4;
    if (orders >= 3) return 3;
    if (orders >= 2) return 2;
    return 1;
  }

  private scoreMonetary(spend: number): number {
    if (spend >= 1000) return 5;
    if (spend >= 500) return 4;
    if (spend >= 250) return 3;
    if (spend >= 100) return 2;
    return 1;
  }

  private determineSegment(
    r: number,
    f: number,
    m: number,
  ): CustomerMetrics["segment"] {
    const avg = (r + f + m) / 3;

    // Whales: High value across all dimensions
    if (r >= 4 && f >= 4 && m >= 4) return "Whale";

    // Loyal: Frequent purchasers, even if not recent
    if (f >= 4 && m >= 3) return "Loyal";

    // At Risk: High value but haven't purchased recently
    if (r <= 2 && (f >= 3 || m >= 3)) return "At Risk";

    // New: Recent first-time purchasers
    if (r >= 4 && f === 1) return "New";

    // Lost: Low across all dimensions
    if (avg <= 2) return "Lost";

    return "Loyal"; // Default
  }

  getSegments() {
    const segments: Record<string, CustomerMetrics[]> = {
      Whale: [],
      Loyal: [],
      "At Risk": [],
      New: [],
      Lost: [],
    };

    for (const metrics of this.customers.values()) {
      segments[metrics.segment].push(metrics);
    }

    // Sort each segment by RFM score
    for (const segment in segments) {
      segments[segment].sort((a, b) => b.rfmScore - a.rfmScore);
    }

    return segments;
  }

  getCustomerMetrics(customerId: string): CustomerMetrics | null {
    return this.customers.get(customerId) || null;
  }

  getTopCustomers(limit: number = 10): CustomerMetrics[] {
    return Array.from(this.customers.values())
      .sort((a, b) => b.monetary - a.monetary)
      .slice(0, limit);
  }
}
