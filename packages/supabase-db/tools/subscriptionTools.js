import { z } from "zod";
import { getSupabaseClient } from "../supabaseClient.js";
export const subscribeTool = {
    name: "subscribe",
    description: "Subscribe to real-time database changes.",
    input_schema: z.object({
        tableName: z.string().describe("The name of the table to subscribe to."),
        event: z.enum(["INSERT", "UPDATE", "DELETE", "*"]).describe("The type of event to subscribe to.").default("*"),
        callbackUrl: z.string().url().describe("The URL to send notifications to when an event occurs."),
    }),
    output_schema: z.object({
        message: z.string(),
    }),
};
export async function handleSubscriptionToolCall(toolName, input, connectionManager) {
    const supabase = getSupabaseClient();
    try {
        switch (toolName) {
            case subscribeTool.name: {
                const { tableName, event, callbackUrl } = input;
                const channel = supabase.channel(`mcp-realtime-${tableName}`);
                channel
                    .on('postgres_changes', { event: event, schema: 'public', table: tableName }, (payload) => {
                    fetch(callbackUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                })
                    .subscribe();
                return { message: `Subscribed to ${event} events on table ${tableName}. Notifications will be sent to ${callbackUrl}` };
            }
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }
    catch (error) {
        throw new Error(`Subscription failed: ${error.message}`);
    }
}
//# sourceMappingURL=subscriptionTools.js.map