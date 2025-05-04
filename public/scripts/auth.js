// Authentication Module
console.log('Auth Module Loaded');

export const SESSION_KEYS = {
    TOKEN: 'authToken',
    ROLE: 'userRole',
    USERNAME: 'username'
};

let currentUser = null;

export function initAuth() {
    console.log('Initializing authentication...');
    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const role = localStorage.getItem(SESSION_KEYS.ROLE);
    
    if (!token || !role) {
        clearSession();
        redirectToLogin();
        return false;
    }
    
    try {
        const tokenData = JSON.parse(atob(token));
        if (!tokenData.exp || tokenData.exp <= Date.now()) {
            console.log('Token expired');
            clearSession();
            redirectToLogin();
            return false;
        }
        
        currentUser = tokenData;
        updateUserInfo();
        return true;
    } catch (error) {
        console.error('Auth initialization error:', error);
        clearSession();
        redirectToLogin();
        return false;
    }
}

export function validateSession() {
    console.log('Validating session...');
    const currentPath = window.location.pathname;
    
    // Allow access to login and unauthorized pages without auth
    if (currentPath === '/login' || currentPath === '/unauthorized') {
        return true;
    }
    
    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const role = localStorage.getItem(SESSION_KEYS.ROLE);
    
    if (!token || !role) {
        redirectToUnauthorized();
        return false;
    }
    
    try {
        const tokenData = JSON.parse(atob(token));
        if (!tokenData.exp || !tokenData.role || 
            tokenData.exp <= Date.now() || 
            tokenData.role !== role) {
            clearSession();
            redirectToUnauthorized();
            return false;
        }
        return true;
    } catch (error) {
        console.error('Session validation error:', error);
        clearSession();
        redirectToUnauthorized();
        return false;
    }
}

export async function login(username, password) {
    console.log('Attempting login...');
    try {
        // Clear any existing session
        clearSession();
        
        // Mock authentication - replace with real API call
        const mockUsers = {
            'admin': { role: 'ADMIN', name: 'Administrator', password: 'admin123' },
            'nurse': { role: 'NURSE', name: 'Anna', password: 'nurse123' },
            'staff': { role: 'STAFF', name: 'Staff Member', password: 'staff123' }
        };
        
        const user = mockUsers[username];
        if (!user || user.password !== password) {
            throw new Error('Invalid username or password');
        }
        
        // Create session token
        const tokenData = {
            username,
            name: user.name,
            role: user.role,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        const token = btoa(JSON.stringify(tokenData));
        
        // Store session data
        localStorage.setItem(SESSION_KEYS.TOKEN, token);
        localStorage.setItem(SESSION_KEYS.ROLE, user.role);
        localStorage.setItem(SESSION_KEYS.USERNAME, username);
        currentUser = tokenData;
        
        updateUserInfo();
        return { success: true };
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

export function logout() {
    console.log('Logging out...');
    clearSession();
    redirectToLogin();
}

function clearSession() {
    console.log('Clearing session...');
    localStorage.clear();
    currentUser = null;
}

function redirectToLogin() {
    window.location.href = '/login';
}

function redirectToUnauthorized() {
    window.location.href = '/unauthorized';
}

function updateUserInfo() {
    console.log('Updating user info display...');
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser?.name || 'User';
    }
    
    if (userRoleElement) {
        userRoleElement.textContent = currentUser?.role || 'Guest';
    }
}

// Initialize auth when DOM is loaded
// NOTE: This is a browser only method, not compliant with NODEJS server
// document.addEventListener('DOMContentLoaded', initAuth);