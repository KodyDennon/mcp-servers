/**
 * Home Graph - Central model for home state and device management
 */

import type {
  Area,
  Device,
  Scene,
  HomeSnapshot,
  DeviceCommand,
  SceneCommand,
  CapabilityType,
  DeviceGroup,
  StateChangeListener,
  StateChangeEvent,
  CapabilityState,
} from "./types.js";

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * HomeGraph manages the normalized, adapter-agnostic representation of the home
 */
export class HomeGraph {
  private areas: Map<string, Area> = new Map();
  private devices: Map<string, Device> = new Map();
  private scenes: Map<string, Scene> = new Map();
  private groups: Map<string, DeviceGroup> = new Map();
  private stateChangeListeners: StateChangeListener[] = [];

  /**
   * Add or update an area
   */
  setArea(area: Area): void {
    this.areas.set(area.id, area);
  }

  /**
   * Get area by ID
   */
  getArea(id: string): Area | undefined {
    return this.areas.get(id);
  }

  /**
   * Find areas by name (case-insensitive)
   */
  findAreasByName(name: string): Area[] {
    const lowerName = name.toLowerCase();
    return Array.from(this.areas.values()).filter(
      (area) =>
        area.name.toLowerCase().includes(lowerName) ||
        area.aliases?.some((alias) => alias.toLowerCase().includes(lowerName))
    );
  }

  /**
   * Get all areas
   */
  getAllAreas(): Area[] {
    return Array.from(this.areas.values());
  }

  /**
   * Add or update a device
   */
  setDevice(device: Device): void {
    this.devices.set(device.id, device);
  }

  /**
   * Get device by ID
   */
  getDevice(id: string): Device | undefined {
    return this.devices.get(id);
  }

  /**
   * Find devices by name (case-insensitive, fuzzy with scoring)
   */
  findDevicesByName(name: string, maxResults: number = 10): Device[] {
    const lowerName = name.toLowerCase();
    const devices = Array.from(this.devices.values());

    // Calculate match scores
    const scored = devices.map((device) => {
      let score = 0;
      const deviceNameLower = device.name.toLowerCase();

      // Exact match
      if (deviceNameLower === lowerName) {
        score = 1000;
      }
      // Starts with
      else if (deviceNameLower.startsWith(lowerName)) {
        score = 500;
      }
      // Contains
      else if (deviceNameLower.includes(lowerName)) {
        score = 250;
      }
      // Check aliases
      else if (device.aliases) {
        for (const alias of device.aliases) {
          const aliasLower = alias.toLowerCase();
          if (aliasLower === lowerName) {
            score = Math.max(score, 900);
          } else if (aliasLower.startsWith(lowerName)) {
            score = Math.max(score, 400);
          } else if (aliasLower.includes(lowerName)) {
            score = Math.max(score, 200);
          }
        }
      }

      // Fuzzy match using Levenshtein distance
      if (score === 0) {
        const distance = levenshteinDistance(lowerName, deviceNameLower);
        if (distance <= 3) {
          score = 100 - distance * 20;
        }
      }

      return { device, score };
    });

    // Filter and sort by score
    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((item) => item.device);
  }

  /**
   * Find devices by area ID
   */
  findDevicesByArea(areaId: string): Device[] {
    return Array.from(this.devices.values()).filter(
      (device) => device.areaId === areaId
    );
  }

  /**
   * Find devices by capability type
   */
  findDevicesByCapability(capabilityType: CapabilityType): Device[] {
    return Array.from(this.devices.values()).filter((device) =>
      device.capabilities.some((cap) => cap.type === capabilityType)
    );
  }

  /**
   * Find devices by tag
   */
  findDevicesByTag(tag: string): Device[] {
    const lowerTag = tag.toLowerCase();
    return Array.from(this.devices.values()).filter((device) =>
      device.tags?.some((t) => t.toLowerCase() === lowerTag)
    );
  }

  /**
   * Get all devices
   */
  getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  /**
   * Remove a device
   */
  removeDevice(id: string): boolean {
    return this.devices.delete(id);
  }

  /**
   * Add or update a scene
   */
  setScene(scene: Scene): void {
    this.scenes.set(scene.id, scene);
  }

