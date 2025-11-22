export declare function getGitHubWorkflowsTools(): (
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          owner: {
            type: string;
            description: string;
          };
          repo: {
            type: string;
            description: string;
          };
          workflow_id?: undefined;
          status?: undefined;
          limit?: undefined;
          ref?: undefined;
          inputs?: undefined;
          run_id?: undefined;
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
          owner: {
            type: string;
            description: string;
          };
          repo: {
            type: string;
            description: string;
          };
          workflow_id: {
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
          ref?: undefined;
          inputs?: undefined;
          run_id?: undefined;
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
          owner: {
            type: string;
            description: string;
          };
          repo: {
            type: string;
            description: string;
          };
          workflow_id: {
            type: string;
            description: string;
          };
          ref: {
            type: string;
            description: string;
          };
          inputs: {
            type: string;
            description: string;
          };
          status?: undefined;
          limit?: undefined;
          run_id?: undefined;
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
          owner: {
            type: string;
            description: string;
          };
          repo: {
            type: string;
            description: string;
          };
          run_id: {
            type: string;
            description: string;
          };
          workflow_id?: undefined;
          status?: undefined;
          limit?: undefined;
          ref?: undefined;
          inputs?: undefined;
        };
        required: string[];
      };
    }
)[];
export declare function handleGitHubToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=githubTools.d.ts.map
