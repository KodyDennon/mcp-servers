export declare function getDockerTools(): (
  | {
      name: string;
      description: string;
      inputSchema: {
        type: string;
        properties: {
          all: {
            type: string;
            description: string;
          };
          container_id?: undefined;
          directory?: undefined;
          detach?: undefined;
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
          container_id: {
            type: string;
            description: string;
          };
          all?: undefined;
          directory?: undefined;
          detach?: undefined;
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
          detach: {
            type: string;
            description: string;
          };
          all?: undefined;
          container_id?: undefined;
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
          all?: undefined;
          container_id?: undefined;
          detach?: undefined;
        };
        required: string[];
      };
    }
)[];
export declare function handleDockerToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{
  content: {
    type: "text";
    text: string;
  }[];
}>;
//# sourceMappingURL=dockerTools.d.ts.map
