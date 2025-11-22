import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { SimulatorManager } from "./simulatorManager.js";
import type { InspectorManager } from "./inspector/index.js";
import type { AutomationManager } from "./automation/automationManager.js";
export declare function registerHandlers(server: Server, managers: {
    simulator: SimulatorManager;
    inspector: InspectorManager;
    automation: AutomationManager;
}): void;
//# sourceMappingURL=handlers.d.ts.map