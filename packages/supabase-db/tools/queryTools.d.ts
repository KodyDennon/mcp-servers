export function handleQueryToolCall(toolName: any, input: any, connectionManager: any): Promise<{
    rowCount: any;
    rows: any;
    command: any;
} | {
    results: {
        command: any;
        rowCount: any;
    }[];
    plan?: undefined;
} | {
    plan: string;
    results?: undefined;
}>;
export namespace queryTool {
    let name: string;
    let description: string;
    let input_schema: z.ZodObject<{
        sql: z.ZodString;
        rowLimit: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    let output_schema: z.ZodObject<{
        rowCount: z.ZodNumber;
        rows: z.ZodArray<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
        command: z.ZodString;
        warning: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}
export namespace queryTransactionTool {
    let name_1: string;
    export { name_1 as name };
    let description_1: string;
    export { description_1 as description };
    let input_schema_1: z.ZodObject<{
        sqlStatements: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    export { input_schema_1 as input_schema };
    let output_schema_1: z.ZodObject<{
        results: z.ZodArray<z.ZodObject<{
            command: z.ZodString;
            rowCount: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    export { output_schema_1 as output_schema };
}
export namespace explainQueryTool {
    let name_2: string;
    export { name_2 as name };
    let description_2: string;
    export { description_2 as description };
    let input_schema_2: z.ZodObject<{
        sql: z.ZodString;
    }, z.core.$strip>;
    export { input_schema_2 as input_schema };
    let output_schema_2: z.ZodObject<{
        plan: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_2 as output_schema };
}
import { z } from "zod";
//# sourceMappingURL=queryTools.d.ts.map