export function handleQueryToolCall(
  toolName: any,
  input: any,
  connectionManager: any,
): Promise<
  | {
      rowCount: any;
      rows: any;
      command: any;
    }
  | {
      results: {
        command: any;
        rowCount: any;
      }[];
      plan?: undefined;
    }
  | {
      plan: string;
      results?: undefined;
    }
>;
export namespace queryTool {
  let name: string;
  let description: string;
  let input_schema: any;
  let output_schema: any;
}
export namespace queryTransactionTool {
  let name_1: string;
  export { name_1 as name };
  let description_1: string;
  export { description_1 as description };
  let input_schema_1: any;
  export { input_schema_1 as input_schema };
  let output_schema_1: any;
  export { output_schema_1 as output_schema };
}
export namespace explainQueryTool {
  let name_2: string;
  export { name_2 as name };
  let description_2: string;
  export { description_2 as description };
  let input_schema_2: any;
  export { input_schema_2 as input_schema };
  let output_schema_2: any;
  export { output_schema_2 as output_schema };
}
//# sourceMappingURL=queryTools.d.ts.map
