import { z } from "zod";
export const listInspectorTargetsTool = {
  name: "listWebInspectorTargets",
  description:
    "Enumerate the inspectable Safari tabs/webviews exposed by the simulator via the WebKit remote debugging protocol.",
  input_schema: z
    .object({
      device: z.string().describe("Target simulator device").optional(),
    })
    .strip(),
  output_schema: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      type: z.string().nullable(),
      webSocketDebuggerUrl: z.string().nullable(),
    }),
  ),
};
export const evaluateJavaScriptTool = {
  name: "evaluateWebViewJavaScript",
  description:
    "Run JavaScript inside the selected Safari webview by leveraging the WebKit DevTools protocol. Great for DOM inspection or simple smoke tests.",
  input_schema: z
    .object({
      targetId: z
        .string()
        .describe("Inspector target ID from listWebInspectorTargets."),
      expression: z
        .string()
        .describe(
          "JavaScript expression to evaluate (for example `document.title`).",
        ),
      device: z.string().optional(),
      awaitPromise: z
        .boolean()
        .default(true)
        .describe("Await promise results before returning."),
      returnByValue: z
        .boolean()
        .default(true)
        .describe("When true, serialize JSON-friendly values."),
    })
    .strip(),
  output_schema: z.object({
    result: z.any().optional(),
    wasThrown: z.boolean().optional(),
    exceptionDetails: z.any().optional(),
  }),
};
export const captureInspectorScreenshotTool = {
  name: "captureWebViewScreenshot",
  description:
    "Capture a page screenshot using the WebKit DevTools Page.captureScreenshot endpoint. Requires an inspectable Safari target.",
  input_schema: z
    .object({
      targetId: z.string(),
      device: z.string().optional(),
      format: z.enum(["png", "jpeg"]).default("png"),
      quality: z.number().min(1).max(100).optional(),
    })
    .strip(),
  output_schema: z.object({
    base64: z.string(),
    format: z.enum(["png", "jpeg"]),
  }),
};
export async function handleInspectorToolCall(name, args, inspector) {
  switch (name) {
    case listInspectorTargetsTool.name: {
      const { device } = listInspectorTargetsTool.input_schema.parse(args);
      const targets = await inspector.listTargets(device);
      return targets.map((target) => ({
        id: target.id,
        title: target.title,
        url: target.url,
        type: target.type ?? null,
        webSocketDebuggerUrl: target.webSocketDebuggerUrl ?? null,
      }));
    }
    case evaluateJavaScriptTool.name: {
      const parsed = evaluateJavaScriptTool.input_schema.parse(args);
      return inspector.evaluateRuntime(parsed);
    }
    case captureInspectorScreenshotTool.name: {
      const parsed = captureInspectorScreenshotTool.input_schema.parse(args);
      const result = await inspector.capturePageScreenshot(parsed);
      return {
        base64: result.data,
        format: parsed.format,
      };
    }
    default:
      throw new Error(`Unknown inspector tool: ${name}`);
  }
}
//# sourceMappingURL=inspectorTools.js.map
