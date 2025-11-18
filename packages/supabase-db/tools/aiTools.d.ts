export namespace rag {
    let name: string;
    let description: string;
    namespace parameters {
        let type: string;
        namespace properties {
            namespace query {
                let type_1: string;
                export { type_1 as type };
                let description_1: string;
                export { description_1 as description };
            }
            namespace textColumn {
                let type_2: string;
                export { type_2 as type };
                let description_2: string;
                export { description_2 as description };
            }
            namespace vectorColumn {
                let type_3: string;
                export { type_3 as type };
                let description_3: string;
                export { description_3 as description };
            }
            namespace embeddingModel {
                let type_4: string;
                export { type_4 as type };
                let description_4: string;
                export { description_4 as description };
                let _default: string;
                export { _default as default };
            }
            namespace languageModel {
                let type_5: string;
                export { type_5 as type };
                let description_5: string;
                export { description_5 as description };
                let _default_1: string;
                export { _default_1 as default };
            }
        }
        let required: string[];
    }
    function execute({ query, textColumn, vectorColumn, embeddingModel, languageModel, }: {
        query: any;
        textColumn: any;
        vectorColumn: any;
        embeddingModel: any;
        languageModel: any;
    }): Promise<any>;
}
export namespace indexDirectory {
    let name_1: string;
    export { name_1 as name };
    let description_6: string;
    export { description_6 as description };
    export namespace parameters_1 {
        let type_6: string;
        export { type_6 as type };
        export namespace properties_1 {
            export namespace directoryPath {
                let type_7: string;
                export { type_7 as type };
                let description_7: string;
                export { description_7 as description };
            }
            export namespace tableName {
                let type_8: string;
                export { type_8 as type };
                let description_8: string;
                export { description_8 as description };
            }
            export namespace textColumn_1 {
                let type_9: string;
                export { type_9 as type };
                let description_9: string;
                export { description_9 as description };
            }
            export { textColumn_1 as textColumn };
            export namespace vectorColumn_1 {
                let type_10: string;
                export { type_10 as type };
                let description_10: string;
                export { description_10 as description };
            }
            export { vectorColumn_1 as vectorColumn };
            export namespace embeddingModel_1 {
                let type_11: string;
                export { type_11 as type };
                let description_11: string;
                export { description_11 as description };
                let _default_2: string;
                export { _default_2 as default };
            }
            export { embeddingModel_1 as embeddingModel };
        }
        export { properties_1 as properties };
        let required_1: string[];
        export { required_1 as required };
    }
    export { parameters_1 as parameters };
    export function execute_1({ directoryPath, tableName, textColumn, vectorColumn, embeddingModel, }: {
        directoryPath: any;
        tableName: any;
        textColumn: any;
        vectorColumn: any;
        embeddingModel: any;
    }): Promise<string>;
    export { execute_1 as execute };
}
export namespace indexUrl {
    let name_2: string;
    export { name_2 as name };
    let description_12: string;
    export { description_12 as description };
    export namespace parameters_2 {
        let type_12: string;
        export { type_12 as type };
        export namespace properties_2 {
            export namespace url {
                let type_13: string;
                export { type_13 as type };
                let description_13: string;
                export { description_13 as description };
            }
            export namespace tableName_1 {
                let type_14: string;
                export { type_14 as type };
                let description_14: string;
                export { description_14 as description };
            }
            export { tableName_1 as tableName };
            export namespace textColumn_2 {
                let type_15: string;
                export { type_15 as type };
                let description_15: string;
                export { description_15 as description };
            }
            export { textColumn_2 as textColumn };
            export namespace vectorColumn_2 {
                let type_16: string;
                export { type_16 as type };
                let description_16: string;
                export { description_16 as description };
            }
            export { vectorColumn_2 as vectorColumn };
            export namespace embeddingModel_2 {
                let type_17: string;
                export { type_17 as type };
                let description_17: string;
                export { description_17 as description };
                let _default_3: string;
                export { _default_3 as default };
            }
            export { embeddingModel_2 as embeddingModel };
        }
        export { properties_2 as properties };
        let required_2: string[];
        export { required_2 as required };
    }
    export { parameters_2 as parameters };
    export function execute_2({ url, tableName, textColumn, vectorColumn, embeddingModel, }: {
        url: any;
        tableName: any;
        textColumn: any;
        vectorColumn: any;
        embeddingModel: any;
    }): Promise<string>;
    export { execute_2 as execute };
}
//# sourceMappingURL=aiTools.d.ts.map