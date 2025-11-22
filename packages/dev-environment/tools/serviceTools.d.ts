export declare function getServiceTools(): {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: {};
  };
}[];
export declare function handleServiceToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=serviceTools.d.ts.map
