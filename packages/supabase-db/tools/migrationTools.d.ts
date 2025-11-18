export function handleMigrationToolCall(toolName: any, input: any, connectionManager: any): Promise<{
    message: string;
    migrations?: undefined;
    filename?: undefined;
    path?: undefined;
    migrationSql?: undefined;
} | {
    migrations: {
        filename: string;
        path: string;
    }[];
    message?: undefined;
    filename?: undefined;
    path?: undefined;
    migrationSql?: undefined;
} | {
    filename: string;
    path: string;
    migrationSql: string;
    message?: undefined;
    migrations?: undefined;
}>;
export namespace runMigrationTool {
    let name: string;
    let description: string;
    let input_schema: z.ZodObject<{
        filename: z.ZodString;
    }, z.core.$strip>;
    let output_schema: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
}
export namespace listMigrationsTool {
    let name_1: string;
    export { name_1 as name };
    let description_1: string;
    export { description_1 as description };
    let input_schema_1: z.ZodObject<{}, z.core.$strip>;
    export { input_schema_1 as input_schema };
    let output_schema_1: z.ZodObject<{
        migrations: z.ZodArray<z.ZodObject<{
            filename: z.ZodString;
            path: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    export { output_schema_1 as output_schema };
}
export namespace generateMigrationTool {
    let name_2: string;
    export { name_2 as name };
    let description_2: string;
    export { description_2 as description };
    let input_schema_2: z.ZodObject<{
        source: z.ZodDefault<z.ZodString>;
        message: z.ZodString;
    }, z.core.$strip>;
    export { input_schema_2 as input_schema };
    let output_schema_2: z.ZodObject<{
        filename: z.ZodString;
        path: z.ZodString;
        migrationSql: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_2 as output_schema };
}
export namespace seedDataTool {
    let name_3: string;
    export { name_3 as name };
    let description_3: string;
    export { description_3 as description };
    let input_schema_3: z.ZodObject<{}, z.core.$strip>;
    export { input_schema_3 as input_schema };
    let output_schema_3: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_3 as output_schema };
}
import { z } from "zod";
//# sourceMappingURL=migrationTools.d.ts.map