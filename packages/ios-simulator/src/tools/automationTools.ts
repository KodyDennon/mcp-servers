import { z } from "zod";
import type { SimulatorManager } from "../simulatorManager.js";
import type { AutomationManager } from "../automation/automationManager.js";

const deviceDescription = z
  .string()
  .describe(
    "Optional simulator name/UDID. Defaults to IOS_SIM_DEFAULT_DEVICE.",
  );

export const installAppTool = {
  name: "installSimulatorApp",
  description:
    "Install a .app or .ipa bundle into the selected simulator. Useful for sideloading dev builds before automated testing.",
  input_schema: z
    .object({
      appPath: z
        .string()
        .min(1)
        .describe(
          "Absolute path to the .app directory or .ipa/.xcarchive payload you want to install.",
        ),
      device: deviceDescription.optional(),
    })
    .strip(),
  output_schema: z.object({
    device: z.object({
      name: z.string(),
      udid: z.string(),
      runtime: z.string(),
      state: z.string(),
    }),
    appPath: z.string(),
  }),
};

export const uninstallAppTool = {
  name: "uninstallSimulatorApp",
  description:
    "Remove an installed application from the simulator by bundle identifier.",
  input_schema: z
    .object({
      bundleId: z
        .string()
        .describe("Bundle identifier to uninstall, e.g. com.example.todo"),
      device: deviceDescription.optional(),
    })
    .strip(),
  output_schema: z.object({
    device: z.object({
      name: z.string(),
      udid: z.string(),
      runtime: z.string(),
      state: z.string(),
    }),
    bundleId: z.string(),
  }),
};

export const launchAppTool = {
  name: "launchSimulatorApp",
  description:
    "Launch an installed app using simctl (great for bootstrapping native test sessions or deep links).",
  input_schema: z
    .object({
      bundleId: z.string().describe("Bundle identifier to launch."),
      arguments: z
        .array(z.string())
        .describe("Optional arguments passed to the process.")
        .optional(),
      device: deviceDescription.optional(),
    })
    .strip(),
  output_schema: z.object({
    device: z.object({
      name: z.string(),
      udid: z.string(),
      runtime: z.string(),
      state: z.string(),
    }),
    bundleId: z.string(),
    output: z.string().describe("Raw simctl launch stdout."),
  }),
};

export const terminateAppTool = {
  name: "terminateSimulatorApp",
  description: "Terminate a running app by bundle identifier.",
  input_schema: z
    .object({
      bundleId: z.string(),
      device: deviceDescription.optional(),
    })
    .strip(),
  output_schema: z.object({
    device: z.object({
      name: z.string(),
      udid: z.string(),
      runtime: z.string(),
      state: z.string(),
    }),
    bundleId: z.string(),
  }),
};

export const tapTool = {
  name: "tapSimulatorScreen",
  description:
    "Simulate a tap/press gesture at x/y coordinates via WebDriverAgent.",
  input_schema: z
    .object({
      x: z.number().describe("X coordinate in screen points."),
      y: z.number().describe("Y coordinate in screen points."),
      durationMs: z
        .number()
        .int()
        .min(0)
        .describe("Optional hold duration in milliseconds.")
        .optional(),
      bundleId: z
        .string()
        .describe(
          "Optional bundle ID to attach the automation session to (defaults to SpringBoard).",
        )
        .optional(),
      device: deviceDescription.optional(),
    })
    .strip(),
  output_schema: z.object({
    device: z.object({
      name: z.string(),
      udid: z.string(),
      runtime: z.string(),
      state: z.string(),
    }),
  }),
};

export const swipeTool = {
  name: "swipeSimulatorScreen",
  description:
    "Perform a swipe/drag gesture for scrolling or reveal actions using WebDriverAgent.",
  input_schema: z
    .object({
      fromX: z.number(),
      fromY: z.number(),
      toX: z.number(),
      toY: z.number(),
      durationMs: z
        .number()
        .int()
        .min(0)
        .describe("Duration of the swipe gesture in milliseconds.")
        .optional(),
      bundleId: z.string().optional(),
      device: deviceDescription.optional(),
    })
    .strip(),
  output_schema: tapTool.output_schema,
};

