import { Octokit } from "@octokit/rest";
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});
export function getGitHubWorkflowsTools() {
    return [
        {
            name: "github_list_workflows",
            description: "List all GitHub Actions workflows for a repository",
            inputSchema: {
                type: "object",
                properties: {
                    owner: { type: "string", description: "Repository owner" },
                    repo: { type: "string", description: "Repository name" },
                },
                required: ["owner", "repo"],
            },
        },
        {
            name: "github_get_workflow_runs",
            description: "Get workflow runs for a specific workflow",
            inputSchema: {
                type: "object",
                properties: {
                    owner: { type: "string", description: "Repository owner" },
                    repo: { type: "string", description: "Repository name" },
                    workflow_id: { type: "string", description: "Workflow ID or filename" },
                    status: {
                        type: "string",
                        description: "Filter by status (completed, in_progress, queued)",
                    },
                    limit: { type: "number", description: "Number of runs to return (default: 10)" },
                },
                required: ["owner", "repo", "workflow_id"],
            },
        },
        {
            name: "github_trigger_workflow",
            description: "Trigger a GitHub Actions workflow",
            inputSchema: {
                type: "object",
                properties: {
                    owner: { type: "string", description: "Repository owner" },
                    repo: { type: "string", description: "Repository name" },
                    workflow_id: { type: "string", description: "Workflow ID or filename" },
                    ref: { type: "string", description: "Branch or tag to run workflow on" },
                    inputs: { type: "object", description: "Workflow inputs" },
                },
                required: ["owner", "repo", "workflow_id", "ref"],
            },
        },
        {
            name: "github_get_workflow_logs",
            description: "Get logs for a specific workflow run",
            inputSchema: {
                type: "object",
                properties: {
                    owner: { type: "string", description: "Repository owner" },
                    repo: { type: "string", description: "Repository name" },
                    run_id: { type: "number", description: "Workflow run ID" },
                },
                required: ["owner", "repo", "run_id"],
            },
        },
        {
            name: "github_cancel_workflow_run",
            description: "Cancel a running workflow",
            inputSchema: {
                type: "object",
                properties: {
                    owner: { type: "string", description: "Repository owner" },
                    repo: { type: "string", description: "Repository name" },
                    run_id: { type: "number", description: "Workflow run ID" },
                },
                required: ["owner", "repo", "run_id"],
            },
        },
        {
            name: "github_rerun_workflow",
            description: "Rerun a failed workflow",
            inputSchema: {
                type: "object",
                properties: {
                    owner: { type: "string", description: "Repository owner" },
                    repo: { type: "string", description: "Repository name" },
                    run_id: { type: "number", description: "Workflow run ID" },
                },
                required: ["owner", "repo", "run_id"],
            },
        },
    ];
}
export async function handleGitHubToolCall(name, args) {
    if (!process.env.GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN environment variable is required");
    }
    switch (name) {
        case "github_list_workflows": {
            const { owner, repo } = args;
            const response = await octokit.actions.listRepoWorkflows({ owner, repo });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(response.data, null, 2),
                    },
                ],
            };
        }
        case "github_get_workflow_runs": {
            const { owner, repo, workflow_id, status, limit = 10 } = args;
            const response = await octokit.actions.listWorkflowRuns({
                owner,
                repo,
                workflow_id,
                status: status,
                per_page: limit,
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
        case "github_trigger_workflow": {
            const { owner, repo, workflow_id, ref, inputs } = args;
            await octokit.actions.createWorkflowDispatch({
                owner,
                repo,
                workflow_id,
                ref,
                inputs,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Workflow ${workflow_id} triggered successfully on ${ref}`,
                    },
                ],
            };
        }
        case "github_get_workflow_logs": {
            const { owner, repo, run_id } = args;
            const response = await octokit.actions.downloadWorkflowRunLogs({
                owner,
                repo,
                run_id,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Logs URL: ${response.url}`,
                    },
                ],
            };
        }
        case "github_cancel_workflow_run": {
            const { owner, repo, run_id } = args;
            await octokit.actions.cancelWorkflowRun({ owner, repo, run_id });
            return {
                content: [
                    {
                        type: "text",
                        text: `Workflow run ${run_id} cancelled successfully`,
                    },
                ],
            };
        }
        case "github_rerun_workflow": {
            const { owner, repo, run_id } = args;
            await octokit.actions.reRunWorkflow({ owner, repo, run_id });
            return {
                content: [
                    {
                        type: "text",
                        text: `Workflow run ${run_id} rerun successfully`,
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown GitHub tool: ${name}`);
    }
}
//# sourceMappingURL=githubTools.js.map