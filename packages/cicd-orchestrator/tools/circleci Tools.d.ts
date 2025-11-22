export declare function getCircleCITools(): (
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          project_slug: {
            type: string;
            description: string;
          };
          limit: {
            type: string;
            description: string;
          };
          pipeline_id?: undefined;
          branch?: undefined;
          parameters?: undefined;
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
          pipeline_id: {
            type: string;
            description: string;
          };
          project_slug?: undefined;
          limit?: undefined;
          branch?: undefined;
          parameters?: undefined;
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
          project_slug: {
            type: string;
            description: string;
          };
          branch: {
            type: string;
            description: string;
          };
          parameters: {
            type: string;
            description: string;
          };
          limit?: undefined;
          pipeline_id?: undefined;
        };
        required: string[];
      };
    }
)[];
export declare function handleCircleCIToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=circleci%20Tools.d.ts.map
