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

const normalize = (value: string) => value.trim().toLowerCase();

export function resolveDeviceFromQuery(
  devices: SimulatorDevice[],
  query?: string,
  fallbackName?: string,
): DeviceMatch {
  if (!devices.length) {
    throw new Error("No simulators are available in Xcode.");
  }

  const trimmedQuery = query?.trim();
  const normalizedQuery = trimmedQuery ? normalize(trimmedQuery) : undefined;

  if (normalizedQuery === "booted") {
    const booted = devices.find((device) => device.state === "Booted");
    if (!booted) {
      throw new Error("No booted simulator found. Boot one first.");
    }
    return { device: booted, reason: "booted" };
  }

  if (normalizedQuery) {
    const byUdid = devices.find(
      (device) => normalize(device.udid) === normalizedQuery,
    );
    if (byUdid) {
      return { device: byUdid, reason: "udid" };
    }

    const byExactName = devices.find(
      (device) => normalize(device.name) === normalizedQuery,
    );
    if (byExactName) {
      return { device: byExactName, reason: "name" };
    }

    const byPartial = devices.find((device) =>
      normalize(device.name).includes(normalizedQuery),
    );
    if (byPartial) {
      return { device: byPartial, reason: "partial-name" };
    }
  }

  if (fallbackName) {
    const normalizedFallback = normalize(fallbackName);
    const fallbackDevice =
      devices.find((device) => normalize(device.name) === normalizedFallback) ??
      devices.find((device) =>
        normalize(device.name).includes(normalizedFallback),
      );
    if (fallbackDevice) {
      return { device: fallbackDevice, reason: "default" };
    }
  }

  // Default to first booted, then first device
  const booted = devices.find((device) => device.state === "Booted");
  if (booted) {
    return { device: booted, reason: "booted" };
  }

  return { device: devices[0], reason: "default" };
}
