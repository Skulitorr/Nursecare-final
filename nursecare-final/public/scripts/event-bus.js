// Event bus module for inter-component communication

class EventBus {
    constructor() {
        this.events = new Map();
        this.pendingEvents = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, callback, options = {}) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }

        const handlers = this.events.get(event);
        const handler = { callback, options };
        handlers.add(handler);

        // Handle any pending events for this subscription
        if (this.pendingEvents.has(event)) {
            const pendingEvents = this.pendingEvents.get(event);
            pendingEvents.forEach(data => {
                if (this.shouldHandleEvent(handler, data)) {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in event handler for ${event}:`, error);
                    }
                }
            });
            this.pendingEvents.delete(event);
        }

        // Return unsubscribe function
        return () => {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.events.delete(event);
            }
        };
    }

    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    publish(event, data = null) {
        const handlers = this.events.get(event);
        
        if (!handlers || handlers.size === 0) {
            // Store event for future subscribers
            if (!this.pendingEvents.has(event)) {
                this.pendingEvents.set(event, []);
            }
            this.pendingEvents.get(event).push(data);
            return;
        }

        handlers.forEach(handler => {
            if (this.shouldHandleEvent(handler, data)) {
                try {
                    handler.callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            }
        });
    }

    /**
     * Check if an event should be handled based on options
     * @param {Object} handler - Event handler
     * @param {*} data - Event data
     * @returns {boolean} Whether event should be handled
     */
    shouldHandleEvent(handler, data) {
        const { filter, once } = handler.options;

        if (filter && typeof filter === 'function') {
            if (!filter(data)) {
                return false;
            }
        }

        if (once) {
            this.events.get(event).delete(handler);
        }

        return true;
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function
     */
    once(event, callback, options = {}) {
        return this.subscribe(event, callback, { ...options, once: true });
    }

    /**
     * Subscribe to multiple events
     * @param {Object} subscriptions - Map of event names to callbacks
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function for all subscriptions
     */
    subscribeMultiple(subscriptions, options = {}) {
        const unsubscribers = Object.entries(subscriptions).map(
            ([event, callback]) => this.subscribe(event, callback, options)
        );

        return () => unsubscribers.forEach(unsubscribe => unsubscribe());
    }

    /**
     * Clear all subscriptions
     */
    clear() {
        this.events.clear();
        this.pendingEvents.clear();
    }
}

// Create singleton instance
const eventBus = new EventBus();

// Event names
export const EVENTS = {
    // Auth events
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_SESSION_EXPIRED: 'auth:session_expired',

    // User events
    USER_PROFILE_UPDATED: 'user:profile_updated',
    USER_PREFERENCES_CHANGED: 'user:preferences_changed',

    // Patient events
    PATIENT_CREATED: 'patient:created',
    PATIENT_UPDATED: 'patient:updated',
    PATIENT_DELETED: 'patient:deleted',
    PATIENT_STATUS_CHANGED: 'patient:status_changed',

    // Schedule events
    SHIFT_CREATED: 'schedule:shift_created',
    SHIFT_UPDATED: 'schedule:shift_updated',
    SHIFT_DELETED: 'schedule:shift_deleted',
    SHIFT_ASSIGNED: 'schedule:shift_assigned',
    SHIFT_APPROVED: 'schedule:shift_approved',
    SHIFT_REJECTED: 'schedule:shift_rejected',

    // Inventory events
    INVENTORY_UPDATED: 'inventory:updated',
    INVENTORY_LOW_STOCK: 'inventory:low_stock',
    INVENTORY_OUT_OF_STOCK: 'inventory:out_of_stock',

    // UI events
    THEME_CHANGED: 'ui:theme_changed',
    SIDEBAR_TOGGLE: 'ui:sidebar_toggle',
    MODAL_OPEN: 'ui:modal_open',
    MODAL_CLOSE: 'ui:modal_close',
    NOTIFICATION_NEW: 'ui:notification_new',
    NOTIFICATION_READ: 'ui:notification_read',

    // Data sync events
    SYNC_STARTED: 'sync:started',
    SYNC_COMPLETED: 'sync:completed',
    SYNC_ERROR: 'sync:error',

    // Error events
    ERROR_NETWORK: 'error:network',
    ERROR_API: 'error:api',
    ERROR_VALIDATION: 'error:validation'
};

// Export singleton instance and event names
export default eventBus;

// Example usage:
/*
import eventBus, { EVENTS } from './event-bus.js';

// Simple subscription
const unsubscribe = eventBus.subscribe(EVENTS.PATIENT_UPDATED, (patient) => {
    console.log('Patient updated:', patient);
});

// Subscription with filter
eventBus.subscribe(EVENTS.INVENTORY_LOW_STOCK, (item) => {
    console.log('Low stock alert:', item);
}, {
    filter: (item) => item.quantity < item.minimumQuantity
});

// One-time subscription
eventBus.once(EVENTS.NOTIFICATION_NEW, (notification) => {
    console.log('New notification:', notification);
});

// Multiple subscriptions
const unsubscribeAll = eventBus.subscribeMultiple({
    [EVENTS.SHIFT_CREATED]: (shift) => console.log('New shift:', shift),
    [EVENTS.SHIFT_UPDATED]: (shift) => console.log('Shift updated:', shift),
    [EVENTS.SHIFT_DELETED]: (shift) => console.log('Shift deleted:', shift)
});

// Publishing events
eventBus.publish(EVENTS.INVENTORY_UPDATED, {
    id: '123',
    name: 'Medical Supplies',
    quantity: 50
});

// Clean up
unsubscribe();
unsubscribeAll();
*/