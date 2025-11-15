import { z } from "zod";
import type { SimulatorManager } from "../simulatorManager.js";
import type { AutomationManager } from "../automation/automationManager.js";
export declare const installAppTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      appPath: z.ZodString;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      device: z.ZodObject<
        {
          name: z.ZodString;
          udid: z.ZodString;
          runtime: z.ZodString;
          state: z.ZodString;
        },
        z.core.$strip
      >;
      appPath: z.ZodString;
    },
    z.core.$strip
  >;
};
export declare const uninstallAppTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      bundleId: z.ZodString;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      device: z.ZodObject<
        {
          name: z.ZodString;
          udid: z.ZodString;
          runtime: z.ZodString;
          state: z.ZodString;
        },
        z.core.$strip
      >;
      bundleId: z.ZodString;
    },
    z.core.$strip
  >;
};
export declare const launchAppTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      bundleId: z.ZodString;
      arguments: z.ZodOptional<z.ZodArray<z.ZodString>>;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      device: z.ZodObject<
        {
          name: z.ZodString;
          udid: z.ZodString;
          runtime: z.ZodString;
          state: z.ZodString;
        },
        z.core.$strip
      >;
      bundleId: z.ZodString;
      output: z.ZodString;
    },
    z.core.$strip
  >;
};
export declare const terminateAppTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      bundleId: z.ZodString;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      device: z.ZodObject<
        {
          name: z.ZodString;
          udid: z.ZodString;
          runtime: z.ZodString;
          state: z.ZodString;
        },
        z.core.$strip
      >;
      bundleId: z.ZodString;
    },
    z.core.$strip
  >;
};
export declare const tapTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      x: z.ZodNumber;
      y: z.ZodNumber;
      durationMs: z.ZodOptional<z.ZodNumber>;
      bundleId: z.ZodOptional<z.ZodString>;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      device: z.ZodObject<
        {
          name: z.ZodString;
          udid: z.ZodString;
          runtime: z.ZodString;
          state: z.ZodString;
        },
        z.core.$strip
      >;
    },
    z.core.$strip
  >;
};
export declare const swipeTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      fromX: z.ZodNumber;
      fromY: z.ZodNumber;
      toX: z.ZodNumber;
      toY: z.ZodNumber;
      durationMs: z.ZodOptional<z.ZodNumber>;
      bundleId: z.ZodOptional<z.ZodString>;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      device: z.ZodObject<
        {
          name: z.ZodString;
          udid: z.ZodString;
          runtime: z.ZodString;
          state: z.ZodString;
        },
        z.core.$strip
      >;
    },
    z.core.$strip
  >;
};
export declare const typeTextTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      text: z.ZodString;
      bundleId: z.ZodOptional<z.ZodString>;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      device: z.ZodObject<
        {
          name: z.ZodString;
          udid: z.ZodString;
          runtime: z.ZodString;
          state: z.ZodString;
        },
        z.core.$strip
      >;
    },
    z.core.$strip
  >;
};
export declare const pressButtonTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      button: z.ZodEnum<{
        home: "home";
        lock: "lock";
        volumeUp: "volumeUp";
        volumeDown: "volumeDown";
        siri: "siri";
      }>;
      bundleId: z.ZodOptional<z.ZodString>;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      device: z.ZodObject<
        {
          name: z.ZodString;
          udid: z.ZodString;
          runtime: z.ZodString;
          state: z.ZodString;
        },
        z.core.$strip
      >;
    },
    z.core.$strip
  >;
};
export declare const hierarchyTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      bundleId: z.ZodOptional<z.ZodString>;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      device: z.ZodObject<
        {
          name: z.ZodString;
          udid: z.ZodString;
          runtime: z.ZodString;
          state: z.ZodString;
        },
        z.core.$strip
      >;
      hierarchy: z.ZodString;
    },
    z.core.$strip
  >;
};
export type AutomationToolName =
  | typeof installAppTool.name
  | typeof uninstallAppTool.name
  | typeof launchAppTool.name
  | typeof terminateAppTool.name
  | typeof tapTool.name
  | typeof swipeTool.name
  | typeof typeTextTool.name
  | typeof pressButtonTool.name
  | typeof hierarchyTool.name;
export declare function handleAutomationToolCall(
  name: AutomationToolName,
  args: unknown,
  managers: {
    simulator: SimulatorManager;
    automation: AutomationManager;
  },
): Promise<
  | {
      device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
      };
    }
  | {
      device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
      };
      appPath: string;
      bundleId?: undefined;
      output?: undefined;
    }
  | {
      device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
      };
      bundleId: string;
      appPath?: undefined;
      output?: undefined;
    }
  | {
      device: {
        name: string;
        udid: string;
        runtime: string;
        state: string;
      };
      bundleId: string;
      output: string;
      appPath?: undefined;
    }
>;
//# sourceMappingURL=automationTools.d.ts.map
