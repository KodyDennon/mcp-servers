import axios from "axios";
const logrocketApi = axios.create({
    baseURL: "https://api.logrocket.com/v1",
    headers: {
        Authorization: `Bearer ${process.env.LOGROCKET_API_KEY || ""}`,
    },
});
export function getLogRocketTools() {
    return [
        {
            name: "logrocket_list_sessions",
            description: "List recent LogRocket sessions",
            inputSchema: {
                type: "object",
                properties: {
                    app_slug: { type: "string", description: "Application slug" },
                    limit: { type: "number", description: "Number of sessions to return (default: 20)" },
                },
                required: ["app_slug"],
            },
        },
        {
            name: "logrocket_get_session",
            description: "Get detailed information about a specific session",
            inputSchema: {
                type: "object",
                properties: {
                    session_url: { type: "string", description: "LogRocket session URL" },
                },
                required: ["session_url"],
            },
        },
    ];
}
export async function handleLogRocketToolCall(name, args) {
    if (!process.env.LOGROCKET_API_KEY) {
        throw new Error("LOGROCKET_API_KEY environment variable is required");
    }
    switch (name) {
        case "logrocket_list_sessions": {
            const { app_slug, limit = 20 } = args;
            const response = await logrocketApi.get(`/apps/${app_slug}/sessions`, {
                params: { limit },
            });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(response.data, null, 2),
                    },
                ],
            };
        }
        case "logrocket_get_session": {
            const { session_url } = args;
            // Extract session ID from URL
            const sessionId = session_url.split("/").pop();
            const response = await logrocketApi.get(`/sessions/${sessionId}`);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(response.data, null, 2),
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown LogRocket tool: ${name}`);
    }
}
//# sourceMappingURL=logrocketTools.js.map