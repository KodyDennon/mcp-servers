export namespace TemplateCategory {
    let ANALYTICS: string;
    let REPORTING: string;
    let ADMIN: string;
    let OPTIMIZATION: string;
    let SECURITY: string;
}
export namespace queryTemplates {
    namespace user_growth {
        export let name: string;
        import category = TemplateCategory.ANALYTICS;
        export { category };
        export let description: string;
        export let sql: string;
        export namespace params {
            namespace tableName {
                export let type: string;
                export let required: boolean;
                let _default: string;
                export { _default as default };
            }
            namespace startDate {
                let type_1: string;
                export { type_1 as type };
                let required_1: boolean;
                export { required_1 as required };
                let _default_1: string;
                export { _default_1 as default };
            }
            namespace limit {
                let type_2: string;
                export { type_2 as type };
                let required_2: boolean;
                export { required_2 as required };
                let _default_2: number;
                export { _default_2 as default };
            }
        }
    }
    namespace active_users_by_period {
        let name_1: string;
        export { name_1 as name };
        import category_1 = TemplateCategory.ANALYTICS;
        export { category_1 as category };
        let description_1: string;
        export { description_1 as description };
        let sql_1: string;
        export { sql_1 as sql };
        export namespace params_1 {
            export namespace tableName_1 {
                let type_3: string;
                export { type_3 as type };
                let required_3: boolean;
                export { required_3 as required };
                let _default_3: string;
                export { _default_3 as default };
            }
            export { tableName_1 as tableName };
            export namespace period {
                let type_4: string;
                export { type_4 as type };
                export let values: string[];
                let _default_4: string;
                export { _default_4 as default };
            }
            export namespace startDate_1 {
                let type_5: string;
                export { type_5 as type };
                let required_4: boolean;
                export { required_4 as required };
                let _default_5: string;
                export { _default_5 as default };
            }
            export { startDate_1 as startDate };
        }
        export { params_1 as params };
    }
    namespace retention_cohort {
        let name_2: string;
        export { name_2 as name };
        import category_2 = TemplateCategory.ANALYTICS;
        export { category_2 as category };
        let description_2: string;
        export { description_2 as description };
        let sql_2: string;
        export { sql_2 as sql };
        export namespace params_2 {
            export namespace tableName_2 {
                let type_6: string;
                export { type_6 as type };
                let required_5: boolean;
                export { required_5 as required };
                let _default_6: string;
                export { _default_6 as default };
            }
            export { tableName_2 as tableName };
            export namespace activityTable {
                let type_7: string;
                export { type_7 as type };
                let required_6: boolean;
                export { required_6 as required };
                let _default_7: string;
                export { _default_7 as default };
            }
            export namespace startDate_2 {
                let type_8: string;
                export { type_8 as type };
                let required_7: boolean;
                export { required_7 as required };
                let _default_8: string;
                export { _default_8 as default };
            }
            export { startDate_2 as startDate };
        }
        export { params_2 as params };
    }
    namespace top_revenue_products {
        let name_3: string;
        export { name_3 as name };
        import category_3 = TemplateCategory.REPORTING;
        export { category_3 as category };
        let description_3: string;
        export { description_3 as description };
        let sql_3: string;
        export { sql_3 as sql };
        export namespace params_3 {
            export namespace productsTable {
                let type_9: string;
                export { type_9 as type };
                let required_8: boolean;
                export { required_8 as required };
                let _default_9: string;
                export { _default_9 as default };
            }
            export namespace ordersTable {
                let type_10: string;
                export { type_10 as type };
                let required_9: boolean;
                export { required_9 as required };
                let _default_10: string;
                export { _default_10 as default };
            }
            export namespace startDate_3 {
                let type_11: string;
                export { type_11 as type };
                let required_10: boolean;
                export { required_10 as required };
                let _default_11: string;
                export { _default_11 as default };
            }
            export { startDate_3 as startDate };
            export namespace limit_1 {
                let type_12: string;
                export { type_12 as type };
                let required_11: boolean;
                export { required_11 as required };
                let _default_12: number;
                export { _default_12 as default };
            }
            export { limit_1 as limit };
        }
        export { params_3 as params };
    }
    namespace daily_revenue {
        let name_4: string;
        export { name_4 as name };
        import category_4 = TemplateCategory.REPORTING;
        export { category_4 as category };
        let description_4: string;
        export { description_4 as description };
        let sql_4: string;
        export { sql_4 as sql };
        export namespace params_4 {
            export namespace tableName_3 {
                let type_13: string;
                export { type_13 as type };
                let required_12: boolean;
                export { required_12 as required };
                let _default_13: string;
                export { _default_13 as default };
            }
            export { tableName_3 as tableName };
            export namespace startDate_4 {
                let type_14: string;
                export { type_14 as type };
                let required_13: boolean;
                export { required_13 as required };
                let _default_14: string;
                export { _default_14 as default };
            }
            export { startDate_4 as startDate };
            export namespace status {
                let type_15: string;
                export { type_15 as type };
                let required_14: boolean;
                export { required_14 as required };
                let _default_15: string;
                export { _default_15 as default };
            }
            export namespace limit_2 {
                let type_16: string;
                export { type_16 as type };
                let required_15: boolean;
                export { required_15 as required };
                let _default_16: number;
                export { _default_16 as default };
            }
            export { limit_2 as limit };
        }
        export { params_4 as params };
    }
    namespace duplicate_records {
        let name_5: string;
        export { name_5 as name };
        import category_5 = TemplateCategory.ADMIN;
        export { category_5 as category };
        let description_5: string;
        export { description_5 as description };
        let sql_5: string;
        export { sql_5 as sql };
        export namespace params_5 {
            export namespace tableName_4 {
                let type_17: string;
                export { type_17 as type };
                let required_16: boolean;
                export { required_16 as required };
            }
            export { tableName_4 as tableName };
            export namespace columns {
                let type_18: string;
                export { type_18 as type };
                let required_17: boolean;
                export { required_17 as required };
                let _default_17: string;
                export { _default_17 as default };
            }
            export namespace limit_3 {
                let type_19: string;
                export { type_19 as type };
                let required_18: boolean;
                export { required_18 as required };
                let _default_18: number;
                export { _default_18 as default };
            }
            export { limit_3 as limit };
        }
        export { params_5 as params };
    }
    namespace orphaned_records {
        let name_6: string;
        export { name_6 as name };
        import category_6 = TemplateCategory.ADMIN;
        export { category_6 as category };
        let description_6: string;
        export { description_6 as description };
        let sql_6: string;
        export { sql_6 as sql };
        export namespace params_6 {
            export namespace tableName_5 {
                let type_20: string;
                export { type_20 as type };
                let required_19: boolean;
                export { required_19 as required };
            }
            export { tableName_5 as tableName };
            export namespace foreignTable {
                let type_21: string;
                export { type_21 as type };
                let required_20: boolean;
                export { required_20 as required };
            }
            export namespace foreignKey {
                let type_22: string;
                export { type_22 as type };
                let required_21: boolean;
                export { required_21 as required };
            }
            export namespace limit_4 {
                let type_23: string;
                export { type_23 as type };
                let required_22: boolean;
                export { required_22 as required };
                let _default_19: number;
                export { _default_19 as default };
            }
            export { limit_4 as limit };
        }
        export { params_6 as params };
    }
    namespace missing_indexes {
        let name_7: string;
        export { name_7 as name };
        import category_7 = TemplateCategory.OPTIMIZATION;
        export { category_7 as category };
        let description_7: string;
        export { description_7 as description };
        let sql_7: string;
        export { sql_7 as sql };
        export namespace params_7 {
            export namespace schema {
                let type_24: string;
                export { type_24 as type };
                let required_23: boolean;
                export { required_23 as required };
                let _default_20: string;
                export { _default_20 as default };
            }
            export namespace tableName_6 {
                let type_25: string;
                export { type_25 as type };
                let required_24: boolean;
                export { required_24 as required };
            }
            export { tableName_6 as tableName };
            export namespace distinctThreshold {
                let type_26: string;
                export { type_26 as type };
                let required_25: boolean;
                export { required_25 as required };
                let _default_21: number;
                export { _default_21 as default };
            }
        }
        export { params_7 as params };
    }
    namespace table_bloat {
        let name_8: string;
        export { name_8 as name };
        import category_8 = TemplateCategory.OPTIMIZATION;
        export { category_8 as category };
        let description_8: string;
        export { description_8 as description };
        let sql_8: string;
        export { sql_8 as sql };
        export namespace params_8 {
            export namespace schema_1 {
                let type_27: string;
                export { type_27 as type };
                let required_26: boolean;
                export { required_26 as required };
                let _default_22: string;
                export { _default_22 as default };
            }
            export { schema_1 as schema };
            export namespace limit_5 {
                let type_28: string;
                export { type_28 as type };
                let required_27: boolean;
                export { required_27 as required };
                let _default_23: number;
                export { _default_23 as default };
            }
            export { limit_5 as limit };
        }
        export { params_8 as params };
    }
    namespace unused_indexes {
        let name_9: string;
        export { name_9 as name };
        import category_9 = TemplateCategory.OPTIMIZATION;
        export { category_9 as category };
        let description_9: string;
        export { description_9 as description };
        let sql_9: string;
        export { sql_9 as sql };
        export namespace params_9 {
            export namespace schema_2 {
                let type_29: string;
                export { type_29 as type };
                let required_28: boolean;
                export { required_28 as required };
                let _default_24: string;
                export { _default_24 as default };
            }
            export { schema_2 as schema };
            export namespace scanThreshold {
                let type_30: string;
                export { type_30 as type };
                let required_29: boolean;
                export { required_29 as required };
                let _default_25: number;
                export { _default_25 as default };
            }
            export namespace limit_6 {
                let type_31: string;
                export { type_31 as type };
                let required_30: boolean;
                export { required_30 as required };
                let _default_26: number;
                export { _default_26 as default };
            }
            export { limit_6 as limit };
        }
        export { params_9 as params };
    }
    namespace role_permissions {
        let name_10: string;
        export { name_10 as name };
        import category_10 = TemplateCategory.SECURITY;
        export { category_10 as category };
        let description_10: string;
        export { description_10 as description };
        let sql_10: string;
        export { sql_10 as sql };
        let params_10: {};
        export { params_10 as params };
    }
    namespace table_access_audit {
        let name_11: string;
        export { name_11 as name };
        import category_11 = TemplateCategory.SECURITY;
        export { category_11 as category };
        let description_11: string;
        export { description_11 as description };
        let sql_11: string;
        export { sql_11 as sql };
        export namespace params_11 {
            export namespace schema_3 {
                let type_32: string;
                export { type_32 as type };
                let required_31: boolean;
                export { required_31 as required };
                let _default_27: string;
                export { _default_27 as default };
            }
            export { schema_3 as schema };
        }
        export { params_11 as params };
    }
}
/**
 * Template Engine
 * Compiles and executes query templates
 */
export class TemplateEngine {
    templates: Map<any, any>;
    /**
     * Register a custom template
     */
    registerTemplate(id: any, template: any): void;
    /**
     * Get template by ID
     */
    getTemplate(id: any): any;
    /**
     * List all templates
     */
    listTemplates(category?: null): {
        id: any;
        name: any;
        category: any;
        description: any;
    }[];
    /**
     * Compile template with parameters
     */
    compile(templateId: any, params?: {}): {
        sql: any;
        template: any;
        params: {};
    };
    /**
     * Get template parameters
     */
    getTemplateParams(templateId: any): any;
    /**
     * Search templates
     */
    searchTemplates(query: any): {
        id: any;
        name: any;
        category: any;
        description: any;
        relevance: number;
    }[];
    /**
     * Get templates by category
     */
    getTemplatesByCategory(category: any): {
        id: any;
        name: any;
        category: any;
        description: any;
    }[];
}
//# sourceMappingURL=queryTemplates.d.ts.map