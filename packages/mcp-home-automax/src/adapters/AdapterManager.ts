/**
 * Adapter Manager - Manages multiple adapters and routes commands
 */

import type { IAdapter } from "./BaseAdapter.js";
import type {
  Device,
  Scene,
  Area,
  DeviceCommand,
  SceneCommand,
} from "../home-graph/types.js";

/**
 * Command queue item
 */
interface QueuedCommand {
  type: "device" | "scene";
  command: DeviceCommand | SceneCommand;
  adapterId: string;
  priority: number;
  timestamp: Date;
  resolve: () => void;
  reject: (error: Error) => void;
}

/**
 * Adapter priority configuration
 */
interface AdapterPriority {
  adapterId: string;
  priority: number; // Higher number = higher priority
}

/**
 * Manages all adapters and coordinates their operations
 */
export class AdapterManager {
  private adapters: Map<string, IAdapter> = new Map();
  private adapterPriorities: Map<string, number> = new Map();
  private commandQueue: QueuedCommand[] = [];
  private isProcessingQueue: boolean = false;
  private maxQueueSize: number = 1000;
  private commandsPerSecond: number = 10;
  private lastCommandTime: number = 0;
  private commandThrottleDelay: number = 100; // ms between commands

  /**
   * Register an adapter
   */
  registerAdapter(adapter: IAdapter, priority: number = 0): void {
    this.adapters.set(adapter.id, adapter);
    this.adapterPriorities.set(adapter.id, priority);
  }

  /**
   * Set adapter priority
   */
  setAdapterPriority(adapterId: string, priority: number): void {
    this.adapterPriorities.set(adapterId, priority);
  }

  /**
   * Get adapter priority
   */
  getAdapterPriority(adapterId: string): number {
    return this.adapterPriorities.get(adapterId) || 0;
  }

  /**
   * Unregister an adapter
   */
  unregisterAdapter(adapterId: string): void {
    this.adapters.delete(adapterId);
  }

  /**
   * Get an adapter by ID
   */
  getAdapter(adapterId: string): IAdapter | undefined {
    return this.adapters.get(adapterId);
  }

  /**
   * Get all adapters
   */
  getAllAdapters(): IAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Initialize all adapters
   */
  async initializeAll(): Promise<void> {
    const promises = Array.from(this.adapters.values()).map((adapter) =>
      adapter.initialize().catch((error) => {
        console.error(`Failed to initialize adapter ${adapter.id}:`, error);
      })
    );
    await Promise.all(promises);
  }

  /**
   * Shutdown all adapters
   */
  async shutdownAll(): Promise<void> {
    const promises = Array.from(this.adapters.values()).map((adapter) =>
      adapter.shutdown().catch((error) => {
        console.error(`Failed to shutdown adapter ${adapter.id}:`, error);
      })
    );
    await Promise.all(promises);
  }

  /**
   * Discover all devices from all adapters
   */
  async discoverAllDevices(): Promise<Device[]> {
    const deviceArrays = await Promise.all(
      Array.from(this.adapters.values()).map((adapter) =>
        adapter.discoverDevices().catch((error) => {
          console.error(
            `Failed to discover devices from adapter ${adapter.id}:`,
            error
          );
          return [] as Device[];
        })
      )
    );
    return deviceArrays.flat();
  }

  /**
   * Discover all scenes from all adapters
   */
  async discoverAllScenes(): Promise<Scene[]> {
    const sceneArrays = await Promise.all(
      Array.from(this.adapters.values()).map((adapter) =>
        adapter.discoverScenes().catch((error) => {
          console.error(
            `Failed to discover scenes from adapter ${adapter.id}:`,
            error
          );
          return [] as Scene[];
        })
      )
    );
    return sceneArrays.flat();
  }

  /**
   * Discover all areas from all adapters
   */
  async discoverAllAreas(): Promise<Area[]> {
    const areaArrays = await Promise.all(
      Array.from(this.adapters.values()).map((adapter) =>
        adapter.discoverAreas().catch((error) => {
          console.error(
            `Failed to discover areas from adapter ${adapter.id}:`,
            error
          );
          return [] as Area[];
        })
      )
    );
    return areaArrays.flat();
  }

