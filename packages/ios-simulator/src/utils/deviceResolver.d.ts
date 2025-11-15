import type { SimulatorDevice } from "../simctl.js";
export type DeviceMatchReason =
  | "udid"
  | "name"
  | "partial-name"
  | "booted"
  | "default";
export interface DeviceMatch {
  device: SimulatorDevice;
  reason: DeviceMatchReason;
}
export declare function resolveDeviceFromQuery(
  devices: SimulatorDevice[],
  query?: string,
  fallbackName?: string,
): DeviceMatch;
//# sourceMappingURL=deviceResolver.d.ts.map
