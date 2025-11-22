/**
 * Device management tools for MCP
 */
import { CapabilityType } from "../home-graph/types.js";
import { PolicyDecision } from "../policy/types.js";
/**
 * Get all device tools
 */
export function getDeviceTools() {
    return [
        {
            name: "home_list_devices",
            description: "List all devices in the home with their current state, capabilities, and areas",
            inputSchema: {
                type: "object",
                properties: {
                    areaId: {
                        type: "string",
                        description: "Optional: filter devices by area ID",
                    },
                    capability: {
                        type: "string",
                        description: "Optional: filter devices by capability type",
                    },
                    tag: {
                        type: "string",
                        description: "Optional: filter devices by tag",
                    },
                },
            },
        },
        {
            name: "home_get_device",
            description: "Get detailed information about a specific device",
            inputSchema: {
                type: "object",
                properties: {
                    deviceId: { type: "string", description: "Device ID" },
                },
                required: ["deviceId"],
            },
        },
        {
            name: "home_find_devices",
            description: "Find devices by name (fuzzy search) or other criteria",
            inputSchema: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Device name to search for (case-insensitive)",
                    },
                    areaName: {
                        type: "string",
                        description: "Area name to search within",
                    },
                },
                required: ["name"],
            },
        },
        {
            name: "home_get_snapshot",
            description: "Get a complete snapshot of the entire home state including all areas, devices, and scenes",
            inputSchema: {
                type: "object",
                properties: {},
            },
        },
        {
            name: "home_set_switch",
            description: "Turn a switch on or off",
            inputSchema: {
                type: "object",
                properties: {
                    deviceId: { type: "string", description: "Device ID" },
                    on: {
                        type: "boolean",
                        description: "true to turn on, false to turn off",
                    },
                },
                required: ["deviceId", "on"],
            },
        },
        {
            name: "home_set_light",
            description: "Control a light (on/off and brightness)",
            inputSchema: {
                type: "object",
                properties: {
                    deviceId: { type: "string", description: "Device ID" },
                    on: {
                        type: "boolean",
                        description: "true to turn on, false to turn off",
                    },
                    brightness: {
                        type: "number",
                        description: "Brightness level (0-100), optional",
                    },
                },
                required: ["deviceId"],
            },
        },
        {
            name: "home_list_areas",
            description: "List all areas/rooms in the home with device counts",
            inputSchema: {
                type: "object",
                properties: {
                    floor: {
                        type: "string",
                        description: "Optional: filter areas by floor",
                    },
                },
            },
        },
        {
            name: "home_get_area",
            description: "Get detailed information about a specific area including all devices in it",
            inputSchema: {
                type: "object",
                properties: {
                    areaId: { type: "string", description: "Area ID" },
                },
                required: ["areaId"],
            },
        },
        {
            name: "home_set_thermostat",
            description: "Control a thermostat (set temperature and mode)",
            inputSchema: {
                type: "object",
                properties: {
                    deviceId: { type: "string", description: "Device ID" },
                    temperature: {
                        type: "number",
                        description: "Target temperature in degrees",
                    },
                    mode: {
                        type: "string",
                        description: "HVAC mode (heat, cool, auto, off)",
                        enum: ["heat", "cool", "auto", "off"],
                    },
                },
                required: ["deviceId"],
            },
        },
        {
            name: "home_set_color",
            description: "Set the color of a color-capable light",
            inputSchema: {
                type: "object",
                properties: {
                    deviceId: { type: "string", description: "Device ID" },
                    hue: {
                        type: "number",
                        description: "Hue value (0-360), optional",
                    },
                    saturation: {
                        type: "number",
                        description: "Saturation (0-100), optional",
                    },
                    rgb: {
                        type: "array",
                        description: "RGB values [r, g, b] (0-255 each), optional",
                        items: { type: "number" },
                        minItems: 3,
                        maxItems: 3,
                    },
                },
                required: ["deviceId"],
            },
        },
        {
            name: "home_set_cover",
            description: "Control a cover/blind (open, close, or set position)",
            inputSchema: {
                type: "object",
                properties: {
                    deviceId: { type: "string", description: "Device ID" },
                    action: {
                        type: "string",
                        description: "Action to perform",
                        enum: ["open", "close", "stop", "set_position"],
                    },
                    position: {
                        type: "number",
                        description: "Position (0-100) for set_position action",
                    },
                },
                required: ["deviceId", "action"],
            },
        },
    ];
}
/**
 * Handle device tool calls
 */
