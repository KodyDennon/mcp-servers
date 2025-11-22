/**
 * Home Assistant Adapter - Integration with Home Assistant via WebSocket and REST APIs
 */

import WebSocket from "ws";
import axios, { AxiosInstance } from "axios";
import { BaseAdapter, type AdapterConfig } from "./BaseAdapter.js";
import type {
  Device,
  Scene,
  Area,
  DeviceCommand,
  SceneCommand,
  Capability,
} from "../home-graph/types.js";
import { CapabilityType, DeviceType } from "../home-graph/types.js";

/**
 * Home Assistant adapter configuration
 */
export interface HomeAssistantConfig extends AdapterConfig {
  baseUrl: string;
  accessToken: string;
  secure?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
  includeAreas?: string[];
  excludeAreas?: string[];
}

/**
 * Home Assistant entity state
 */
interface HAEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

/**
 * Home Assistant area
 */
interface HAArea {
  area_id: string;
  name: string;
  aliases?: string[];
}

/**
 * Home Assistant scene
 */
interface HAScene {
  entity_id: string;
  attributes: {
    friendly_name?: string;
    icon?: string;
    [key: string]: unknown;
  };
}

/**
 * Home Assistant adapter using WebSocket and REST APIs
 */
export class HomeAssistantAdapter extends BaseAdapter {
  private ws?: WebSocket;
  private httpClient: AxiosInstance;
  private messageId: number = 1;
  private pendingMessages: Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  > = new Map();
  private entities: Map<string, HAEntity> = new Map();
  private haAreas: Map<string, HAArea> = new Map();
  private haConfig: HomeAssistantConfig;
  private wsReconnectAttempts: number = 0;
  private wsMaxReconnectAttempts: number = 10;

  constructor(config: HomeAssistantConfig) {
    super(config);
    this.haConfig = config;

    // Create HTTP client for REST API
    const baseURL = config.baseUrl.replace(/\/$/, "");
    this.httpClient = axios.create({
      baseURL: `${baseURL}/api`,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test REST API connection first
      await this.httpClient.get("/");

      // Connect to WebSocket
      await this.connectWebSocket();

      // Fetch initial state
      await this.fetchAllStates();
      await this.fetchAreas();

      this.setConnected(true);
      this.updateLastSync();
      this.startHealthCheck();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setError(`Failed to initialize Home Assistant adapter: ${errorMessage}`);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.stopHealthCheck();

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    this.entities.clear();
    this.haAreas.clear();
    this.pendingMessages.clear();
    this.setConnected(false);
  }

  /**
   * Connect to Home Assistant WebSocket API
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.haConfig.baseUrl
        .replace(/^http/, "ws")
        .replace(/\/$/, "") + "/api/websocket";

      this.ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
        this.ws?.close();
      }, 10000);

      this.ws.on("open", () => {
        console.error("Home Assistant WebSocket connected");
      });

      this.ws.on("message", async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());

          // Handle auth_required
          if (message.type === "auth_required") {
            this.sendWebSocketMessage({
              type: "auth",
              access_token: this.haConfig.accessToken,
            });
          }

          // Handle auth_ok
          if (message.type === "auth_ok") {
            clearTimeout(timeout);

            // Subscribe to state changes
            await this.subscribeToStateChanges();

            resolve();
          }

          // Handle auth_invalid
          if (message.type === "auth_invalid") {
            clearTimeout(timeout);
            reject(new Error("Home Assistant authentication failed"));
          }

          // Handle message responses
          if (message.id && this.pendingMessages.has(message.id)) {
            const pending = this.pendingMessages.get(message.id)!;
            this.pendingMessages.delete(message.id);

            if (message.success) {
              pending.resolve(message.result);
            } else {
              pending.reject(new Error(message.error?.message || "Unknown error"));
            }
          }

          // Handle state change events
          if (message.type === "event" && message.event?.event_type === "state_changed") {
            const newState = message.event.data.new_state;
            if (newState) {
              this.entities.set(newState.entity_id, newState);
              this.emit({
                type: "state_changed",
                adapterId: this.id,
                timestamp: new Date(),
                data: { entity_id: newState.entity_id },
              });
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });

      this.ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        clearTimeout(timeout);
        reject(error);
      });

      this.ws.on("close", () => {
        console.error("WebSocket closed");
        this.setConnected(false);

        // Attempt to reconnect
        if (this.wsReconnectAttempts < this.wsMaxReconnectAttempts) {
          this.wsReconnectAttempts++;
          setTimeout(() => {
            this.reconnect();
          }, 5000);
        }
      });
    });
  }

  /**
   * Send a message via WebSocket
   */
  private sendWebSocketMessage(message: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send a message and wait for response
   */
  private async sendWebSocketRequest(
    type: string,
    data?: Record<string, unknown>
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.pendingMessages.set(id, { resolve, reject });

      this.sendWebSocketMessage({
        id,
        type,
        ...data,
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(id)) {
          this.pendingMessages.delete(id);
          reject(new Error("WebSocket request timeout"));
        }
      }, 30000);
    });
  }

