/**
 * Handle data tool calls with comprehensive error handling and security
 */
export function handleDataToolCall(
  toolName: any,
  input: any,
  connectionManager: any,
): Promise<
  | {
      success: boolean;
      error: {
        code: any;
        message: any;
        retry: any;
        category: any;
        suggested_action: any;
        details: {};
        timestamp: string;
      };
    }
  | {
      success: boolean;
      data: any;
    }
>;
export namespace importDataTool {
  let name: string;
  let description: string;
  let input_schema: any;
  let output_schema: any;
}
export namespace insertRowTool {
  let name_1: string;
  export { name_1 as name };
  let description_1: string;
  export { description_1 as description };
  let input_schema_1: any;
  export { input_schema_1 as input_schema };
  let output_schema_1: any;
  export { output_schema_1 as output_schema };
}
export namespace updateRowTool {
  let name_2: string;
  export { name_2 as name };
  let description_2: string;
  export { description_2 as description };
  let input_schema_2: any;
  export { input_schema_2 as input_schema };
  let output_schema_2: any;
  export { output_schema_2 as output_schema };
}
export namespace deleteRowTool {
  let name_3: string;
  export { name_3 as name };
  let description_3: string;
  export { description_3 as description };
  let input_schema_3: any;
  export { input_schema_3 as input_schema };
  let output_schema_3: any;
  export { output_schema_3 as output_schema };
}
//# sourceMappingURL=dataTools.d.ts.map
