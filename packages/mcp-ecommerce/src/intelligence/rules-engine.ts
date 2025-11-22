import fs from "fs";
import path from "path";

export interface ReturnRule {
  id: string;
  condition: string; // JavaScript expression (e.g., "order.totalPrice < 50")
  action: "approve" | "reject" | "review";
  priority: number; // Lower number = higher priority
  description?: string;
}

export class DynamicRulesEngine {
  private rulesFile: string;
  private rules: ReturnRule[] = [];

  constructor() {
    this.rulesFile = path.join(process.cwd(), ".data", "return_rules.json");
    this.ensureDataDir();
    this.loadRules();
  }

  private ensureDataDir() {
    const dataDir = path.dirname(this.rulesFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.rulesFile)) {
      this.saveRules();
    }
  }

  private loadRules() {
    try {
      const data = fs.readFileSync(this.rulesFile, "utf-8");
      this.rules = JSON.parse(data);
    } catch (error) {
      this.rules = this.getDefaultRules();
      this.saveRules();
    }
  }

  private saveRules() {
    fs.writeFileSync(this.rulesFile, JSON.stringify(this.rules, null, 2));
  }

  private getDefaultRules(): ReturnRule[] {
    return [
      {
        id: "default-low-value",
        condition: "order.totalPrice < 50",
        action: "approve",
        priority: 1,
        description: "Auto-approve returns for orders under $50",
      },
      {
        id: "default-high-ltv",
        condition: "customer.ltv > 1000",
        action: "approve",
        priority: 2,
        description: "Auto-approve returns for high-value customers",
      },
      {
        id: "default-damaged",
        condition: 'reason === "damaged"',
        action: "approve",
        priority: 3,
        description: "Auto-approve damaged item returns",
      },
    ];
  }

  addRule(rule: Omit<ReturnRule, "id">) {
    const newRule: ReturnRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    this.rules.push(newRule);
    this.rules.sort((a, b) => a.priority - b.priority);
    this.saveRules();
    return newRule;
  }

  removeRule(id: string) {
    this.rules = this.rules.filter((r) => r.id !== id);
    this.saveRules();
  }

  getRules() {
    return this.rules;
  }

  evaluate(context: { order: any; customer?: any; reason?: string }): {
    decision: "approve" | "reject" | "review";
    rule?: ReturnRule;
    explanation: string;
  } {
    for (const rule of this.rules) {
      try {
        // Create a safe evaluation context
        const evalContext = {
          order: context.order,
          customer: context.customer || { ltv: 0 },
          reason: context.reason || "",
        };

        // Evaluate the condition
        const condition = new Function(
          "order",
          "customer",
          "reason",
          `return ${rule.condition}`,
        );
        const matches = condition(
          evalContext.order,
          evalContext.customer,
          evalContext.reason,
        );

        if (matches) {
          return {
            decision: rule.action,
            rule,
            explanation: rule.description || `Matched rule: ${rule.condition}`,
          };
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    return {
      decision: "review",
      explanation: "No rules matched - requires manual review",
    };
  }
}
