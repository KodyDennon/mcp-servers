/**
 * Z-Wave JS Adapter - Z-Wave device integration via Z-Wave JS
 */
import WebSocket from "ws";
import { BaseAdapter } from "./BaseAdapter.js";
import { CapabilityType, } from "../home-graph/types.js";
/**
 * Z-Wave JS Adapter
 */
export class ZwaveAdapter extends BaseAdapter {
    ws;
    zwaveConfig;
    nodes = new Map();
    devices = new Map();
    messageCallbacks = new Map();
    messageIdCounter = 0;
    zwReconnectAttempts = 0;
    zwMaxReconnectAttempts = 5;
    constructor(config) {
        super(config);
        this.zwaveConfig = config;
    }
    async initialize() {
        try {
            await this.connectWebSocket();
            await this.discoverNodes();
            await this.discoverDevices();
            this.setConnected(true);
            this.startHealthCheck();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.setError(`Failed to initialize Z-Wave adapter: ${errorMessage}`);
            throw error;
        }
    }
    async shutdown() {
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
    async connectWebSocket() {
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
    setupWebSocketHandlers() {
        if (!this.ws)
            return;
        this.ws.on("message", (data) => {
            try {
                const response = JSON.parse(data.toString());
                this.handleWebSocketMessage(response);
            }
            catch (error) {
                this.setError(`Failed to parse Z-Wave message: ${error instanceof Error ? error.message : String(error)}`);
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
    handleWebSocketMessage(response) {
        if (response.type === "result" && response.messageId) {
            // Handle command response
            const callback = this.messageCallbacks.get(response.messageId);
            if (callback) {
                callback(response);
                this.messageCallbacks.delete(response.messageId);
            }
        }
        else if (response.type === "event" && response.event) {
            // Handle event
            this.handleZwaveEvent(response.event);
        }
    }
    /**
     * Handle Z-Wave events
     */
    handleZwaveEvent(event) {
        if (!event)
            return;
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
    handleValueUpdated(event) {
        if (!event)
            return;
        const nodeId = event.nodeId;
        const args = event.args;
        const node = this.nodes.get(nodeId);
        if (!node)
            return;
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
    handleNodeReady(event) {
        if (!event)
            return;
        const nodeId = event.nodeId;
        // Refresh node information
        this.getNodeInfo(nodeId);
    }
    /**
     * Send command to Z-Wave JS server
     */
    async sendCommand(command, params = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error("Z-Wave WebSocket not connected");
        }
        return new Promise((resolve, reject) => {
            const messageId = `msg-${++this.messageIdCounter}`;
            const message = {
                messageId,
                command,
                ...params,
            };
            this.messageCallbacks.set(messageId, (response) => {
                if (response.success) {
                    resolve(response.result);
                }
                else {
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
    async discoverNodes() {
        try {
            const nodes = await this.sendCommand("node.get_nodes");
            this.nodes.clear();
            for (const node of nodes) {
                if (this.shouldIncludeNode(node.nodeId)) {
                    this.nodes.set(node.nodeId, node);
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to discover Z-Wave nodes: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get node information
     */
    async getNodeInfo(nodeId) {
        try {
            const node = await this.sendCommand("node.get_node_info", { nodeId });
            if (node) {
                this.nodes.set(nodeId, node);
            }
            return node;
        }
        catch (error) {
            this.setError(`Failed to get node info for ${nodeId}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    /**
     * Check if node should be included based on filters
     */
    shouldIncludeNode(nodeId) {
        const { deviceFilter } = this.zwaveConfig;
        if (!deviceFilter)
            return true;
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
    async discoverDevices() {
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
    convertNodeToDevice(node) {
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
    extractCapabilitiesFromNode(node) {
        const capabilities = [];
        const addedTypes = new Set();
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
    mapValueToCapability(value) {
        let type = null;
        // Map by command class
        switch (value.commandClass) {
            case 37: // Binary Switch
                type = CapabilityType.SWITCH;
                break;
            case 38: // Multilevel Switch
                type = CapabilityType.DIMMER;
                break;
            case 51: // Color Switch
                type = CapabilityType.COLOR_LIGHT;
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
        if (!type)
            return null;
        return {
            type,
            supported: true,
        };
    }
    /**
     * Infer device type from node
     */
    inferDeviceType(node, capabilities) {
        const types = capabilities.map((c) => c.type);
        // Check device class first
        const genericClass = node.deviceClass?.generic.label.toLowerCase();
        if (genericClass?.includes("switch")) {
            if (types.includes(CapabilityType.DIMMER)) {
                return "light";
            }
            return "switch";
        }
        // Check capabilities
        if (types.includes(CapabilityType.LIGHT) || types.includes(CapabilityType.COLOR_LIGHT)) {
            return "light";
        }
        if (types.includes(CapabilityType.THERMOSTAT)) {
            return "thermostat";
        }
        if (types.includes(CapabilityType.LOCK)) {
            return "lock";
        }
        if (types.includes(CapabilityType.COVER)) {
            return "cover";
        }
        return "sensor";
    }
    /**
     * Get device ID from node ID
     */
    getDeviceId(nodeId) {
        return `zwave-${nodeId}`;
    }
    /**
     * Get value ID
     */
    getValueId(nodeId, property) {
        return `${nodeId}-${property}`;
    }
    /**
     * Update device state from node
     */
    updateDeviceStateFromNode(deviceId, node) {
        const device = this.devices.get(deviceId);
        if (!device)
            return;
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
    async discoverScenes() {
        // Z-Wave JS doesn't support scenes directly
        return [];
    }
    async discoverAreas() {
        // Extract unique locations from nodes
        const areas = [];
        const locationSet = new Set();
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
    async getDeviceState(deviceId) {
        const device = this.devices.get(deviceId);
        return device ? { ...device } : null;
    }
    async executeCommand(command) {
        const device = this.devices.get(command.deviceId);
        if (!device || !device.metadata) {
            throw new Error(`Device ${command.deviceId} not found`);
        }
        const nodeId = device.metadata.nodeId;
        // Map capability to Z-Wave command
        const zwaveCommand = this.mapCommandToZwave(command, nodeId);
        await this.sendCommand(zwaveCommand.command, zwaveCommand.params);
    }
    /**
     * Map device command to Z-Wave command
     */
    mapCommandToZwave(command, nodeId) {
        const params = { nodeId };
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
                }
                else if (command.action === "close") {
                    params.value = 0;
                }
                else if (command.parameters?.position !== undefined) {
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
    async executeScene(command) {
        throw new Error("Z-Wave adapter does not support scene execution");
    }
    async refresh() {
        await this.discoverNodes();
        await this.discoverDevices();
        this.updateLastSync();
    }
    async healthCheck() {
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
        }
        catch (error) {
            this.healthy = false;
            this.lastHealthCheck = new Date();
            return false;
        }
    }
}
//# sourceMappingURL=ZwaveAdapter.js.map