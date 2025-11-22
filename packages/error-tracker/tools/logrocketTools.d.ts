export declare function getLogRocketTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            app_slug: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            session_url?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            session_url: {
                type: string;
                description: string;
            };
            app_slug?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleLogRocketToolCall(name: string, args: Record<string, unknown>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=logrocketTools.d.ts.map