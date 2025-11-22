/**
 * Policy Engine - Evaluates actions against safety policies
 */

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
  },
};

/**
 * PolicyEngine evaluates all actions against user-defined policies
 */
export class PolicyEngine {
  private config: PolicyConfig;

  constructor(config?: Partial<PolicyConfig>) {
    this.config = {
      ...DEFAULT_POLICY,
      ...config,
      globalSettings: {
        ...DEFAULT_POLICY.globalSettings,
        ...config?.globalSettings,
      },
    };
  }

  /**
   * Evaluate a device command
   */
  evaluateDeviceCommand(
    command: DeviceCommand,
    device?: Device
  ): PolicyResult {
    // Determine base risk level
    const riskLevel = this.determineDeviceCommandRisk(command, device);

    // Check for specific device policies
    const matchingPolicy = this.findMatchingDevicePolicy(command, device);

    // Make decision
    let decision = PolicyDecision.ALLOW;
    let reason: string | undefined;

    if (matchingPolicy) {
      if (matchingPolicy.decision) {
        decision = matchingPolicy.decision;
        reason = "Matched specific device policy";
      } else if (matchingPolicy.requireConfirmation) {
        decision = PolicyDecision.REQUIRE_CONFIRMATION;
        reason = "Device policy requires confirmation";
      }

      // Check allowed ranges
      if (
        matchingPolicy.allowedRange &&
        command.parameters?.value !== undefined
      ) {
        const value = command.parameters.value as number;
        if (
          (matchingPolicy.allowedRange.min !== undefined &&
            value < matchingPolicy.allowedRange.min) ||
          (matchingPolicy.allowedRange.max !== undefined &&
            value > matchingPolicy.allowedRange.max)
        ) {
          decision = PolicyDecision.DENY;
          reason = "Value outside allowed range";
        }
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
}