  /**
   * Subscribe to state changes
   */
  private async subscribeToStateChanges(): Promise<void> {
    await this.sendWebSocketRequest("subscribe_events", {
      event_type: "state_changed",
    });
  }

  /**
   * Fetch all entity states via REST API
   */
  private async fetchAllStates(): Promise<void> {
    try {
      const response = await this.httpClient.get<HAEntity[]>("/states");
      for (const entity of response.data) {
        this.entities.set(entity.entity_id, entity);
      }
    } catch (error) {
      throw new Error(`Failed to fetch states: ${error}`);
    }
  }

  /**
   * Fetch areas via REST API
   */
  private async fetchAreas(): Promise<void> {
    try {
      const response = await this.httpClient.get<HAArea[]>("/config/area_registry/list");
      for (const area of response.data) {
        this.haAreas.set(area.area_id, area);
      }
    } catch (error) {
      console.error("Failed to fetch areas:", error);
      // Areas are optional, don't fail initialization
    }
  }

  /**
   * Map Home Assistant domain to device type
   */
  private mapDomainToDeviceType(domain: string): DeviceType {
    const mapping: Record<string, DeviceType> = {
      light: DeviceType.LIGHT,
      switch: DeviceType.SWITCH,
      climate: DeviceType.THERMOSTAT,
      lock: DeviceType.LOCK,
      cover: DeviceType.COVER,
      media_player: DeviceType.MEDIA_PLAYER,
      sensor: DeviceType.SENSOR,
      camera: DeviceType.CAMERA,
      fan: DeviceType.FAN,
      vacuum: DeviceType.VACUUM,
    };

    return mapping[domain] || DeviceType.GENERIC;
  }

  /**
   * Map Home Assistant entity to device capabilities
   */
  private mapEntityToCapabilities(entity: HAEntity): Capability[] {
    const domain = entity.entity_id.split(".")[0];
    const capabilities: Capability[] = [];

    switch (domain) {
      case "light":
        capabilities.push({
          type: CapabilityType.SWITCH,
          supported: true,
          state: {
            type: CapabilityType.SWITCH,
            on: entity.state === "on",
          },
        });

        if (entity.attributes.brightness !== undefined) {
          capabilities.push({
            type: CapabilityType.DIMMER,
            supported: true,
            state: {
              type: CapabilityType.DIMMER,
              brightness: Math.round(((entity.attributes.brightness as number) / 255) * 100),
            },
          });
        }

        if (entity.attributes.hs_color || entity.attributes.rgb_color) {
          capabilities.push({
            type: CapabilityType.COLOR_LIGHT,
            supported: true,
            state: {
              type: CapabilityType.COLOR_LIGHT,
              color: entity.attributes.hs_color
                ? {
                    hue: (entity.attributes.hs_color as number[])[0],
                    saturation: (entity.attributes.hs_color as number[])[1],
                  }
                : entity.attributes.rgb_color
                ? { rgb: entity.attributes.rgb_color as [number, number, number] }
                : undefined,
            },
          });
        }
        break;

      case "switch":
        capabilities.push({
          type: CapabilityType.SWITCH,
          supported: true,
          state: {
            type: CapabilityType.SWITCH,
            on: entity.state === "on",
          },
        });
        break;

      case "climate":
        capabilities.push({
          type: CapabilityType.THERMOSTAT,
          supported: true,
          state: {
            type: CapabilityType.THERMOSTAT,
            temperature: entity.attributes.current_temperature as number,
            targetTemperature: entity.attributes.temperature as number,
            mode: entity.state,
          },
        });
        break;

      case "lock":
        capabilities.push({
          type: CapabilityType.LOCK,
          supported: true,
          state: {
            type: CapabilityType.LOCK,
            locked: entity.state === "locked",
          },
        });
        break;

      case "cover":
        capabilities.push({
          type: CapabilityType.COVER,
          supported: true,
          state: {
            type: CapabilityType.COVER,
            position: entity.attributes.current_position as number,
          },
        });
        break;

      case "media_player":
        capabilities.push({
          type: CapabilityType.MEDIA_PLAYER,
          supported: true,
          state: {
            type: CapabilityType.MEDIA_PLAYER,
            playing: entity.state === "playing",
            volume: entity.attributes.volume_level as number,
          },
        });
        break;

      case "sensor":
        capabilities.push({
          type: CapabilityType.SENSOR,
          supported: true,
          state: {
            type: CapabilityType.SENSOR,
            value: entity.state,
          },
        });
        break;

      default:
        // Generic device with basic state
        break;
    }

    return capabilities;
  }

