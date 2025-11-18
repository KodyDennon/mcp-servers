/**
 * Get all available tools
 */
export function getAllTools(): ({
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        connectionString: import("zod").ZodString;
        connectionId: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        connectionId: import("zod").ZodString;
        database: import("zod").ZodString;
        user: import("zod").ZodString;
        version: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodArray<import("zod").ZodObject<{
        id: import("zod").ZodString;
        database: import("zod").ZodString;
        user: import("zod").ZodString;
        version: import("zod").ZodString;
        active: import("zod").ZodBoolean;
    }, import("zod/v4/core").$strip>>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        connectionId: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        connectionId: import("zod").ZodString;
        database: import("zod").ZodString;
        user: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        sql: import("zod").ZodString;
        rowLimit: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        rowCount: import("zod").ZodNumber;
        rows: import("zod").ZodArray<import("zod").ZodRecord<import("zod").ZodAny, import("zod/v4/core").SomeType>>;
        command: import("zod").ZodString;
        warning: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        sqlStatements: import("zod").ZodArray<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        results: import("zod").ZodArray<import("zod").ZodObject<{
            command: import("zod").ZodString;
            rowCount: import("zod").ZodOptional<import("zod").ZodNumber>;
        }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        sql: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        plan: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        tables: import("zod").ZodArray<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        tableName: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        tableName: import("zod").ZodString;
        columns: import("zod").ZodArray<import("zod").ZodObject<{
            name: import("zod").ZodString;
            type: import("zod").ZodString;
            nullable: import("zod").ZodBoolean;
            default: import("zod").ZodNullable<import("zod").ZodAny>;
        }, import("zod/v4/core").$strip>>;
        constraints: import("zod").ZodArray<import("zod").ZodObject<{
            name: import("zod").ZodString;
            type: import("zod").ZodString;
            definition: import("zod").ZodString;
        }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        tableName: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        indexes: import("zod").ZodArray<import("zod").ZodObject<{
            name: import("zod").ZodString;
            definition: import("zod").ZodString;
        }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        functions: import("zod").ZodArray<import("zod").ZodObject<{
            name: import("zod").ZodString;
            returnType: import("zod").ZodString;
            arguments: import("zod").ZodString;
        }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        keyword: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        results: import("zod").ZodArray<import("zod").ZodObject<{
            type: import("zod").ZodString;
            name: import("zod").ZodString;
            details: import("zod").ZodOptional<import("zod").ZodString>;
        }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        source: import("zod").ZodDefault<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        diff: import("zod").ZodAny;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        migrations: import("zod").ZodArray<import("zod").ZodObject<{
            filename: import("zod").ZodString;
            path: import("zod").ZodString;
        }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        source: import("zod").ZodDefault<import("zod").ZodString>;
        message: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        filename: import("zod").ZodString;
        path: import("zod").ZodString;
        migrationSql: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        message: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        tableName: import("zod").ZodString;
        data: import("zod").ZodRecord<import("zod").ZodAny, import("zod/v4/core").SomeType>;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        success: import("zod").ZodBoolean;
        row: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodAny, import("zod/v4/core").SomeType>>;
        error: import("zod").ZodOptional<import("zod").ZodObject<{
            code: import("zod").ZodString;
            message: import("zod").ZodString;
            retry: import("zod").ZodBoolean;
            suggested_action: import("zod").ZodString;
        }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        tableName: import("zod").ZodString;
        rowId: import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodNumber]>;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        success: import("zod").ZodBoolean;
        row: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodAny, import("zod/v4/core").SomeType>>;
        error: import("zod").ZodOptional<import("zod").ZodObject<{
            code: import("zod").ZodString;
            message: import("zod").ZodString;
            retry: import("zod").ZodBoolean;
            suggested_action: import("zod").ZodString;
        }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        database_size: import("zod").ZodString;
        active_connections: import("zod").ZodString;
        table_stats: import("zod").ZodAny;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{
        filename: import("zod").ZodOptional<import("zod").ZodString>;
        tables: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    }, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        path: import("zod").ZodString;
        filename: import("zod").ZodString;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
    output_schema: import("zod").ZodObject<{
        data: import("zod").ZodAny;
    }, import("zod/v4/core").$strip>;
} | {
    name: string;
    description: string;
    input_schema: {
        type: string;
        properties: {};
    };
})[];
/**
 * Register the list tools handler
 */
export function registerListToolsHandler(server: any): void;
/**
 * Register the call tool handler
 */
export function registerCallToolHandler(server: any, context: any): void;
/**
 * Register all handlers
 */
export function registerHandlers(server: any, context: any): void;
//# sourceMappingURL=handlers.d.ts.map