export function handleSubscriptionToolCall(toolName: any, input: any, connectionManager: any): Promise<{
    message: string;
}>;
export namespace subscribeTool {
    let name: string;
    let description: string;
    let input_schema: z.ZodObject<{
        tableName: z.ZodString;
        event: z.ZodDefault<z.ZodEnum<{
            "*": "*";
            INSERT: "INSERT";
            UPDATE: "UPDATE";
            DELETE: "DELETE";
        }>>;
        callbackUrl: z.ZodString;
    }, z.core.$strip>;
    let output_schema: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
}
import { z } from "zod";
//# sourceMappingURL=subscriptionTools.d.ts.map