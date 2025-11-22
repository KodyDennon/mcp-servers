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
  healthy: boolean;
  lastSync?: Date;
  lastHealthCheck?: Date;
  error?: string;
  deviceCount?: number;
  reconnectAttempts?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Adapter event types
 */
export type AdapterEventType =
  | "connected"
  | "disconnected"
  | "error"
  | "device_discovered"
  | "device_removed"
  | "state_changed";

/**
 * Adapter event
 */
export interface AdapterEvent {
  type: AdapterEventType;
  adapterId: string;
  timestamp: Date;
  data?: unknown;
}

/**
 * Adapter event listener
 */
export type AdapterEventListener = (event: AdapterEvent) => void;

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

  /**
   * Perform health check
   */
  healthCheck(): Promise<boolean>;

  /**
   * Attempt to reconnect
   */
  reconnect(): Promise<void>;

  /**
   * Subscribe to adapter events
   */
  on(listener: AdapterEventListener): void;

  /**
   * Unsubscribe from adapter events
   */
  off(listener: AdapterEventListener): void;
}

/**
 * Abstract base class for adapters with common functionality
 */
export abstract class BaseAdapter implements IAdapter {
  public readonly id: string;
  public readonly type: string;
  protected config: AdapterConfig;
  protected connected: boolean = false;
  protected healthy: boolean = false;
  protected lastSync?: Date;
  protected lastHealthCheck?: Date;
  protected error?: string;
  protected reconnectAttempts: number = 0;
  protected maxReconnectAttempts: number = 5;
  protected reconnectDelay: number = 5000; // 5 seconds
  protected reconnectTimer?: NodeJS.Timeout;
  protected healthCheckTimer?: NodeJS.Timeout;
  protected healthCheckInterval: number = 60000; // 1 minute
  protected eventListeners: AdapterEventListener[] = [];

  constructor(config: AdapterConfig) {
    this.id = config.id;
    this.type = config.type;
    this.config = config;

    // Override defaults from config if provided
    if (typeof config.maxReconnectAttempts === "number") {
      this.maxReconnectAttempts = config.maxReconnectAttempts;
    }
    if (typeof config.reconnectDelay === "number") {
      this.reconnectDelay = config.reconnectDelay;
    }
    if (typeof config.healthCheckInterval === "number") {
      this.healthCheckInterval = config.healthCheckInterval;
    }
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

  /**
   * Default health check implementation - can be overridden
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Default: attempt to discover devices as a health check
      await this.discoverDevices();
      this.healthy = true;
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      this.healthy = false;
      this.lastHealthCheck = new Date();
      return false;
    }
  }

  /**
   * Reconnect logic with exponential backoff
   */
  async reconnect(): Promise<void> {
    if (this.reconnectTimer) {
      return; // Already reconnecting
    }

    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      const error = `Max reconnect attempts (${this.maxReconnectAttempts}) reached`;
      this.setError(error);
      this.emit({
        type: "error",
        adapterId: this.id,
        timestamp: new Date(),
        data: { error },
      });
      return;
    }

    try {
      await this.shutdown();
      await this.initialize();
      this.reconnectAttempts = 0;
      this.emit({
        type: "connected",
        adapterId: this.id,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setError(errorMessage);

      // Schedule next reconnect with exponential backoff
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = undefined;
        this.reconnect();
      }, delay);

      this.emit({
        type: "error",
        adapterId: this.id,
        timestamp: new Date(),
        data: { error: errorMessage, reconnectAttempt: this.reconnectAttempts },
      });
    }
  }

  /**
   * Subscribe to events
   */
  on(listener: AdapterEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Unsubscribe from events
   */
  off(listener: AdapterEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index >= 0) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit an event to all listeners
   */
  protected emit(event: AdapterEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in adapter event listener:", error);
      }
    }
  }

  /**
   * Start automatic health checking
   */
  protected startHealthCheck(): void {
    if (this.healthCheckTimer) {
      return;
    }

    this.healthCheckTimer = setInterval(async () => {
      const healthy = await this.healthCheck();
      if (!healthy && this.connected) {
        await this.reconnect();
      }
    }, this.healthCheckInterval);
  }

  /**
   * Stop automatic health checking
   */
  protected stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  getStatus(): AdapterStatus {
    return {
      connected: this.connected,
      healthy: this.healthy,
      lastSync: this.lastSync,
      lastHealthCheck: this.lastHealthCheck,
      error: this.error,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  protected setConnected(connected: boolean): void {
    const wasConnected = this.connected;
    this.connected = connected;
    this.healthy = connected;

    if (connected) {
      this.error = undefined;
      this.reconnectAttempts = 0;
      if (!wasConnected) {
        this.emit({
          type: "connected",
          adapterId: this.id,
          timestamp: new Date(),
        });
      }
    } else if (wasConnected) {
      this.emit({
        type: "disconnected",
        adapterId: this.id,
        timestamp: new Date(),
      });
    }
  }

  protected setError(error: string): void {
    this.error = error;
    this.healthy = false;
    this.emit({
      type: "error",
      adapterId: this.id,
      timestamp: new Date(),
      data: { error },
    });
  }

  protected updateLastSync(): void {
    this.lastSync = new Date();
  }
}
