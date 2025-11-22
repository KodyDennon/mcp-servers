/**
 * Home Graph - Central model for home state and device management
 */
/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}
/**
 * HomeGraph manages the normalized, adapter-agnostic representation of the home
 */
export class HomeGraph {
    areas = new Map();
    devices = new Map();
    scenes = new Map();
    groups = new Map();
    stateChangeListeners = [];
    /**
     * Add or update an area
     */
    setArea(area) {
        this.areas.set(area.id, area);
    }
    /**
     * Get area by ID
     */
    getArea(id) {
        return this.areas.get(id);
    }
    /**
     * Find areas by name (case-insensitive)
     */
    findAreasByName(name) {
        const lowerName = name.toLowerCase();
        return Array.from(this.areas.values()).filter((area) => area.name.toLowerCase().includes(lowerName) ||
            area.aliases?.some((alias) => alias.toLowerCase().includes(lowerName)));
    }
    /**
     * Get all areas
     */
    getAllAreas() {
        return Array.from(this.areas.values());
    }
    /**
     * Add or update a device
     */
    setDevice(device) {
        this.devices.set(device.id, device);
    }
    /**
     * Get device by ID
     */
    getDevice(id) {
        return this.devices.get(id);
    }
    /**
     * Find devices by name (case-insensitive, fuzzy with scoring)
     */
    findDevicesByName(name, maxResults = 10) {
        const lowerName = name.toLowerCase();
        const devices = Array.from(this.devices.values());
        // Calculate match scores
        const scored = devices.map((device) => {
            let score = 0;
            const deviceNameLower = device.name.toLowerCase();
            // Exact match
            if (deviceNameLower === lowerName) {
                score = 1000;
            }
            // Starts with
            else if (deviceNameLower.startsWith(lowerName)) {
                score = 500;
            }
            // Contains
            else if (deviceNameLower.includes(lowerName)) {
                score = 250;
            }
            // Check aliases
            else if (device.aliases) {
                for (const alias of device.aliases) {
                    const aliasLower = alias.toLowerCase();
                    if (aliasLower === lowerName) {
                        score = Math.max(score, 900);
                    }
                    else if (aliasLower.startsWith(lowerName)) {
                        score = Math.max(score, 400);
                    }
                    else if (aliasLower.includes(lowerName)) {
                        score = Math.max(score, 200);
                    }
                }
            }
            // Fuzzy match using Levenshtein distance
            if (score === 0) {
                const distance = levenshteinDistance(lowerName, deviceNameLower);
                if (distance <= 3) {
                    score = 100 - distance * 20;
                }
            }
            return { device, score };
        });
        // Filter and sort by score
        return scored
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map((item) => item.device);
    }
    /**
     * Find devices by area ID
     */
    findDevicesByArea(areaId) {
        return Array.from(this.devices.values()).filter((device) => device.areaId === areaId);
    }
    /**
     * Find devices by capability type
     */
    findDevicesByCapability(capabilityType) {
        return Array.from(this.devices.values()).filter((device) => device.capabilities.some((cap) => cap.type === capabilityType));
    }
    /**
     * Find devices by tag
     */
    findDevicesByTag(tag) {
        const lowerTag = tag.toLowerCase();
        return Array.from(this.devices.values()).filter((device) => device.tags?.some((t) => t.toLowerCase() === lowerTag));
    }
    /**
     * Get all devices
     */
    getAllDevices() {
        return Array.from(this.devices.values());
    }
    /**
     * Remove a device
     */
    removeDevice(id) {
        return this.devices.delete(id);
    }
    /**
     * Add or update a scene
     */
    setScene(scene) {
        this.scenes.set(scene.id, scene);
    }
    /**
     * Get scene by ID
     */
    getScene(id) {
        return this.scenes.get(id);
    }
    /**
     * Find scenes by name (case-insensitive)
     */
    findScenesByName(name) {
        const lowerName = name.toLowerCase();
        return Array.from(this.scenes.values()).filter((scene) => scene.name.toLowerCase().includes(lowerName));
    }
    /**
     * Get all scenes
     */
    getAllScenes() {
        return Array.from(this.scenes.values());
    }
    /**
     * Add or update a device group
     */
    setGroup(group) {
        this.groups.set(group.id, group);
    }
    /**
     * Get group by ID
     */
    getGroup(id) {
        return this.groups.get(id);
    }
    /**
     * Get all groups
     */
    getAllGroups() {
        return Array.from(this.groups.values());
    }
    /**
     * Find groups by tag
     */
    findGroupsByTag(tag) {
        const lowerTag = tag.toLowerCase();
        return Array.from(this.groups.values()).filter((group) => group.tags?.some((t) => t.toLowerCase() === lowerTag));
    }
    /**
     * Get all devices in a group
     */
    getDevicesInGroup(groupId) {
        const group = this.groups.get(groupId);
        if (!group) {
            return [];
        }
        return group.deviceIds
            .map((id) => this.devices.get(id))
            .filter((d) => d !== undefined);
    }
    /**
     * Update device state and emit change event
     */
    updateDeviceState(deviceId, capability, newState) {
        const device = this.devices.get(deviceId);
        if (!device) {
            return;
        }
        const cap = device.capabilities.find((c) => c.type === capability);
        if (!cap) {
            return;
        }
        const oldState = cap.state;
        cap.state = newState;
        device.lastUpdated = new Date();
        // Emit state change event
        const event = {
            deviceId,
            capability,
            oldState,
            newState,
            timestamp: new Date(),
        };
        this.emitStateChange(event);
    }
    /**
     * Register a state change listener
     */
    onStateChange(listener) {
        this.stateChangeListeners.push(listener);
    }
    /**
     * Remove a state change listener
     */
    removeStateChangeListener(listener) {
        const index = this.stateChangeListeners.indexOf(listener);
        if (index >= 0) {
            this.stateChangeListeners.splice(index, 1);
        }
    }
    /**
     * Emit a state change event to all listeners
     */
    emitStateChange(event) {
        for (const listener of this.stateChangeListeners) {
            try {
                listener(event);
            }
            catch (error) {
                console.error("Error in state change listener:", error);
            }
        }
    }
    /**
     * Get hierarchical areas (areas grouped by floor/parent)
     */
    getHierarchicalAreas() {
        const hierarchy = new Map();
        for (const area of this.areas.values()) {
            const parent = area.parentAreaId || area.floor;
            if (!hierarchy.has(parent)) {
                hierarchy.set(parent, []);
            }
            hierarchy.get(parent).push(area);
        }
        return hierarchy;
    }
    /**
     * Get child areas of a parent area
     */
    getChildAreas(parentId) {
        return Array.from(this.areas.values()).filter((area) => area.parentAreaId === parentId);
    }
    /**
     * Get a complete snapshot of the home state
     */
    getSnapshot() {
        return {
            areas: this.getAllAreas(),
            devices: this.getAllDevices(),
            scenes: this.getAllScenes(),
            groups: this.getAllGroups(),
            timestamp: new Date(),
        };
    }
    /**
     * Clear all data (for testing or reset)
     */
    clear() {
        this.areas.clear();
        this.devices.clear();
        this.scenes.clear();
        this.groups.clear();
        this.stateChangeListeners = [];
    }
    /**
     * Get statistics about the home
     */
    getStats() {
        return {
            areaCount: this.areas.size,
            deviceCount: this.devices.size,
            sceneCount: this.scenes.size,
            groupCount: this.groups.size,
            onlineDevices: Array.from(this.devices.values()).filter((d) => d.online !== false).length,
            listenerCount: this.stateChangeListeners.length,
        };
    }
}
//# sourceMappingURL=HomeGraph.js.map