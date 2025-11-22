export declare function getSecurityTools(): (
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
          level: {
            type: string;
            description: string;
          };
          package_name?: undefined;
          version?: undefined;
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
          level?: undefined;
          package_name?: undefined;
          version?: undefined;
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
          version: {
            type: string;
            description: string;
          };
          directory?: undefined;
          level?: undefined;
        };
        required: string[];
      };
    }
)[];
export declare function handleSecurityToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=securityTools.d.ts.map