  /**
   * Get scene by ID
   */
  getScene(id: string): Scene | undefined {
    return this.scenes.get(id);
  }

  /**
   * Find scenes by name (case-insensitive)
   */
  findScenesByName(name: string): Scene[] {
    const lowerName = name.toLowerCase();
    return Array.from(this.scenes.values()).filter((scene) =>
      scene.name.toLowerCase().includes(lowerName)
    );
  }

  /**
   * Get all scenes
   */
  getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Add or update a device group
   */
  setGroup(group: DeviceGroup): void {
    this.groups.set(group.id, group);
  }

  /**
   * Get group by ID
   */
  getGroup(id: string): DeviceGroup | undefined {
    return this.groups.get(id);
  }

  /**
   * Get all groups
   */
  getAllGroups(): DeviceGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Find groups by tag
   */
  findGroupsByTag(tag: string): DeviceGroup[] {
    const lowerTag = tag.toLowerCase();
    return Array.from(this.groups.values()).filter((group) =>
      group.tags?.some((t) => t.toLowerCase() === lowerTag)
    );
  }

  /**
   * Get all devices in a group
   */
  getDevicesInGroup(groupId: string): Device[] {
    const group = this.groups.get(groupId);
    if (!group) {
      return [];
    }
    return group.deviceIds
      .map((id) => this.devices.get(id))
      .filter((d): d is Device => d !== undefined);
  }

  /**
   * Update device state and emit change event
   */
  updateDeviceState(
    deviceId: string,
    capability: CapabilityType,
    newState: CapabilityState
  ): void {
    const device = this.devices.get(deviceId);
    if (!device) {
      return;
    }

    const cap = device.capabilities.find((c) => c.type === capability);
    if (!cap) {
      return;
    }

    const oldState = cap.state;
    cap.state = newState;
    device.lastUpdated = new Date();

    // Emit state change event
    const event: StateChangeEvent = {
      deviceId,
      capability,
      oldState,
      newState,
      timestamp: new Date(),
    };

    this.emitStateChange(event);
  }

  /**
   * Register a state change listener
   */
  onStateChange(listener: StateChangeListener): void {
    this.stateChangeListeners.push(listener);
  }

  /**
   * Remove a state change listener
   */
  removeStateChangeListener(listener: StateChangeListener): void {
    const index = this.stateChangeListeners.indexOf(listener);
    if (index >= 0) {
      this.stateChangeListeners.splice(index, 1);
    }
  }

  /**
   * Emit a state change event to all listeners
   */
  private emitStateChange(event: StateChangeEvent): void {
    for (const listener of this.stateChangeListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in state change listener:", error);
      }
    }
  }

  /**
   * Get hierarchical areas (areas grouped by floor/parent)
   */
  getHierarchicalAreas(): Map<string | undefined, Area[]> {
    const hierarchy = new Map<string | undefined, Area[]>();

    for (const area of this.areas.values()) {
      const parent = area.parentAreaId || area.floor;
      if (!hierarchy.has(parent)) {
        hierarchy.set(parent, []);
      }
      hierarchy.get(parent)!.push(area);
    }

    return hierarchy;
  }

  /**
   * Get child areas of a parent area
   */
  getChildAreas(parentId: string): Area[] {
    return Array.from(this.areas.values()).filter(
      (area) => area.parentAreaId === parentId
    );
  }

  /**
   * Get a complete snapshot of the home state
   */
  getSnapshot(): HomeSnapshot {
    return {
      areas: this.getAllAreas(),
      devices: this.getAllDevices(),
      scenes: this.getAllScenes(),
      groups: this.getAllGroups(),
      timestamp: new Date(),
    };
  }

  /**
   * Clear all data (for testing or reset)
   */
  clear(): void {
    this.areas.clear();
    this.devices.clear();
    this.scenes.clear();
    this.groups.clear();
    this.stateChangeListeners = [];
  }

  /**
   * Get statistics about the home
   */
  getStats() {
    return {
      areaCount: this.areas.size,
      deviceCount: this.devices.size,
      sceneCount: this.scenes.size,
      groupCount: this.groups.size,
      onlineDevices: Array.from(this.devices.values()).filter(
        (d) => d.online !== false
      ).length,
      listenerCount: this.stateChangeListeners.length,
    };
  }
}
