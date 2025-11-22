/**
 * Resource tools for MCP
 */
/**
 * Get home schema resource
 */
export function getHomeSchema() {
    return {
        uri: "home://schema",
        name: "Home Schema",
        description: "Schema describing the home automation model",
        mimeType: "application/json",
    };
}
/**
 * Get home layout resource
 */
export function getHomeLayout() {
    return {
        uri: "home://layout",
        name: "Home Layout",
        description: "Current layout of areas and devices in the home",
        mimeType: "application/json",
    };
}
/**
 * Get home policies resource
 */
export function getHomePolicies() {
    return {
        uri: "home://policies",
        name: "Home Policies",
        description: "Safety and policy rules for home automation",
        mimeType: "application/json",
    };
}
/**
 * Get all resources
 */
export function getResources() {
    return [getHomeSchema(), getHomeLayout(), getHomePolicies()];
}
/**
 * Handle resource requests
 */
export async function handleResourceRead(uri, homeGraph, policyEngine) {
    switch (uri) {
        case "home://schema":
            return {
                contents: [
                    {
                        uri,
                        mimeType: "application/json",
                        text: JSON.stringify({
                            version: "1.0",
                            description: "Home automation model schema",
                            types: {
                                Device: {
                                    properties: {
                                        id: "string",
                                        name: "string",
                                        type: "DeviceType",
                                        areaId: "string",
                                        capabilities: "Capability[]",
                                        tags: "string[]",
                                        adapterId: "string",
                                        nativeId: "string",
                                        online: "boolean",
                                    },
                                },
                                Area: {
                                    properties: {
                                        id: "string",
                                        name: "string",
                                        floor: "string",
                                        tags: "string[]",
                                    },
                                },
                                Scene: {
                                    properties: {
                                        id: "string",
                                        name: "string",
                                        description: "string",
                                        tags: "string[]",
                                    },
                                },
                                CapabilityType: {
                                    enum: [
                                        "switch",
                                        "light",
                                        "dimmer",
                                        "color_light",
                                        "thermostat",
                                        "lock",
                                        "cover",
                                        "media_player",
                                        "sensor",
                                        "camera",
                                    ],
                                },
                            },
                        }, null, 2),
                    },
                ],
            };
        case "home://layout":
            return {
                contents: [
                    {
                        uri,
                        mimeType: "application/json",
                        text: JSON.stringify({
                            areas: homeGraph.getAllAreas(),
                            devices: homeGraph.getAllDevices(),
                            scenes: homeGraph.getAllScenes(),
                            stats: homeGraph.getStats(),
                        }, null, 2),
                    },
                ],
            };
        case "home://policies":
            return {
                contents: [
                    {
                        uri,
                        mimeType: "application/json",
                        text: JSON.stringify(policyEngine.getConfig(), null, 2),
                    },
                ],
            };
        default:
            throw new Error(`Unknown resource URI: ${uri}`);
    }
}
//# sourceMappingURL=resourceTools.js.map