export declare function getSentryTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_slug: {
                type: string;
                description: string;
            };
            query: {
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
            issue_id?: undefined;
            assignedTo?: undefined;
            stat?: undefined;
            since?: undefined;
            until?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            issue_id: {
                type: string;
                description: string;
            };
            project_slug?: undefined;
            query?: undefined;
            status?: undefined;
            limit?: undefined;
            assignedTo?: undefined;
            stat?: undefined;
            since?: undefined;
            until?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            issue_id: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            project_slug?: undefined;
            query?: undefined;
            status?: undefined;
            assignedTo?: undefined;
            stat?: undefined;
            since?: undefined;
            until?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            issue_id: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                description: string;
            };
            assignedTo: {
                type: string;
                description: string;
            };
            project_slug?: undefined;
            query?: undefined;
            limit?: undefined;
            stat?: undefined;
            since?: undefined;
            until?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            project_slug: {
                type: string;
                description: string;
            };
            stat: {
                type: string;
                description: string;
            };
            since: {
                type: string;
                description: string;
            };
            until: {
                type: string;
                description: string;
            };
            query?: undefined;
            status?: undefined;
            limit?: undefined;
            issue_id?: undefined;
            assignedTo?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleSentryToolCall(name: string, args: Record<string, unknown>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=sentryTools.d.ts.map