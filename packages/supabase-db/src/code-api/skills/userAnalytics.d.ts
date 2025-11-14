/**
 * User Analytics Skills
 * Common patterns for analyzing user data
 */
/**
 * Get active user growth over time
 */
export declare function getActiveUserGrowth(days?: number): Promise<{
    total: any;
    daily_average: number;
    trend: {
        date: any;
        count: any;
    }[];
}>;
/**
 * Get user retention cohort analysis
 */
export declare function getUserRetention(cohortDays?: number): Promise<{
    cohort: any;
    size: any;
    retention_rate: number;
}[]>;
/**
 * Get user engagement metrics
 */
export declare function getUserEngagement(): Promise<{
    key: string;
    items: {
        engagement_level: string;
    }[];
}[]>;
/**
 * Get user segmentation by behavior
 */
export declare function getUserSegments(): Promise<{
    count: number;
    active: number;
}[]>;
//# sourceMappingURL=userAnalytics.d.ts.map