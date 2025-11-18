export function handleEdgeFunctionToolCall(toolName: any, input: any): Promise<{
    data: unknown;
}>;
export namespace deployFunctionTool {
    let name: string;
    let description: string;
    let input_schema: z.ZodObject<{
        functionName: z.ZodString;
        functionCode: z.ZodString;
    }, z.core.$strip>;
    let output_schema: z.ZodObject<{
        data: z.ZodAny;
    }, z.core.$strip>;
}
export namespace listFunctionsTool {
    let name_1: string;
    export { name_1 as name };
    let description_1: string;
    export { description_1 as description };
    let input_schema_1: z.ZodObject<{}, z.core.$strip>;
    export { input_schema_1 as input_schema };
    let output_schema_1: z.ZodObject<{
        data: z.ZodAny;
    }, z.core.$strip>;
    export { output_schema_1 as output_schema };
}
export namespace deleteFunctionTool {
    let name_2: string;
    export { name_2 as name };
    let description_2: string;
    export { description_2 as description };
    let input_schema_2: z.ZodObject<{
        functionName: z.ZodString;
    }, z.core.$strip>;
    export { input_schema_2 as input_schema };
    let output_schema_2: z.ZodObject<{
        data: z.ZodAny;
    }, z.core.$strip>;
    export { output_schema_2 as output_schema };
}
import { z } from "zod";
//# sourceMappingURL=edgeFunctionTools.d.ts.map