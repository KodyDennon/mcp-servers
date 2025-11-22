export declare function getRuntimeTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            directory: {
                type: string;
                description: string;
            };
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
            directory?: undefined;
            version?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            version: {
                type: string;
                description: string;
            };
            directory?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleRuntimeToolCall(name: string, args: Record<string, unknown>): Promise<{
    content: {
        type: "text";
        text: any;
    }[];
}>;
//# sourceMappingURL=runtimeTools.d.ts.map