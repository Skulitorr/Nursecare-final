// Common functionality for all pages
function checkAuthorization() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Skip auth check for login and unauthorized pages
    if (['login.html', 'unauthorized.html'].includes(currentPage)) {
        return;
    }
    
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
        window.location.href = '/login.html';
        return;
    }
}

function handlePermissionBasedUI() {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) return;

    // Handle elements that require specific permissions
    document.querySelectorAll('[data-requires-permission]').forEach(element => {
        const requiredPermission = element.getAttribute('data-requires-permission');
        if (!window.hasPermission(requiredPermission, userRole)) {
            element.remove();
        }
    });

    // Handle elements that require any of the specified permissions
    document.querySelectorAll('[data-requires-any-permission]').forEach(element => {
        const permissions = element.getAttribute('data-requires-any-permission').split(',');
        const hasAnyPermission = permissions.some(permission => 
            window.hasPermission(permission.trim(), userRole)
        );
        if (!hasAnyPermission) {
            element.remove();
        }
    });

    // Handle elements that should be disabled based on permissions
    document.querySelectorAll('[data-permission-disabled]').forEach(element => {
        const requiredPermission = element.getAttribute('data-permission-disabled');
        if (!window.hasPermission(requiredPermission, userRole)) {
            element.disabled = true;
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthorization();
    handlePermissionBasedUI();
});