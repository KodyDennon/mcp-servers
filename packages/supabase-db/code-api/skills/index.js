/**
 * Skills Library
 * Reusable functions for common database operations
 *
 * Import and use skills in your code:
 *
 * import { getActiveUserGrowth } from './servers/supabase-db/skills/userAnalytics';
 * const growth = await getActiveUserGrowth(7);
 */
// User Analytics
export * from "./userAnalytics.js";
// Data Quality
export * from "./dataQuality.js";
// Reporting
export * from "./reporting.js";
// Skill metadata
export const SKILLS = {
  userAnalytics: {
    name: "User Analytics",
    description: "Common patterns for analyzing user data",
    functions: [
      "getActiveUserGrowth",
      "getUserRetention",
      "getUserEngagement",
      "getUserSegments",
    ],
  },
  dataQuality: {
    name: "Data Quality",
    description: "Common patterns for data validation and cleaning",
    functions: [
      "findDuplicates",
      "findNullValues",
      "getColumnStats",
      "validateEmails",
      "findOutliers",
    ],
  },
  reporting: {
    name: "Reporting",
    description: "Common patterns for generating reports",
    functions: [
      "getDailySummary",
      "getTopN",
      "getTimeSeries",
      "getCohortReport",
    ],
  },
};
//# sourceMappingURL=index.js.map
