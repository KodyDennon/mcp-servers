import { z } from "zod";
import type { SimulatorManager } from "../simulatorManager.js";
export declare const listSimulatorsTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      includeUnavailable: z.ZodOptional<z.ZodBoolean>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodArray<
    z.ZodObject<
      {
        name: z.ZodString;
        udid: z.ZodString;
        state: z.ZodString;
        runtime: z.ZodString;
        platform: z.ZodNullable<z.ZodString>;
      },
      z.core.$strip
    >
  >;
};
export declare const bootSimulatorTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      name: z.ZodString;
      udid: z.ZodString;
      runtime: z.ZodString;
      state: z.ZodString;
    },
    z.core.$strip
  >;
};
export declare const shutdownSimulatorTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      message: z.ZodOptional<z.ZodString>;
      device: z.ZodOptional<
        z.ZodObject<
          {
            name: z.ZodString;
            udid: z.ZodString;
            runtime: z.ZodString;
          },
          z.core.$strip
        >
      >;
    },
    z.core.$strip
  >;
};
export declare const openUrlTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      url: z.ZodString;
      device: z.ZodOptional<z.ZodString>;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      url: z.ZodString;
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
export declare const screenshotTool: {
  name: string;
  description: string;
  input_schema: z.ZodObject<
    {
      device: z.ZodOptional<z.ZodString>;
      format: z.ZodDefault<
        z.ZodEnum<{
          png: "png";
          jpg: "jpg";
        }>
      >;
    },
    z.core.$strip
  >;
  output_schema: z.ZodObject<
    {
      filePath: z.ZodString;
      bytes: z.ZodNumber;
      format: z.ZodEnum<{
        png: "png";
        jpg: "jpg";
      }>;
      base64: z.ZodString;
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
export type SimulatorToolName =
  | typeof listSimulatorsTool.name
  | typeof bootSimulatorTool.name
  | typeof shutdownSimulatorTool.name
  | typeof openUrlTool.name
  | typeof screenshotTool.name;
export declare function handleSimulatorToolCall(
  name: SimulatorToolName,
  args: unknown,
  manager: SimulatorManager,
): Promise<
  | {
      name: string;
      udid: string;
      platform: string | null;
      runtime: string;
      state: string;
    }[]
  | {
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
    }
  | {
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
    }
  | {
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
    }
  | {
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
    }
  | {
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
    }
>;
//# sourceMappingURL=simulatorTools.d.ts.map
