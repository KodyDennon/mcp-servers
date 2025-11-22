import type { SimulatorConfig } from "../config.js";
import { SimulatorManager } from "../simulatorManager.js";
export interface TapOptions {
    device?: string;
    x: number;
    y: number;
    durationMs?: number;
    bundleId?: string;
}
export interface SwipeOptions {
    device?: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    durationMs?: number;
    bundleId?: string;
}
export interface TypeTextOptions {
    device?: string;
    text: string;
    bundleId?: string;
}
export interface PressButtonOptions {
    device?: string;
    button: string;
    bundleId?: string;
}
export interface HierarchyOptions {
    device?: string;
    bundleId?: string;
}
export declare class AutomationManager {
    private readonly config;
    private readonly simulatorManager;
    private readonly contexts;
    constructor(config: SimulatorConfig, simulatorManager: SimulatorManager);
    private getProjectFile;
    private waitForStatus;
    private ensureAgent;
    private ensureSession;
    private formatResult;
    tap(options: TapOptions): Promise<{
        device: {
            name: string;
            udid: string;
            runtime: string;
            state: string;
        };
    }>;
    swipe(options: SwipeOptions): Promise<{
        device: {
            name: string;
            udid: string;
            runtime: string;
            state: string;
        };
    }>;
    typeText(options: TypeTextOptions): Promise<{
        device: {
            name: string;
            udid: string;
            runtime: string;
            state: string;
        };
    }>;
    pressButton(options: PressButtonOptions): Promise<{
        device: {
            name: string;
            udid: string;
            runtime: string;
            state: string;
        };
    }>;
    getHierarchy(options: HierarchyOptions): Promise<{
        device: {
            name: string;
            udid: string;
            runtime: string;
            state: string;
        };
        hierarchy: string;
    }>;
    launchViaWebDriver(bundleId: string, deviceQuery?: string, args?: string[]): Promise<{
        device: {
            name: string;
            udid: string;
            runtime: string;
            state: string;
        };
    }>;
    terminateViaWebDriver(bundleId: string, deviceQuery?: string): Promise<{
        device: {
            name: string;
            udid: string;
            runtime: string;
            state: string;
        };
    }>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=automationManager.d.ts.map