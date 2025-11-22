/**
 * Core type definitions for the home automation graph model
 */

/**
 * Capability types that devices can support
 */
export enum CapabilityType {
  SWITCH = "switch",
  LIGHT = "light",
  DIMMER = "dimmer",
  COLOR_LIGHT = "color_light",
  THERMOSTAT = "thermostat",
  LOCK = "lock",
  COVER = "cover",
  MEDIA_PLAYER = "media_player",
  SENSOR = "sensor",
  CAMERA = "camera",
  FAN = "fan",
  VACUUM = "vacuum",
  CLIMATE = "climate",
  ALARM = "alarm",
}

/**
 * Device type classification
 */
export enum DeviceType {
  LIGHT = "light",
  SWITCH = "switch",
  THERMOSTAT = "thermostat",
  LOCK = "lock",
  COVER = "cover",
  MEDIA_PLAYER = "media_player",
  SENSOR = "sensor",
  CAMERA = "camera",
  FAN = "fan",
  VACUUM = "vacuum",
  CLIMATE = "climate",
  ALARM = "alarm",
  GENERIC = "generic",
}

/**
 * State of a capability
 */
export interface CapabilityState {
  type: CapabilityType;
  on?: boolean;
  brightness?: number; // 0-100
  color?: {
    hue?: number; // 0-360
    saturation?: number; // 0-100
    temperature?: number; // Kelvin
    rgb?: [number, number, number]; // RGB values 0-255
  };
  temperature?: number;
  targetTemperature?: number;
  mode?: string;
  position?: number; // 0-100 for covers
  locked?: boolean;
  volume?: number; // 0-100
  playing?: boolean;
  value?: unknown; // For sensors
  speed?: number; // For fans
  [key: string]: unknown; // Allow additional state properties
}

/**
 * Device capability definition
 */
export interface Capability {
  type: CapabilityType;
  supported: boolean;
  state?: CapabilityState;
}

/**
 * Area (room or zone) in the home
 */
export interface Area {
  id: string;
  name: string;
  aliases?: string[];
  floor?: string;
  parentAreaId?: string;
  tags?: string[];
}

/**
 * Device in the home
 */
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  areaId?: string;
  capabilities: Capability[];
  tags?: string[];
  adapterId: string;
  nativeId: string;
  manufacturer?: string;
  model?: string;
  online?: boolean;
  lastSeen?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Scene definition
 */
export interface Scene {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  adapterId?: string;
  nativeId?: string;
}

/**
 * Complete home state snapshot
 */
export interface HomeSnapshot {
  areas: Area[];
  devices: Device[];
  scenes: Scene[];
  timestamp: Date;
}

/**
 * Device command
 */
export interface DeviceCommand {
  deviceId: string;
  capability: CapabilityType;
  action: string;
  parameters?: Record<string, unknown>;
}

/**
 * Scene execution command
 */
export interface SceneCommand {
  sceneId: string;
  parameters?: Record<string, unknown>;
}
