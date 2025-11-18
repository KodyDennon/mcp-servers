/**
 * Sandbox security configuration for code execution mode
 * Defines safe execution boundaries and resource limits
 */
import type { SandboxConfig } from "./types.js";
export declare const defaultSandboxConfig: SandboxConfig;
/**
 * Validate if a module import is allowed
 */
export declare function isModuleAllowed(
  modulePath: string,
  config?: SandboxConfig,
): boolean;
/**
 * Check if operation is allowed
 */
export declare function isOperationAllowed(
  operation: "read" | "write" | "admin",
  config?: SandboxConfig,
): boolean;
/**
 * Get config for specific environment
 */
export declare function getSandboxConfig(env?: string): SandboxConfig;
/**
 * Check if currently running in sandbox mode
 */
export declare function isSandboxMode(): boolean;
/**
 * Get execution mode from environment
 */
export declare function getExecutionMode(): "sandbox" | "direct";
//# sourceMappingURL=sandbox.config.d.ts.map
