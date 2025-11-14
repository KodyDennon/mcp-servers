/**
 * User Analytics Skills
 * Common patterns for analyzing user data
 */

import { query } from '../query.js';
import { DataPipeline } from '../pipeline.js';

/**
 * Get active user growth over time
 */
export async function getActiveUserGrowth(days: number = 30) {
  const sql = `
    SELECT DATE(created_at) as date, COUNT(*) as new_users
    FROM users
    WHERE created_at > NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `;

  const result = await query({ sql, cache: true });

  return {
    total: result.rows.reduce((sum, r) => sum + r.new_users, 0),
    daily_average: result.rows.reduce((sum, r) => sum + r.new_users, 0) / days,
    trend: result.rows.map(r => ({ date: r.date, count: r.new_users })),
  };
}

/**
 * Get user retention cohort analysis
 */
export async function getUserRetention(cohortDays: number = 7) {
  const sql = `
    SELECT
      DATE_TRUNC('week', u.created_at) as cohort_week,
      COUNT(DISTINCT u.id) as cohort_size,
      COUNT(DISTINCT CASE WHEN a.timestamp > u.created_at + INTERVAL '7 days' THEN u.id END) as retained_week_1
    FROM users u
    LEFT JOIN activity_log a ON u.id = a.user_id
    WHERE u.created_at > NOW() - INTERVAL '${cohortDays * 7} days'
    GROUP BY cohort_week
    ORDER BY cohort_week DESC
  `;

  const result = await query({ sql, cache: true });

  return result.rows.map(r => ({
    cohort: r.cohort_week,
    size: r.cohort_size,
    retention_rate: r.cohort_size > 0 ? (r.retained_week_1 / r.cohort_size) * 100 : 0,
  }));
}

/**
 * Get user engagement metrics
 */
export async function getUserEngagement() {
  const result = await query({
    sql: `
      SELECT
        u.id,
        u.email,
        COUNT(a.id) as activity_count,
        MAX(a.timestamp) as last_active
      FROM users u
      LEFT JOIN activity_log a ON u.id = a.user_id
      GROUP BY u.id, u.email
    `,
    cache: true,
    privacy: 'tokenize',
  });

  return new DataPipeline(result.rows)
    .map(user => ({
      ...user,
      engagement_level:
        user.activity_count > 100 ? 'high' :
        user.activity_count > 50 ? 'medium' : 'low',
    }))
    .groupBy('engagement_level')
    .result();
}

/**
 * Get user segmentation by behavior
 */
export async function getUserSegments() {
  const result = await query({
    sql: `SELECT * FROM users`,
    cache: true,
    privacy: 'tokenize',
  });

  return new DataPipeline(result.rows)
    .groupBy(user => {
      const daysSinceSignup = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceSignup < 7) return 'new';
      if (daysSinceSignup < 30) return 'recent';
      return 'established';
    })
    .aggregate(users => ({
      count: users.length,
      active: users.filter((u: any) => u.status === 'active').length,
    }))
    .result();
}
