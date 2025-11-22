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
];
const normalizeStructuredContent = (result) => {
  if (result && typeof result === "object" && !Array.isArray(result)) {
    return result;
  }
  return { value: result };
};
export async function callTool(name, args, managers) {
  let rawResult;
  if (
    [
      listSimulatorsTool.name,
      bootSimulatorTool.name,
      shutdownSimulatorTool.name,
      openUrlTool.name,
      screenshotTool.name,
    ].includes(name)
  ) {
    rawResult = await handleSimulatorToolCall(name, args, managers.simulator);
  } else if (
    [
      listInspectorTargetsTool.name,
      evaluateJavaScriptTool.name,
      captureInspectorScreenshotTool.name,
    ].includes(name)
  ) {
    rawResult = await handleInspectorToolCall(name, args, managers.inspector);
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
    rawResult = await handleAutomationToolCall(name, args, {
      simulator: managers.simulator,
      automation: managers.automation,
    });
  } else {
    throw new Error(`Unknown tool requested: ${name}`);
  }
  return {
    content: [],
    structuredContent: normalizeStructuredContent(rawResult),
  };
}
//# sourceMappingURL=index.js.map
