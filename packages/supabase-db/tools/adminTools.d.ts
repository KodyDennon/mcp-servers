export function handleAdminToolCall(toolName: any, input: any, connectionManager: any): Promise<{
    database_size: any;
    active_connections: any;
    table_stats: any;
    path?: undefined;
    filename?: undefined;
    data?: undefined;
} | {
    path: string;
    filename: any;
    database_size?: undefined;
    active_connections?: undefined;
    table_stats?: undefined;
    data?: undefined;
} | {
    data: any;
    database_size?: undefined;
    active_connections?: undefined;
    table_stats?: undefined;
    path?: undefined;
    filename?: undefined;
}>;
export namespace getDatabaseStatsTool {
    let name: string;
    let description: string;
    let input_schema: z.ZodObject<{}, z.core.$strip>;
    let output_schema: z.ZodObject<{
        database_size: z.ZodString;
        active_connections: z.ZodString;
        table_stats: z.ZodAny;
    }, z.core.$strip>;
}
export namespace createBackupTool {
    let name_1: string;
    export { name_1 as name };
    let description_1: string;
    export { description_1 as description };
    let input_schema_1: z.ZodObject<{
        filename: z.ZodOptional<z.ZodString>;
        tables: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    export { input_schema_1 as input_schema };
    let output_schema_1: z.ZodObject<{
        path: z.ZodString;
        filename: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_1 as output_schema };
}
export namespace manageAuthTool {
    let name_2: string;
    export { name_2 as name };
    let description_2: string;
    export { description_2 as description };
    let input_schema_2: z.ZodObject<{
        action: z.ZodEnum<{
            createUser: "createUser";
            listUsers: "listUsers";
            deleteUser: "deleteUser";
        }>;
        email: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    export { input_schema_2 as input_schema };
    let output_schema_2: z.ZodObject<{
        data: z.ZodAny;
    }, z.core.$strip>;
    export { output_schema_2 as output_schema };
}
export namespace manageStorageTool {
    let name_3: string;
    export { name_3 as name };
    let description_3: string;
    export { description_3 as description };
    let input_schema_3: z.ZodObject<{
        action: z.ZodEnum<{
            uploadFile: "uploadFile";
            downloadFile: "downloadFile";
            listFiles: "listFiles";
        }>;
        bucket: z.ZodString;
        path: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    export { input_schema_3 as input_schema };
    let output_schema_3: z.ZodObject<{
        data: z.ZodAny;
    }, z.core.$strip>;
    export { output_schema_3 as output_schema };
}
import { z } from "zod";
//# sourceMappingURL=adminTools.d.ts.map