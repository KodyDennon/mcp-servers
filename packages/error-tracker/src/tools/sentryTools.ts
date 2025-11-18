import axios from "axios";

const sentryApi = axios.create({
  baseURL: "https://sentry.io/api/0",
  headers: {
    Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN || ""}`,
  },
});

export function getSentryTools() {
  return [
    {
      name: "sentry_list_issues",
      description: "List recent errors and issues from Sentry",
      inputSchema: {
        type: "object",
        properties: {
          project_slug: { type: "string", description: "Project slug" },
          query: { type: "string", description: "Search query (optional)" },
          status: { type: "string", description: "Status filter: unresolved, resolved, ignored" },
          limit: { type: "number", description: "Number of issues to return (default: 25)" },
        },
        required: ["project_slug"],
      },
    },
    {
      name: "sentry_get_issue",
      description: "Get detailed information about a specific issue",
      inputSchema: {
        type: "object",
        properties: {
          issue_id: { type: "string", description: "Issue ID" },
        },
        required: ["issue_id"],
      },
    },
    {
      name: "sentry_get_issue_events",
      description: "Get all events for a specific issue",
      inputSchema: {
        type: "object",
        properties: {
          issue_id: { type: "string", description: "Issue ID" },
          limit: { type: "number", description: "Number of events to return (default: 10)" },
        },
        required: ["issue_id"],
      },
    },
    {
      name: "sentry_update_issue",
      description: "Update an issue (resolve, ignore, assign, etc.)",
      inputSchema: {
        type: "object",
        properties: {
          issue_id: { type: "string", description: "Issue ID" },
          status: { type: "string", description: "New status: resolved, unresolved, ignored" },
          assignedTo: { type: "string", description: "User to assign to (optional)" },
        },
        required: ["issue_id", "status"],
      },
    },
    {
      name: "sentry_get_stats",
      description: "Get project statistics and error trends",
      inputSchema: {
        type: "object",
        properties: {
          project_slug: { type: "string", description: "Project slug" },
          stat: { type: "string", description: "Stat to retrieve: received, rejected, blacklisted" },
          since: { type: "string", description: "Start time (ISO format)" },
          until: { type: "string", description: "End time (ISO format)" },
        },
        required: ["project_slug"],
      },
    },
  ];
}

export async function handleSentryToolCall(name: string, args: Record<string, unknown>) {
  if (!process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG) {
    throw new Error("SENTRY_AUTH_TOKEN and SENTRY_ORG environment variables are required");
  }

  const org = process.env.SENTRY_ORG;

  switch (name) {
    case "sentry_list_issues": {
      const { project_slug, query, status = "unresolved", limit = 25 } = args as {
        project_slug: string;
        query?: string;
        status?: string;
        limit?: number;
      };
      const params: Record<string, unknown> = { query: status, limit };
      if (query) params.query = query;

      const response = await sentryApi.get(`/projects/${org}/${project_slug}/issues/`, { params });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    case "sentry_get_issue": {
      const { issue_id } = args as { issue_id: string };
      const response = await sentryApi.get(`/issues/${issue_id}/`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    case "sentry_get_issue_events": {
      const { issue_id, limit = 10 } = args as { issue_id: string; limit?: number };
      const response = await sentryApi.get(`/issues/${issue_id}/events/`, {
        params: { limit },
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

    case "sentry_update_issue": {
      const { issue_id, status, assignedTo } = args as {
        issue_id: string;
        status: string;
        assignedTo?: string;
      };
      const updateData: Record<string, unknown> = { status };
      if (assignedTo) updateData.assignedTo = assignedTo;

      const response = await sentryApi.put(`/issues/${issue_id}/`, updateData);
      return {
        content: [
          {
            type: "text" as const,
            text: `Issue ${issue_id} updated successfully: ${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    }

    case "sentry_get_stats": {
      const { project_slug, stat = "received", since, until } = args as {
        project_slug: string;
        stat?: string;
        since?: string;
        until?: string;
      };
      const params: Record<string, unknown> = { stat };
      if (since) params.since = since;
      if (until) params.until = until;

      const response = await sentryApi.get(`/projects/${org}/${project_slug}/stats/`, { params });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown Sentry tool: ${name}`);
  }
}
