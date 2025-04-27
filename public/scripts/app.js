import eventBus, { Events } from './event-bus.js';
import debugManager from './debug.js';
import errorHandler from './error-handler.js';
import chartManager from './charts.js';
import aiManager from './ai.js';
import apiClient from './api-client.js';
import authManager from './auth.js';
import navigationManager from './navigation.js';
import notificationsManager from './notifications.js';

console.log('App Module Loaded');

class App {
    constructor() {
        this.initialized = false;
        this.modules = new Map();
        this.initPromises = new Map();
    }

    async initialize() {
        console.log('Initializing application...');
        
        try {
            // Register core modules
            this.registerModule('debug', debugManager);
            this.registerModule('error', errorHandler);
            this.registerModule('charts', chartManager);
            this.registerModule('ai', aiManager);
            this.registerModule('api', apiClient);
            this.registerModule('auth', authManager);
            this.registerModule('navigation', navigationManager);
            this.registerModule('notifications', notificationsManager);

            // Initialize error handling first
            await this.initializeModule('error');
            
            // Initialize debug mode if enabled
            const debugMode = localStorage.getItem('debugMode') === 'true';
            if (debugMode) {
                await this.initializeModule('debug');
                debugManager.enable();
            }

            // Initialize remaining core modules in parallel
            await Promise.all([
                this.initializeModule('auth'),
                this.initializeModule('api'),
                this.initializeModule('navigation'),
                this.initializeModule('notifications'),
                this.initializeModule('charts'),
                this.initializeModule('ai')
            ]);

            // Set up global event listeners
            this.setupEventListeners();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Mark as initialized
            this.initialized = true;
            eventBus.emit(Events.APP_INITIALIZED);

            console.log('Application initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize application:', error);
            errorHandler.handleError(error);
            return false;
        }
    }

    registerModule(name, module) {
        if (this.modules.has(name)) {
            throw new Error(`Module ${name} is already registered`);
        }
        this.modules.set(name, module);
    }

    async initializeModule(name) {
        // Skip if already initializing
        if (this.initPromises.has(name)) {
            return this.initPromises.get(name);
        }

        const module = this.modules.get(name);
        if (!module) {
            throw new Error(`Module ${name} is not registered`);
        }

        console.log(`Initializing module: ${name}`);
        debugManager.startPerformanceMark(`init:${name}`);

        try {
            // Create promise for initialization
            const promise = Promise.resolve()
                .then(() => {
                    // Call initialize if it exists
                    if (typeof module.initialize === 'function') {
                        return module.initialize();
                    }
                    return true;
                })
                .finally(() => {
                    // Clean up promise reference
                    this.initPromises.delete(name);
                    debugManager.endPerformanceMark(`init:${name}`);
                });

            // Store promise
            this.initPromises.set(name, promise);
            return promise;

        } catch (error) {
            console.error(`Failed to initialize module ${name}:`, error);
            errorHandler.handleError(error);
            throw error;
        }
    }

    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                eventBus.emit('app:hidden');
            } else {
                eventBus.emit('app:visible');
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            eventBus.emit('app:online');
            notificationsManager.showSuccess('Connection restored');
        });

        window.addEventListener('offline', () => {
            eventBus.emit('app:offline');
            notificationsManager.showWarning('No internet connection');
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                eventBus.emit('app:resize', {
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            }, 250);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Shift combinations
            if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
                switch (event.key.toLowerCase()) {
                    case 'd': // Toggle debug mode
                        event.preventDefault();
                        debugManager.enabled ? debugManager.disable() : debugManager.enable();
                        break;
                    
                    case 'l': // Toggle dark/light mode
                        event.preventDefault();
                        eventBus.emit(Events.THEME_CHANGED);
                        break;
                    
                    case 'e': // Focus search
                        event.preventDefault();
                        const searchInput = document.querySelector('.search-input');
                        if (searchInput) searchInput.focus();
                        break;
                    
                    case 'm': // Toggle menu
                        event.preventDefault();
                        eventBus.emit(Events.SIDEBAR_TOGGLE);
                        break;
                }
            }
        });
    }

    getModule(name) {
        return this.modules.get(name);
    }

    isInitialized() {
        return this.initialized;
    }

    async reinitializeModule(name) {
        console.log(`Reinitializing module: ${name}`);
        
        const module = this.modules.get(name);
        if (!module) {
            throw new Error(`Module ${name} is not registered`);
        }

        // Cleanup if possible
        if (typeof module.cleanup === 'function') {
            await module.cleanup();
        }

        // Reinitialize
        return this.initializeModule(name);
    }

    getDiagnostics() {
        const diagnostics = {
            initialized: this.initialized,
            modules: {},
            events: eventBus.listEvents(),
            debug: debugManager.getDiagnostics()
        };

        // Collect module states
        for (const [name, module] of this.modules) {
            diagnostics.modules[name] = {
                initialized: !this.initPromises.has(name),
                hasInitMethod: typeof module.initialize === 'function',
                hasCleanupMethod: typeof module.cleanup === 'function'
            };
        }

        return diagnostics;
    }
}

// Create and export singleton instance
const app = new App();
export default app;