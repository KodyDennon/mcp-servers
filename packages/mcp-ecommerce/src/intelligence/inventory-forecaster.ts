import { UnifiedProduct } from "../types.js";

interface InventorySnapshot {
  sku: string;
  quantity: number;
  timestamp: number;
}

interface ForecastResult {
  sku: string;
  currentStock: number;
  forecastedStock: number;
  daysUntilStockout: number;
  trend: "increasing" | "decreasing" | "stable";
  confidence: number;
}

export class InventoryForecaster {
  private snapshots: Map<string, InventorySnapshot[]> = new Map();

  recordSnapshot(sku: string, quantity: number) {
    if (!this.snapshots.has(sku)) {
      this.snapshots.set(sku, []);
    }

    const history = this.snapshots.get(sku)!;
    history.push({
      sku,
      quantity,
      timestamp: Date.now(),
    });

    // Keep only last 30 days of data
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.snapshots.set(
      sku,
      history.filter((s) => s.timestamp > thirtyDaysAgo),
    );
  }

  forecast(sku: string, daysAhead: number = 7): ForecastResult | null {
    const history = this.snapshots.get(sku);
    if (!history || history.length < 3) {
      return null; // Need at least 3 data points
    }

    // Sort by timestamp
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate linear regression
    const n = sorted.length;
    const xValues = sorted.map((_, i) => i);
    const yValues = sorted.map((s) => s.quantity);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Project forward
    const currentStock = sorted[sorted.length - 1].quantity;
    const forecastedStock = slope * (n + daysAhead) + intercept;

    // Calculate days until stockout
    let daysUntilStockout = Infinity;
    if (slope < 0) {
      daysUntilStockout = Math.max(0, -intercept / slope - n);
    }

    // Determine trend
    let trend: "increasing" | "decreasing" | "stable";
    if (Math.abs(slope) < 0.5) {
      trend = "stable";
    } else if (slope > 0) {
      trend = "increasing";
    } else {
      trend = "decreasing";
    }

    // Calculate confidence (R-squared)
    const meanY = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
    const ssResidual = yValues.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const confidence = Math.max(0, Math.min(1, 1 - ssResidual / ssTotal));

    return {
      sku,
      currentStock,
      forecastedStock: Math.max(0, Math.round(forecastedStock)),
      daysUntilStockout: Math.round(daysUntilStockout),
      trend,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  getAlerts(threshold: number = 10): ForecastResult[] {
    const alerts: ForecastResult[] = [];

    for (const sku of this.snapshots.keys()) {
      const forecast = this.forecast(sku, 7);
      if (forecast && forecast.daysUntilStockout < threshold) {
        alerts.push(forecast);
      }
    }

    return alerts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  }
}
