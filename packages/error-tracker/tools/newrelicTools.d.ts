export declare function getNewRelicTools(): (
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          account_id: {
            type: string;
            description: string;
          };
          query: {
            type: string;
            description: string;
          };
          app_id?: undefined;
          from?: undefined;
          to?: undefined;
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
          account_id?: undefined;
          query?: undefined;
          app_id?: undefined;
          from?: undefined;
          to?: undefined;
        };
        required?: undefined;
      };
    }
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          app_id: {
            type: string;
            description: string;
          };
          from: {
            type: string;
            description: string;
          };
          to: {
            type: string;
            description: string;
          };
          account_id?: undefined;
          query?: undefined;
        };
        required: string[];
      };
    }
)[];
export declare function handleNewRelicToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=newrelicTools.d.ts.map
