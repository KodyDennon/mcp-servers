export declare function getGitLabPipelinesTools(): (
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          project_id: {
            type: string;
            description: string;
          };
          status: {
            type: string;
            description: string;
          };
          limit: {
            type: string;
            description: string;
          };
          pipeline_id?: undefined;
          ref?: undefined;
          variables?: undefined;
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
          project_id: {
            type: string;
            description: string;
          };
          pipeline_id: {
            type: string;
            description: string;
          };
          status?: undefined;
          limit?: undefined;
          ref?: undefined;
          variables?: undefined;
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
          project_id: {
            type: string;
            description: string;
          };
          ref: {
            type: string;
            description: string;
          };
          variables: {
            type: string;
            description: string;
          };
          status?: undefined;
          limit?: undefined;
          pipeline_id?: undefined;
        };
        required: string[];
      };
    }
)[];
export declare function handleGitLabToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=gitlabTools.d.ts.map