export const typeTextTool = {
  name: "typeSimulatorText",
  description:
    "Send Unicode text via the simulator keyboard using WebDriverAgent. Useful for filling forms programmatically.",
  input_schema: z
    .object({
      text: z.string().describe("Exact text to type."),
      bundleId: z.string().optional(),
      device: deviceDescription.optional(),
    })
    .strip(),
  output_schema: tapTool.output_schema,
};

export const pressButtonTool = {
  name: "pressSimulatorButton",
  description:
    "Emulate hardware button presses (home, lock, volume) via WebDriverAgent.",
  input_schema: z
    .object({
      button: z
        .enum(["home", "lock", "volumeUp", "volumeDown", "siri"])
        .describe("Hardware button to press."),
      bundleId: z.string().optional(),
      device: deviceDescription.optional(),
    })
    .strip(),
  output_schema: tapTool.output_schema,
};

export const hierarchyTool = {
  name: "getSimulatorUiHierarchy",
  description:
    "Fetch the current accessibility/UI hierarchy (XML) from WebDriverAgent for debugging selectors.",
  input_schema: z
    .object({
      bundleId: z.string().optional(),
      device: deviceDescription.optional(),
    })
    .strip(),
  output_schema: z.object({
    device: z.object({
      name: z.string(),
      udid: z.string(),
      runtime: z.string(),
      state: z.string(),
    }),
    hierarchy: z.string(),
  }),
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

export async function handleAutomationToolCall(
  name: AutomationToolName,
  args: unknown,
  managers: {
    simulator: SimulatorManager;
    automation: AutomationManager;
  },
) {
  switch (name) {
    case installAppTool.name: {
      const input = installAppTool.input_schema.parse(args);
      const result = await managers.simulator.installApp(
        input.appPath,
        input.device,
      );
      return {
        device: {
          name: result.device.name,
          udid: result.device.udid,
          runtime: result.device.runtimeDisplayName,
          state: result.device.state,
        },
        appPath: result.appPath,
      };
    }
    case uninstallAppTool.name: {
      const input = uninstallAppTool.input_schema.parse(args);
      const result = await managers.simulator.uninstallApp(
        input.bundleId,
        input.device,
      );
      return {
        device: {
          name: result.device.name,
          udid: result.device.udid,
          runtime: result.device.runtimeDisplayName,
          state: result.device.state,
        },
        bundleId: result.bundleId,
      };
    }
    case launchAppTool.name: {
      const input = launchAppTool.input_schema.parse(args);
      const result = await managers.simulator.launchApp(
        input.bundleId,
        input.device,
        input.arguments,
      );
      return {
        device: {
          name: result.device.name,
          udid: result.device.udid,
          runtime: result.device.runtimeDisplayName,
          state: result.device.state,
        },
        bundleId: result.bundleId,
        output: result.output,
      };
    }
    case terminateAppTool.name: {
      const input = terminateAppTool.input_schema.parse(args);
      const result = await managers.simulator.terminateApp(
        input.bundleId,
        input.device,
      );
      return {
        device: {
          name: result.device.name,
          udid: result.device.udid,
          runtime: result.device.runtimeDisplayName,
          state: result.device.state,
        },
        bundleId: result.bundleId,
      };
    }
    case tapTool.name: {
      const input = tapTool.input_schema.parse(args);
      return managers.automation.tap(input);
    }
    case swipeTool.name: {
      const input = swipeTool.input_schema.parse(args);
      return managers.automation.swipe(input);
    }
    case typeTextTool.name: {
      const input = typeTextTool.input_schema.parse(args);
      return managers.automation.typeText(input);
    }
    case pressButtonTool.name: {
      const input = pressButtonTool.input_schema.parse(args);
      return managers.automation.pressButton(input);
    }
    case hierarchyTool.name: {
      const input = hierarchyTool.input_schema.parse(args);
      return managers.automation.getHierarchy(input);
    }
    default:
      throw new Error(`Unknown automation tool: ${name}`);
  }
}
