/**
 * Zigbee2MQTT Adapter - Zigbee device integration via Zigbee2MQTT
 */

import { MqttAdapter, type MqttAdapterConfig } from "./MqttAdapter.js";
import type {
  Device,


  Capability,
} from "../home-graph/types.js";
import {
  DeviceType,
  CapabilityType,
} from "../home-graph/types.js";
import type { AdapterConfig } from "./BaseAdapter.js";

/**
 * Zigbee2MQTT adapter configuration
 */
export interface Zigbee2MqttAdapterConfig extends AdapterConfig {
  type: "zigbee2mqtt";
  broker: MqttAdapterConfig["broker"];
  tls?: MqttAdapterConfig["tls"];
  baseTopic?: string; // Default: "zigbee2mqtt"
  includeGroups?: boolean; // Default: false
  deviceFilter?: {
    include?: string[]; // Device friendly names or IEEE addresses to include
    exclude?: string[]; // Device friendly names or IEEE addresses to exclude
  };
}

/**
 * Zigbee2MQTT device definition from bridge/devices
 */
interface Z2MDevice {
  ieee_address: string;
  type: "Coordinator" | "Router" | "EndDevice";
  network_address: number;
  supported: boolean;
  friendly_name: string;
  definition?: {
    model: string;
    vendor: string;
    description: string;
    exposes: Z2MExpose[];
  };
  power_source?: string;
  disabled: boolean;
  available?: boolean;
}

/**
 * Zigbee2MQTT expose definition
 */
interface Z2MExpose {
  type: string;
  features?: Z2MExpose[];
  property?: string;
  name?: string;
  value_on?: string;
  value_off?: string;
  value_min?: number;
  value_max?: number;
  values?: string[];
  access?: number;
}

/**
 * Zigbee2MQTT Adapter
 */
export class Zigbee2MqttAdapter extends MqttAdapter {
  private z2mConfig: Zigbee2MqttAdapterConfig;
  private baseTopic: string;
  private devicesDiscovered: boolean = false;
  private z2mDevices: Map<string, Z2MDevice> = new Map();

  constructor(config: Zigbee2MqttAdapterConfig) {
    // Convert to MQTT adapter config
    const mqttConfig: MqttAdapterConfig = {
      ...config,
      type: "mqtt",
      devices: [], // Will be populated by auto-discovery
    };

    super(mqttConfig);
    this.z2mConfig = config;
    this.baseTopic = config.baseTopic || "zigbee2mqtt";
  }

  async initialize(): Promise<void> {
    try {
      // Initialize MQTT connection through parent
      await this.connectMqtt();

      // Subscribe to bridge topics for device discovery
      await this.subscribeToBridgeTopics();

      // Request device list
      await this.requestDeviceList();

      // Wait for devices to be discovered
      await this.waitForDeviceDiscovery();

      this.setConnected(true);
      this.startHealthCheck();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setError(`Failed to initialize Zigbee2MQTT adapter: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Subscribe to Zigbee2MQTT bridge topics
   */
  private async subscribeToBridgeTopics(): Promise<void> {
    if (!this.mqttClient) {
      throw new Error("MQTT client not initialized");
    }

    return new Promise((resolve, reject) => {
      if (!this.mqttClient) {
        reject(new Error("MQTT client not initialized"));
        return;
      }

      const bridgeTopic = `${this.baseTopic}/bridge/#`;

      this.mqttClient.subscribe(bridgeTopic, (err) => {
        if (err) {
          reject(new Error(`Failed to subscribe to ${bridgeTopic}: ${err.message}`));
        } else {
          // Setup bridge message handler
          this.mqttClient?.on("message", (topic, payload) => {
            if (topic.startsWith(`${this.baseTopic}/bridge/`)) {
              this.handleBridgeMessage(topic, payload);
            }
          });
          resolve();
        }
      });
    });
  }

