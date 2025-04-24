// Common utility functions for authentication and navigation
import { hasPermission } from './roles.js';

/**
 * Check authorization for current page
 */
function checkAuthorization() {
    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Skip auth check for public pages
    if (['login.html', 'unauthorized.html', 'index.html'].includes(currentPage)) {
        return true;
    }
    
    // Get auth data
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    // Redirect to login if no auth data
    if (!authToken || !userRole) {
        window.location.href = '/login.html';
        return false;
    }
    
    try {
        // Validate token
        const tokenData = JSON.parse(atob(authToken));
        if (!tokenData.exp || tokenData.exp <= Date.now() || tokenData.role !== userRole) {
            localStorage.clear();
            window.location.href = '/login.html';
            return false;
        }
        
        // Check page permissions based on user role
        const pageName = currentPage.replace('.html', '');
        if (!hasPermission(pageName, userRole)) {
            window.location.href = '/unauthorized.html';
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('Auth validation failed:', e);
        localStorage.clear();
        window.location.href = '/login.html';
        return false;
    }
}

function handlePermissionBasedUI() {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) return;

    // Handle elements that require specific permissions
    document.querySelectorAll('[data-requires-permission]').forEach(element => {
        const requiredPermission = element.getAttribute('data-requires-permission');
        if (!hasPermission(requiredPermission, userRole)) {
            element.remove();
        }
    });

    // Handle elements that require any of the specified permissions
    document.querySelectorAll('[data-requires-any-permission]').forEach(element => {
        const permissions = element.getAttribute('data-requires-any-permission').split(',');
        const hasAnyPermission = permissions.some(permission => 
            hasPermission(permission.trim(), userRole)
        );
        if (!hasAnyPermission) {
            element.remove();
        }
    });

    // Handle elements that should be disabled based on permissions
    document.querySelectorAll('[data-permission-disabled]').forEach(element => {
        const requiredPermission = element.getAttribute('data-permission-disabled');
        if (!hasPermission(requiredPermission, userRole)) {
            element.disabled = true;
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthorization();
    handlePermissionBasedUI();
});

export { checkAuthorization };