import { z } from "zod";
import type { InspectorManager } from "../inspector/index.js";
export declare const listInspectorTargetsTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodArray<
    z.ZodObject<
      {
        id: z.ZodString;
        title: z.ZodString;
        url: z.ZodString;
        type: z.ZodNullable<z.ZodString>;
        webSocketDebuggerUrl: z.ZodNullable<z.ZodString>;
      },
      z.core.$strip
    >
  >;
};
export declare const evaluateJavaScriptTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      targetId: z.ZodString;
      expression: z.ZodString;
      device: z.ZodOptional<z.ZodString>;
      awaitPromise: z.ZodDefault<z.ZodBoolean>;
      returnByValue: z.ZodDefault<z.ZodBoolean>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      result: z.ZodOptional<z.ZodAny>;
      wasThrown: z.ZodOptional<z.ZodBoolean>;
      exceptionDetails: z.ZodOptional<z.ZodAny>;
    },
    z.core.$strip
  >;
};
export declare const captureInspectorScreenshotTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      targetId: z.ZodString;
      device: z.ZodOptional<z.ZodString>;
      format: z.ZodDefault<
        z.ZodEnum<{
          png: "png";
          jpeg: "jpeg";
        }>
      >;
      quality: z.ZodOptional<z.ZodNumber>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      base64: z.ZodString;
      format: z.ZodEnum<{
        png: "png";
        jpeg: "jpeg";
      }>;
    },
    z.core.$strip
  >;
};
export type InspectorToolName =
  | typeof listInspectorTargetsTool.name
  | typeof evaluateJavaScriptTool.name
  | typeof captureInspectorScreenshotTool.name;
export declare function handleInspectorToolCall(
  name: InspectorToolName,
  args: unknown,
  inspector: InspectorManager,
): Promise<
  | {
      id: string;
      title: string;
      url: string;
      type: string | null;
      webSocketDebuggerUrl: string | null;
    }[]
  | {
      result: unknown;
      wasThrown: boolean;
      exceptionDetails: {} | null;
    }
  | {
      base64: string;
      format: "png" | "jpeg";
    }
>;
//# sourceMappingURL=inspectorTools.d.ts.map
