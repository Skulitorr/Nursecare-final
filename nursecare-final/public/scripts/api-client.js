// API client module
import { getCurrentUser, refreshToken } from './auth.js';
import { showToast, showLoading, hideLoading } from './utils.js';

// API configuration
const API_CONFIG = {
    BASE_URL: process.env.API_URL || 'http://localhost:3000/api',
    VERSION: 'v1',
    TIMEOUT: 30000 // 30 seconds
};

/**
 * Format API URL
 * @param {string} endpoint - API endpoint
 * @returns {string} Full API URL
 */
function formatApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/${endpoint.replace(/^\//, '')}`;
}

/**
 * Get common headers
 * @returns {Object} Common headers
 */
function getCommonHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const user = getCurrentUser();
    if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
    }

    return headers;
}

/**
 * Handle API response
 * @param {Response} response - Fetch response
 * @returns {Promise<any>} Response data
 */
async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        // Handle specific error cases
        switch (response.status) {
            case 401:
                // Try to refresh token
                const refreshed = await refreshToken();
                if (refreshed) {
                    // Retry original request
                    return retryRequest(response.url, {
                        method: response.method,
                        headers: getCommonHeaders(),
                        body: response.body
                    });
                }
                throw new Error('Unauthorized');

            case 403:
                throw new Error('Forbidden');

            case 404:
                throw new Error('Not Found');

            case 429:
                throw new Error('Too Many Requests');

            default:
                throw new Error(data.message || 'API Error');
        }
    }

    return data;
}

/**
 * Retry a failed request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<any>} Response data
 */
async function retryRequest(url, options) {
    const response = await fetch(url, {
        ...options,
        headers: getCommonHeaders()
    });
    return handleResponse(response);
}

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @param {boolean} showLoader - Whether to show loading state
 * @returns {Promise<any>} Response data
 */
async function request(endpoint, options = {}, showLoader = true) {
    const url = formatApiUrl(endpoint);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
        let loader;
        if (showLoader) {
            loader = showLoading();
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...getCommonHeaders(),
                ...options.headers
            },
            signal: controller.signal
        });

        const data = await handleResponse(response);

        if (loader) {
            hideLoading(loader);
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            showToast('Villa', 'Beiðnin rann út á tíma', 'error');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Export request methods
export const api = {
    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    get: (endpoint, options = {}) => 
        request(endpoint, { ...options, method: 'GET' }),

    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    post: (endpoint, data, options = {}) =>
        request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        }),

    /**
     * Make a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    put: (endpoint, data, options = {}) =>
        request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    /**
     * Make a PATCH request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    patch: (endpoint, data, options = {}) =>
        request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data)
        }),

    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    delete: (endpoint, options = {}) =>
        request(endpoint, { ...options, method: 'DELETE' }),

    /**
     * Upload a file
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - Form data with file
     * @param {Object} options - Additional options
     * @returns {Promise<any>} Response data
     */
    upload: (endpoint, formData, options = {}) =>
        request(endpoint, {
            ...options,
            method: 'POST',
            headers: {
                ...options.headers,
                // Let browser set content type for multipart/form-data
                'Content-Type': undefined
            },
            body: formData
        }),

    /**
     * Download a file
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Additional options
     * @returns {Promise<Blob>} File blob
     */
    download: async (endpoint, options = {}) => {
        const url = formatApiUrl(endpoint);
        const response = await fetch(url, {
            ...options,
            headers: getCommonHeaders()
        });

        if (!response.ok) {
            throw new Error('Download failed');
        }

        return response.blob();
    }
};

// API endpoints
export const endpoints = {
    // Auth endpoints
    auth: {
        login: '/auth/login',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        resetPassword: '/auth/reset-password',
        changePassword: '/auth/change-password'
    },

    // User endpoints
    users: {
        profile: '/users/profile',
        list: '/users',
        details: (id) => `/users/${id}`,
        create: '/users',
        update: (id) => `/users/${id}`,
        delete: (id) => `/users/${id}`,
        avatar: (id) => `/users/${id}/avatar`
    },

    // Patient endpoints
    patients: {
        list: '/patients',
        details: (id) => `/patients/${id}`,
        create: '/patients',
        update: (id) => `/patients/${id}`,
        delete: (id) => `/patients/${id}`,
        records: (id) => `/patients/${id}/records`,
        visits: (id) => `/patients/${id}/visits`
    },

    // Schedule endpoints
    schedule: {
        list: '/schedule',
        shift: (id) => `/schedule/shifts/${id}`,
        createShift: '/schedule/shifts',
        updateShift: (id) => `/schedule/shifts/${id}`,
        deleteShift: (id) => `/schedule/shifts/${id}`,
        approve: (id) => `/schedule/shifts/${id}/approve`,
        reject: (id) => `/schedule/shifts/${id}/reject`
    },

    // Inventory endpoints
    inventory: {
        list: '/inventory',
        item: (id) => `/inventory/${id}`,
        create: '/inventory',
        update: (id) => `/inventory/${id}`,
        delete: (id) => `/inventory/${id}`,
        stock: (id) => `/inventory/${id}/stock`,
        lowStock: '/inventory/low-stock'
    },

    // Report endpoints
    reports: {
        list: '/reports',
        generate: (type) => `/reports/generate/${type}`,
        download: (id) => `/reports/${id}/download`,
        templates: '/reports/templates'
    }
};

// Example usage:
/*
// Get user profile
try {
    const profile = await api.get(endpoints.users.profile);
    console.log('User profile:', profile);
} catch (error) {
    console.error('Failed to get profile:', error);
}

// Create a new patient
try {
    const newPatient = await api.post(endpoints.patients.create, {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        // ...other patient data
    });
    console.log('Created patient:', newPatient);
} catch (error) {
    console.error('Failed to create patient:', error);
}

// Update inventory item stock
try {
    const updated = await api.patch(endpoints.inventory.stock(itemId), {
        quantity: 100,
        action: 'add'
    });
    console.log('Updated stock:', updated);
} catch (error) {
    console.error('Failed to update stock:', error);
}

// Upload user avatar
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

try {
    const result = await api.upload(endpoints.users.avatar(userId), formData);
    console.log('Avatar uploaded:', result);
} catch (error) {
    console.error('Failed to upload avatar:', error);
}

// Download report
try {
    const blob = await api.download(endpoints.reports.download(reportId));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.pdf';
    a.click();
    URL.revokeObjectURL(url);
} catch (error) {
    console.error('Failed to download report:', error);
}
*/