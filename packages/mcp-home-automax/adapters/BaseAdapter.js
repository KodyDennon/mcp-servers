/**
 * Base Adapter interface and abstract class for home automation integrations
 */
/**
 * Abstract base class for adapters with common functionality
 */
export class BaseAdapter {
    id;
    type;
    config;
    connected = false;
    healthy = false;
    lastSync;
    lastHealthCheck;
    error;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 5000; // 5 seconds
    reconnectTimer;
    healthCheckTimer;
    healthCheckInterval = 60000; // 1 minute
    eventListeners = [];
    constructor(config) {
        this.id = config.id;
        this.type = config.type;
        this.config = config;
        // Override defaults from config if provided
        if (typeof config.maxReconnectAttempts === "number") {
            this.maxReconnectAttempts = config.maxReconnectAttempts;
        }
        if (typeof config.reconnectDelay === "number") {
            this.reconnectDelay = config.reconnectDelay;
        }
        if (typeof config.healthCheckInterval === "number") {
            this.healthCheckInterval = config.healthCheckInterval;
        }
    }
    /**
     * Default health check implementation - can be overridden
     */
    async healthCheck() {
        try {
            // Default: attempt to discover devices as a health check
            await this.discoverDevices();
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
    /**
     * Reconnect logic with exponential backoff
     */
    async reconnect() {
        if (this.reconnectTimer) {
            return; // Already reconnecting
        }
        this.reconnectAttempts++;
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            const error = `Max reconnect attempts (${this.maxReconnectAttempts}) reached`;
            this.setError(error);
            this.emit({
                type: "error",
                adapterId: this.id,
                timestamp: new Date(),
                data: { error },
            });
            return;
        }
        try {
            await this.shutdown();
            await this.initialize();
            this.reconnectAttempts = 0;
            this.emit({
                type: "connected",
                adapterId: this.id,
                timestamp: new Date(),
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.setError(errorMessage);
            // Schedule next reconnect with exponential backoff
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            this.reconnectTimer = setTimeout(() => {
                this.reconnectTimer = undefined;
                this.reconnect();
            }, delay);
            this.emit({
                type: "error",
                adapterId: this.id,
                timestamp: new Date(),
                data: { error: errorMessage, reconnectAttempt: this.reconnectAttempts },
            });
        }
    }
    /**
     * Subscribe to events
     */
    on(listener) {
        this.eventListeners.push(listener);
    }
    /**
     * Unsubscribe from events
     */
    off(listener) {
        const index = this.eventListeners.indexOf(listener);
        if (index >= 0) {
            this.eventListeners.splice(index, 1);
        }
    }
    /**
     * Emit an event to all listeners
     */
    emit(event) {
        for (const listener of this.eventListeners) {
            try {
                listener(event);
            }
            catch (error) {
                console.error("Error in adapter event listener:", error);
            }
        }
    }
    /**
     * Start automatic health checking
     */
    startHealthCheck() {
        if (this.healthCheckTimer) {
            return;
        }
        this.healthCheckTimer = setInterval(async () => {
            const healthy = await this.healthCheck();
            if (!healthy && this.connected) {
                await this.reconnect();
            }
        }, this.healthCheckInterval);
    }
    /**
     * Stop automatic health checking
     */
    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
    }
    getStatus() {
        return {
            connected: this.connected,
            healthy: this.healthy,
            lastSync: this.lastSync,
            lastHealthCheck: this.lastHealthCheck,
            error: this.error,
            reconnectAttempts: this.reconnectAttempts,
        };
    }
    setConnected(connected) {
        const wasConnected = this.connected;
        this.connected = connected;
        this.healthy = connected;
        if (connected) {
            this.error = undefined;
            this.reconnectAttempts = 0;
            if (!wasConnected) {
                this.emit({
                    type: "connected",
                    adapterId: this.id,
                    timestamp: new Date(),
                });
            }
        }
        else if (wasConnected) {
            this.emit({
                type: "disconnected",
                adapterId: this.id,
                timestamp: new Date(),
            });
        }
    }
    setError(error) {
        this.error = error;
        this.healthy = false;
        this.emit({
            type: "error",
            adapterId: this.id,
            timestamp: new Date(),
            data: { error },
        });
    }
    updateLastSync() {
        this.lastSync = new Date();
    }
}
//# sourceMappingURL=BaseAdapter.js.map