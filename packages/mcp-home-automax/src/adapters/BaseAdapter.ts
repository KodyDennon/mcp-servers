/**
 * Base Adapter interface and abstract class for home automation integrations
 */

import type {
  Device,
  Scene,
  Area,
  DeviceCommand,
  SceneCommand,
} from "../home-graph/types.js";

/**
 * Adapter configuration interface
 */
export interface AdapterConfig {
  id: string;
  type: string;
  enabled: boolean;
  [key: string]: unknown;
}

/**
 * Adapter status
 */
export interface AdapterStatus {
  connected: boolean;
  lastSync?: Date;
  error?: string;
  deviceCount?: number;
}

/**
 * Base adapter interface that all adapters must implement
 */
export interface IAdapter {
  /**
   * Unique identifier for this adapter instance
   */
  readonly id: string;

  /**
   * Adapter type name
   */
  readonly type: string;

  /**
   * Initialize the adapter and establish connections
   */
  initialize(): Promise<void>;

  /**
   * Shut down the adapter and clean up resources
   */
  shutdown(): Promise<void>;

  /**
   * Discover all devices from this adapter
   */
  discoverDevices(): Promise<Device[]>;

  /**
   * Discover all scenes from this adapter
   */
  discoverScenes(): Promise<Scene[]>;

  /**
   * Discover all areas from this adapter
   */
  discoverAreas(): Promise<Area[]>;

  /**
   * Get current state for a specific device
   */
  getDeviceState(deviceId: string): Promise<Device | null>;

  /**
   * Execute a command on a device
   */
  executeCommand(command: DeviceCommand): Promise<void>;

  /**
   * Execute a scene
   */
  executeScene(command: SceneCommand): Promise<void>;

  /**
   * Get adapter status
   */
  getStatus(): AdapterStatus;

  /**
   * Refresh all device states
   */
  refresh(): Promise<void>;
}

/**
 * Abstract base class for adapters with common functionality
 */
export abstract class BaseAdapter implements IAdapter {
  public readonly id: string;
  public readonly type: string;
  protected config: AdapterConfig;
  protected connected: boolean = false;
  protected lastSync?: Date;
  protected error?: string;

  constructor(config: AdapterConfig) {
    this.id = config.id;
    this.type = config.type;
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  abstract discoverDevices(): Promise<Device[]>;
  abstract discoverScenes(): Promise<Scene[]>;
  abstract discoverAreas(): Promise<Area[]>;
  abstract getDeviceState(deviceId: string): Promise<Device | null>;
  abstract executeCommand(command: DeviceCommand): Promise<void>;
  abstract executeScene(command: SceneCommand): Promise<void>;
  abstract refresh(): Promise<void>;

  getStatus(): AdapterStatus {
    return {
      connected: this.connected,
      lastSync: this.lastSync,
      error: this.error,
    };
  }

  protected setConnected(connected: boolean): void {
    this.connected = connected;
    if (connected) {
      this.error = undefined;
    }
  }

  protected setError(error: string): void {
    this.error = error;
    this.connected = false;
  }

  protected updateLastSync(): void {
    this.lastSync = new Date();
  }
}