  async discoverDevices(): Promise<Device[]> {
    const devices: Device[] = [];

    for (const [entityId, entity] of this.entities) {
      const domain = entityId.split(".")[0];

      // Filter by domain if specified
      if (this.haConfig.includeDomains && !this.haConfig.includeDomains.includes(domain)) {
        continue;
      }
      if (this.haConfig.excludeDomains && this.haConfig.excludeDomains.includes(domain)) {
        continue;
      }

      // Skip certain domains
      if (["automation", "script", "group", "zone", "person", "sun"].includes(domain)) {
        continue;
      }

      const device: Device = {
        id: `ha_${entityId}`,
        name: (entity.attributes.friendly_name as string) || entityId,
        type: this.mapDomainToDeviceType(domain),
        adapterId: this.id,
        nativeId: entityId,
        capabilities: this.mapEntityToCapabilities(entity),
        online: entity.state !== "unavailable",
        lastUpdated: new Date(entity.last_updated),
        metadata: {
          domain,
          ...entity.attributes,
        },
      };

      // Add area if available
      const areaId = entity.attributes.area_id as string;
      if (areaId) {
        device.areaId = `ha_area_${areaId}`;
      }

      devices.push(device);
    }

    return devices;
  }

  async discoverScenes(): Promise<Scene[]> {
    const scenes: Scene[] = [];

    for (const [entityId, entity] of this.entities) {
      if (entityId.startsWith("scene.")) {
        scenes.push({
          id: `ha_scene_${entityId}`,
          name: (entity.attributes.friendly_name as string) || entityId,
          description: entity.attributes.description as string,
          icon: entity.attributes.icon as string,
          adapterId: this.id,
          nativeId: entityId,
        });
      }
    }

    return scenes;
  }

  async discoverAreas(): Promise<Area[]> {
    const areas: Area[] = [];

    for (const [areaId, haArea] of this.haAreas) {
      areas.push({
        id: `ha_area_${areaId}`,
        name: haArea.name,
        aliases: haArea.aliases,
      });
    }

    return areas;
  }

  async getDeviceState(deviceId: string): Promise<Device | null> {
    // Extract native entity ID from our device ID
    const entityId = deviceId.replace(/^ha_/, "");
    const entity = this.entities.get(entityId);

    if (!entity) {
      return null;
    }

    const domain = entityId.split(".")[0];

    return {
      id: deviceId,
      name: (entity.attributes.friendly_name as string) || entityId,
      type: this.mapDomainToDeviceType(domain),
      adapterId: this.id,
      nativeId: entityId,
      capabilities: this.mapEntityToCapabilities(entity),
      online: entity.state !== "unavailable",
      lastUpdated: new Date(entity.last_updated),
      metadata: entity.attributes,
    };
  }

  async executeCommand(command: DeviceCommand): Promise<void> {
    const entityId = command.deviceId.replace(/^ha_/, "");
    const domain = entityId.split(".")[0];

    let service = "";
    const serviceData: Record<string, unknown> = {
      entity_id: entityId,
    };

    // Map command to Home Assistant service call
    switch (command.capability) {
      case CapabilityType.SWITCH:
        service = command.action === "turn_on" ? "turn_on" : "turn_off";
        break;

      case CapabilityType.DIMMER:
        service = "turn_on";
        if (command.parameters?.brightness !== undefined) {
          serviceData.brightness = Math.round(
            ((command.parameters.brightness as number) / 100) * 255
          );
        }
        break;

      case CapabilityType.COLOR_LIGHT:
        service = "turn_on";
        if (command.parameters?.hue !== undefined || command.parameters?.saturation !== undefined) {
          serviceData.hs_color = [
            command.parameters.hue as number,
            command.parameters.saturation as number,
          ];
        }
        if (command.parameters?.rgb !== undefined) {
          serviceData.rgb_color = command.parameters.rgb;
        }
        break;

      case CapabilityType.THERMOSTAT:
        if (command.action === "set_temperature") {
          service = "set_temperature";
          serviceData.temperature = command.parameters?.temperature;
        } else if (command.action === "set_mode") {
          service = "set_hvac_mode";
          serviceData.hvac_mode = command.parameters?.mode;
        }
        break;

      case CapabilityType.LOCK:
        service = command.action === "lock" ? "lock" : "unlock";
        break;

      case CapabilityType.COVER:
        if (command.action === "open") {
          service = "open_cover";
        } else if (command.action === "close") {
          service = "close_cover";
        } else if (command.action === "stop") {
          service = "stop_cover";
        } else if (command.action === "set_position") {
          service = "set_cover_position";
          serviceData.position = command.parameters?.position;
        }
        break;

      default:
        throw new Error(`Unsupported capability: ${command.capability}`);
    }

    try {
      await this.httpClient.post(`/services/${domain}/${service}`, serviceData);
      this.updateLastSync();
    } catch (error) {
      throw new Error(`Failed to execute command: ${error}`);
    }
  }

  async executeScene(command: SceneCommand): Promise<void> {
    const entityId = command.sceneId.replace(/^ha_scene_/, "");

    try {
      await this.httpClient.post("/services/scene/turn_on", {
        entity_id: entityId,
      });
      this.updateLastSync();
    } catch (error) {
      throw new Error(`Failed to execute scene: ${error}`);
    }
  }

  async refresh(): Promise<void> {
    await this.fetchAllStates();
    await this.fetchAreas();
    this.updateLastSync();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.httpClient.get("/");
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