export async function handleDeviceToolCall(name, args, homeGraph, adapterManager, policyEngine) {
    switch (name) {
        case "home_list_devices": {
            const { areaId, capability, tag } = args;
            let devices = homeGraph.getAllDevices();
            if (areaId) {
                devices = devices.filter((d) => d.areaId === areaId);
            }
            if (capability) {
                devices = devices.filter((d) => d.capabilities.some((c) => c.type === capability));
            }
            if (tag) {
                devices = devices.filter((d) => d.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()));
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(devices, null, 2),
                    },
                ],
            };
        }
        case "home_get_device": {
            const { deviceId } = args;
            const device = homeGraph.getDevice(deviceId);
            if (!device) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Device not found: ${deviceId}`,
                        },
                    ],
                    isError: true,
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(device, null, 2),
                    },
                ],
            };
        }
        case "home_find_devices": {
            const { name, areaName } = args;
            let devices = homeGraph.findDevicesByName(name);
            if (areaName) {
                const areas = homeGraph.findAreasByName(areaName);
                const areaIds = areas.map((a) => a.id);
                devices = devices.filter((d) => d.areaId && areaIds.includes(d.areaId));
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(devices, null, 2),
                    },
                ],
            };
        }
        case "home_get_snapshot": {
            const snapshot = homeGraph.getSnapshot();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(snapshot, null, 2),
                    },
                ],
            };
        }
        case "home_set_switch": {
            const { deviceId, on } = args;
            const device = homeGraph.getDevice(deviceId);
            if (!device) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Device not found: ${deviceId}`,
                        },
                    ],
                    isError: true,
                };
            }
            const command = {
                deviceId,
                capability: CapabilityType.SWITCH,
                action: on ? "turn_on" : "turn_off",
            };
            // Evaluate policy
            const policyResult = policyEngine.evaluateDeviceCommand(command, device);
            if (policyResult.decision === PolicyDecision.DENY) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Action denied: ${policyResult.reason}`,
                        },
                    ],
                    isError: true,
                };
            }
            if (policyResult.decision === PolicyDecision.REQUIRE_CONFIRMATION) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Action requires confirmation: ${policyResult.reason}. Please confirm to proceed.`,
                        },
                    ],
                };
            }
            // Execute command
            await adapterManager.executeDeviceCommand(command, device.adapterId);
            return {
                content: [
                    {
                        type: "text",
                        text: `Switch ${on ? "turned on" : "turned off"} successfully`,
                    },
                ],
            };
        }
        case "home_set_light": {
            const { deviceId, on, brightness } = args;
            const device = homeGraph.getDevice(deviceId);
            if (!device) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Device not found: ${deviceId}`,
                        },
                    ],
                    isError: true,
                };
            }
            // Handle on/off
            if (on !== undefined) {
                const command = {
                    deviceId,
                    capability: CapabilityType.SWITCH,
                    action: on ? "turn_on" : "turn_off",
                };
                const policyResult = policyEngine.evaluateDeviceCommand(command, device);
                if (policyResult.decision === PolicyDecision.DENY) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Action denied: ${policyResult.reason}`,
                            },
                        ],
                        isError: true,
                    };
                }
                await adapterManager.executeDeviceCommand(command, device.adapterId);
            }
            // Handle brightness
            if (brightness !== undefined) {
                const command = {
                    deviceId,
                    capability: CapabilityType.DIMMER,
                    action: "set_brightness",
                    parameters: { brightness },
                };
                const policyResult = policyEngine.evaluateDeviceCommand(command, device);
                if (policyResult.decision === PolicyDecision.DENY) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Action denied: ${policyResult.reason}`,
                            },
                        ],
                        isError: true,
                    };
                }
                await adapterManager.executeDeviceCommand(command, device.adapterId);
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `Light controlled successfully`,
                    },
                ],
            };
        }
        case "home_list_areas": {
            const { floor } = args;
            let areas = homeGraph.getAllAreas();
            if (floor) {
                areas = areas.filter((a) => a.floor === floor);
            }
            // Add device counts to each area
            const areasWithCounts = areas.map((area) => ({
                ...area,
                deviceCount: homeGraph.findDevicesByArea(area.id).length,
            }));
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(areasWithCounts, null, 2),
                    },
                ],
            };
        }
        case "home_get_area": {
            const { areaId } = args;
            const area = homeGraph.getArea(areaId);
            if (!area) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Area not found: ${areaId}`,
                        },
                    ],
                    isError: true,
                };
            }
            const devices = homeGraph.findDevicesByArea(areaId);
            const result = {
                ...area,
                devices,
            };
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        case "home_set_thermostat": {
            const { deviceId, temperature, mode } = args;
            const device = homeGraph.getDevice(deviceId);
            if (!device) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Device not found: ${deviceId}`,
                        },
                    ],
                    isError: true,
                };
            }
            // Set temperature if provided
            if (temperature !== undefined) {
                const command = {
                    deviceId,
                    capability: CapabilityType.THERMOSTAT,
                    action: "set_temperature",
                    parameters: { temperature },
                };
                const policyResult = policyEngine.evaluateDeviceCommand(command, device);
                if (policyResult.decision === PolicyDecision.DENY) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Action denied: ${policyResult.reason}`,
                            },
                        ],
                        isError: true,
                    };
                }
                await adapterManager.executeDeviceCommand(command, device.adapterId);
            }
            // Set mode if provided
            if (mode !== undefined) {
                const command = {
                    deviceId,
                    capability: CapabilityType.THERMOSTAT,
                    action: "set_mode",
                    parameters: { mode },
                };
                const policyResult = policyEngine.evaluateDeviceCommand(command, device);
                if (policyResult.decision === PolicyDecision.DENY) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Action denied: ${policyResult.reason}`,
                            },
                        ],
                        isError: true,
                    };
                }
                await adapterManager.executeDeviceCommand(command, device.adapterId);
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `Thermostat controlled successfully`,
                    },
                ],
            };
        }
        case "home_set_color": {
            const { deviceId, hue, saturation, rgb } = args;
            const device = homeGraph.getDevice(deviceId);
            if (!device) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Device not found: ${deviceId}`,
                        },
                    ],
                    isError: true,
                };
            }
            const parameters = {};
            if (hue !== undefined)
                parameters.hue = hue;
            if (saturation !== undefined)
                parameters.saturation = saturation;
            if (rgb !== undefined)
                parameters.rgb = rgb;
            const command = {
                deviceId,
                capability: CapabilityType.COLOR_LIGHT,
                action: "set_color",
                parameters,
            };
            const policyResult = policyEngine.evaluateDeviceCommand(command, device);
            if (policyResult.decision === PolicyDecision.DENY) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Action denied: ${policyResult.reason}`,
                        },
                    ],
                    isError: true,
                };
            }
            await adapterManager.executeDeviceCommand(command, device.adapterId);
            return {
                content: [
                    {
                        type: "text",
                        text: `Color set successfully`,
                    },
                ],
            };
        }
        case "home_set_cover": {
            const { deviceId, action, position } = args;
            const device = homeGraph.getDevice(deviceId);
            if (!device) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Device not found: ${deviceId}`,
                        },
                    ],
                    isError: true,
                };
            }
            const parameters = {};
            if (position !== undefined)
                parameters.position = position;
            const command = {
                deviceId,
                capability: CapabilityType.COVER,
                action,
                parameters,
            };
            const policyResult = policyEngine.evaluateDeviceCommand(command, device);
            if (policyResult.decision === PolicyDecision.DENY) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Action denied: ${policyResult.reason}`,
                        },
                    ],
                    isError: true,
                };
            }
            await adapterManager.executeDeviceCommand(command, device.adapterId);
            return {
                content: [
                    {
                        type: "text",
                        text: `Cover ${action} executed successfully`,
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
//# sourceMappingURL=deviceTools.js.map