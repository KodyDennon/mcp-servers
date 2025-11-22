/**
 * Fake Adapter - In-memory adapter for testing and Phase 1 development
 */

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
 * Fake adapter that provides an in-memory home for testing
 */
export class FakeAdapter extends BaseAdapter {
  private devices: Map<string, Device> = new Map();
  private scenes: Map<string, Scene> = new Map();
  private areas: Map<string, Area> = new Map();

  constructor(config: AdapterConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    // Create fake areas
    const kitchen: Area = {
      id: "area_kitchen",
      name: "Kitchen",
      floor: "1",
      tags: ["indoor"],
    };

    const livingRoom: Area = {
      id: "area_living_room",
      name: "Living Room",
      floor: "1",
      tags: ["indoor"],
    };

    const bedroom: Area = {
      id: "area_bedroom",
      name: "Bedroom",
      floor: "2",
      tags: ["indoor"],
    };

    this.areas.set(kitchen.id, kitchen);
    this.areas.set(livingRoom.id, livingRoom);
    this.areas.set(bedroom.id, bedroom);

    // Create fake devices
    const kitchenLight: Device = {
      id: "device_kitchen_light",
      name: "Kitchen Main Light",
      type: DeviceType.LIGHT,
      areaId: kitchen.id,
      adapterId: this.id,
      nativeId: "fake_kitchen_light",
      online: true,
      capabilities: [
        {
          type: CapabilityType.SWITCH,
          supported: true,
          state: { type: CapabilityType.SWITCH, on: false },
        },
        {
          type: CapabilityType.DIMMER,
          supported: true,
          state: { type: CapabilityType.DIMMER, brightness: 100 },
        },
      ],
      tags: ["light", "main"],
    };

    const livingRoomLight: Device = {
      id: "device_living_room_light",
      name: "Living Room Light",
      type: DeviceType.LIGHT,
      areaId: livingRoom.id,
      adapterId: this.id,
      nativeId: "fake_living_room_light",
      online: true,
      capabilities: [
        {
          type: CapabilityType.SWITCH,
          supported: true,
          state: { type: CapabilityType.SWITCH, on: true },
        },
        {
          type: CapabilityType.DIMMER,
          supported: true,
          state: { type: CapabilityType.DIMMER, brightness: 75 },
        },
        {
          type: CapabilityType.COLOR_LIGHT,
          supported: true,
          state: {
            type: CapabilityType.COLOR_LIGHT,
            color: { hue: 120, saturation: 50 },
          },
        },
      ],
      tags: ["light", "rgb"],
    };

    const bedroomThermostat: Device = {
      id: "device_bedroom_thermostat",
      name: "Bedroom Thermostat",
      type: DeviceType.THERMOSTAT,
      areaId: bedroom.id,
      adapterId: this.id,
      nativeId: "fake_bedroom_thermostat",
      online: true,
      capabilities: [
        {
          type: CapabilityType.THERMOSTAT,
          supported: true,
          state: {
            type: CapabilityType.THERMOSTAT,
            temperature: 72,
            targetTemperature: 70,
            mode: "heat",
          },
        },
      ],
      tags: ["climate"],
    };

    const frontDoorLock: Device = {
      id: "device_front_door_lock",
      name: "Front Door Lock",
      type: DeviceType.LOCK,
      areaId: livingRoom.id,
      adapterId: this.id,
      nativeId: "fake_front_door_lock",
      online: true,
      capabilities: [
        {
          type: CapabilityType.LOCK,
          supported: true,
          state: { type: CapabilityType.LOCK, locked: true },
        },
      ],
      tags: ["security", "door"],
    };

    this.devices.set(kitchenLight.id, kitchenLight);
    this.devices.set(livingRoomLight.id, livingRoomLight);
    this.devices.set(bedroomThermostat.id, bedroomThermostat);
    this.devices.set(frontDoorLock.id, frontDoorLock);

    // Create fake scenes
    const movieMode: Scene = {
      id: "scene_movie_mode",
      name: "Movie Mode",
      description: "Dim lights and set comfortable temperature",
      adapterId: this.id,
      nativeId: "fake_movie_mode",
      tags: ["entertainment"],
    };

    const eveningMode: Scene = {
      id: "scene_evening_mode",
      name: "Evening Mode",
      description: "Warm lighting throughout the house",
      adapterId: this.id,
      nativeId: "fake_evening_mode",
      tags: ["routine"],
    };

    this.scenes.set(movieMode.id, movieMode);
    this.scenes.set(eveningMode.id, eveningMode);

    this.setConnected(true);
    this.updateLastSync();
  }

  async shutdown(): Promise<void> {
    this.devices.clear();
    this.scenes.clear();
    this.areas.clear();
    this.setConnected(false);
  }

  async discoverDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async discoverScenes(): Promise<Scene[]> {
    return Array.from(this.scenes.values());
  }

  async discoverAreas(): Promise<Area[]> {
    return Array.from(this.areas.values());
  }

  async getDeviceState(deviceId: string): Promise<Device | null> {
    return this.devices.get(deviceId) || null;
  }

  async executeCommand(command: DeviceCommand): Promise<void> {
    const device = this.devices.get(command.deviceId);
    if (!device) {
      throw new Error(`Device not found: ${command.deviceId}`);
    }

    const capability = device.capabilities.find(
      (cap) => cap.type === command.capability
    );
    if (!capability) {
      throw new Error(
        `Capability ${command.capability} not supported on device ${command.deviceId}`
      );
    }

    // Update the fake state based on command
    if (!capability.state) {
      capability.state = { type: command.capability };
    }

    switch (command.action) {
      case "turn_on":
        capability.state.on = true;
        break;
      case "turn_off":
        capability.state.on = false;
        break;
      case "set_brightness":
        if (command.parameters?.brightness !== undefined) {
          capability.state.brightness = command.parameters.brightness as number;
        }
        break;
      case "set_temperature":
        if (command.parameters?.temperature !== undefined) {
          capability.state.targetTemperature = command.parameters
            .temperature as number;
        }
        break;
      case "lock":
        capability.state.locked = true;
        break;
      case "unlock":
        capability.state.locked = false;
        break;
      default:
        throw new Error(`Unknown action: ${command.action}`);
    }

    this.updateLastSync();
  }

  async executeScene(command: SceneCommand): Promise<void> {
    const scene = this.scenes.get(command.sceneId);
    if (!scene) {
      throw new Error(`Scene not found: ${command.sceneId}`);
    }

    // Simulate scene execution by logging
    console.error(`Executing fake scene: ${scene.name}`);
    this.updateLastSync();
  }

  async refresh(): Promise<void> {
    // In a fake adapter, there's nothing to refresh
    this.updateLastSync();
  }
}
