import axios from "axios";

const gitlabApi = axios.create({
  baseURL: process.env.GITLAB_URL || "https://gitlab.com/api/v4",
  headers: {
    "PRIVATE-TOKEN": process.env.GITLAB_TOKEN || "",
  },
});

export function getGitLabPipelinesTools() {
  return [
    {
      name: "gitlab_list_pipelines",
      description: "List GitLab CI pipelines for a project",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID or path" },
          status: { type: "string", description: "Filter by status (running, pending, success, failed)" },
          limit: { type: "number", description: "Number of pipelines to return (default: 10)" },
        },
        required: ["project_id"],
      },
    },
    {
      name: "gitlab_get_pipeline",
      description: "Get details of a specific pipeline",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID or path" },
          pipeline_id: { type: "number", description: "Pipeline ID" },
        },
        required: ["project_id", "pipeline_id"],
      },
    },
    {
      name: "gitlab_trigger_pipeline",
      description: "Trigger a new GitLab CI pipeline",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID or path" },
          ref: { type: "string", description: "Branch or tag to run pipeline on" },
          variables: { type: "object", description: "Pipeline variables" },
        },
        required: ["project_id", "ref"],
      },
    },
    {
      name: "gitlab_cancel_pipeline",
      description: "Cancel a running pipeline",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID or path" },
          pipeline_id: { type: "number", description: "Pipeline ID" },
        },
        required: ["project_id", "pipeline_id"],
      },
    },
    {
      name: "gitlab_retry_pipeline",
      description: "Retry a failed pipeline",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID or path" },
          pipeline_id: { type: "number", description: "Pipeline ID" },
        },
        required: ["project_id", "pipeline_id"],
      },
    },
  ];
}

export async function handleGitLabToolCall(name: string, args: Record<string, unknown>) {
  if (!process.env.GITLAB_TOKEN) {
    throw new Error("GITLAB_TOKEN environment variable is required");
  }

  switch (name) {
    case "gitlab_list_pipelines": {
      const { project_id, status, limit = 10 } = args as {
        project_id: string;
        status?: string;
        limit?: number;
      };
      const params: Record<string, unknown> = { per_page: limit };
      if (status) params.status = status;

      const response = await gitlabApi.get(`/projects/${encodeURIComponent(project_id)}/pipelines`, {
        params,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    case "gitlab_get_pipeline": {
      const { project_id, pipeline_id } = args as { project_id: string; pipeline_id: number };
      const response = await gitlabApi.get(
        `/projects/${encodeURIComponent(project_id)}/pipelines/${pipeline_id}`
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    case "gitlab_trigger_pipeline": {
      const { project_id, ref, variables } = args as {
        project_id: string;
        ref: string;
        variables?: Record<string, unknown>;
      };
      const response = await gitlabApi.post(
        `/projects/${encodeURIComponent(project_id)}/pipeline`,
        { ref, variables }
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Pipeline triggered successfully: ${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    }

    case "gitlab_cancel_pipeline": {
      const { project_id, pipeline_id } = args as { project_id: string; pipeline_id: number };
      await gitlabApi.post(
        `/projects/${encodeURIComponent(project_id)}/pipelines/${pipeline_id}/cancel`
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Pipeline ${pipeline_id} cancelled successfully`,
          },
        ],
      };
    }

    case "gitlab_retry_pipeline": {
      const { project_id, pipeline_id } = args as { project_id: string; pipeline_id: number };
      const response = await gitlabApi.post(
        `/projects/${encodeURIComponent(project_id)}/pipelines/${pipeline_id}/retry`
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Pipeline ${pipeline_id} retried successfully: ${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown GitLab tool: ${name}`);
  }
}
