export namespace HelpTopic {
    let GETTING_STARTED: string;
    let DATABASE_CONNECTION: string;
    let QUERYING: string;
    let SCHEMA_MANAGEMENT: string;
    let PERFORMANCE: string;
    let TROUBLESHOOTING: string;
    let ADVANCED: string;
}
export namespace helpContent {
    namespace getting_started {
        let title: string;
        let description: string;
        let sections: ({
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    connectionString: string;
                    sql?: undefined;
                };
            };
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    connectionString?: undefined;
                    sql?: undefined;
                };
            };
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    sql: string;
                    connectionString?: undefined;
                };
            };
        })[];
        let next_topics: string[];
    }
    namespace database_connection {
        let title_1: string;
        export { title_1 as title };
        let description_1: string;
        export { description_1 as description };
        let sections_1: ({
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    connectionString: string;
                    id: string;
                    connectionId?: undefined;
                };
            };
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    connectionString?: undefined;
                    id?: undefined;
                    connectionId?: undefined;
                };
            };
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    connectionId: string;
                    connectionString?: undefined;
                    id?: undefined;
                };
            };
        })[];
        export { sections_1 as sections };
        let next_topics_1: string[];
        export { next_topics_1 as next_topics };
    }
    namespace querying {
        let title_2: string;
        export { title_2 as title };
        let description_2: string;
        export { description_2 as description };
        let sections_2: ({
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    sql: string;
                    queries?: undefined;
                };
            };
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    queries: string[];
                    sql?: undefined;
                };
            };
        })[];
        export { sections_2 as sections };
        let next_topics_2: string[];
        export { next_topics_2 as next_topics };
    }
    namespace schema_management {
        let title_3: string;
        export { title_3 as title };
        let description_3: string;
        export { description_3 as description };
        let sections_3: ({
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    tableName: string;
                    columns?: undefined;
                    columnName?: undefined;
                    columnType?: undefined;
                };
            };
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    tableName: string;
                    columns: {
                        name: string;
                        type: string;
                    }[];
                    columnName?: undefined;
                    columnType?: undefined;
                };
            };
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    tableName: string;
                    columnName: string;
                    columnType: string;
                    columns?: undefined;
                };
            };
        })[];
        export { sections_3 as sections };
        let next_topics_3: string[];
        export { next_topics_3 as next_topics };
    }
    namespace performance {
        let title_4: string;
        export { title_4 as title };
        let description_4: string;
        export { description_4 as description };
        let sections_4: ({
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    include_history: boolean;
                    tableName?: undefined;
                    indexName?: undefined;
                    columns?: undefined;
                };
            };
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    include_history?: undefined;
                    tableName?: undefined;
                    indexName?: undefined;
                    columns?: undefined;
                };
            };
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {
                    tableName: string;
                    indexName: string;
                    columns: string[];
                    include_history?: undefined;
                };
            };
        })[];
        export { sections_4 as sections };
        let next_topics_4: string[];
        export { next_topics_4 as next_topics };
    }
    namespace troubleshooting {
        let title_5: string;
        export { title_5 as title };
        let description_5: string;
        export { description_5 as description };
        let sections_5: ({
            title: string;
            content: string;
            example?: undefined;
        } | {
            title: string;
            content: string;
            example: {
                tool: string;
                args: {};
            };
        })[];
        export { sections_5 as sections };
        let next_topics_5: string[];
        export { next_topics_5 as next_topics };
    }
    namespace advanced {
        let title_6: string;
        export { title_6 as title };
        let description_6: string;
        export { description_6 as description };
        let sections_6: {
            title: string;
            content: string;
        }[];
        export { sections_6 as sections };
        let next_topics_6: string[];
        export { next_topics_6 as next_topics };
    }
}
/**
 * Interactive Help System
 */
export class InteractiveHelp {
    currentTopic: any;
    history: any[];
    /**
     * Get help for a topic
     */
    getTopic(topic: any): any;
    /**
     * Search help content
     */
    search(query: any): {
        topic: string;
        title: string;
        description: string;
        relevance: number;
    }[];
    /**
     * Calculate relevance score
     */
    calculateRelevance(content: any, query: any): number;
    /**
     * Get suggested next topics
     */
    getSuggestedTopics(): any;
    /**
     * List all topics
     */
    listTopics(): {
        topic: string;
        title: string;
        description: string;
    }[];
    /**
     * Get help history
     */
    getHistory(): any[];
    /**
     * Clear history
     */
    clearHistory(): void;
}
/**
 * Interactive Tour
 * Guided walkthrough of features
 */
export class InteractiveTour {
    constructor(connectionManager: any);
    connectionManager: any;
    currentStep: number;
    steps: ({
        title: string;
        description: string;
        action: null;
        tool?: undefined;
        args?: undefined;
    } | {
        title: string;
        description: string;
        tool: string;
        args: {
            sql?: undefined;
        };
        action?: undefined;
    } | {
        title: string;
        description: string;
        tool: string;
        args: {
            sql: string;
        };
        action?: undefined;
    })[];
    /**
     * Get current step
     */
    getCurrentStep(): {
        title: string;
        description: string;
        action: null;
        tool?: undefined;
        args?: undefined;
    } | {
        title: string;
        description: string;
        tool: string;
        args: {
            sql?: undefined;
        };
        action?: undefined;
    } | {
        title: string;
        description: string;
        tool: string;
        args: {
            sql: string;
        };
        action?: undefined;
    };
    /**
     * Move to next step
     */
    nextStep(): {
        title: string;
        description: string;
        action: null;
        tool?: undefined;
        args?: undefined;
    } | {
        title: string;
        description: string;
        tool: string;
        args: {
            sql?: undefined;
        };
        action?: undefined;
    } | {
        title: string;
        description: string;
        tool: string;
        args: {
            sql: string;
        };
        action?: undefined;
    } | null;
    /**
     * Move to previous step
     */
    previousStep(): {
        title: string;
        description: string;
        action: null;
        tool?: undefined;
        args?: undefined;
    } | {
        title: string;
        description: string;
        tool: string;
        args: {
            sql?: undefined;
        };
        action?: undefined;
    } | {
        title: string;
        description: string;
        tool: string;
        args: {
            sql: string;
        };
        action?: undefined;
    } | null;
    /**
     * Reset tour
     */
    reset(): void;
    /**
     * Get progress
     */
    getProgress(): {
        current: number;
        total: number;
        percent: number;
    };
    /**
     * Is tour complete
     */
    isComplete(): boolean;
}
//# sourceMappingURL=interactiveHelp.d.ts.map