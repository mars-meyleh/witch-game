// Centralized event manager for game and UI actions
// Handles registration, deregistration, and dispatching of events

class EventManager {
    constructor() {
        this.listeners = {};
    }

    // Register an event listener
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    // Remove an event listener
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    // Dispatch an event to all listeners
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb(data));
    }

    // Utility: clear all listeners (for cleanup)
    clear() {
        this.listeners = {};
    }
}

// Export a singleton instance
const eventManager = new EventManager();
export default eventManager;
