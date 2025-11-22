/**
 * Policy Engine - Evaluates actions against safety policies
 */

import { randomUUID } from "crypto";
import type {
  DeviceCommand,
  SceneCommand,
  Device,
  Scene,
} from "../home-graph/types.js";
import {
  RiskLevel,
  PolicyDecision,
  type PolicyResult,
  type PolicyConfig,
  type DevicePolicy,
  type ScenePolicy,
  type AuditLogEntry,
  type PendingConfirmation,
  type TimeRange,
} from "./types.js";
import { CapabilityType, DeviceType } from "../home-graph/types.js";

/**
 * Default policy configuration
 */
const DEFAULT_POLICY: PolicyConfig = {
  defaultRiskLevel: RiskLevel.SAFE,
  devicePolicies: [],
  scenePolicies: [],
  globalSettings: {
    allowHighRiskActions: true,
    requireConfirmationForHighRisk: true,
    enableQuietHours: false,
    enableAuditLog: true,
    auditLogMaxEntries: 1000,
    confirmationTimeout: 300, // 5 minutes
  },
};

/**
 * PolicyEngine evaluates all actions against user-defined policies
 */
export class PolicyEngine {
  private config: PolicyConfig;
  private auditLog: AuditLogEntry[] = [];
  private pendingConfirmations: Map<string, PendingConfirmation> = new Map();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<PolicyConfig>) {
    this.config = {
      ...DEFAULT_POLICY,
      ...config,
      globalSettings: {
        ...DEFAULT_POLICY.globalSettings,
        ...config?.globalSettings,
      },
    };

    // Start cleanup timer for expired confirmations
    this.startCleanupTimer();
  }

  /**
   * Start timer to clean up expired confirmations
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredConfirmations();
    }, 60000); // Check every minute
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Clean up expired pending confirmations
   */
  private cleanupExpiredConfirmations(): void {
    const now = new Date();
    const expired: string[] = [];

    for (const [token, confirmation] of this.pendingConfirmations) {
      if (confirmation.expiresAt < now) {
        expired.push(token);
      }
    }

    for (const token of expired) {
      this.pendingConfirmations.delete(token);
    }
  }

  /**
   * Evaluate a device command
   */
  evaluateDeviceCommand(
    command: DeviceCommand,
    device?: Device,
    toolName: string = "unknown"
  ): PolicyResult {
    // Determine base risk level
    const riskLevel = this.determineDeviceCommandRisk(command, device);

    // Check for specific device policies
    const matchingPolicy = this.findMatchingDevicePolicy(command, device);

    // Make decision
    let decision = PolicyDecision.ALLOW;
    let reason: string | undefined;
    let confirmationToken: string | undefined;

    // Check quiet hours
    if (this.isQuietHoursViolation(matchingPolicy?.quietHours)) {
      decision = PolicyDecision.DENY;
      reason = "Action denied during quiet hours";
    } else if (matchingPolicy) {
      // Check if policy is enabled
      if (matchingPolicy.enabled === false) {
        decision = PolicyDecision.DENY;
        reason = "Policy is disabled";
      } else if (matchingPolicy.decision) {
        decision = matchingPolicy.decision;
        reason = "Matched specific device policy";
      } else if (matchingPolicy.requireConfirmation) {
        decision = PolicyDecision.REQUIRE_CONFIRMATION;
        reason = "Device policy requires confirmation";
      }

      // Check allowed ranges
      if (matchingPolicy.allowedRange) {
        const rangeCheck = this.checkValueRange(
          command,
          matchingPolicy.allowedRange
        );
        if (!rangeCheck.valid) {
          decision = PolicyDecision.DENY;
          reason = rangeCheck.reason;
        }
      }
    } else {
      // Check global bounds
      const boundsCheck = this.checkGlobalBounds(command);
      if (!boundsCheck.valid) {
        decision = PolicyDecision.DENY;
        reason = boundsCheck.reason;
      }

      // Apply global policy based on risk level
      if (riskLevel === RiskLevel.HIGH) {
        if (!this.config.globalSettings.allowHighRiskActions) {
          decision = PolicyDecision.DENY;
          reason = "High-risk actions are disabled";
        } else if (this.config.globalSettings.requireConfirmationForHighRisk) {
          decision = PolicyDecision.REQUIRE_CONFIRMATION;
          reason = "High-risk action requires confirmation";
        }
      }
    }

    // Create confirmation token if needed
    if (decision === PolicyDecision.REQUIRE_CONFIRMATION) {
      confirmationToken = this.createPendingConfirmation(
        command,
        "device",
        riskLevel,
        reason || "Confirmation required",
        device?.id
      );
    }

    // Log audit entry
    this.logAudit({
      id: randomUUID(),
      timestamp: new Date(),
      tool: toolName,
      deviceId: command.deviceId,
      command,
      decision,
      riskLevel,
      reason,
      success: decision !== PolicyDecision.DENY,
    });

    return {
      decision,
      riskLevel,
      reason,
      confirmationToken,
    };
  }

  /**
   * Check if current time violates quiet hours
   */
  private isQuietHoursViolation(quietHours?: TimeRange[]): boolean {
    if (!this.config.globalSettings.enableQuietHours) {
      return false;
    }

    const ranges =
      quietHours || this.config.globalSettings.quietHours || [];

    if (ranges.length === 0) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay();
    const currentTime = currentHour * 60 + currentMinute;

    for (const range of ranges) {
      // Check if day matches
      if (range.days && !range.days.includes(currentDay)) {
        continue;
      }

      const [startHour, startMinute] = range.start.split(":").map(Number);
      const [endHour, endMinute] = range.end.split(":").map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      // Handle overnight ranges
      if (startTime > endTime) {
        if (currentTime >= startTime || currentTime <= endTime) {
          return true;
        }
      } else {
        if (currentTime >= startTime && currentTime <= endTime) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check value against allowed range
   */
  private checkValueRange(
    command: DeviceCommand,
    range: { min?: number; max?: number }
  ): { valid: boolean; reason?: string } {
    const params = command.parameters || {};

    // Check various parameter types
    const valueChecks = [
      { key: "temperature", name: "Temperature" },
      { key: "brightness", name: "Brightness" },
      { key: "position", name: "Position" },
      { key: "volume", name: "Volume" },
      { key: "value", name: "Value" },
    ];

    for (const check of valueChecks) {
      if (params[check.key] !== undefined) {
        const value = params[check.key] as number;
        if (range.min !== undefined && value < range.min) {
          return {
            valid: false,
            reason: `${check.name} ${value} is below minimum ${range.min}`,
          };
        }
        if (range.max !== undefined && value > range.max) {
          return {
            valid: false,
            reason: `${check.name} ${value} is above maximum ${range.max}`,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Check against global bounds
   */
  private checkGlobalBounds(
    command: DeviceCommand
  ): { valid: boolean; reason?: string } {
    const params = command.parameters || {};

    // Check temperature bounds
    if (
      this.config.globalSettings.temperatureBounds &&
      params.temperature !== undefined
    ) {
      const temp = params.temperature as number;
      const bounds = this.config.globalSettings.temperatureBounds;

      if (temp < bounds.min) {
        return {
          valid: false,
          reason: `Temperature ${temp} is below global minimum ${bounds.min}`,
        };
      }
      if (temp > bounds.max) {
        return {
          valid: false,
          reason: `Temperature ${temp} is above global maximum ${bounds.max}`,
        };
      }
    }

    // Check brightness bounds
    if (
      this.config.globalSettings.brightnessBounds &&
      params.brightness !== undefined
    ) {
      const brightness = params.brightness as number;
      const bounds = this.config.globalSettings.brightnessBounds;

      if (brightness < bounds.min) {
        return {
          valid: false,
          reason: `Brightness ${brightness} is below global minimum ${bounds.min}`,
        };
      }
      if (brightness > bounds.max) {
        return {
          valid: false,
          reason: `Brightness ${brightness} is above global maximum ${bounds.max}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Create a pending confirmation
   */
  private createPendingConfirmation(
    command: DeviceCommand | SceneCommand,
    type: "device" | "scene",
    riskLevel: RiskLevel,
    reason: string,
    deviceOrSceneId?: string
  ): string {
    const token = randomUUID();
    const timeout =
      this.config.globalSettings.confirmationTimeout || 300;
    const expiresAt = new Date(Date.now() + timeout * 1000);

    const pending: PendingConfirmation = {
      token,
      command,
      type,
      riskLevel,
      reason,
      timestamp: new Date(),
      expiresAt,
    };

    if (type === "device") {
      pending.deviceId = (command as DeviceCommand).deviceId;
    } else {
      pending.sceneId = (command as SceneCommand).sceneId;
    }

    this.pendingConfirmations.set(token, pending);
    return token;
  }

  /**
   * Evaluate a scene command
   */
  evaluateSceneCommand(command: SceneCommand, scene?: Scene): PolicyResult {
    // Determine base risk level
    const riskLevel = this.determineSceneCommandRisk(command, scene);

    // Check for specific scene policies
    const matchingPolicy = this.findMatchingScenePolicy(command, scene);

    // Make decision
    let decision = PolicyDecision.ALLOW;
    let reason: string | undefined;

    if (matchingPolicy) {
      if (matchingPolicy.decision) {
        decision = matchingPolicy.decision;
        reason = "Matched specific scene policy";
      } else if (matchingPolicy.requireConfirmation) {
        decision = PolicyDecision.REQUIRE_CONFIRMATION;
        reason = "Scene policy requires confirmation";
      }
    } else {
      // Apply global policy based on risk level
      if (riskLevel === RiskLevel.HIGH) {
        if (!this.config.globalSettings.allowHighRiskActions) {
          decision = PolicyDecision.DENY;
          reason = "High-risk actions are disabled";
        } else if (this.config.globalSettings.requireConfirmationForHighRisk) {
          decision = PolicyDecision.REQUIRE_CONFIRMATION;
          reason = "High-risk action requires confirmation";
        }
      }
    }

    return {
      decision,
      riskLevel,
      reason,
    };
  }

  /**
   * Determine risk level for a device command
   */
  private determineDeviceCommandRisk(
    command: DeviceCommand,
    device?: Device
  ): RiskLevel {
    // High-risk capabilities and actions
    if (
      command.capability === CapabilityType.LOCK ||
      command.capability === CapabilityType.ALARM
    ) {
      if (command.action === "unlock" || command.action === "disarm") {
        return RiskLevel.HIGH;
      }
    }

    if (device?.type === DeviceType.LOCK && command.action === "unlock") {
      return RiskLevel.HIGH;
    }

    // Medium-risk capabilities
    if (
      command.capability === CapabilityType.THERMOSTAT ||
      command.capability === CapabilityType.CLIMATE
    ) {
      return RiskLevel.MEDIUM;
    }

    // Default to safe
    return RiskLevel.SAFE;
  }

  /**
   * Determine risk level for a scene command
   */
  private determineSceneCommandRisk(
    command: SceneCommand,
    scene?: Scene
  ): RiskLevel {
    // Scenes are generally safe unless specifically marked
    return RiskLevel.SAFE;
  }

  /**
   * Find matching device policy
   */
  private findMatchingDevicePolicy(
    command: DeviceCommand,
    device?: Device
  ): DevicePolicy | undefined {
    return this.config.devicePolicies.find((policy) => {
      if (policy.deviceId && policy.deviceId !== command.deviceId) {
        return false;
      }
      if (policy.deviceType && device && policy.deviceType !== device.type) {
        return false;
      }
      if (
        policy.capabilityType &&
        policy.capabilityType !== command.capability
      ) {
        return false;
      }
      if (policy.action && policy.action !== command.action) {
        return false;
      }
      return true;
    });
  }

  /**
   * Find matching scene policy
   */
  private findMatchingScenePolicy(
    command: SceneCommand,
    scene?: Scene
  ): ScenePolicy | undefined {
    return this.config.scenePolicies.find((policy) => {
      if (policy.sceneId && policy.sceneId !== command.sceneId) {
        return false;
      }
      if (policy.sceneName && scene && policy.sceneName !== scene.name) {
        return false;
      }
      return true;
    });
  }

  /**
   * Update policy configuration
   */
  updateConfig(config: Partial<PolicyConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      globalSettings: {
        ...this.config.globalSettings,
        ...config.globalSettings,
      },
    };
  }

  /**
   * Get current policy configuration
   */
  getConfig(): PolicyConfig {
    return { ...this.config };
  }

  /**
   * Log audit entry
   */
  private logAudit(entry: AuditLogEntry): void {
    if (!this.config.globalSettings.enableAuditLog) {
      return;
    }

    this.auditLog.push(entry);

    // Trim log if it exceeds max entries
    const maxEntries =
      this.config.globalSettings.auditLogMaxEntries || 1000;
    if (this.auditLog.length > maxEntries) {
      this.auditLog = this.auditLog.slice(-maxEntries);
    }
  }

  /**
   * Get audit log entries
   */
  getAuditLog(limit?: number): AuditLogEntry[] {
    if (limit) {
      return this.auditLog.slice(-limit);
    }
    return [...this.auditLog];
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  /**
   * Get pending confirmations
   */
  getPendingConfirmations(): PendingConfirmation[] {
    return Array.from(this.pendingConfirmations.values());
  }

  /**
   * Get a specific pending confirmation
   */
  getPendingConfirmation(token: string): PendingConfirmation | undefined {
    return this.pendingConfirmations.get(token);
  }

  /**
   * Confirm a pending action
   */
  confirmAction(token: string, confirmedBy?: string): PendingConfirmation | null {
    const pending = this.pendingConfirmations.get(token);

    if (!pending) {
      return null;
    }

    // Check if expired
    if (pending.expiresAt < new Date()) {
      this.pendingConfirmations.delete(token);
      return null;
    }

    // Remove from pending
    this.pendingConfirmations.delete(token);

    // Log confirmation
    this.logAudit({
      id: randomUUID(),
      timestamp: new Date(),
      tool: "confirmation",
      deviceId: pending.deviceId,
      sceneId: pending.sceneId,
      command: pending.command,
      decision: PolicyDecision.ALLOW,
      riskLevel: pending.riskLevel,
      reason: `Confirmed: ${pending.reason}`,
      success: true,
      confirmedBy,
    });

    return pending;
  }

  /**
   * Deny a pending action
   */
  denyAction(token: string): boolean {
    const pending = this.pendingConfirmations.get(token);

    if (!pending) {
      return false;
    }

    this.pendingConfirmations.delete(token);

    // Log denial
    this.logAudit({
      id: randomUUID(),
      timestamp: new Date(),
      tool: "confirmation",
      deviceId: pending.deviceId,
      sceneId: pending.sceneId,
      command: pending.command,
      decision: PolicyDecision.DENY,
      riskLevel: pending.riskLevel,
      reason: `Denied: ${pending.reason}`,
      success: false,
    });

    return true;
  }

  /**
   * Get audit statistics
   */
  getAuditStats() {
    const total = this.auditLog.length;
    const allowed = this.auditLog.filter(
      (e) => e.decision === PolicyDecision.ALLOW
    ).length;
    const denied = this.auditLog.filter(
      (e) => e.decision === PolicyDecision.DENY
    ).length;
    const confirmed = this.auditLog.filter(
      (e) => e.decision === PolicyDecision.REQUIRE_CONFIRMATION
    ).length;

    return {
      total,
      allowed,
      denied,
      confirmed,
      pendingConfirmations: this.pendingConfirmations.size,
    };
  }
}
