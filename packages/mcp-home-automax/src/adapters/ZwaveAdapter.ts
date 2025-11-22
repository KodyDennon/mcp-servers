/**
 * Z-Wave JS Adapter - Z-Wave device integration via Z-Wave JS
 */

import WebSocket from "ws";
import { BaseAdapter, type AdapterConfig } from "./BaseAdapter.js";
import type {
  Device,
  Scene,
  Area,
  DeviceCommand,
  SceneCommand,


  Capability,
} from "../home-graph/types.js";
import {
  DeviceType,
  CapabilityType,
} from "../home-graph/types.js";

/**
 * Z-Wave JS adapter configuration
 */
export interface ZwaveAdapterConfig extends AdapterConfig {
  type: "zwave";
  server: {
    url: string; // WebSocket URL (e.g., "ws://localhost:3000")
    apiKey?: string;
  };
  deviceFilter?: {
    include?: number[]; // Node IDs to include
    exclude?: number[]; // Node IDs to exclude
  };
}

/**
 * Z-Wave JS WebSocket message types
 */
interface ZwaveMessage {
  messageId: string;
  command: string;
  [key: string]: unknown;
}

interface ZwaveResponse {
  type: "result" | "event";
  messageId?: string;
  success?: boolean;
  result?: unknown;
  event?: {
    source: string;
    event: string;
    [key: string]: unknown;
  };
}

/**
 * Z-Wave node information
 */
interface ZwaveNode {
  nodeId: number;
  status: number;
  ready: boolean;
  deviceClass?: {
    basic: { label: string };
    generic: { label: string };
    specific: { label: string };
  };
  label?: string;
  name?: string;
  location?: string;
  manufacturerId?: number;
  manufacturer?: string;
  productId?: number;
  productType?: number;
  productLabel?: string;
  firmwareVersion?: string;
  values: Record<string, ZwaveValue>;
}

/**
 * Z-Wave value information
 */
interface ZwaveValue {
  commandClass: number;
  commandClassName: string;
  endpoint?: number;
  property: string | number;
  propertyKey?: string | number;
  propertyName?: string;
  propertyKeyName?: string;
  type: string;
  readable: boolean;
  writeable: boolean;
  label?: string;
  value?: unknown;
  unit?: string;
  min?: number;
  max?: number;
  states?: Record<number, string>;
}

/**
 * Z-Wave JS Adapter
 */
export class ZwaveAdapter extends BaseAdapter {
  private ws?: WebSocket;
  private zwaveConfig: ZwaveAdapterConfig;
  private nodes: Map<number, ZwaveNode> = new Map();
  private devices: Map<string, Device> = new Map();
  private messageCallbacks: Map<string, (response: ZwaveResponse) => void> = new Map();
  private messageIdCounter = 0;
  private zwReconnectAttempts = 0;
  private zwMaxReconnectAttempts = 5;

  constructor(config: ZwaveAdapterConfig) {
    super(config);
    this.zwaveConfig = config;
  }

