import axios from "axios";
const circleci = axios.create({
    baseURL: "https://circleci.com/api/v2",
    headers: {
        "Circle-Token": process.env.CIRCLECI_TOKEN || "",
    },
});
export function getCircleCITools() {
    return [
        {
            name: "circleci_list_pipelines",
            description: "List CircleCI pipelines for a project",
            inputSchema: {
                type: "object",
                properties: {
                    project_slug: { type: "string", description: "Project slug (e.g., gh/org/repo)" },
                    limit: { type: "number", description: "Number of pipelines to return (default: 10)" },
                },
                required: ["project_slug"],
            },
        },
        {
            name: "circleci_get_pipeline",
            description: "Get details of a specific pipeline",
            inputSchema: {
                type: "object",
                properties: {
                    pipeline_id: { type: "string", description: "Pipeline ID" },
                },
                required: ["pipeline_id"],
            },
        },
        {
            name: "circleci_trigger_pipeline",
            description: "Trigger a new CircleCI pipeline",
            inputSchema: {
                type: "object",
                properties: {
                    project_slug: { type: "string", description: "Project slug (e.g., gh/org/repo)" },
                    branch: { type: "string", description: "Branch to run pipeline on" },
                    parameters: { type: "object", description: "Pipeline parameters" },
                },
                required: ["project_slug"],
            },
        },
    ];
}
export async function handleCircleCIToolCall(name, args) {
    if (!process.env.CIRCLECI_TOKEN) {
        throw new Error("CIRCLECI_TOKEN environment variable is required");
    }
    switch (name) {
        case "circleci_list_pipelines": {
            const { project_slug, limit = 10 } = args;
            const response = await circleci.get(`/project/${project_slug}/pipeline`, {
                params: { "page-token": "", limit },
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
        case "circleci_get_pipeline": {
            const { pipeline_id } = args;
            const response = await circleci.get(`/pipeline/${pipeline_id}`);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(response.data, null, 2),
                    },
                ],
            };
        }
        case "circleci_trigger_pipeline": {
            const { project_slug, branch, parameters } = args;
            const response = await circleci.post(`/project/${project_slug}/pipeline`, {
                branch,
                parameters,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Pipeline triggered successfully: ${JSON.stringify(response.data, null, 2)}`,
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown CircleCI tool: ${name}`);
    }
}
//# sourceMappingURL=circleci%20Tools.js.map