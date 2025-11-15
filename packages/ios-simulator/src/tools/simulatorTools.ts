import { z } from "zod";
import type {
  OpenUrlResult,
  ScreenshotResult,
  SimulatorManager,
} from "../simulatorManager.js";

export const listSimulatorsTool = {
  name: "listSimulators",
  description:
    "List available iOS simulator devices, including runtime, state, and UDID.",
  input_schema: z
    .object({
      includeUnavailable: z
        .boolean()
        .describe(
          "When true, include simulators that are currently unavailable.",
        )
        .optional(),
    })
    .strip(),
  output_schema: z.array(
    z.object({
      name: z.string(),
      udid: z.string(),
      state: z.string(),
      runtime: z.string(),
      platform: z.string().nullable(),
    }),
  ),
};

export const bootSimulatorTool = {
  name: "bootSimulator",
  description:
    "Boot (or focus) a simulator by name or UDID and bring the Simulator window to the front.",
  input_schema: z
    .object({
      device: z
        .string()
        .describe(
          "Optional simulator name, UDID, or the literal word 'booted'. Defaults to IOS_SIM_DEFAULT_DEVICE.",
        )
        .optional(),
    })
    .strip(),
  output_schema: z.object({
    name: z.string(),
    udid: z.string(),
    runtime: z.string(),
    state: z.string(),
  }),
};

export const shutdownSimulatorTool = {
  name: "shutdownSimulator",
  description: "Shut down the currently booted simulator or a specific device.",
  input_schema: z
    .object({
      device: z
        .string()
        .describe(
          "Simulator name/UDID or 'booted'. Defaults to the active simulator.",
        )
        .optional(),
    })
    .strip(),
  output_schema: z.object({
    message: z.string().optional(),
    device: z
      .object({
        name: z.string(),
        udid: z.string(),
        runtime: z.string(),
      })
      .optional(),
  }),
};

export const openUrlTool = {
  name: "openUrlInSimulator",
  description:
    "Open a URL inside Safari on the booted simulator. Boot happens automatically if needed.",
  input_schema: z
    .object({
      url: z.string().url().describe("HTTPS URL to open inside the simulator."),
      device: z
        .string()
        .describe(
          "Optional simulator name/UDID. Defaults to IOS_SIM_DEFAULT_DEVICE.",
        )
        .optional(),
    })
    .strip(),
  output_schema: z.object({
    url: z.string(),
    device: z.object({
      name: z.string(),
      udid: z.string(),
      runtime: z.string(),
      state: z.string(),
    }),
  }),
};

export const screenshotTool = {
  name: "captureSimulatorScreenshot",
  description:
    "Capture a screenshot from the simulator display and return a base64 payload.",
  input_schema: z
    .object({
      device: z.string().optional(),
      format: z.enum(["png", "jpg"]).default("png"),
    })
    .strip(),
  output_schema: z.object({
    filePath: z.string(),
    bytes: z.number(),
    format: z.enum(["png", "jpg"]),
    base64: z.string(),
    device: z.object({
      name: z.string(),
      udid: z.string(),
      runtime: z.string(),
      state: z.string(),
    }),
  }),
};

export type SimulatorToolName =
  | typeof listSimulatorsTool.name
  | typeof bootSimulatorTool.name
  | typeof shutdownSimulatorTool.name
  | typeof openUrlTool.name
  | typeof screenshotTool.name;

export async function handleSimulatorToolCall(
  name: SimulatorToolName,
  args: unknown,
  manager: SimulatorManager,
) {
  switch (name) {
    case listSimulatorsTool.name: {
      const { includeUnavailable } =
        listSimulatorsTool.input_schema.parse(args);
      const simulators = await manager.listDevices(includeUnavailable ?? false);
      return simulators.map((sim) => ({
        name: sim.name,
        udid: sim.udid,
        platform: sim.platform ?? null,
        runtime: sim.runtimeDisplayName,
        state: sim.state,
      }));
    }
    case bootSimulatorTool.name: {
      const { device } = bootSimulatorTool.input_schema.parse(args);
      const result = await manager.ensureBooted(device);
      return {
        name: result.name,
        udid: result.udid,
        runtime: result.runtimeDisplayName,
        state: result.state,
      };
    }
    case shutdownSimulatorTool.name: {
      const { device } = shutdownSimulatorTool.input_schema.parse(args);
      const result = await manager.shutdown(device);
      if (result.device) {
        return {
          device: {
            name: result.device.name,
            udid: result.device.udid,
            runtime: result.device.runtimeDisplayName,
          },
        };
      }
      return { message: result.message ?? "Simulator shutdown requested." };
    }
    case openUrlTool.name: {
      const { url, device } = openUrlTool.input_schema.parse(args);
      const result: OpenUrlResult = await manager.openUrl(url, device);
      return {
        url: result.url,
        device: {
          name: result.device.name,
          udid: result.device.udid,
          runtime: result.device.runtimeDisplayName,
          state: result.device.state,
        },
      };
    }
    case screenshotTool.name: {
      const { device, format } = screenshotTool.input_schema.parse(args);
      const result: ScreenshotResult = await manager.captureScreenshot(
        device,
        format,
      );
      return {
        filePath: result.filePath,
        bytes: result.bytes,
        format: result.format,
        base64: result.base64,
        device: {
          name: result.device.name,
          udid: result.device.udid,
          runtime: result.device.runtimeDisplayName,
          state: result.device.state,
        },
      };
    }
    default:
      throw new Error(`Unknown simulator tool: ${name}`);
  }
}