  async initialize(): Promise<void> {
    try {
      await this.connectWebSocket();
      await this.discoverNodes();
      await this.discoverDevices();
      this.setConnected(true);
      this.startHealthCheck();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setError(`Failed to initialize Z-Wave adapter: ${errorMessage}`);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.stopHealthCheck();
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.setConnected(false);
  }

  /**
   * Connect to Z-Wave JS WebSocket server
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { server } = this.zwaveConfig;

      this.ws = new WebSocket(server.url);

      const timeout = setTimeout(() => {
        reject(new Error("Z-Wave WebSocket connection timeout"));
      }, 30000);

      this.ws.on("open", () => {
        clearTimeout(timeout);
        this.setupWebSocketHandlers();
        resolve();
      });

      this.ws.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.on("message", (data) => {
      try {
        const response: ZwaveResponse = JSON.parse(data.toString());
        this.handleWebSocketMessage(response);
      } catch (error) {
        this.setError(
          `Failed to parse Z-Wave message: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    this.ws.on("close", () => {
      this.setConnected(false);
      this.emit({
        type: "disconnected",
        adapterId: this.id,
        timestamp: new Date(),
      });
      // Attempt reconnection
      this.reconnect();
    });

    this.ws.on("error", (error) => {
      this.setError(`Z-Wave WebSocket error: ${error.message}`);
    });
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(response: ZwaveResponse): void {
    if (response.type === "result" && response.messageId) {
      // Handle command response
      const callback = this.messageCallbacks.get(response.messageId);
      if (callback) {
        callback(response);
        this.messageCallbacks.delete(response.messageId);
      }
    } else if (response.type === "event" && response.event) {
      // Handle event
      this.handleZwaveEvent(response.event);
    }
  }

  /**
   * Handle Z-Wave events
   */
  private handleZwaveEvent(event: ZwaveResponse["event"]): void {
    if (!event) return;

    switch (event.event) {
      case "value updated":
        this.handleValueUpdated(event);
        break;
      case "node ready":
        this.handleNodeReady(event);
        break;
      case "node added":
      case "node removed":
        // Trigger device rediscovery
        this.discoverDevices();
        break;
    }
  }

  /**
   * Handle value updated event
   */
  private handleValueUpdated(event: ZwaveResponse["event"]): void {
    if (!event) return;

    const nodeId = event.nodeId as number;
    const args = event.args as { property: string; value: unknown };

    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Update node value
    const valueId = this.getValueId(nodeId, args.property);
    if (node.values[valueId]) {
      node.values[valueId].value = args.value;
    }

    // Update device state
    const deviceId = this.getDeviceId(nodeId);
    this.updateDeviceStateFromNode(deviceId, node);

    this.emit({
      type: "state_changed",
      adapterId: this.id,
      timestamp: new Date(),
      data: { deviceId, nodeId, property: args.property, value: args.value },
    });
  }

  /**
   * Handle node ready event
   */
  private handleNodeReady(event: ZwaveResponse["event"]): void {
    if (!event) return;

    const nodeId = event.nodeId as number;
    // Refresh node information
    this.getNodeInfo(nodeId);
  }

  /**
   * Send command to Z-Wave JS server
   */
  private async sendCommand(command: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Z-Wave WebSocket not connected");
    }

    return new Promise((resolve, reject) => {
      const messageId = `msg-${++this.messageIdCounter}`;

      const message: ZwaveMessage = {
        messageId,
        command,
        ...params,
      };

      this.messageCallbacks.set(messageId, (response) => {
        if (response.success) {
          resolve(response.result);
        } else {
          reject(new Error(`Z-Wave command failed: ${JSON.stringify(response)}`));
        }
      });

      // Set timeout for response
      setTimeout(() => {
        if (this.messageCallbacks.has(messageId)) {
          this.messageCallbacks.delete(messageId);
          reject(new Error(`Z-Wave command timeout: ${command}`));
        }
      }, 10000);

      this.ws?.send(JSON.stringify(message));
    });
  }

