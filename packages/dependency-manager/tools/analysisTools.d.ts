export declare function getDependencyAnalysisTools(): (
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          directory: {
            type: string;
            description: string;
          };
          package_name?: undefined;
        };
        required: string[];
      };
    }
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          directory: {
            type: string;
            description: string;
          };
          package_name: {
            type: string;
            description: string;
          };
        };
        required: string[];
      };
    }
)[];
export declare function handleAnalysisToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=analysisTools.d.ts.map
