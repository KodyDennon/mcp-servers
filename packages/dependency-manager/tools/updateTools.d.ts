export declare function getUpdateTools(): (
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
          from_version?: undefined;
          to_version?: undefined;
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
          package_name: {
            type: string;
            description: string;
          };
          from_version: {
            type: string;
            description: string;
          };
          to_version: {
            type: string;
            description: string;
          };
          directory?: undefined;
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
          package_name: {
            type: string;
            description: string;
          };
          directory?: undefined;
          from_version?: undefined;
          to_version?: undefined;
        };
        required: string[];
      };
    }
)[];
export declare function handleUpdateToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=updateTools.d.ts.map
