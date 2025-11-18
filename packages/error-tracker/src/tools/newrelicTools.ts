import axios from "axios";

const newRelicApi = axios.create({
  baseURL: "https://api.newrelic.com/v2",
  headers: {
    "X-Api-Key": process.env.NEWRELIC_API_KEY || "",
  },
});

export function getNewRelicTools() {
  return [
    {
      name: "newrelic_query_nrql",
      description: "Run NRQL query against New Relic",
      inputSchema: {
        type: "object",
        properties: {
          account_id: { type: "string", description: "New Relic account ID" },
          query: { type: "string", description: "NRQL query" },
        },
        required: ["account_id", "query"],
      },
    },
    {
      name: "newrelic_list_applications",
      description: "List all applications in New Relic",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "newrelic_get_error_rate",
      description: "Get error rate for an application",
      inputSchema: {
        type: "object",
        properties: {
          app_id: { type: "string", description: "Application ID" },
          from: { type: "string", description: "Start time (ISO format)" },
          to: { type: "string", description: "End time (ISO format)" },
        },
        required: ["app_id"],
      },
    },
  ];
}

export async function handleNewRelicToolCall(name: string, args: Record<string, unknown>) {
  if (!process.env.NEWRELIC_API_KEY) {
    throw new Error("NEWRELIC_API_KEY environment variable is required");
  }

  switch (name) {
    case "newrelic_query_nrql": {
      const { account_id, query } = args as { account_id: string; query: string };
      const response = await newRelicApi.get(`/accounts/${account_id}/query`, {
        params: { nrql: query },
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

    case "newrelic_list_applications": {
      const response = await newRelicApi.get("/applications.json");
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    case "newrelic_get_error_rate": {
      const { app_id, from, to } = args as { app_id: string; from?: string; to?: string };
      const params: Record<string, unknown> = {
        names: ["Errors/all"],
        values: ["error_count"],
      };
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await newRelicApi.get(`/applications/${app_id}/metrics/data.json`, {
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

    default:
      throw new Error(`Unknown New Relic tool: ${name}`);
  }
}
