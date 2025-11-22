/**
 * Adapter Manager - Manages multiple adapters and routes commands
 */
/**
 * Manages all adapters and coordinates their operations
 */
export class AdapterManager {
    adapters = new Map();
    adapterPriorities = new Map();
    commandQueue = [];
    isProcessingQueue = false;
    maxQueueSize = 1000;
    commandsPerSecond = 10;
    lastCommandTime = 0;
    commandThrottleDelay = 100; // ms between commands
    /**
     * Register an adapter
     */
    registerAdapter(adapter, priority = 0) {
        this.adapters.set(adapter.id, adapter);
        this.adapterPriorities.set(adapter.id, priority);
    }
    /**
     * Set adapter priority
     */
    setAdapterPriority(adapterId, priority) {
        this.adapterPriorities.set(adapterId, priority);
    }
    /**
     * Get adapter priority
     */
    getAdapterPriority(adapterId) {
        return this.adapterPriorities.get(adapterId) || 0;
    }
    /**
     * Unregister an adapter
     */
    unregisterAdapter(adapterId) {
        this.adapters.delete(adapterId);
    }
    /**
     * Get an adapter by ID
     */
    getAdapter(adapterId) {
        return this.adapters.get(adapterId);
    }
    /**
     * Get all adapters
     */
    getAllAdapters() {
        return Array.from(this.adapters.values());
    }
    /**
     * Initialize all adapters
     */
    async initializeAll() {
        const promises = Array.from(this.adapters.values()).map((adapter) => adapter.initialize().catch((error) => {
            console.error(`Failed to initialize adapter ${adapter.id}:`, error);
        }));
        await Promise.all(promises);
    }
    /**
     * Shutdown all adapters
     */
    async shutdownAll() {
        const promises = Array.from(this.adapters.values()).map((adapter) => adapter.shutdown().catch((error) => {
            console.error(`Failed to shutdown adapter ${adapter.id}:`, error);
        }));
        await Promise.all(promises);
    }
    /**
     * Discover all devices from all adapters
     */
    async discoverAllDevices() {
        const deviceArrays = await Promise.all(Array.from(this.adapters.values()).map((adapter) => adapter.discoverDevices().catch((error) => {
            console.error(`Failed to discover devices from adapter ${adapter.id}:`, error);
            return [];
        })));
        return deviceArrays.flat();
    }
    /**
     * Discover all scenes from all adapters
     */
    async discoverAllScenes() {
        const sceneArrays = await Promise.all(Array.from(this.adapters.values()).map((adapter) => adapter.discoverScenes().catch((error) => {
            console.error(`Failed to discover scenes from adapter ${adapter.id}:`, error);
            return [];
        })));
        return sceneArrays.flat();
    }
    /**
     * Discover all areas from all adapters
     */
    async discoverAllAreas() {
        const areaArrays = await Promise.all(Array.from(this.adapters.values()).map((adapter) => adapter.discoverAreas().catch((error) => {
            console.error(`Failed to discover areas from adapter ${adapter.id}:`, error);
            return [];
        })));
        return areaArrays.flat();
    }
    /**
     * Execute a device command through the appropriate adapter
     */
    async executeDeviceCommand(command, adapterId) {
        const adapter = this.adapters.get(adapterId);
        if (!adapter) {
            throw new Error(`Adapter not found: ${adapterId}`);
        }
        await adapter.executeCommand(command);
    }
    /**
     * Execute a scene command through the appropriate adapter
     */
    async executeSceneCommand(command, adapterId) {
        const adapter = this.adapters.get(adapterId);
        if (!adapter) {
            throw new Error(`Adapter not found: ${adapterId}`);
        }
        await adapter.executeScene(command);
    }
    /**
     * Refresh all adapters
     */
    async refreshAll() {
        const promises = Array.from(this.adapters.values()).map((adapter) => adapter.refresh().catch((error) => {
            console.error(`Failed to refresh adapter ${adapter.id}:`, error);
        }));
        await Promise.all(promises);
    }
    /**
     * Get status of all adapters
     */
    getAllStatus() {
        return Array.from(this.adapters.values()).map((adapter) => ({
            id: adapter.id,
            type: adapter.type,
            priority: this.getAdapterPriority(adapter.id),
            ...adapter.getStatus(),
        }));
    }
    /**
     * Execute a device command with queuing (non-blocking)
     */
    async queueDeviceCommand(command, adapterId, priority = 0) {
        return new Promise((resolve, reject) => {
            if (this.commandQueue.length >= this.maxQueueSize) {
                reject(new Error("Command queue is full"));
                return;
            }
            this.commandQueue.push({
                type: "device",
                command,
                adapterId,
                priority,
                timestamp: new Date(),
                resolve,
                reject,
            });
            this.processQueue();
        });
    }
    /**
     * Execute a scene command with queuing (non-blocking)
     */
    async queueSceneCommand(command, adapterId, priority = 0) {
        return new Promise((resolve, reject) => {
            if (this.commandQueue.length >= this.maxQueueSize) {
                reject(new Error("Command queue is full"));
                return;
            }
            this.commandQueue.push({
                type: "scene",
                command,
                adapterId,
                priority,
                timestamp: new Date(),
                resolve,
                reject,
            });
            this.processQueue();
        });
    }
    /**
     * Process the command queue
     */
    async processQueue() {
        if (this.isProcessingQueue || this.commandQueue.length === 0) {
            return;
        }
        this.isProcessingQueue = true;
        while (this.commandQueue.length > 0) {
            // Sort queue by priority (higher first) and timestamp (older first)
            this.commandQueue.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                }
                return a.timestamp.getTime() - b.timestamp.getTime();
            });
            const item = this.commandQueue.shift();
            if (!item) {
                break;
            }
            // Throttle commands
            const now = Date.now();
            const timeSinceLastCommand = now - this.lastCommandTime;
            if (timeSinceLastCommand < this.commandThrottleDelay) {
                await new Promise((resolve) => setTimeout(resolve, this.commandThrottleDelay - timeSinceLastCommand));
            }
            try {
                if (item.type === "device") {
                    await this.executeDeviceCommand(item.command, item.adapterId);
                }
                else {
                    await this.executeSceneCommand(item.command, item.adapterId);
                }
                item.resolve();
            }
            catch (error) {
                item.reject(error);
            }
            this.lastCommandTime = Date.now();
        }
        this.isProcessingQueue = false;
    }
    /**
     * Execute multiple device commands in bulk
     */
    async executeBulkDeviceCommands(commands) {
        const promises = commands.map(({ command, adapterId }) => this.executeDeviceCommand(command, adapterId).catch((error) => {
            console.error(`Failed to execute command on device ${command.deviceId}:`, error);
        }));
        await Promise.all(promises);
    }
    /**
     * Execute multiple scene commands in bulk
     */
    async executeBulkSceneCommands(commands) {
        const promises = commands.map(({ command, adapterId }) => this.executeSceneCommand(command, adapterId).catch((error) => {
            console.error(`Failed to execute scene ${command.sceneId}:`, error);
        }));
        await Promise.all(promises);
    }
    /**
     * Get queue statistics
     */
    getQueueStats() {
        return {
            queueLength: this.commandQueue.length,
            maxQueueSize: this.maxQueueSize,
            isProcessing: this.isProcessingQueue,
            commandsPerSecond: this.commandsPerSecond,
            throttleDelay: this.commandThrottleDelay,
        };
    }
    /**
     * Clear the command queue
     */
    clearQueue() {
        const items = this.commandQueue.splice(0);
        for (const item of items) {
            item.reject(new Error("Queue cleared"));
        }
    }
}
//# sourceMappingURL=AdapterManager.js.map