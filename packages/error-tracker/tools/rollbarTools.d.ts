export declare function getRollbarTools(): ({
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
            item_id?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            item_id: {
                type: string;
                description: string;
            };
            project_id?: undefined;
            status?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            item_id: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                description: string;
            };
            project_id?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleRollbarToolCall(name: string, args: Record<string, unknown>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=rollbarTools.d.ts.map