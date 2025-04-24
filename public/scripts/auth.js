// Authentication module
import { hasPermission } from './roles.js';
import { showToast } from './utils.js';

// Session storage keys
const SESSION_KEYS = {
    USER: 'currentUser',
    TOKEN: 'authToken',
    ROLE: 'userRole',
    EXPIRES_AT: 'tokenExpiresAt'
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
 * Clear current session
 */
export function clearSession() {
    currentUser = null;
    localStorage.clear();
}

/**
 * Check if user is logged in with valid session
 */
export function isLoggedIn() {
    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const role = localStorage.getItem(SESSION_KEYS.ROLE);
    
    if (!token || !role) return false;
    
    try {
        const tokenData = JSON.parse(atob(token));
        return tokenData.exp > Date.now() && tokenData.role === role;
    } catch {
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
    window.location.href = '/login.html';
}