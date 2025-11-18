/**
 * Handle advanced tool calls
 */
export function handleAdvancedToolCall(toolName: any, args: any, context: any): Promise<{
    content: {
        type: string;
        text: any;
    }[];
}>;
export namespace getCacheStatsTool {
    let name: string;
    let description: string;
    namespace input_schema {
        let type: string;
        let properties: {};
    }
}
export namespace clearCacheTool {
    let name_1: string;
    export { name_1 as name };
    let description_1: string;
    export { description_1 as description };
    export namespace input_schema_1 {
        let type_1: string;
        export { type_1 as type };
        export namespace properties_1 {
            namespace pattern {
                let type_2: string;
                export { type_2 as type };
                let description_2: string;
                export { description_2 as description };
            }
        }
        export { properties_1 as properties };
    }
    export { input_schema_1 as input_schema };
}
export namespace listTemplatesTool {
    let name_2: string;
    export { name_2 as name };
    let description_3: string;
    export { description_3 as description };
    export namespace input_schema_2 {
        let type_3: string;
        export { type_3 as type };
        export namespace properties_2 {
            namespace category {
                let type_4: string;
                export { type_4 as type };
                let description_4: string;
                export { description_4 as description };
            }
        }
        export { properties_2 as properties };
    }
    export { input_schema_2 as input_schema };
}
export namespace getTemplateTool {
    let name_3: string;
    export { name_3 as name };
    let description_5: string;
    export { description_5 as description };
    export namespace input_schema_3 {
        let type_5: string;
        export { type_5 as type };
        export namespace properties_3 {
            namespace templateId {
                let type_6: string;
                export { type_6 as type };
                let description_6: string;
                export { description_6 as description };
            }
        }
        export { properties_3 as properties };
        export let required: string[];
    }
    export { input_schema_3 as input_schema };
}
export namespace executeTemplateTool {
    let name_4: string;
    export { name_4 as name };
    let description_7: string;
    export { description_7 as description };
    export namespace input_schema_4 {
        let type_7: string;
        export { type_7 as type };
        export namespace properties_4 {
            export namespace templateId_1 {
                let type_8: string;
                export { type_8 as type };
                let description_8: string;
                export { description_8 as description };
            }
            export { templateId_1 as templateId };
            export namespace params {
                let type_9: string;
                export { type_9 as type };
                let description_9: string;
                export { description_9 as description };
            }
        }
        export { properties_4 as properties };
        let required_1: string[];
        export { required_1 as required };
    }
    export { input_schema_4 as input_schema };
}
export namespace getHelpTool {
    let name_5: string;
    export { name_5 as name };
    let description_10: string;
    export { description_10 as description };
    export namespace input_schema_5 {
        let type_10: string;
        export { type_10 as type };
        export namespace properties_5 {
            namespace topic {
                let type_11: string;
                export { type_11 as type };
                let description_11: string;
                export { description_11 as description };
            }
        }
        export { properties_5 as properties };
        let required_2: string[];
        export { required_2 as required };
    }
    export { input_schema_5 as input_schema };
}
export namespace searchHelpTool {
    let name_6: string;
    export { name_6 as name };
    let description_12: string;
    export { description_12 as description };
    export namespace input_schema_6 {
        let type_12: string;
        export { type_12 as type };
        export namespace properties_6 {
            namespace query {
                let type_13: string;
                export { type_13 as type };
                let description_13: string;
                export { description_13 as description };
            }
        }
        export { properties_6 as properties };
        let required_3: string[];
        export { required_3 as required };
    }
    export { input_schema_6 as input_schema };
}
export namespace startTourTool {
    let name_7: string;
    export { name_7 as name };
    let description_14: string;
    export { description_14 as description };
    export namespace input_schema_7 {
        let type_14: string;
        export { type_14 as type };
        let properties_7: {};
        export { properties_7 as properties };
    }
    export { input_schema_7 as input_schema };
}
export namespace getRateLimitsTool {
    let name_8: string;
    export { name_8 as name };
    let description_15: string;
    export { description_15 as description };
    export namespace input_schema_8 {
        let type_15: string;
        export { type_15 as type };
        export namespace properties_8 {
            namespace clientId {
                let type_16: string;
                export { type_16 as type };
                let description_16: string;
                export { description_16 as description };
            }
        }
        export { properties_8 as properties };
    }
    export { input_schema_8 as input_schema };
}
export namespace setClientTierTool {
    let name_9: string;
    export { name_9 as name };
    let description_17: string;
    export { description_17 as description };
    export namespace input_schema_9 {
        let type_17: string;
        export { type_17 as type };
        export namespace properties_9 {
            export namespace clientId_1 {
                let type_18: string;
                export { type_18 as type };
                let description_18: string;
                export { description_18 as description };
            }
            export { clientId_1 as clientId };
            export namespace tier {
                let type_19: string;
                export { type_19 as type };
                let description_19: string;
                export { description_19 as description };
                let _enum: string[];
                export { _enum as enum };
            }
        }
        export { properties_9 as properties };
        let required_4: string[];
        export { required_4 as required };
    }
    export { input_schema_9 as input_schema };
}
export namespace registerTenantTool {
    let name_10: string;
    export { name_10 as name };
    let description_20: string;
    export { description_20 as description };
    export namespace input_schema_10 {
        let type_20: string;
        export { type_20 as type };
        export namespace properties_10 {
            export namespace tenantId {
                let type_21: string;
                export { type_21 as type };
                let description_21: string;
                export { description_21 as description };
            }
            export namespace name_11 {
                let type_22: string;
                export { type_22 as type };
                let description_22: string;
                export { description_22 as description };
            }
            export { name_11 as name };
            export namespace tier_1 {
                let type_23: string;
                export { type_23 as type };
                let description_23: string;
                export { description_23 as description };
                let _enum_1: string[];
                export { _enum_1 as enum };
            }
            export { tier_1 as tier };
            export namespace connectionString {
                let type_24: string;
                export { type_24 as type };
                let description_24: string;
                export { description_24 as description };
            }
        }
        export { properties_10 as properties };
        let required_5: string[];
        export { required_5 as required };
    }
    export { input_schema_10 as input_schema };
}
export namespace listTenantsTool {
    let name_12: string;
    export { name_12 as name };
    let description_25: string;
    export { description_25 as description };
    export namespace input_schema_11 {
        let type_25: string;
        export { type_25 as type };
        export namespace properties_11 {
            export namespace tier_2 {
                let type_26: string;
                export { type_26 as type };
                let description_26: string;
                export { description_26 as description };
            }
            export { tier_2 as tier };
            export namespace isActive {
                let type_27: string;
                export { type_27 as type };
                let description_27: string;
                export { description_27 as description };
            }
        }
        export { properties_11 as properties };
    }
    export { input_schema_11 as input_schema };
}
export namespace listPluginsTool {
    let name_13: string;
    export { name_13 as name };
    let description_28: string;
    export { description_28 as description };
    export namespace input_schema_12 {
        let type_28: string;
        export { type_28 as type };
        let properties_12: {};
        export { properties_12 as properties };
    }
    export { input_schema_12 as input_schema };
}
export namespace enablePluginTool {
    let name_14: string;
    export { name_14 as name };
    let description_29: string;
    export { description_29 as description };
    export namespace input_schema_13 {
        let type_29: string;
        export { type_29 as type };
        export namespace properties_13 {
            namespace pluginName {
                let type_30: string;
                export { type_30 as type };
                let description_30: string;
                export { description_30 as description };
            }
        }
        export { properties_13 as properties };
        let required_6: string[];
        export { required_6 as required };
    }
    export { input_schema_13 as input_schema };
}
export namespace disablePluginTool {
    let name_15: string;
    export { name_15 as name };
    let description_31: string;
    export { description_31 as description };
    export namespace input_schema_14 {
        let type_31: string;
        export { type_31 as type };
        export namespace properties_14 {
            export namespace pluginName_1 {
                let type_32: string;
                export { type_32 as type };
                let description_32: string;
                export { description_32 as description };
            }
            export { pluginName_1 as pluginName };
        }
        export { properties_14 as properties };
        let required_7: string[];
        export { required_7 as required };
    }
    export { input_schema_14 as input_schema };
}
export namespace getMetricsTool {
    let name_16: string;
    export { name_16 as name };
    let description_33: string;
    export { description_33 as description };
    export namespace input_schema_15 {
        let type_33: string;
        export { type_33 as type };
        export namespace properties_15 {
            namespace format {
                let type_34: string;
                export { type_34 as type };
                let description_34: string;
                export { description_34 as description };
                let _enum_2: string[];
                export { _enum_2 as enum };
                let _default: string;
                export { _default as default };
            }
        }
        export { properties_15 as properties };
    }
    export { input_schema_15 as input_schema };
}
export namespace analyzeQueryTool {
    let name_17: string;
    export { name_17 as name };
    let description_35: string;
    export { description_35 as description };
    export namespace input_schema_16 {
        let type_35: string;
        export { type_35 as type };
        export namespace properties_16 {
            export namespace sql {
                let type_36: string;
                export { type_36 as type };
                let description_36: string;
                export { description_36 as description };
            }
            export namespace params_1 {
                let type_37: string;
                export { type_37 as type };
                let description_37: string;
                export { description_37 as description };
                export namespace items {
                    let type_38: string;
                    export { type_38 as type };
                }
            }
            export { params_1 as params };
        }
        export { properties_16 as properties };
        let required_8: string[];
        export { required_8 as required };
    }
    export { input_schema_16 as input_schema };
}
export namespace getOptimizationReportTool {
    let name_18: string;
    export { name_18 as name };
    let description_38: string;
    export { description_38 as description };
    export namespace input_schema_17 {
        let type_39: string;
        export { type_39 as type };
        let properties_17: {};
        export { properties_17 as properties };
    }
    export { input_schema_17 as input_schema };
}
//# sourceMappingURL=advancedTools.d.ts.map