export declare function getLicenseTools(): (
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
          format?: undefined;
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
          format: {
            type: string;
            description: string;
          };
        };
        required: string[];
      };
    }
)[];
export declare function handleLicenseToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=licenseTools.d.ts.map
