// Authentication Module
console.log('Auth Module Loaded');

import { SESSION_KEYS, parseToken, validateTokenData } from '../shared/session.js';

let currentUser = null;

export function initAuth() {
    console.log('Initializing authentication...');
    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const role = localStorage.getItem(SESSION_KEYS.ROLE);

    if (!token || !role) {
        console.debug('No token or role found in localStorage');
        clearSession();
        redirectToLogin();
        return false;
    }

    const tokenData = parseToken(token);
    if (tokenData && !validateTokenData(tokenData)) {
        console.log('Token expired');
        clearSession();
        redirectToLogin();
        return false;
    }

    currentUser = tokenData;
    console.debug('Auth initialized successfully for user:', tokenData.username);
    updateUserInfo();
    return true;
}

export function validateSession() {
    console.log('Validating session...');
    const currentPath = window.location.pathname;
    if (currentPath.includes('/login') || currentPath.includes('/unauthorized')) {
        console.debug('No authentication needed for:', currentPath);
        return true;
    }

    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const role = localStorage.getItem(SESSION_KEYS.ROLE);

    const tokenData = parseToken(token);
    if (!tokenData || tokenData.role !== role) {
        console.debug('No token or role found during validation');
        clearSession();
        redirectToUnauthorized();
        return false;
    }

    return true;
}

export async function login(username, password) {
    console.log('Attempting login for user:', username);
    clearSession();
    const mockUsers = {
        admin: { role: 'ADMIN', name: 'Administrator', password: 'admin123' },
        nurse: { role: 'NURSE', name: 'Anna', password: 'nurse123' },
        staff: { role: 'STAFF', name: 'Staff Member', password: 'staff123' }
    };

    const user = mockUsers[username.toLowerCase()];
    if (!user || user.password !== password) {
        console.debug('Login failed: invalid credentials');
        throw new Error('Invalid username or password');
    }

    const tokenData = {
        username,
        name: user.name,
        role: user.role,
        exp: Date.now() + (24 * 60 * 60 * 1000)
    };

    const token = btoa(JSON.stringify(tokenData));
    localStorage.setItem(SESSION_KEYS.TOKEN, token);
    localStorage.setItem(SESSION_KEYS.ROLE, user.role);
    localStorage.setItem(SESSION_KEYS.USERNAME, username);
    currentUser = tokenData;
    updateUserInfo();
    return { success: true, role: user.role };
}

export function logout() {
    console.log('Logging out...');
    clearSession();
    redirectToLogin();
}

function clearSession() {
    console.log('Clearing session...');
    localStorage.removeItem(SESSION_KEYS.TOKEN);
    localStorage.removeItem(SESSION_KEYS.ROLE);
    localStorage.removeItem(SESSION_KEYS.USERNAME);
    currentUser = null;
}

function redirectToLogin() {
    console.debug('Redirecting to login page');
    window.location.href = '/login.html';
}

function redirectToUnauthorized() {
    console.debug('Redirecting to unauthorized page');
    window.location.href = '/unauthorized.html';
}

function updateUserInfo() {
    console.debug('Updating user info display...');

    try {
        const userNameElement = document.querySelector('.user-name');
        const userRoleElement = document.querySelector('.user-role');
        const profileAvatar = document.querySelector('.profile-btn img');

        if (userNameElement) userNameElement.textContent = currentUser?.name || 'User';
        if (userRoleElement) userRoleElement.textContent = currentUser?.role || 'Guest';

        if (profileAvatar && currentUser) {
            const seed = currentUser.username || currentUser.name;
            profileAvatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            profileAvatar.alt = `Profile Avatar for ${currentUser.name}`;
        }

        console.debug('User info display updated');
    } catch (error) {
        console.warn('User info update failed:', error);
    }
}

export function getCurrentUser() {
    return currentUser;
}
// Initialize auth when DOM is loaded if we're not on login page
// NOTE: This is a browser only method, not compliant with NODEJS server
document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = window.location.pathname.includes('/login');
    if (!isLoginPage) {
        initAuth();
    }
});
