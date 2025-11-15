import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  bootSimulatorTool,
  handleSimulatorToolCall,
  listSimulatorsTool,
  openUrlTool,
  screenshotTool,
  shutdownSimulatorTool,
} from "./simulatorTools.js";
import {
  captureInspectorScreenshotTool,
  evaluateJavaScriptTool,
  handleInspectorToolCall,
  listInspectorTargetsTool,
} from "./inspectorTools.js";
import type { SimulatorManager } from "../simulatorManager.js";
import type { InspectorManager } from "../inspector/index.js";
import type { AutomationManager } from "../automation/automationManager.js";
import {
  handleAutomationToolCall,
  installAppTool,
  uninstallAppTool,
  launchAppTool,
  terminateAppTool,
  tapTool,
  swipeTool,
  typeTextTool,
  pressButtonTool,
  hierarchyTool,
  type AutomationToolName,
} from "./automationTools.js";

export const allTools = [
  listSimulatorsTool,
  bootSimulatorTool,
  shutdownSimulatorTool,
  openUrlTool,
  screenshotTool,
  listInspectorTargetsTool,
  evaluateJavaScriptTool,
  captureInspectorScreenshotTool,
  installAppTool,
  uninstallAppTool,
  launchAppTool,
  terminateAppTool,
  tapTool,
  swipeTool,
  typeTextTool,
  pressButtonTool,
  hierarchyTool,
] as const;

export type ToolDefinitions = (typeof allTools)[number];

const normalizeStructuredContent = (result: unknown) => {
  if (result && typeof result === "object" && !Array.isArray(result)) {
    return result as Record<string, unknown>;
  }
  return { value: result };
};

export async function callTool(
  name: string,
  args: unknown,
  managers: {
    simulator: SimulatorManager;
    inspector: InspectorManager;
    automation: AutomationManager;
  },
): Promise<CallToolResult> {
  let rawResult: unknown;

  if (
    [
      listSimulatorsTool.name,
      bootSimulatorTool.name,
      shutdownSimulatorTool.name,
      openUrlTool.name,
      screenshotTool.name,
    ].includes(name)
  ) {
    rawResult = await handleSimulatorToolCall(
      name as typeof listSimulatorsTool.name,
      args,
      managers.simulator,
    );
  } else if (
    [
      listInspectorTargetsTool.name,
      evaluateJavaScriptTool.name,
      captureInspectorScreenshotTool.name,
    ].includes(name)
  ) {
    rawResult = await handleInspectorToolCall(
      name as typeof listInspectorTargetsTool.name,
      args,
      managers.inspector,
    );
  } else if (
    [
      installAppTool.name,
      uninstallAppTool.name,
      launchAppTool.name,
      terminateAppTool.name,
      tapTool.name,
      swipeTool.name,
      typeTextTool.name,
      pressButtonTool.name,
      hierarchyTool.name,
    ].includes(name)
  ) {
    rawResult = await handleAutomationToolCall(
      name as AutomationToolName,
      args,
      {
        simulator: managers.simulator,
        automation: managers.automation,
      },
    );
  } else {
    throw new Error(`Unknown tool requested: ${name}`);
  }

  return {
    content: [],
    structuredContent: normalizeStructuredContent(rawResult),
  };
}
