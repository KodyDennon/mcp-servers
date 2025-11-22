import type { SimulatorManager } from "../simulatorManager.js";
export declare const listSimulatorsTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const bootSimulatorTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const shutdownSimulatorTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const openUrlTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const screenshotTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export type SimulatorToolName = typeof listSimulatorsTool.name | typeof bootSimulatorTool.name | typeof shutdownSimulatorTool.name | typeof openUrlTool.name | typeof screenshotTool.name;
export declare function handleSimulatorToolCall(name: SimulatorToolName, args: unknown, manager: SimulatorManager): Promise<{
    name: string;
    udid: string;
    platform: string | null;
    runtime: string;
    state: string;
}[] | {
    name: string;
    udid: string;
    runtime: string;
    state: string;
    device?: undefined;
    message?: undefined;
    url?: undefined;
    filePath?: undefined;
    bytes?: undefined;
    format?: undefined;
    base64?: undefined;
} | {
    device: {
        name: string;
        udid: string;
        runtime: string;
        state?: undefined;
    };
    name?: undefined;
    udid?: undefined;
    runtime?: undefined;
    state?: undefined;
    message?: undefined;
    url?: undefined;
    filePath?: undefined;
    bytes?: undefined;
    format?: undefined;
    base64?: undefined;
} | {
    message: string;
    name?: undefined;
    udid?: undefined;
    runtime?: undefined;
    state?: undefined;
    device?: undefined;
    url?: undefined;
    filePath?: undefined;
    bytes?: undefined;
    format?: undefined;
    base64?: undefined;
} | {
    url: string;
    device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
    };
    name?: undefined;
    udid?: undefined;
    runtime?: undefined;
    state?: undefined;
    message?: undefined;
    filePath?: undefined;
    bytes?: undefined;
    format?: undefined;
    base64?: undefined;
} | {
    filePath: string;
    bytes: number;
    format: "png" | "jpg";
    base64: string;
    device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
    };
    name?: undefined;
    udid?: undefined;
    runtime?: undefined;
    state?: undefined;
    message?: undefined;
    url?: undefined;
}>;
//# sourceMappingURL=simulatorTools.d.ts.map