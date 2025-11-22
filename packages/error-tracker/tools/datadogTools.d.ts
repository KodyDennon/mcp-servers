export declare function getDatadogTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
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
            limit: {
                type: string;
                description: string;
            };
            tags?: undefined;
            monitor_id?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
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
            limit?: undefined;
            tags?: undefined;
            monitor_id?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                description: string;
            };
            from?: undefined;
            to?: undefined;
            limit?: undefined;
            monitor_id?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            monitor_id: {
                type: string;
                description: string;
            };
            query?: undefined;
            from?: undefined;
            to?: undefined;
            limit?: undefined;
            tags?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleDatadogToolCall(name: string, args: Record<string, unknown>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=datadogTools.d.ts.map