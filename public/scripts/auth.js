// Authentication module
import { hasPermission } from './roles.js';
import { showToast } from './utils.js';

// Constants
const SESSION_KEYS = {
    TOKEN: 'authToken',
    ROLE: 'userRole',
    USERNAME: 'username'
};

let currentUser = null;

/**
 * Initialize authentication
 */
export function initAuth() {
    // Check for existing auth data
    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const role = localStorage.getItem(SESSION_KEYS.ROLE);
    
    if (token && role) {
        try {
            const tokenData = JSON.parse(atob(token));
            if (tokenData.exp > Date.now() && tokenData.role === role) {
                currentUser = tokenData;
            } else {
                clearSession();
            }
        } catch (e) {
            clearSession();
        }
    } else {
        clearSession();
    }
}

/**
 * Clear all session data
 */
export function clearSession() {
    localStorage.clear();
    currentUser = null;
}

/**
 * Validate token and role
 */
export function validateSession() {
    const authToken = localStorage.getItem(SESSION_KEYS.TOKEN);
    const userRole = localStorage.getItem(SESSION_KEYS.ROLE);
    const currentPath = window.location.pathname;

    if (!authToken || !userRole) {
        if (!currentPath.includes('/public/login.html')) {
            redirectToLogin();
        }
        return false;
    }

    try {
        const tokenData = JSON.parse(atob(authToken));
        if (!tokenData.exp || !tokenData.role || 
            tokenData.exp <= Date.now() || 
            tokenData.role !== userRole) {
            clearSession();
            if (!currentPath.includes('/public/login.html')) {
                redirectToLogin();
            }
            return false;
        }
        return true;
    } catch (e) {
        clearSession();
        if (!currentPath.includes('/public/login.html')) {
            redirectToLogin();
        }
        return false;
    }
}

/**
 * Handle user login
 */
export async function login(username, password) {
    // Clear any existing session
    clearSession();
    
    try {
        // Mock authentication - replace with real API call
        const mockUsers = {
            'admin': { role: 'ADMIN', password: 'admin123' },
            'nurse': { role: 'NURSE', password: 'nurse123' },
            'staff': { role: 'STAFF', password: 'staff123' },
            'inventory': { role: 'INVENTORY', password: 'inv123' }
        };
        
        const user = mockUsers[username];
        if (!user || user.password !== password) {
            throw new Error('Invalid username or password');
        }
        
        // Create session token
        const tokenData = {
            username,
            role: user.role,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        const token = btoa(JSON.stringify(tokenData));
        
        // Store session data
        localStorage.setItem(SESSION_KEYS.TOKEN, token);
        localStorage.setItem(SESSION_KEYS.ROLE, user.role);
        localStorage.setItem(SESSION_KEYS.USERNAME, username);
        currentUser = tokenData;
        
        return { success: true };
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

/**
 * Handle user logout
 */
export function logout() {
    clearSession();
    redirectToLogin();
}

/**
 * Redirect to login
 */
function redirectToLogin() {
    window.location.href = '/public/login.html';
}

/**
 * Check if user has required role
 */
export function hasRole(requiredRole) {
    const userRole = localStorage.getItem(SESSION_KEYS.ROLE);
    return userRole === requiredRole;
}

// Export constants
export { SESSION_KEYS };