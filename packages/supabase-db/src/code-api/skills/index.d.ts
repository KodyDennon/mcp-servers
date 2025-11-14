/**
 * Skills Library
 * Reusable functions for common database operations
 *
 * Import and use skills in your code:
 *
 * import { getActiveUserGrowth } from './servers/supabase-db/skills/userAnalytics';
 * const growth = await getActiveUserGrowth(7);
 */
export * from './userAnalytics.js';
export * from './dataQuality.js';
export * from './reporting.js';
export declare const SKILLS: {
    userAnalytics: {
        name: string;
        description: string;
        functions: string[];
    };
    dataQuality: {
        name: string;
        description: string;
        functions: string[];
    };
    reporting: {
        name: string;
        description: string;
        functions: string[];
    };
};
//# sourceMappingURL=index.d.ts.map