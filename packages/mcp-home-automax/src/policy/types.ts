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
}

/**
 * Policy evaluation result
 */
export interface PolicyResult {
  decision: PolicyDecision;
  riskLevel: RiskLevel;
  reason?: string;
  modifiedCommand?: DeviceCommand | SceneCommand;
}

/**
 * Device policy rule
 */
export interface DevicePolicy {
  deviceId?: string;
  deviceType?: string;
  capabilityType?: string;
  action?: string;
  riskLevel?: RiskLevel;
  decision?: PolicyDecision;
  allowedRange?: {
    min?: number;
    max?: number;
  };
  quietHours?: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  requireConfirmation?: boolean;
}

/**
 * Scene policy rule
 */
export interface ScenePolicy {
  sceneId?: string;
  sceneName?: string;
  riskLevel?: RiskLevel;
  decision?: PolicyDecision;
  requireConfirmation?: boolean;
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
  };
}
