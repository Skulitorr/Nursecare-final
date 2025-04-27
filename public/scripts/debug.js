import eventBus, { Events } from './event-bus.js';

console.log('Debug Module Loaded');

class DebugManager {
    constructor() {
        this.enabled = localStorage.getItem('debugMode') === 'true';
        this.metrics = {
            pageLoads: {},
            apiCalls: {},
            errors: [],
            events: []
        };
        this.performanceMarks = new Map();
        this.setupEventListeners();
    }

    enable() {
        console.log('Enabling debug mode...');
        this.enabled = true;
        localStorage.setItem('debugMode', 'true');
        this.injectDebugUI();
    }

    disable() {
        console.log('Disabling debug mode...');
        this.enabled = false;
        localStorage.setItem('debugMode', 'false');
        this.removeDebugUI();
    }

    setupEventListeners() {
        // Listen for performance-related events
        eventBus.on(Events.DATA_LOADED, this.logDataLoad.bind(this));
        eventBus.on(Events.ERROR_OCCURRED, this.logError.bind(this));
        
        // Monitor all events if debug mode is enabled
        if (this.enabled) {
            Object.values(Events).forEach(eventName => {
                eventBus.on(eventName, (data) => this.logEvent(eventName, data));
            });
        }
    }

    startPerformanceMark(name) {
        if (!this.enabled) return;
        
        const startTime = performance.now();
        this.performanceMarks.set(name, startTime);
        console.log(`Starting performance mark: ${name}`);
    }

    endPerformanceMark(name) {
        if (!this.enabled) return;
        
        const startTime = this.performanceMarks.get(name);
        if (!startTime) {
            console.warn(`No start mark found for: ${name}`);
            return;
        }
        
        const duration = performance.now() - startTime;
        this.performanceMarks.delete(name);
        
        console.log(`Performance mark: ${name} - ${duration.toFixed(2)}ms`);
        return duration;
    }

    logDataLoad(data) {
        if (!this.enabled) return;
        
        const endpoint = data.endpoint || 'unknown';
        if (!this.metrics.apiCalls[endpoint]) {
            this.metrics.apiCalls[endpoint] = {
                count: 0,
                totalTime: 0,
                errors: 0
            };
        }
        
        this.metrics.apiCalls[endpoint].count++;
        if (data.duration) {
            this.metrics.apiCalls[endpoint].totalTime += data.duration;
        }
        
        console.log(`API Call: ${endpoint}`, {
            duration: data.duration,
            size: this.getDataSize(data)
        });
    }

    logError(error) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            page: window.location.pathname
        };
        
        this.metrics.errors.push(errorInfo);
        
        if (this.enabled) {
            console.error('Debug Error:', errorInfo);
        }
    }

    logEvent(eventName, data) {
        if (!this.enabled) return;
        
        const eventInfo = {
            timestamp: new Date().toISOString(),
            event: eventName,
            data
        };
        
        this.metrics.events.push(eventInfo);
        console.log(`Event: ${eventName}`, data);
    }

    getPageLoadMetrics() {
        const pathname = window.location.pathname;
        const timing = window.performance.timing;
        
        const metrics = {
            page: pathname,
            loadTime: timing.loadEventEnd - timing.navigationStart,
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
            firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
            resources: performance.getEntriesByType('resource').length
        };
        
        this.metrics.pageLoads[pathname] = metrics;
        return metrics;
    }

    getNetworkMetrics() {
        if (!this.enabled) return null;
        
        const resources = performance.getEntriesByType('resource');
        return {
            totalRequests: resources.length,
            totalBytes: resources.reduce((total, entry) => total + (entry.transferSize || 0), 0),
            slowestRequest: Math.max(...resources.map(entry => entry.duration)),
            byType: this.groupResourcesByType(resources)
        };
    }

    groupResourcesByType(resources) {
        const types = {};
        resources.forEach(resource => {
            const type = resource.initiatorType;
            if (!types[type]) {
                types[type] = {
                    count: 0,
                    totalBytes: 0,
                    totalDuration: 0
                };
            }
            types[type].count++;
            types[type].totalBytes += resource.transferSize || 0;
            types[type].totalDuration += resource.duration;
        });
        return types;
    }

    getDataSize(data) {
        try {
            const str = JSON.stringify(data);
            return str.length;
        } catch (e) {
            return 0;
        }
    }

    injectDebugUI() {
        if (document.getElementById('debug-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.innerHTML = `
            <style>
                #debug-panel {
                    position: fixed;
                    bottom: 0;
                    right: 0;
                    background: rgba(0, 0, 0, 0.8);
                    color: #fff;
                    padding: 10px;
                    font-family: monospace;
                    font-size: 12px;
                    z-index: 9999;
                    max-height: 300px;
                    overflow-y: auto;
                }
                .debug-metric {
                    margin: 5px 0;
                }
                .debug-error {
                    color: #ff4444;
                }
            </style>
            <div class="debug-content">
                <div class="debug-metric">Page Load: <span id="debug-load-time">...</span>ms</div>
                <div class="debug-metric">Memory: <span id="debug-memory">...</span></div>
                <div class="debug-metric">API Calls: <span id="debug-api-calls">0</span></div>
                <div class="debug-metric">Errors: <span id="debug-errors">0</span></div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.startDebugUpdates();
    }

    removeDebugUI() {
        const panel = document.getElementById('debug-panel');
        if (panel) {
            panel.remove();
        }
    }

    startDebugUpdates() {
        if (!this.enabled) return;
        
        setInterval(() => {
            this.updateDebugUI();
        }, 1000);
    }

    updateDebugUI() {
        const loadTimeElement = document.getElementById('debug-load-time');
        const memoryElement = document.getElementById('debug-memory');
        const apiCallsElement = document.getElementById('debug-api-calls');
        const errorsElement = document.getElementById('debug-errors');
        
        if (loadTimeElement) {
            const metrics = this.getPageLoadMetrics();
            loadTimeElement.textContent = metrics.loadTime.toFixed(0);
        }
        
        if (memoryElement && window.performance.memory) {
            const memory = window.performance.memory;
            const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
            const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
            memoryElement.textContent = `${usedMB}MB / ${totalMB}MB`;
        }
        
        if (apiCallsElement) {
            const totalCalls = Object.values(this.metrics.apiCalls)
                .reduce((total, endpoint) => total + endpoint.count, 0);
            apiCallsElement.textContent = totalCalls;
        }
        
        if (errorsElement) {
            errorsElement.textContent = this.metrics.errors.length;
        }
    }

    getDiagnostics() {
        return {
            enabled: this.enabled,
            metrics: this.metrics,
            performance: this.getPageLoadMetrics(),
            network: this.getNetworkMetrics(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
    }

    clearMetrics() {
        this.metrics = {
            pageLoads: {},
            apiCalls: {},
            errors: [],
            events: []
        };
        this.performanceMarks.clear();
        console.log('Debug metrics cleared');
    }
}

// Create and export singleton instance
const debugManager = new DebugManager();
export default debugManager;