/**
 * Handle monitoring tool calls
 */
export function handleMonitoringToolCall(toolName: any, args: any, connectionManager: any): Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;
export namespace healthCheckTool {
    let name: string;
    let description: string;
    namespace input_schema {
        let type: string;
        namespace properties {
            namespace include_history {
                let type_1: string;
                export { type_1 as type };
                let description_1: string;
                export { description_1 as description };
                let _default: boolean;
                export { _default as default };
            }
        }
    }
}
export namespace getConnectionStatsTool {
    let name_1: string;
    export { name_1 as name };
    let description_2: string;
    export { description_2 as description };
    export namespace input_schema_1 {
        let type_2: string;
        export { type_2 as type };
        export namespace properties_1 {
            namespace connection_id {
                let type_3: string;
                export { type_3 as type };
                let description_3: string;
                export { description_3 as description };
            }
        }
        export { properties_1 as properties };
    }
    export { input_schema_1 as input_schema };
}
export namespace getRecoveryStatsTool {
    let name_2: string;
    export { name_2 as name };
    let description_4: string;
    export { description_4 as description };
    export namespace input_schema_2 {
        let type_4: string;
        export { type_4 as type };
        let properties_2: {};
        export { properties_2 as properties };
    }
    export { input_schema_2 as input_schema };
}
export namespace resetCircuitBreakerTool {
    let name_3: string;
    export { name_3 as name };
    let description_5: string;
    export { description_5 as description };
    export namespace input_schema_3 {
        let type_5: string;
        export { type_5 as type };
        export namespace properties_3 {
            export namespace connection_id_1 {
                let type_6: string;
                export { type_6 as type };
                let description_6: string;
                export { description_6 as description };
            }
            export { connection_id_1 as connection_id };
        }
        export { properties_3 as properties };
    }
    export { input_schema_3 as input_schema };
}
//# sourceMappingURL=monitoringTools.d.ts.map