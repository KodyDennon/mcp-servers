import type { InspectorManager } from "../inspector/index.js";
export declare const listInspectorTargetsTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const evaluateJavaScriptTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export declare const captureInspectorScreenshotTool: {
    name: string;
    description: string;
    input_schema: any;
    output_schema: any;
};
export type InspectorToolName = typeof listInspectorTargetsTool.name | typeof evaluateJavaScriptTool.name | typeof captureInspectorScreenshotTool.name;
export declare function handleInspectorToolCall(name: InspectorToolName, args: unknown, inspector: InspectorManager): Promise<{
    id: string;
    title: string;
    url: string;
    type: string | null;
    webSocketDebuggerUrl: string | null;
}[] | {
    result: unknown;
    wasThrown: boolean;
    exceptionDetails: {} | null;
} | {
    base64: string;
    format: any;
}>;
//# sourceMappingURL=inspectorTools.d.ts.map