  /**
   * Execute a device command through the appropriate adapter
   */
  async executeDeviceCommand(
    command: DeviceCommand,
    adapterId: string
  ): Promise<void> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterId}`);
    }
    await adapter.executeCommand(command);
  }

  /**
   * Execute a scene command through the appropriate adapter
   */
  async executeSceneCommand(
    command: SceneCommand,
    adapterId: string
  ): Promise<void> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterId}`);
    }
    await adapter.executeScene(command);
  }

  /**
   * Refresh all adapters
   */
  async refreshAll(): Promise<void> {
    const promises = Array.from(this.adapters.values()).map((adapter) =>
      adapter.refresh().catch((error) => {
        console.error(`Failed to refresh adapter ${adapter.id}:`, error);
      })
    );
    await Promise.all(promises);
  }

  /**
   * Get status of all adapters
   */
  getAllStatus() {
    return Array.from(this.adapters.values()).map((adapter) => ({
      id: adapter.id,
      type: adapter.type,
      priority: this.getAdapterPriority(adapter.id),
      ...adapter.getStatus(),
    }));
  }

  /**
   * Execute a device command with queuing (non-blocking)
   */
  async queueDeviceCommand(
    command: DeviceCommand,
    adapterId: string,
    priority: number = 0
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.commandQueue.length >= this.maxQueueSize) {
        reject(new Error("Command queue is full"));
        return;
      }

      this.commandQueue.push({
        type: "device",
        command,
        adapterId,
        priority,
        timestamp: new Date(),
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  /**
   * Execute a scene command with queuing (non-blocking)
   */
  async queueSceneCommand(
    command: SceneCommand,
    adapterId: string,
    priority: number = 0
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.commandQueue.length >= this.maxQueueSize) {
        reject(new Error("Command queue is full"));
        return;
      }

      this.commandQueue.push({
        type: "scene",
        command,
        adapterId,
        priority,
        timestamp: new Date(),
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  /**
   * Process the command queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.commandQueue.length > 0) {
      // Sort queue by priority (higher first) and timestamp (older first)
      this.commandQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      const item = this.commandQueue.shift();
      if (!item) {
        break;
      }

      // Throttle commands
      const now = Date.now();
      const timeSinceLastCommand = now - this.lastCommandTime;
      if (timeSinceLastCommand < this.commandThrottleDelay) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.commandThrottleDelay - timeSinceLastCommand)
        );
      }

      try {
        if (item.type === "device") {
          await this.executeDeviceCommand(
            item.command as DeviceCommand,
            item.adapterId
          );
        } else {
          await this.executeSceneCommand(
            item.command as SceneCommand,
            item.adapterId
          );
        }
        item.resolve();
      } catch (error) {
        item.reject(error as Error);
      }

      this.lastCommandTime = Date.now();
    }

    this.isProcessingQueue = false;
  }

  /**
   * Execute multiple device commands in bulk
   */
  async executeBulkDeviceCommands(
    commands: Array<{ command: DeviceCommand; adapterId: string }>
  ): Promise<void> {
    const promises = commands.map(({ command, adapterId }) =>
      this.executeDeviceCommand(command, adapterId).catch((error) => {
        console.error(
          `Failed to execute command on device ${command.deviceId}:`,
          error
        );
      })
    );
    await Promise.all(promises);
  }

  /**
   * Execute multiple scene commands in bulk
   */
  async executeBulkSceneCommands(
    commands: Array<{ command: SceneCommand; adapterId: string }>
  ): Promise<void> {
    const promises = commands.map(({ command, adapterId }) =>
      this.executeSceneCommand(command, adapterId).catch((error) => {
        console.error(
          `Failed to execute scene ${command.sceneId}:`,
          error
        );
      })
    );
    await Promise.all(promises);
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return {
      queueLength: this.commandQueue.length,
      maxQueueSize: this.maxQueueSize,
      isProcessing: this.isProcessingQueue,
      commandsPerSecond: this.commandsPerSecond,
      throttleDelay: this.commandThrottleDelay,
    };
  }

  /**
   * Clear the command queue
   */
  clearQueue(): void {
    const items = this.commandQueue.splice(0);
    for (const item of items) {
      item.reject(new Error("Queue cleared"));
    }
  }
}
