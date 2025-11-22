export declare function getJenkinsTools(): ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            job_name?: undefined;
            parameters?: undefined;
            build_number?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            job_name: {
                type: string;
                description: string;
            };
            parameters?: undefined;
            build_number?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            job_name: {
                type: string;
                description: string;
            };
            parameters: {
                type: string;
                description: string;
            };
            build_number?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            job_name: {
                type: string;
                description: string;
            };
            build_number: {
                type: string;
                description: string;
            };
            parameters?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleJenkinsToolCall(name: string, args: Record<string, unknown>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=jenkinsTools.d.ts.map