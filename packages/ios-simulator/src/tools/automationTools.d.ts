import type { SimulatorManager } from "../simulatorManager.js";
import type { AutomationManager } from "../automation/automationManager.js";
export declare const installAppTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const uninstallAppTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const launchAppTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const terminateAppTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const tapTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const swipeTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const typeTextTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const pressButtonTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const hierarchyTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export type AutomationToolName = typeof installAppTool.name | typeof uninstallAppTool.name | typeof launchAppTool.name | typeof terminateAppTool.name | typeof tapTool.name | typeof swipeTool.name | typeof typeTextTool.name | typeof pressButtonTool.name | typeof hierarchyTool.name;
export declare function handleAutomationToolCall(name: AutomationToolName, args: unknown, managers: {
    simulator: SimulatorManager;
    automation: AutomationManager;
}): Promise<{
    device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
    };
} | {
    device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
    };
    appPath: string;
    bundleId?: undefined;
    output?: undefined;
} | {
    device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
    };
    bundleId: string;
    appPath?: undefined;
    output?: undefined;
} | {
    device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
    };
    bundleId: string;
    output: string;
    appPath?: undefined;
}>;
//# sourceMappingURL=automationTools.d.ts.map