/**
 * Policy and safety types
 */

import type { DeviceCommand, SceneCommand } from "../home-graph/types.js";

/**
 * Risk level for actions
 */
export enum RiskLevel {
  SAFE = "safe",
  MEDIUM = "medium",
  HIGH = "high",
}

/**
 * Policy decision
 */
export enum PolicyDecision {
  ALLOW = "allow",
  DENY = "deny",
  REQUIRE_CONFIRMATION = "require_confirmation",
  MODIFY = "modify",
  LOG_ONLY = "log_only",
}

/**
 * Policy evaluation result
 */
export interface PolicyResult {
  decision: PolicyDecision;
  riskLevel: RiskLevel;
  reason?: string;
  modifiedCommand?: DeviceCommand | SceneCommand;
  confirmationToken?: string;
}

/**
 * Time range for quiet hours
 */
export interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
  days?: number[]; // 0-6 (Sunday-Saturday), undefined means all days
}

/**
 * Device policy rule
 */
export interface DevicePolicy {
  id?: string;
  deviceId?: string;
  deviceType?: string;
  capabilityType?: string;
  action?: string;
  areaId?: string;
  tags?: string[];
  riskLevel?: RiskLevel;
  decision?: PolicyDecision;
  allowedRange?: {
    min?: number;
    max?: number;
  };
  quietHours?: TimeRange[];
  requireConfirmation?: boolean;
  requirePin?: boolean;
  pin?: string;
  enabled?: boolean;
}

/**
 * Scene policy rule
 */
export interface ScenePolicy {
  id?: string;
  sceneId?: string;
  sceneName?: string;
  riskLevel?: RiskLevel;
  decision?: PolicyDecision;
  requireConfirmation?: boolean;
  requirePin?: boolean;
  pin?: string;
  quietHours?: TimeRange[];
  enabled?: boolean;
}

/**
 * Global policy configuration
 */
export interface PolicyConfig {
  defaultRiskLevel: RiskLevel;
  devicePolicies: DevicePolicy[];
  scenePolicies: ScenePolicy[];
  globalSettings: {
    allowHighRiskActions: boolean;
    requireConfirmationForHighRisk: boolean;
    enableQuietHours: boolean;
    quietHours?: TimeRange[];
    temperatureBounds?: {
      min: number;
      max: number;
    };
    brightnessBounds?: {
      min: number;
      max: number;
    };
    enableAuditLog: boolean;
    auditLogMaxEntries?: number;
    confirmationTimeout?: number; // seconds
  };
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  tool: string;
  deviceId?: string;
  sceneId?: string;
  command?: DeviceCommand | SceneCommand;
  decision: PolicyDecision;
  riskLevel: RiskLevel;
  reason?: string;
  success: boolean;
  error?: string;
  confirmedBy?: string;
}

/**
 * Pending confirmation action
 */
export interface PendingConfirmation {
  token: string;
  command: DeviceCommand | SceneCommand;
  type: "device" | "scene";
  riskLevel: RiskLevel;
  reason: string;
  timestamp: Date;
  expiresAt: Date;
  deviceId?: string;
  sceneId?: string;
}
