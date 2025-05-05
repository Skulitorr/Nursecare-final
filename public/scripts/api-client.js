import eventBus, { Events } from './event-bus.js';
import errorHandler from './error-handler.js';

console.log('API Client Module Loaded');

class APIClient {
    constructor() {
        this.baseURL = ''; // Empty base URL since we're using relative paths for Vercel
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        console.debug('API Client initialized for Vercel deployment');
    }

    async fetch(endpoint, options = {}) {
        console.log(`API Request: ${endpoint}`, options);
        
        const cacheKey = this.getCacheKey(endpoint, options);
        
        // Check cache if it's a GET request
        if (options.method === undefined || options.method === 'GET') {
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;
        }
        
        // Check for pending requests to the same endpoint
        if (this.pendingRequests.has(cacheKey)) {
            console.log('Using pending request for:', endpoint);
            return this.pendingRequests.get(cacheKey);
        }

        try {
            // Prepare request
            const url = this.getFullURL(endpoint);
            const requestOptions = this.prepareRequestOptions(options);
            
            console.debug(`Sending request to: ${url}`, requestOptions);
            
            // Create promise and store it
            const promise = this.executeRequest(url, requestOptions, cacheKey);
            this.pendingRequests.set(cacheKey, promise);
            
            // Wait for result
            const result = await promise;
            
            // Cache if it's a GET request
            if (options.method === undefined || options.method === 'GET') {
                this.setInCache(cacheKey, result);
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.handleError(error);
            throw error;
        } finally {
            // Clean up pending request
            this.pendingRequests.delete(cacheKey);
        }
    }

    async executeRequest(url, options, cacheKey) {
        try {
            console.debug(`Executing fetch to ${url}`);
            const response = await fetch(url, options);
            
            if (!response.ok) {
                console.error(`API error: ${response.status} ${response.statusText}`);
                throw new APIError(response.statusText, response.status, await response.text());
            }
            
            // Parse response based on content type
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType?.includes('application/json')) {
                data = await response.json();
            } else if (contentType?.includes('text/')) {
                data = await response.text();
            } else {
                data = await response.blob();
            }
            
            console.debug('API response received successfully');
            return data;
        } catch (error) {
            console.error('Fetch execution error:', error);
            throw error;
        }
    }

    prepareRequestOptions(options) {
        const token = localStorage.getItem('authToken');
        
        return {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };
    }

    getFullURL(endpoint) {
        // For Vercel, ensure we use the right path format
        if (endpoint.startsWith('http')) {
            return endpoint;
        }
        
        // Make sure endpoint starts with / for API routes
        const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${this.baseURL}${formattedEndpoint}`;
    }

    getCacheKey(endpoint, options) {
        return `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || '')}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheDuration) {
            this.cache.delete(key);
            return null;
        }
        
        console.log('Cache hit:', key);
        return cached.data;
    }

    setInCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        console.log('Clearing API cache');
        this.cache.clear();
    }

    handleError(error) {
        // Convert to APIError if it's not already
        const apiError = error instanceof APIError ? error : new APIError(error.message);
        
        // Emit error event
        eventBus.emit(Events.ERROR_OCCURRED, apiError);
        
        // Show error notification
        errorHandler.showError(apiError.message);
        
        // Handle specific error cases
        if (apiError.status === 401) {
            eventBus.emit(Events.AUTH_ERROR, apiError);
        }
    }

    // Patient endpoints
    async getPatients() {
        return this.fetch('/patients');
    }

    async getPatient(id) {
        return this.fetch(`/patients/${id}`);
    }

    async createPatient(data) {
        return this.fetch('/patients', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updatePatient(id, data) {
        return this.fetch(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deletePatient(id) {
        return this.fetch(`/patients/${id}`, {
            method: 'DELETE'
        });
    }

    // Staff endpoints
    async getStaff() {
        return this.fetch('/staff');
    }

    async getStaffMember(id) {
        return this.fetch(`/staff/${id}`);
    }

    async createStaffMember(data) {
        return this.fetch('/staff', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateStaffMember(id, data) {
        return this.fetch(`/staff/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteStaffMember(id) {
        return this.fetch(`/staff/${id}`, {
            method: 'DELETE'
        });
    }

    // Schedule endpoints
    async getSchedule(start, end) {
        return this.fetch(`/schedule?start=${start}&end=${end}`);
    }

    async createShift(data) {
        return this.fetch('/schedule/shifts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateShift(id, data) {
        return this.fetch(`/schedule/shifts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteShift(id) {
        return this.fetch(`/schedule/shifts/${id}`, {
            method: 'DELETE'
        });
    }

    // Inventory endpoints
    async getInventory() {
        return this.fetch('/inventory');
    }

    async updateInventoryItem(id, data) {
        return this.fetch(`/inventory/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // AI endpoints for Vercel serverless functions
    async generateReport(prompt, context) {
        console.debug('Generating AI report', { prompt, context });
        return this.fetch('/api/generate', {
            method: 'POST',
            body: JSON.stringify({ prompt, context })
        });
    }

    async processChatMessage(message, context = {}) {
        console.debug('Processing chat message', { message, context });
        return this.fetch('/api/generate', {
            method: 'POST',
            body: JSON.stringify({ 
                prompt: message,
                context 
            })
        });
    }
}

class APIError extends Error {
    constructor(message, status = 500, details = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.details = details;
    }
}

// Create and export singleton instance
const apiClient = new APIClient();
export default apiClient;