  /**
   * Handle bridge messages
   */
  private handleBridgeMessage(topic: string, payload: Buffer): void {
    try {
      const message = JSON.parse(payload.toString());

      if (topic === `${this.baseTopic}/bridge/devices`) {
        this.handleDevicesMessage(message);
      } else if (topic === `${this.baseTopic}/bridge/info`) {
        this.handleInfoMessage(message);
      } else if (topic === `${this.baseTopic}/bridge/state`) {
        this.handleStateMessage(message);
      }
    } catch (error) {
      this.setError(
        `Failed to parse bridge message: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle devices list message
   */
  private handleDevicesMessage(devices: Z2MDevice[]): void {
    this.z2mDevices.clear();

    for (const device of devices) {
      // Skip coordinators and unsupported devices
      if (device.type === "Coordinator" || !device.supported || device.disabled) {
        continue;
      }

      // Apply filters
      if (this.shouldIncludeDevice(device)) {
        this.z2mDevices.set(device.friendly_name, device);
      }
    }

    this.devicesDiscovered = true;
  }

  /**
   * Check if device should be included based on filters
   */
  private shouldIncludeDevice(device: Z2MDevice): boolean {
    const { deviceFilter } = this.z2mConfig;
    if (!deviceFilter) return true;

    const identifier = device.friendly_name;

    // Check exclude list
    if (deviceFilter.exclude?.includes(identifier) ||
        deviceFilter.exclude?.includes(device.ieee_address)) {
      return false;
    }

    // Check include list (if defined, device must be in it)
    if (deviceFilter.include && deviceFilter.include.length > 0) {
      return deviceFilter.include.includes(identifier) ||
             deviceFilter.include.includes(device.ieee_address);
    }

    return true;
  }

  /**
   * Handle bridge info message
   */
  private handleInfoMessage(info: unknown): void {
    this.emit({
      type: "connected",
      adapterId: this.id,
      timestamp: new Date(),
      data: { info },
    });
  }

  /**
   * Handle bridge state message
   */
  private handleStateMessage(state: unknown): void {
    if (state === "offline") {
      this.setConnected(false);
    } else if (state === "online") {
      this.setConnected(true);
    }
  }

  /**
   * Request device list from Zigbee2MQTT
   */
  private async requestDeviceList(): Promise<void> {
    if (!this.mqttClient) {
      throw new Error("MQTT client not initialized");
    }

    return new Promise((resolve, reject) => {
      if (!this.mqttClient) {
        reject(new Error("MQTT client not initialized"));
        return;
      }

      this.mqttClient.publish(
        `${this.baseTopic}/bridge/request/devices`,
        "",
        { qos: 1 },
        (err) => {
          if (err) {
            reject(new Error(`Failed to request devices: ${err.message}`));
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Wait for device discovery to complete
   */
  private async waitForDeviceDiscovery(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (!this.devicesDiscovered) {
      if (Date.now() - startTime > timeout) {
        throw new Error("Device discovery timeout");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async discoverDevices(): Promise<Device[]> {
    this.devices.clear();

    for (const z2mDevice of this.z2mDevices.values()) {
      const device = this.convertZ2MDevice(z2mDevice);
      if (device) {
        this.devices.set(device.id, device);

        // Subscribe to device state topic
        if (this.mqttClient) {
          const stateTopic = `${this.baseTopic}/${z2mDevice.friendly_name}`;
          this.mqttClient.subscribe(stateTopic);
          this.topicToDeviceMap.set(stateTopic, device.id);
        }

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
   * Convert Zigbee2MQTT device to normalized device
   */
  private convertZ2MDevice(z2mDevice: Z2MDevice): Device | null {
    if (!z2mDevice.definition) {
      return null;
    }

    const capabilities = this.extractCapabilities(z2mDevice.definition.exposes);
    if (capabilities.length === 0) {
      return null;
    }

    const deviceType = this.inferDeviceType(capabilities);

    return {
      id: z2mDevice.ieee_address,
      name: z2mDevice.friendly_name,
      type: deviceType,
      capabilities,
      tags: [z2mDevice.power_source || "unknown"],
      adapterId: this.id,
      nativeId: z2mDevice.ieee_address,
      manufacturer: z2mDevice.definition.vendor,
      model: z2mDevice.definition.model,
      online: z2mDevice.available ?? true,
      lastSeen: new Date(),
      lastUpdated: new Date(),
      metadata: {
        networkAddress: z2mDevice.network_address,
        description: z2mDevice.definition.description,
      },
    };
  }

  /**
   * Extract capabilities from Zigbee2MQTT exposes
   */
  private extractCapabilities(exposes: Z2MExpose[]): Capability[] {
    const capabilities: Capability[] = [];

    for (const expose of exposes) {
      const capability = this.mapExpose(expose);
      if (capability) {
        capabilities.push(capability);
      }

      // Check nested features
      if (expose.features) {
        for (const feature of expose.features) {
          const featureCapability = this.mapExpose(feature);
          if (featureCapability) {
            capabilities.push(featureCapability);
          }
        }
      }
    }

    return capabilities;
  }

  /**
   * Map Zigbee2MQTT expose to capability
   */
  private mapExpose(expose: Z2MExpose): Capability | null {
    const property = expose.property || expose.name;
    if (!property) return null;

    let type: CapabilityType | null = null;

    switch (expose.type) {
      case "switch":
      case "binary":
        if (property === "state") {
          type = CapabilityType.SWITCH;
        }
        break;

      case "light":
        type = CapabilityType.LIGHT;
        break;

      case "numeric":
        if (property === "brightness") {
          type = CapabilityType.DIMMER;
        } else if (property === "temperature" || property === "current_heating_setpoint") {
          type = CapabilityType.THERMOSTAT;
        }
        break;

      case "composite":
        if (property === "color" || property === "color_xy") {
          type = CapabilityType.COLOR_LIGHT
        }
        break;

      case "lock":
        type = CapabilityType.LOCK;
        break;

      case "cover":
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
   * Infer device type from capabilities
   */
  private inferDeviceType(capabilities: Capability[]): DeviceType {
    const types = capabilities.map((c) => c.type);

    if (types.includes(CapabilityType.LIGHT) || types.includes(CapabilityType.COLOR_LIGHT)) {
      return "light" as DeviceType;
    }
    if (types.includes(CapabilityType.SWITCH)) {
      return "switch" as DeviceType;
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
   * Override parent method to handle Zigbee2MQTT message format
   */
  protected handleMqttMessage(topic: string, payload: Buffer): void {
    // Skip bridge messages (handled separately)
    if (topic.startsWith(`${this.baseTopic}/bridge/`)) {
      return;
    }

    const friendlyName = topic.replace(`${this.baseTopic}/`, "");

    // Find device by friendly name
    let deviceId: string | undefined;
    for (const [id, device] of this.devices.entries()) {
      if (device.name === friendlyName) {
        deviceId = id;
        break;
      }
    }

    if (!deviceId) return;

    try {
      const state = JSON.parse(payload.toString());
      this.updateDeviceStateFromZ2M(deviceId, state);

      this.emit({
        type: "state_changed",
        adapterId: this.id,
        timestamp: new Date(),
        data: { deviceId, state },
      });
    } catch (error) {
      this.setError(
        `Failed to parse Zigbee2MQTT state: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update device state from Zigbee2MQTT state object
   */
  private updateDeviceStateFromZ2M(deviceId: string, state: Record<string, unknown>): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    for (const capability of device.capabilities) {
      switch (capability.type) {
        case CapabilityType.SWITCH:
        case CapabilityType.LIGHT:
          if ("state" in state) {
            capability.state = { type: capability.type, on: state.state === "ON" };
          }
          if ("brightness" in state) {
            capability.state = { type: capability.type, ...(capability.state || {}), brightness: state.brightness as number };
          }
          break;

        case CapabilityType.DIMMER:
          if ("brightness" in state) {
            capability.state = { type: capability.type, brightness: state.brightness as number };
          }
          break;

        case CapabilityType.COLOR_LIGHT:
          if ("color" in state) {
            capability.state = { type: capability.type, ...(state.color as Record<string, unknown> || {}) };
          }
          break;

        case CapabilityType.THERMOSTAT:
          if ("temperature" in state || "current_heating_setpoint" in state) {
            capability.state = {
              type: capability.type,
              temperature: state.temperature as number || state.current_heating_setpoint as number,
              mode: (state.system_mode as string) || (state.preset as string),
            };
          }
          break;

        case CapabilityType.LOCK:
          if ("lock_state" in state) {
            capability.state = { type: capability.type, locked: state.lock_state === "locked" };
          }
          break;

        case CapabilityType.COVER:
          if ("position" in state) {
            capability.state = { type: capability.type, position: state.position as number };
          }
          break;
      }
    }

    device.lastUpdated = new Date();
    device.online = true;
  }

  /**
   * Override parent method to use Zigbee2MQTT command format
   */
  protected buildCommandPayload(
    command: import("../home-graph/types.js").DeviceCommand,
    _capabilityMapping: unknown
  ): string {
    const payload: Record<string, unknown> = {};

    switch (command.capability) {
      case CapabilityType.SWITCH:
      case CapabilityType.LIGHT:
        payload.state = command.action === "turn_on" ? "ON" : "OFF";
        if (command.parameters?.brightness !== undefined) {
          payload.brightness = command.parameters.brightness;
        }
        break;

      case CapabilityType.DIMMER:
        if (command.parameters?.brightness !== undefined) {
          payload.brightness = command.parameters.brightness;
        }
        break;

      case CapabilityType.COLOR_LIGHT:
        if (command.parameters?.color) {
          payload.color = command.parameters.color;
        }
        break;

      case CapabilityType.THERMOSTAT:
        if (command.parameters?.temperature !== undefined) {
          payload.current_heating_setpoint = command.parameters.temperature;
        }
        if (command.parameters?.mode) {
          payload.system_mode = command.parameters.mode;
        }
        break;

      case CapabilityType.LOCK:
        payload.state = command.action === "lock" ? "LOCK" : "UNLOCK";
        break;

      case CapabilityType.COVER:
        if (command.action === "open") {
          payload.state = "OPEN";
        } else if (command.action === "close") {
          payload.state = "CLOSE";
        } else if (command.parameters?.position !== undefined) {
          payload.position = command.parameters.position;
        }
        break;

      default:
        if (command.parameters) {
          Object.assign(payload, command.parameters);
        }
    }

    return JSON.stringify(payload);
  }

  async executeCommand(command: import("../home-graph/types.js").DeviceCommand): Promise<void> {
    const device = this.devices.get(command.deviceId);
    if (!device) {
      throw new Error(`Device ${command.deviceId} not found`);
    }

    if (!this.mqttClient) {
      throw new Error("MQTT client not connected");
    }

    const topic = `${this.baseTopic}/${device.name}/set`;
    const payload = this.buildCommandPayload(command, null);

    return new Promise((resolve, reject) => {
      if (!this.mqttClient) {
        reject(new Error("MQTT client not connected"));
        return;
      }

      this.mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
          reject(new Error(`Failed to publish command: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }
}
