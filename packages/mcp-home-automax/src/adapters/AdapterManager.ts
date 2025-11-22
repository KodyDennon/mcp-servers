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
 * Manages all adapters and coordinates their operations
 */
export class AdapterManager {
  private adapters: Map<string, IAdapter> = new Map();

  /**
   * Register an adapter
   */
  registerAdapter(adapter: IAdapter): void {
    this.adapters.set(adapter.id, adapter);
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
      ...adapter.getStatus(),
    }));
  }
}