  /**
   * Discover Z-Wave nodes
   */
  private async discoverNodes(): Promise<void> {
    try {
      const nodes = await this.sendCommand("node.get_nodes") as ZwaveNode[];

      this.nodes.clear();
      for (const node of nodes) {
        if (this.shouldIncludeNode(node.nodeId)) {
          this.nodes.set(node.nodeId, node);
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to discover Z-Wave nodes: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get node information
   */
  private async getNodeInfo(nodeId: number): Promise<ZwaveNode | null> {
    try {
      const node = await this.sendCommand("node.get_node_info", { nodeId }) as ZwaveNode;
      if (node) {
        this.nodes.set(nodeId, node);
      }
      return node;
    } catch (error) {
      this.setError(
        `Failed to get node info for ${nodeId}: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  /**
   * Check if node should be included based on filters
   */
  private shouldIncludeNode(nodeId: number): boolean {
    const { deviceFilter } = this.zwaveConfig;
    if (!deviceFilter) return true;

    // Check exclude list
    if (deviceFilter.exclude?.includes(nodeId)) {
      return false;
    }

    // Check include list (if defined, node must be in it)
    if (deviceFilter.include && deviceFilter.include.length > 0) {
      return deviceFilter.include.includes(nodeId);
    }

    return true;
  }

  async discoverDevices(): Promise<Device[]> {
    this.devices.clear();

    for (const node of this.nodes.values()) {
      const device = this.convertNodeToDevice(node);
      if (device) {
        this.devices.set(device.id, device);

        this.emit({
          type: "device_discovered",
          adapterId: this.id,
          timestamp: new Date(),
          data: { device },
        });
      }
    }

    this.updateLastSync();
    return Array.from(this.devices.values());
  }

  /**
   * Convert Z-Wave node to normalized device
   */
  private convertNodeToDevice(node: ZwaveNode): Device | null {
    if (!node.ready) {
      return null;
    }

    const capabilities = this.extractCapabilitiesFromNode(node);
    if (capabilities.length === 0) {
      return null;
    }

    const deviceType = this.inferDeviceType(node, capabilities);
    const deviceId = this.getDeviceId(node.nodeId);

    return {
      id: deviceId,
      name: node.name || node.label || `Node ${node.nodeId}`,
      type: deviceType,
      areaId: node.location,
      capabilities,
      tags: [node.deviceClass?.generic.label || "unknown"],
      adapterId: this.id,
      nativeId: String(node.nodeId),
      manufacturer: node.manufacturer,
      model: node.productLabel,
      firmwareVersion: node.firmwareVersion,
      online: node.status === 4, // 4 = alive
      lastSeen: new Date(),
      lastUpdated: new Date(),
      metadata: {
        nodeId: node.nodeId,
        deviceClass: node.deviceClass,
      },
    };
  }

  /**
   * Extract capabilities from Z-Wave node
   */
  private extractCapabilitiesFromNode(node: ZwaveNode): Capability[] {
    const capabilities: Capability[] = [];
    const addedTypes = new Set<CapabilityType>();

    for (const value of Object.values(node.values)) {
      const capability = this.mapValueToCapability(value);

      if (capability && !addedTypes.has(capability.type)) {
        capabilities.push(capability);
        addedTypes.add(capability.type);
      }
    }

    return capabilities;
  }

  /**
   * Map Z-Wave value to capability
   */
  private mapValueToCapability(value: ZwaveValue): Capability | null {
    let type: CapabilityType | null = null;

    // Map by command class
    switch (value.commandClass) {
      case 37: // Binary Switch
        type = CapabilityType.SWITCH;
        break;
      case 38: // Multilevel Switch
        type = CapabilityType.DIMMER;
        break;
      case 51: // Color Switch
        type = CapabilityType.COLOR_LIGHT
        break;
      case 64: // Thermostat Mode
      case 66: // Thermostat Setpoint
      case 67: // Thermostat Fan Mode
        type = CapabilityType.THERMOSTAT;
        break;
      case 98: // Door Lock
        type = CapabilityType.LOCK;
        break;
      case 102: // Barrier Operator (Garage Door)
        type = CapabilityType.COVER;
        break;
    }

    if (!type) return null;

    return {
      type,
      supported: true,
    };
  }

  /**
   * Infer device type from node
   */
  private inferDeviceType(node: ZwaveNode, capabilities: Capability[]): DeviceType {
    const types = capabilities.map((c) => c.type);

    // Check device class first
    const genericClass = node.deviceClass?.generic.label.toLowerCase();
    if (genericClass?.includes("switch")) {
      if (types.includes(CapabilityType.DIMMER)) {
        return "light" as DeviceType;
      }
      return "switch" as DeviceType;
    }

    // Check capabilities
    if (types.includes(CapabilityType.LIGHT) || types.includes(CapabilityType.COLOR_LIGHT)) {
      return "light" as DeviceType;
    }
    if (types.includes(CapabilityType.THERMOSTAT)) {
      return "thermostat" as DeviceType;
    }
    if (types.includes(CapabilityType.LOCK)) {
      return "lock" as DeviceType;
    }
    if (types.includes(CapabilityType.COVER)) {
      return "cover" as DeviceType;
    }

    return "sensor" as DeviceType;
  }

  /**
   * Get device ID from node ID
   */
  private getDeviceId(nodeId: number): string {
    return `zwave-${nodeId}`;
  }

  /**
   * Get value ID
   */
  private getValueId(nodeId: number, property: string): string {
    return `${nodeId}-${property}`;
  }

  /**
   * Update device state from node
   */
  private updateDeviceStateFromNode(deviceId: string, node: ZwaveNode): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    for (const capability of device.capabilities) {
      // Find matching value in node
      for (const value of Object.values(node.values)) {
        const capType = this.mapValueToCapability(value);
        if (capType?.type === capability.type && value.value !== undefined) {
          capability.state = { type: capability.type, value: value.value };
          break;
        }
      }
    }

    device.lastUpdated = new Date();
  }

  async discoverScenes(): Promise<Scene[]> {
    // Z-Wave JS doesn't support scenes directly
    return [];
  }

  async discoverAreas(): Promise<Area[]> {
    // Extract unique locations from nodes
    const areas: Area[] = [];
    const locationSet = new Set<string>();

    for (const node of this.nodes.values()) {
      if (node.location && !locationSet.has(node.location)) {
        locationSet.add(node.location);
        areas.push({
          id: node.location,
          name: node.location,
        });
      }
    }

    return areas;
  }

  async getDeviceState(deviceId: string): Promise<Device | null> {
    const device = this.devices.get(deviceId);
    return device ? { ...device } : null;
  }

  async executeCommand(command: DeviceCommand): Promise<void> {
    const device = this.devices.get(command.deviceId);
    if (!device || !device.metadata) {
      throw new Error(`Device ${command.deviceId} not found`);
    }

    const nodeId = device.metadata.nodeId as number;

    // Map capability to Z-Wave command
    const zwaveCommand = this.mapCommandToZwave(command, nodeId);

    await this.sendCommand(zwaveCommand.command, zwaveCommand.params);
  }

  /**
   * Map device command to Z-Wave command
   */
  private mapCommandToZwave(command: DeviceCommand, nodeId: number): {
    command: string;
    params: Record<string, unknown>;
  } {
    const params: Record<string, unknown> = { nodeId };

    switch (command.capability) {
      case CapabilityType.SWITCH:
      case CapabilityType.LIGHT:
        params.commandClass = 37; // Binary Switch
        params.property = "targetValue";
        params.value = command.action === "turn_on";
        break;

      case CapabilityType.DIMMER:
        params.commandClass = 38; // Multilevel Switch
        params.property = "targetValue";
        params.value = command.parameters?.brightness || 0;
        break;

      case CapabilityType.COLOR_LIGHT:
        params.commandClass = 51; // Color Switch
        params.property = "targetColor";
        params.value = command.parameters?.color;
        break;

      case CapabilityType.THERMOSTAT:
        params.commandClass = 66; // Thermostat Setpoint
        params.property = "setpoint";
        params.value = command.parameters?.temperature;
        break;

      case CapabilityType.LOCK:
        params.commandClass = 98; // Door Lock
        params.property = "targetMode";
        params.value = command.action === "lock" ? 255 : 0;
        break;

      case CapabilityType.COVER:
        params.commandClass = 102; // Barrier Operator
        params.property = "targetState";
        if (command.action === "open") {
          params.value = 255;
        } else if (command.action === "close") {
          params.value = 0;
        } else if (command.parameters?.position !== undefined) {
          params.value = command.parameters.position;
        }
        break;

      default:
        throw new Error(`Unsupported capability: ${command.capability}`);
    }

    return {
      command: "node.set_value",
      params,
    };
  }

  async executeScene(command: SceneCommand): Promise<void> {
    throw new Error("Z-Wave adapter does not support scene execution");
  }

  async refresh(): Promise<void> {
    await this.discoverNodes();
    await this.discoverDevices();
    this.updateLastSync();
  }

  async healthCheck(): Promise<boolean> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.healthy = false;
      this.lastHealthCheck = new Date();
      return false;
    }

    try {
      // Try to get nodes as health check
      await this.sendCommand("node.get_nodes");
      this.healthy = true;
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      this.healthy = false;
      this.lastHealthCheck = new Date();
      return false;
    }
  }
}
