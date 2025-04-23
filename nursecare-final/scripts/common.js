import { isAuthorized, hasPermission, getRoleDisplayName, getCurrentPage, getUserRole } from './roles.js';

/**
 * Check if user is authenticated
 */
export function checkAuth() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = '/login.html';
        return false;
    }

    try {
        // Validate token
        const tokenData = JSON.parse(atob(authToken));
        if (tokenData.exp <= Date.now()) {
            localStorage.clear();
            window.location.href = '/login.html';
            return false;
        }
        return true;
    } catch (e) {
        localStorage.clear();
        window.location.href = '/login.html';
        return false;
    }
}

/**
 * Authorize user access to a page
 */
export function authorizeUser(page) {
    if (!checkAuth()) return;
    
    // Remove .html and any leading/trailing slashes
    const cleanPage = page.replace('.html', '').replace(/^\/+|\/+$/g, '');
    // Extract the page name without path
    const pageName = cleanPage.split('/').pop();
    
    if (!isAuthorized(pageName)) {
        window.location.href = '/pages/unauthorized.html';
    }
}

/**
 * Set up navigation based on user role
 */
export function setupNavigation() {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) return;

    // Update user info in navigation if available
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');
    if (userNameElement) {
        userNameElement.textContent = localStorage.getItem('userName') || '';
    }
    if (userRoleElement) {
        userRoleElement.textContent = getRoleDisplayName(userRole);
    }
    
    // Hide unauthorized navigation items
    document.querySelectorAll('nav a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const page = href.split('/').pop().replace('.html', '');
        if (!isAuthorized(page)) {
            const listItem = link.closest('li') || link;
            listItem.style.display = 'none';
        }
    });
}

/**
 * Handle user logout
 */
export function logout() {
    // Clear all auth data
    localStorage.clear();
    
    // Redirect to login page
    window.location.href = '/login.html';
}

/**
 * Update user preferences
 */
export function updatePreferences(preferences) {
    const currentPrefs = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    const updatedPrefs = { ...currentPrefs, ...preferences };
    localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
}

/**
 * Get user preferences
 */
export function getPreferences() {
    return JSON.parse(localStorage.getItem('userPreferences') || '{}');
}

/**
 * Check if user has permission
 */
export function checkPermission(permission) {
    return hasPermission(permission);
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    const container = document.getElementById('toast-container');
    if (container) {
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

export function checkAuthorization() {
    const currentPage = getCurrentPage();
    const userRole = getUserRole();
    
    if (!userRole) {
        window.location.href = '/pages/login.html';
        return false;
    }

    if (!isAuthorized(currentPage, userRole)) {
        window.location.href = '/pages/unauthorized.html';
        return false;
    }

    return true;
}

export function applyPermissionAttributes() {
    document.querySelectorAll('[data-requires-permission]').forEach(element => {
        const permission = element.getAttribute('data-requires-permission');
        if (!hasPermission(permission)) {
            element.classList.add('permission-disabled');
        }
    });

    document.querySelectorAll('[data-requires-any-permission]').forEach(element => {
        const permissions = element.getAttribute('data-requires-any-permission').split(',');
        if (!permissions.some(p => hasPermission(p.trim()))) {
            element.classList.add('permission-disabled');
        }
    });

    document.querySelectorAll('[data-requires-all-permissions]').forEach(element => {
        const permissions = element.getAttribute('data-requires-all-permissions').split(',');
        if (!permissions.every(p => hasPermission(p.trim()))) {
            element.classList.add('permission-disabled');
        }
    });

    document.querySelectorAll('[data-permission-disabled]').forEach(element => {
        element.classList.add('permission-disabled');
    });
}

export function filterSidebarByPermissions() {
    document.querySelectorAll('nav li[data-route]').forEach(item => {
        const route = item.getAttribute('data-route');
        if (!isAuthorized(route)) {
            item.style.display = 'none';
        }
    });
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthorization()) {
        applyPermissionAttributes();
        filterSidebarByPermissions();
    }
});

export { isAuthorized, hasPermission, getRoleDisplayName };