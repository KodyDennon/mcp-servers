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
} from "./types.js";

/**
 * HomeGraph manages the normalized, adapter-agnostic representation of the home
 */
export class HomeGraph {
  private areas: Map<string, Area> = new Map();
  private devices: Map<string, Device> = new Map();
  private scenes: Map<string, Scene> = new Map();

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
   * Find devices by name (case-insensitive, fuzzy)
   */
  findDevicesByName(name: string): Device[] {
    const lowerName = name.toLowerCase();
    return Array.from(this.devices.values()).filter((device) =>
      device.name.toLowerCase().includes(lowerName)
    );
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
   * Get a complete snapshot of the home state
   */
  getSnapshot(): HomeSnapshot {
    return {
      areas: this.getAllAreas(),
      devices: this.getAllDevices(),
      scenes: this.getAllScenes(),
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
  }

  /**
   * Get statistics about the home
   */
  getStats() {
    return {
      areaCount: this.areas.size,
      deviceCount: this.devices.size,
      sceneCount: this.scenes.size,
      onlineDevices: Array.from(this.devices.values()).filter(
        (d) => d.online !== false
      ).length,
    };
  }
}
