export function handleConnectionToolCall(toolName: any, input: any, connectionManager: any): Promise<any>;
export namespace connectToDatabaseTool {
    let name: string;
    let description: string;
    let input_schema: z.ZodObject<{
        connectionString: z.ZodString;
        connectionId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    let output_schema: z.ZodObject<{
        connectionId: z.ZodString;
        database: z.ZodString;
        user: z.ZodString;
        version: z.ZodString;
    }, z.core.$strip>;
}
export namespace listConnectionsTool {
    let name_1: string;
    export { name_1 as name };
    let description_1: string;
    export { description_1 as description };
    let input_schema_1: z.ZodObject<{}, z.core.$strip>;
    export { input_schema_1 as input_schema };
    let output_schema_1: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        database: z.ZodString;
        user: z.ZodString;
        version: z.ZodString;
        active: z.ZodBoolean;
    }, z.core.$strip>>;
    export { output_schema_1 as output_schema };
}
export namespace switchConnectionTool {
    let name_2: string;
    export { name_2 as name };
    let description_2: string;
    export { description_2 as description };
    let input_schema_2: z.ZodObject<{
        connectionId: z.ZodString;
    }, z.core.$strip>;
    export { input_schema_2 as input_schema };
    let output_schema_2: z.ZodObject<{
        connectionId: z.ZodString;
        database: z.ZodString;
        user: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_2 as output_schema };
}
import { z } from "zod";
//# sourceMappingURL=connectionTools.d.ts.map