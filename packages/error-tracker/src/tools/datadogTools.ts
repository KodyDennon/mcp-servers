import axios from "axios";

const datadogApi = axios.create({
  baseURL: "https://api.datadoghq.com/api/v1",
  headers: {
    "DD-API-KEY": process.env.DATADOG_API_KEY || "",
    "DD-APPLICATION-KEY": process.env.DATADOG_APP_KEY || "",
  },
});

export function getDatadogTools() {
  return [
    {
      name: "datadog_search_logs",
      description: "Search Datadog logs for errors and events",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          from: { type: "string", description: "Start time (ISO format or relative like 'now-1h')" },
          to: { type: "string", description: "End time (ISO format or 'now')" },
          limit: { type: "number", description: "Number of logs to return (default: 50)" },
        },
        required: ["query"],
      },
    },
    {
      name: "datadog_get_metrics",
      description: "Query metrics from Datadog",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Metrics query" },
          from: { type: "number", description: "Start timestamp" },
          to: { type: "number", description: "End timestamp" },
        },
        required: ["query", "from", "to"],
      },
    },
    {
      name: "datadog_list_monitors",
      description: "List Datadog monitors",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Filter monitors by name" },
          tags: { type: "array", description: "Filter by tags" },
        },
      },
    },
    {
      name: "datadog_get_monitor",
      description: "Get details of a specific monitor",
      inputSchema: {
        type: "object",
        properties: {
          monitor_id: { type: "number", description: "Monitor ID" },
        },
        required: ["monitor_id"],
      },
    },
  ];
}

export async function handleDatadogToolCall(name: string, args: Record<string, unknown>) {
  if (!process.env.DATADOG_API_KEY || !process.env.DATADOG_APP_KEY) {
    throw new Error("DATADOG_API_KEY and DATADOG_APP_KEY environment variables are required");
  }

  switch (name) {
    case "datadog_search_logs": {
      const { query, from = "now-1h", to = "now", limit = 50 } = args as {
        query: string;
        from?: string;
        to?: string;
        limit?: number;
      };
      const response = await datadogApi.post("/logs-queries/list", {
        query,
        time: { from, to },
        limit,
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

    case "datadog_get_metrics": {
      const { query, from, to } = args as { query: string; from: number; to: number };
      const response = await datadogApi.get("/query", {
        params: { query, from, to },
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

    case "datadog_list_monitors": {
      const { query, tags } = args as { query?: string; tags?: string[] };
      const params: Record<string, unknown> = {};
      if (query) params.name = query;
      if (tags) params.tags = tags.join(",");

      const response = await datadogApi.get("/monitor", { params });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    case "datadog_get_monitor": {
      const { monitor_id } = args as { monitor_id: number };
      const response = await datadogApi.get(`/monitor/${monitor_id}`);
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
      throw new Error(`Unknown Datadog tool: ${name}`);
  }
}
