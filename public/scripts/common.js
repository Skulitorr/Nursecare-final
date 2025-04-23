import { getCurrentPage, isAuthorized, hasPermission } from './roles.js';

function checkAuthorization() {
    const currentPage = getCurrentPage();
    
    // Skip auth check for login and unauthorized pages
    if (['login.html', 'unauthorized.html'].includes(currentPage)) {
        return;
    }
    
    if (!isAuthorized(currentPage)) {
        window.location.href = '/unauthorized.html';
        return;
    }
}

function handlePermissionBasedUI() {
    // Handle elements that require specific permissions
    document.querySelectorAll('[data-requires-permission]').forEach(element => {
        const requiredPermission = element.getAttribute('data-requires-permission');
        if (!hasPermission(requiredPermission)) {
            element.remove();
        }
    });

    // Handle elements that require any of the specified permissions
    document.querySelectorAll('[data-requires-any-permission]').forEach(element => {
        const permissions = element.getAttribute('data-requires-any-permission').split(',');
        const hasAnyPermission = permissions.some(permission => hasPermission(permission.trim()));
        if (!hasAnyPermission) {
            element.remove();
        }
    });

    // Handle elements that should be disabled based on permissions
    document.querySelectorAll('[data-permission-disabled]').forEach(element => {
        const requiredPermission = element.getAttribute('data-permission-disabled');
        if (!hasPermission(requiredPermission)) {
            element.disabled = true;
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthorization();
    handlePermissionBasedUI();
});