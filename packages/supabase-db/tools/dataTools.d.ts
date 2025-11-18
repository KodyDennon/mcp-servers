/**
 * Handle data tool calls with comprehensive error handling and security
 */
export function handleDataToolCall(toolName: any, input: any, connectionManager: any): Promise<{
    success: boolean;
    error: {
        code: any;
        message: any;
        retry: any;
        category: any;
        suggested_action: any;
        details: {};
        timestamp: string;
    };
} | {
    success: boolean;
    data: any;
}>;
export namespace importDataTool {
    let name: string;
    let description: string;
    let input_schema: z.ZodObject<{
        tableName: z.ZodString;
        format: z.ZodEnum<{
            csv: "csv";
            json: "json";
        }>;
        data: z.ZodString;
        batchSize: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, z.core.$strip>;
    let output_schema: z.ZodObject<{
        success: z.ZodBoolean;
        rowsImported: z.ZodNumber;
        message: z.ZodString;
        warnings: z.ZodOptional<z.ZodArray<z.ZodObject<{
            line: z.ZodNumber;
            error: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}
export namespace insertRowTool {
    let name_1: string;
    export { name_1 as name };
    let description_1: string;
    export { description_1 as description };
    let input_schema_1: z.ZodObject<{
        tableName: z.ZodString;
        data: z.ZodRecord<z.ZodAny, z.core.SomeType>;
    }, z.core.$strip>;
    export { input_schema_1 as input_schema };
    let output_schema_1: z.ZodObject<{
        success: z.ZodBoolean;
        row: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
        error: z.ZodOptional<z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            retry: z.ZodBoolean;
            suggested_action: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    export { output_schema_1 as output_schema };
}
export namespace updateRowTool {
    let name_2: string;
    export { name_2 as name };
    let description_2: string;
    export { description_2 as description };
    let input_schema_2: z.ZodObject<{
        tableName: z.ZodString;
        rowId: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
        data: z.ZodRecord<z.ZodAny, z.core.SomeType>;
    }, z.core.$strip>;
    export { input_schema_2 as input_schema };
    let output_schema_2: z.ZodObject<{
        success: z.ZodBoolean;
        row: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
        error: z.ZodOptional<z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            retry: z.ZodBoolean;
            suggested_action: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    export { output_schema_2 as output_schema };
}
export namespace deleteRowTool {
    let name_3: string;
    export { name_3 as name };
    let description_3: string;
    export { description_3 as description };
    let input_schema_3: z.ZodObject<{
        tableName: z.ZodString;
        rowId: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    }, z.core.$strip>;
    export { input_schema_3 as input_schema };
    let output_schema_3: z.ZodObject<{
        success: z.ZodBoolean;
        row: z.ZodOptional<z.ZodRecord<z.ZodAny, z.core.SomeType>>;
        error: z.ZodOptional<z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            retry: z.ZodBoolean;
            suggested_action: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    export { output_schema_3 as output_schema };
}
import { z } from "zod";
//# sourceMappingURL=dataTools.d.ts.map