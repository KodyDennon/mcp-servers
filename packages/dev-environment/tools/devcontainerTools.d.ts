export declare function getDevContainerTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            directory: {
                type: string;
                description: string;
            };
            runtime?: undefined;
            version?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            directory: {
                type: string;
                description: string;
            };
            runtime: {
                type: string;
                description: string;
            };
            version: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
})[];
export declare function handleDevContainerToolCall(name: string, args: Record<string, unknown>): Promise<{
    content: {
        type: "text";
        text: any;
    }[];
}>;
//# sourceMappingURL=devcontainerTools.d.ts.map