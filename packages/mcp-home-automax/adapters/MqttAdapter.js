/**
 * MQTT Adapter - Generic MQTT device integration
 */
import mqtt from "mqtt";
import { BaseAdapter } from "./BaseAdapter.js";
import { CapabilityType, } from "../home-graph/types.js";
/**
 * MQTT Adapter for generic MQTT device control
 */
export class MqttAdapter extends BaseAdapter {
    mqttClient;
    mqttConfig;
    deviceMappings = new Map();
    devices = new Map();
    topicToDeviceMap = new Map();
    constructor(config) {
        super(config);
        this.mqttConfig = config;
        // Build device mappings
        for (const mapping of config.devices) {
            this.deviceMappings.set(mapping.id, mapping);
        }
    }
    async initialize() {
        try {
            await this.connectMqtt();
            await this.discoverDevices();
            this.setConnected(true);
            this.startHealthCheck();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.setError(`Failed to initialize MQTT adapter: ${errorMessage}`);
            throw error;
        }
    }
    async shutdown() {
        this.stopHealthCheck();
        if (this.mqttClient) {
            await new Promise((resolve) => {
                if (this.mqttClient) {
                    this.mqttClient.end(false, {}, () => resolve());
                }
                else {
                    resolve();
                }
            });
            this.mqttClient = undefined;
        }
        this.setConnected(false);
    }
    /**
     * Connect to MQTT broker
     */
    async connectMqtt() {
        const { broker, tls } = this.mqttConfig;
        const options = {
            clientId: broker.clientId || `mcp-home-automax-${this.id}`,
            username: broker.username,
            password: broker.password,
            keepalive: broker.keepalive || 60,
            clean: broker.clean ?? true,
            reconnectPeriod: broker.reconnectPeriod || 5000,
            connectTimeout: broker.connectTimeout || 30000,
        };
        // Add TLS options if enabled
        if (tls?.enabled) {
            options.rejectUnauthorized = tls.rejectUnauthorized ?? true;
            if (tls.ca)
                options.ca = tls.ca;
            if (tls.cert)
                options.cert = tls.cert;
            if (tls.key)
                options.key = tls.key;
        }
        return new Promise((resolve, reject) => {
            const url = broker.port
                ? `${broker.url}:${broker.port}`
                : broker.url;
            this.mqttClient = mqtt.connect(url, options);
            const timeoutId = setTimeout(() => {
                reject(new Error("MQTT connection timeout"));
            }, options.connectTimeout);
            this.mqttClient.on("connect", () => {
                clearTimeout(timeoutId);
                this.setupMqttHandlers();
                this.subscribeToDeviceTopics();
                resolve();
            });
            this.mqttClient.on("error", (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }
    /**
     * Setup MQTT event handlers
     */
    setupMqttHandlers() {
        if (!this.mqttClient)
            return;
        this.mqttClient.on("message", (topic, payload) => {
            this.handleMqttMessage(topic, payload);
        });
        this.mqttClient.on("disconnect", () => {
            this.setConnected(false);
            this.emit({
                type: "disconnected",
                adapterId: this.id,
                timestamp: new Date(),
            });
        });
        this.mqttClient.on("reconnect", () => {
            this.emit({
                type: "connected",
                adapterId: this.id,
                timestamp: new Date(),
            });
        });
        this.mqttClient.on("error", (error) => {
            this.setError(`MQTT error: ${error.message}`);
        });
    }
    /**
     * Subscribe to all device state topics
     */
    subscribeToDeviceTopics() {
        if (!this.mqttClient)
            return;
        for (const mapping of this.deviceMappings.values()) {
            for (const capability of mapping.capabilities) {
                this.mqttClient.subscribe(capability.stateTopic, (err) => {
                    if (err) {
                        this.setError(`Failed to subscribe to ${capability.stateTopic}: ${err.message}`);
                    }
                    else {
                        this.topicToDeviceMap.set(capability.stateTopic, mapping.id);
                    }
                });
            }
        }
    }
    /**
     * Handle incoming MQTT messages
     */
    handleMqttMessage(topic, payload) {
        const deviceId = this.topicToDeviceMap.get(topic);
        if (!deviceId)
            return;
        const mapping = this.deviceMappings.get(deviceId);
        if (!mapping)
            return;
        // Find capability for this topic
        const capabilityMapping = mapping.capabilities.find((cap) => cap.stateTopic === topic);
        if (!capabilityMapping)
            return;
        try {
            const payloadString = payload.toString();
            const format = capabilityMapping.payloadFormat || "json";
            let value;
            if (format === "json") {
                const jsonPayload = JSON.parse(payloadString);
                value = capabilityMapping.stateProperty
                    ? this.getNestedProperty(jsonPayload, capabilityMapping.stateProperty)
                    : jsonPayload;
            }
            else {
                value = payloadString;
            }
            // Update device state
            this.updateDeviceState(deviceId, capabilityMapping.type, value);
            // Emit state change event
            this.emit({
                type: "state_changed",
                adapterId: this.id,
                timestamp: new Date(),
                data: { deviceId, capability: capabilityMapping.type, value },
            });
        }
        catch (error) {
            this.setError(`Failed to parse MQTT message from ${topic}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get nested property from object using dot notation
     */
    getNestedProperty(obj, path) {
        const parts = path.split(".");
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === "object" && part in current) {
                current = current[part];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    /**
     * Update device state in memory
     */
    updateDeviceState(deviceId, capabilityType, value) {
        const device = this.devices.get(deviceId);
        if (!device)
            return;
        const capability = device.capabilities.find((c) => c.type === capabilityType);
        if (!capability)
            return;
        // Update capability state based on type
        switch (capabilityType) {
            case CapabilityType.SWITCH:
                capability.state = { type: capabilityType, on: this.parseBoolean(value) };
                break;
            case CapabilityType.LIGHT:
                if (typeof value === "object" && value !== null) {
                    capability.state = { type: capabilityType, ...value };
                }
                else {
                    capability.state = { type: capabilityType, on: this.parseBoolean(value) };
                }
                break;
            case CapabilityType.DIMMER:
                if (typeof value === "number") {
                    capability.state = { type: capabilityType, brightness: value };
                }
                break;
            case CapabilityType.COLOR_LIGHT:
                capability.state = { type: capabilityType, ...(typeof value === "object" && value !== null ? value : {}) };
                break;
            case CapabilityType.THERMOSTAT:
                capability.state = { type: capabilityType, ...(typeof value === "object" && value !== null ? value : {}) };
                break;
            default:
                capability.state = { type: capabilityType, value };
        }
        device.lastUpdated = new Date();
    }
    /**
     * Parse boolean from various formats
     */
    parseBoolean(value) {
        if (typeof value === "boolean")
            return value;
        if (typeof value === "string") {
            const lower = value.toLowerCase();
            return lower === "on" || lower === "true" || lower === "1";
        }
        if (typeof value === "number")
            return value !== 0;
        return false;
    }
    async discoverDevices() {
        this.devices.clear();
        for (const mapping of this.deviceMappings.values()) {
            const capabilities = mapping.capabilities.map((cap) => ({
                type: cap.type,
                supported: true,
            }));
            const device = {
                id: mapping.id,
                name: mapping.name,
                type: mapping.type,
                areaId: mapping.areaId,
                capabilities,
                tags: mapping.tags || [],
                adapterId: this.id,
                nativeId: mapping.id,
                manufacturer: mapping.manufacturer,
                model: mapping.model,
                online: true,
                lastSeen: new Date(),
                lastUpdated: new Date(),
            };
            this.devices.set(device.id, device);
            this.emit({
                type: "device_discovered",
                adapterId: this.id,
                timestamp: new Date(),
                data: { device },
            });
        }
        this.updateLastSync();
        return Array.from(this.devices.values());
    }
    async discoverScenes() {
        // MQTT adapter doesn't support scenes by default
        return [];
    }
    async discoverAreas() {
        // MQTT adapter doesn't support areas by default
        return [];
    }
    async getDeviceState(deviceId) {
        const device = this.devices.get(deviceId);
        return device ? { ...device } : null;
    }
    async executeCommand(command) {
        const mapping = this.deviceMappings.get(command.deviceId);
        if (!mapping) {
            throw new Error(`Device ${command.deviceId} not found in MQTT mappings`);
        }
        const capabilityMapping = mapping.capabilities.find((cap) => cap.type === command.capability);
        if (!capabilityMapping) {
            throw new Error(`Capability ${command.capability} not found for device ${command.deviceId}`);
        }
        if (!this.mqttClient) {
            throw new Error("MQTT client not connected");
        }
        // Build payload based on action and parameters
        const payload = this.buildCommandPayload(command, capabilityMapping);
        return new Promise((resolve, reject) => {
            if (!this.mqttClient) {
                reject(new Error("MQTT client not connected"));
                return;
            }
            this.mqttClient.publish(capabilityMapping.commandTopic, payload, { qos: 1 }, (err) => {
                if (err) {
                    reject(new Error(`Failed to publish command: ${err.message}`));
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * Build command payload based on capability and action
     */
    buildCommandPayload(command, capabilityMapping) {
        const format = capabilityMapping.payloadFormat || "json";
        if (format === "raw") {
            // Simple on/off commands
            if (command.action === "turn_on") {
                return capabilityMapping.onPayload || "ON";
            }
            else if (command.action === "turn_off") {
                return capabilityMapping.offPayload || "OFF";
            }
            return String(command.parameters?.value || "");
        }
        // JSON format
        const payload = {};
        switch (command.capability) {
            case CapabilityType.SWITCH:
            case CapabilityType.LIGHT:
                if (command.action === "turn_on") {
                    payload.state = "ON";
                    if (command.parameters?.brightness !== undefined) {
                        payload.brightness = command.parameters.brightness;
                    }
                }
                else if (command.action === "turn_off") {
                    payload.state = "OFF";
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
                if (command.parameters?.brightness !== undefined) {
                    payload.brightness = command.parameters.brightness;
                }
                break;
            case CapabilityType.THERMOSTAT:
                if (command.parameters?.temperature !== undefined) {
                    payload.temperature = command.parameters.temperature;
                }
                if (command.parameters?.mode) {
                    payload.mode = command.parameters.mode;
                }
                break;
            default:
                // Generic parameter passing
                if (command.parameters) {
                    Object.assign(payload, command.parameters);
                }
        }
        return JSON.stringify(payload);
    }
    async executeScene(command) {
        throw new Error("MQTT adapter does not support scene execution");
    }
    async refresh() {
        await this.discoverDevices();
        this.updateLastSync();
    }
    async healthCheck() {
        if (!this.mqttClient || !this.mqttClient.connected) {
            this.healthy = false;
            this.lastHealthCheck = new Date();
            return false;
        }
        this.healthy = true;
        this.lastHealthCheck = new Date();
        return true;
    }
}
//# sourceMappingURL=MqttAdapter.js.map