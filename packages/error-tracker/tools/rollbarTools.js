import axios from "axios";
const rollbarApi = axios.create({
  baseURL: "https://api.rollbar.com/api/1",
  headers: {
    "X-Rollbar-Access-Token": process.env.ROLLBAR_ACCESS_TOKEN || "",
  },
});
export function getRollbarTools() {
  return [
    {
      name: "rollbar_list_items",
      description: "List recent items (errors) from Rollbar",
      inputSchema: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          status: {
            type: "string",
            description: "Status filter: active, resolved, muted",
          },
          limit: {
            type: "number",
            description: "Number of items to return (default: 20)",
          },
        },
        required: ["project_id"],
      },
    },
    {
      name: "rollbar_get_item",
      description: "Get detailed information about a specific item",
      inputSchema: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Item ID" },
        },
        required: ["item_id"],
      },
    },
    {
      name: "rollbar_update_item",
      description: "Update an item (resolve, mute, etc.)",
      inputSchema: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Item ID" },
          status: {
            type: "string",
            description: "New status: active, resolved, muted",
          },
        },
        required: ["item_id", "status"],
      },
    },
  ];
}
export async function handleRollbarToolCall(name, args) {
  if (!process.env.ROLLBAR_ACCESS_TOKEN) {
    throw new Error("ROLLBAR_ACCESS_TOKEN environment variable is required");
  }
  switch (name) {
    case "rollbar_list_items": {
      const { project_id, status = "active", limit = 20 } = args;
      const response = await rollbarApi.get(`/items/`, {
        params: { project_id, status, page: 1, limit },
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
    case "rollbar_get_item": {
      const { item_id } = args;
      const response = await rollbarApi.get(`/item/${item_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }
    case "rollbar_update_item": {
      const { item_id, status } = args;
      const response = await rollbarApi.patch(`/item/${item_id}`, { status });
      return {
        content: [
          {
            type: "text",
            text: `Item ${item_id} updated to ${status}: ${JSON.stringify(response.data, null, 2)}`,
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown Rollbar tool: ${name}`);
  }
}
//# sourceMappingURL=rollbarTools.js.map
