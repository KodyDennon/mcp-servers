export function handleSchemaToolCall(toolName: any, input: any, connectionManager: any): Promise<any>;
export namespace listTablesTool {
    let name: string;
    let description: string;
    let input_schema: z.ZodObject<{}, z.core.$strip>;
    let output_schema: z.ZodObject<{
        tables: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}
export namespace getTableSchemaTool {
    let name_1: string;
    export { name_1 as name };
    let description_1: string;
    export { description_1 as description };
    let input_schema_1: z.ZodObject<{
        tableName: z.ZodString;
    }, z.core.$strip>;
    export { input_schema_1 as input_schema };
    let output_schema_1: z.ZodObject<{
        tableName: z.ZodString;
        columns: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            nullable: z.ZodBoolean;
            default: z.ZodNullable<z.ZodAny>;
        }, z.core.$strip>>;
        constraints: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            definition: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    export { output_schema_1 as output_schema };
}
export namespace listIndexesTool {
    let name_2: string;
    export { name_2 as name };
    let description_2: string;
    export { description_2 as description };
    let input_schema_2: z.ZodObject<{
        tableName: z.ZodString;
    }, z.core.$strip>;
    export { input_schema_2 as input_schema };
    let output_schema_2: z.ZodObject<{
        indexes: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            definition: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    export { output_schema_2 as output_schema };
}
export namespace listFunctionsTool {
    let name_3: string;
    export { name_3 as name };
    let description_3: string;
    export { description_3 as description };
    let input_schema_3: z.ZodObject<{}, z.core.$strip>;
    export { input_schema_3 as input_schema };
    let output_schema_3: z.ZodObject<{
        functions: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            returnType: z.ZodString;
            arguments: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    export { output_schema_3 as output_schema };
}
export namespace searchSchemaTool {
    let name_4: string;
    export { name_4 as name };
    let description_4: string;
    export { description_4 as description };
    let input_schema_4: z.ZodObject<{
        keyword: z.ZodString;
    }, z.core.$strip>;
    export { input_schema_4 as input_schema };
    let output_schema_4: z.ZodObject<{
        results: z.ZodArray<z.ZodObject<{
            type: z.ZodString;
            name: z.ZodString;
            details: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    export { output_schema_4 as output_schema };
}
export namespace createTableTool {
    let name_5: string;
    export { name_5 as name };
    let description_5: string;
    export { description_5 as description };
    let input_schema_5: z.ZodObject<{
        tableName: z.ZodString;
        columns: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            isPrimaryKey: z.ZodOptional<z.ZodBoolean>;
            isUnique: z.ZodOptional<z.ZodBoolean>;
            isNullable: z.ZodOptional<z.ZodBoolean>;
            defaultValue: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        primaryKey: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    export { input_schema_5 as input_schema };
    let output_schema_5: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_5 as output_schema };
}
export namespace dropTableTool {
    let name_6: string;
    export { name_6 as name };
    let description_6: string;
    export { description_6 as description };
    let input_schema_6: z.ZodObject<{
        tableName: z.ZodString;
        cascade: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    export { input_schema_6 as input_schema };
    let output_schema_6: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_6 as output_schema };
}
export namespace addColumnTool {
    let name_7: string;
    export { name_7 as name };
    let description_7: string;
    export { description_7 as description };
    let input_schema_7: z.ZodObject<{
        tableName: z.ZodString;
        columnName: z.ZodString;
        columnType: z.ZodString;
        isNullable: z.ZodOptional<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    export { input_schema_7 as input_schema };
    let output_schema_7: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_7 as output_schema };
}
export namespace dropColumnTool {
    let name_8: string;
    export { name_8 as name };
    let description_8: string;
    export { description_8 as description };
    let input_schema_8: z.ZodObject<{
        tableName: z.ZodString;
        columnName: z.ZodString;
        cascade: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    export { input_schema_8 as input_schema };
    let output_schema_8: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_8 as output_schema };
}
export namespace createIndexTool {
    let name_9: string;
    export { name_9 as name };
    let description_9: string;
    export { description_9 as description };
    let input_schema_9: z.ZodObject<{
        tableName: z.ZodString;
        columns: z.ZodArray<z.ZodString>;
        indexName: z.ZodOptional<z.ZodString>;
        isUnique: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    export { input_schema_9 as input_schema };
    let output_schema_9: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
    export { output_schema_9 as output_schema };
}
export namespace diffSchemaTool {
    let name_10: string;
    export { name_10 as name };
    let description_10: string;
    export { description_10 as description };
    let input_schema_10: z.ZodObject<{
        source: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    export { input_schema_10 as input_schema };
    let output_schema_10: z.ZodObject<{
        diff: z.ZodAny;
    }, z.core.$strip>;
    export { output_schema_10 as output_schema };
}
import { z } from "zod";
//# sourceMappingURL=schemaTools.d.ts.map