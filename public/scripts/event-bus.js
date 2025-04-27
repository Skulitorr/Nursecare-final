console.log('Event Bus Module Loaded');

// Define all possible events
export const Events = {
    // Core events
    APP_INITIALIZED: 'app:initialized',
    PAGE_LOADED: 'page:loaded',
    ROUTE_CHANGED: 'route:changed',
    DATA_LOADED: 'data:loaded',
    ERROR_OCCURRED: 'error:occurred',

    // Authentication events
    AUTH_INITIALIZED: 'auth:initialized',
    AUTH_STATE_CHANGED: 'auth:stateChanged',
    AUTH_ERROR: 'auth:error',
    LOGIN_SUCCESS: 'auth:loginSuccess',
    LOGIN_ERROR: 'auth:loginError',
    LOGOUT: 'auth:logout',

    // Patient events
    PATIENT_LOADED: 'patient:loaded',
    PATIENT_UPDATED: 'patient:updated',
    PATIENT_CREATED: 'patient:created',
    PATIENT_DELETED: 'patient:deleted',
    VITALS_UPDATED: 'patient:vitalsUpdated',

    // Staff events
    STAFF_LOADED: 'staff:loaded',
    STAFF_UPDATED: 'staff:updated',
    STAFF_CREATED: 'staff:created',
    STAFF_DELETED: 'staff:deleted',
    SHIFT_UPDATED: 'staff:shiftUpdated',

    // Schedule events
    SCHEDULE_LOADED: 'schedule:loaded',
    SCHEDULE_UPDATED: 'schedule:updated',
    SHIFT_CREATED: 'schedule:shiftCreated',
    SHIFT_DELETED: 'schedule:shiftDeleted',
    SHIFT_ASSIGNED: 'schedule:shiftAssigned',

    // Inventory events
    INVENTORY_LOADED: 'inventory:loaded',
    INVENTORY_UPDATED: 'inventory:updated',
    STOCK_LOW: 'inventory:stockLow',
    ITEM_EXPIRED: 'inventory:itemExpired',

    // AI events
    AI_INITIALIZED: 'ai:initialized',
    AI_REPORT_GENERATED: 'ai:reportGenerated',
    AI_CHAT_MESSAGE: 'ai:chatMessage',
    AI_ERROR: 'ai:error',

    // UI events
    THEME_CHANGED: 'ui:themeChanged',
    SIDEBAR_TOGGLE: 'ui:sidebarToggle',
    MODAL_OPEN: 'ui:modalOpen',
    MODAL_CLOSE: 'ui:modalClose',
    NOTIFICATION_SHOW: 'ui:notificationShow',
    NOTIFICATION_CLEAR: 'ui:notificationClear',

    // Settings events
    SETTINGS_LOADED: 'settings:loaded',
    SETTINGS_UPDATED: 'settings:updated',
    PREFERENCES_CHANGED: 'settings:preferencesChanged',

    // Debug events
    DEBUG_ENABLED: 'debug:enabled',
    DEBUG_DISABLED: 'debug:disabled',
    PERFORMANCE_MARK: 'debug:performanceMark'
};

class EventBus {
    constructor() {
        this.events = new Map();
        this.debug = false;
    }

    enableDebug() {
        this.debug = true;
        console.log('Event Bus Debug Mode Enabled');
    }

    disableDebug() {
        this.debug = false;
    }

    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        
        const handlers = this.events.get(eventName);
        handlers.add(callback);
        
        if (this.debug) {
            console.log(`Event listener added for: ${eventName}`);
        }
        
        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }

    off(eventName, callback) {
        const handlers = this.events.get(eventName);
        
        if (handlers) {
            handlers.delete(callback);
            
            if (this.debug) {
                console.log(`Event listener removed for: ${eventName}`);
            }
            
            // Clean up empty handler sets
            if (handlers.size === 0) {
                this.events.delete(eventName);
            }
        }
    }

    once(eventName, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(eventName, wrapper);
        };
        
        return this.on(eventName, wrapper);
    }

    emit(eventName, data = null) {
        const handlers = this.events.get(eventName);
        
        if (handlers) {
            handlers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                    // Re-emit as error event
                    if (eventName !== Events.ERROR_OCCURRED) {
                        this.emit(Events.ERROR_OCCURRED, error);
                    }
                }
            });
            
            if (this.debug) {
                console.log(`Event emitted: ${eventName}`, data);
            }
        }
    }

    clear(eventName) {
        if (eventName) {
            this.events.delete(eventName);
            
            if (this.debug) {
                console.log(`Cleared all handlers for: ${eventName}`);
            }
        } else {
            this.events.clear();
            
            if (this.debug) {
                console.log('Cleared all event handlers');
            }
        }
    }

    listEvents() {
        return Array.from(this.events.keys());
    }

    hasListeners(eventName) {
        return this.events.has(eventName) && this.events.get(eventName).size > 0;
    }

    getListenerCount(eventName) {
        const handlers = this.events.get(eventName);
        return handlers ? handlers.size : 0;
    }

    emitAsync(eventName, data = null) {
        const handlers = this.events.get(eventName);
        
        if (handlers) {
            const promises = Array.from(handlers).map(callback =>
                Promise.resolve().then(() => callback(data))
            );
            
            if (this.debug) {
                console.log(`Async event emitted: ${eventName}`, data);
            }
            
            return Promise.all(promises);
        }
        
        return Promise.resolve([]);
    }

    pipe(sourceEvent, targetEvent, transform) {
        return this.on(sourceEvent, data => {
            const transformedData = transform ? transform(data) : data;
            this.emit(targetEvent, transformedData);
        });
    }
}

// Create and export singleton instance
const eventBus = new EventBus();
export default eventBus;