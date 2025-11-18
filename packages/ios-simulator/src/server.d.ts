import { SimulatorManager } from "./simulatorManager.js";
import { InspectorManager } from "./inspector/index.js";
import { AutomationManager } from "./automation/automationManager.js";
export declare function createServer(): any;
export declare function startServer(): Promise<{
    server: any;
    transport: any;
    simulatorManager: SimulatorManager;
    inspectorManager: InspectorManager;
    automationManager: AutomationManager;
}>;
//# sourceMappingURL=server.d.ts.map