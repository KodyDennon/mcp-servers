/**
 * Fake Adapter - In-memory adapter for testing and Phase 1 development
 */
import { BaseAdapter } from "./BaseAdapter.js";
import { CapabilityType, DeviceType } from "../home-graph/types.js";
/**
 * Fake adapter that provides an in-memory home for testing
 */
export class FakeAdapter extends BaseAdapter {
    devices = new Map();
    scenes = new Map();
    areas = new Map();
    constructor(config) {
        super(config);
    }
    async initialize() {
        // Create fake areas
        const kitchen = {
            id: "area_kitchen",
            name: "Kitchen",
            floor: "1",
            tags: ["indoor"],
        };
        const livingRoom = {
            id: "area_living_room",
            name: "Living Room",
            floor: "1",
            tags: ["indoor"],
        };
        const bedroom = {
            id: "area_bedroom",
            name: "Bedroom",
            floor: "2",
            tags: ["indoor"],
        };
        this.areas.set(kitchen.id, kitchen);
        this.areas.set(livingRoom.id, livingRoom);
        this.areas.set(bedroom.id, bedroom);
        // Create fake devices
        const kitchenLight = {
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
        const livingRoomLight = {
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
        const bedroomThermostat = {
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
        const frontDoorLock = {
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
        const movieMode = {
            id: "scene_movie_mode",
            name: "Movie Mode",
            description: "Dim lights and set comfortable temperature",
            adapterId: this.id,
            nativeId: "fake_movie_mode",
            tags: ["entertainment"],
        };
        const eveningMode = {
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
    async shutdown() {
        this.devices.clear();
        this.scenes.clear();
        this.areas.clear();
        this.setConnected(false);
    }
    async discoverDevices() {
        return Array.from(this.devices.values());
    }
    async discoverScenes() {
        return Array.from(this.scenes.values());
    }
    async discoverAreas() {
        return Array.from(this.areas.values());
    }
    async getDeviceState(deviceId) {
        return this.devices.get(deviceId) || null;
    }
    async executeCommand(command) {
        const device = this.devices.get(command.deviceId);
        if (!device) {
            throw new Error(`Device not found: ${command.deviceId}`);
        }
        const capability = device.capabilities.find((cap) => cap.type === command.capability);
        if (!capability) {
            throw new Error(`Capability ${command.capability} not supported on device ${command.deviceId}`);
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
                    capability.state.brightness = command.parameters.brightness;
                }
                break;
            case "set_temperature":
                if (command.parameters?.temperature !== undefined) {
                    capability.state.targetTemperature = command.parameters
                        .temperature;
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
    async executeScene(command) {
        const scene = this.scenes.get(command.sceneId);
        if (!scene) {
            throw new Error(`Scene not found: ${command.sceneId}`);
        }
        // Simulate scene execution by logging
        console.error(`Executing fake scene: ${scene.name}`);
        this.updateLastSync();
    }
    async refresh() {
        // In a fake adapter, there's nothing to refresh
        this.updateLastSync();
    }
}
//# sourceMappingURL=FakeAdapter.js.map