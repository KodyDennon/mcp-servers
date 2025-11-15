import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SimulatorManager } from "../simulatorManager.js";
import type { InspectorManager } from "../inspector/index.js";
import type { AutomationManager } from "../automation/automationManager.js";
export declare const allTools: readonly [
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        includeUnavailable: import("zod").ZodOptional<import("zod").ZodBoolean>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodArray<
      import("zod").ZodObject<
        {
          name: import("zod").ZodString;
          udid: import("zod").ZodString;
          state: import("zod").ZodString;
          runtime: import("zod").ZodString;
          platform: import("zod").ZodNullable<import("zod").ZodString>;
        },
        import("zod/v4/core").$strip
      >
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        name: import("zod").ZodString;
        udid: import("zod").ZodString;
        runtime: import("zod").ZodString;
        state: import("zod").ZodString;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        message: import("zod").ZodOptional<import("zod").ZodString>;
        device: import("zod").ZodOptional<
          import("zod").ZodObject<
            {
              name: import("zod").ZodString;
              udid: import("zod").ZodString;
              runtime: import("zod").ZodString;
            },
            import("zod/v4/core").$strip
          >
        >;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        url: import("zod").ZodString;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        url: import("zod").ZodString;
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodOptional<import("zod").ZodString>;
        format: import("zod").ZodDefault<
          import("zod").ZodEnum<{
            png: "png";
            jpg: "jpg";
          }>
        >;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        filePath: import("zod").ZodString;
        bytes: import("zod").ZodNumber;
        format: import("zod").ZodEnum<{
          png: "png";
          jpg: "jpg";
        }>;
        base64: import("zod").ZodString;
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodArray<
      import("zod").ZodObject<
        {
          id: import("zod").ZodString;
          title: import("zod").ZodString;
          url: import("zod").ZodString;
          type: import("zod").ZodNullable<import("zod").ZodString>;
          webSocketDebuggerUrl: import("zod").ZodNullable<
            import("zod").ZodString
          >;
        },
        import("zod/v4/core").$strip
      >
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        targetId: import("zod").ZodString;
        expression: import("zod").ZodString;
        device: import("zod").ZodOptional<import("zod").ZodString>;
        awaitPromise: import("zod").ZodDefault<import("zod").ZodBoolean>;
        returnByValue: import("zod").ZodDefault<import("zod").ZodBoolean>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        result: import("zod").ZodOptional<import("zod").ZodAny>;
        wasThrown: import("zod").ZodOptional<import("zod").ZodBoolean>;
        exceptionDetails: import("zod").ZodOptional<import("zod").ZodAny>;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        targetId: import("zod").ZodString;
        device: import("zod").ZodOptional<import("zod").ZodString>;
        format: import("zod").ZodDefault<
          import("zod").ZodEnum<{
            png: "png";
            jpeg: "jpeg";
          }>
        >;
        quality: import("zod").ZodOptional<import("zod").ZodNumber>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        base64: import("zod").ZodString;
        format: import("zod").ZodEnum<{
          png: "png";
          jpeg: "jpeg";
        }>;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        appPath: import("zod").ZodString;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
        appPath: import("zod").ZodString;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        bundleId: import("zod").ZodString;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
        bundleId: import("zod").ZodString;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        bundleId: import("zod").ZodString;
        arguments: import("zod").ZodOptional<
          import("zod").ZodArray<import("zod").ZodString>
        >;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
        bundleId: import("zod").ZodString;
        output: import("zod").ZodString;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        bundleId: import("zod").ZodString;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
        bundleId: import("zod").ZodString;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        x: import("zod").ZodNumber;
        y: import("zod").ZodNumber;
        durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
        bundleId: import("zod").ZodOptional<import("zod").ZodString>;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        fromX: import("zod").ZodNumber;
        fromY: import("zod").ZodNumber;
        toX: import("zod").ZodNumber;
        toY: import("zod").ZodNumber;
        durationMs: import("zod").ZodOptional<import("zod").ZodNumber>;
        bundleId: import("zod").ZodOptional<import("zod").ZodString>;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        text: import("zod").ZodString;
        bundleId: import("zod").ZodOptional<import("zod").ZodString>;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        button: import("zod").ZodEnum<{
          home: "home";
          lock: "lock";
          volumeUp: "volumeUp";
          volumeDown: "volumeDown";
          siri: "siri";
        }>;
        bundleId: import("zod").ZodOptional<import("zod").ZodString>;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
      },
      import("zod/v4/core").$strip
    >;
  },
  {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<
      {
        bundleId: import("zod").ZodOptional<import("zod").ZodString>;
        device: import("zod").ZodOptional<import("zod").ZodString>;
      },
      import("zod/v4/core").$strip
    >;
    output_schema: import("zod").ZodObject<
      {
        device: import("zod").ZodObject<
          {
            name: import("zod").ZodString;
            udid: import("zod").ZodString;
            runtime: import("zod").ZodString;
            state: import("zod").ZodString;
          },
          import("zod/v4/core").$strip
        >;
        hierarchy: import("zod").ZodString;
      },
      import("zod/v4/core").$strip
    >;
  },
];
export type ToolDefinitions = (typeof allTools)[number];
export declare function callTool(
  name: string,
  args: unknown,
  managers: {
    simulator: SimulatorManager;
    inspector: InspectorManager;
    automation: AutomationManager;
  },
): Promise<CallToolResult>;
//# sourceMappingURL=index.d.ts.map
