import { hasPermission } from './roles.js';

/**
 * Update UI elements based on user permissions
 */
export function setupPermissionBasedUI() {
    // Handle elements that require specific permissions
    document.querySelectorAll('[data-requires-permission]').forEach(element => {
        const requiredPermission = element.dataset.requiresPermission;
        if (!hasPermission(requiredPermission)) {
            element.style.display = 'none';
        }
    });

    // Handle elements that require any of multiple permissions
    document.querySelectorAll('[data-requires-any-permission]').forEach(element => {
        const requiredPermissions = element.dataset.requiresAnyPermission.split(',');
        const hasAnyPermission = requiredPermissions.some(permission => hasPermission(permission.trim()));
        if (!hasAnyPermission) {
            element.style.display = 'none';
        }
    });

    // Handle elements that require all specified permissions
    document.querySelectorAll('[data-requires-all-permissions]').forEach(element => {
        const requiredPermissions = element.dataset.requiresAllPermissions.split(',');
        const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission.trim()));
        if (!hasAllPermissions) {
            element.style.display = 'none';
        }
    });

    // Handle disabled elements based on permissions
    document.querySelectorAll('[data-permission-disabled]').forEach(element => {
        const requiredPermission = element.dataset.permissionDisabled;
        if (!hasPermission(requiredPermission)) {
            element.disabled = true;
            element.classList.add('permission-disabled');
        }
    });
}

/**
 * Check if element should be shown based on permissions
 */
export function shouldShowElement(element) {
    // Check single permission
    const requiredPermission = element.dataset.requiresPermission;
    if (requiredPermission) {
        return hasPermission(requiredPermission);
    }

    // Check any of multiple permissions
    const anyPermissions = element.dataset.requiresAnyPermission;
    if (anyPermissions) {
        const permissions = anyPermissions.split(',');
        return permissions.some(permission => hasPermission(permission.trim()));
    }

    // Check all required permissions
    const allPermissions = element.dataset.requiresAllPermissions;
    if (allPermissions) {
        const permissions = allPermissions.split(',');
        return permissions.every(permission => hasPermission(permission.trim()));
    }

    return true;
}

/**
 * Update a specific container's UI based on permissions
 */
export function updateContainerPermissions(container) {
    if (!container) return;

    // Update elements requiring permissions
    container.querySelectorAll('[data-requires-permission]').forEach(element => {
        element.style.display = shouldShowElement(element) ? '' : 'none';
    });

    // Update elements requiring any permissions
    container.querySelectorAll('[data-requires-any-permission]').forEach(element => {
        element.style.display = shouldShowElement(element) ? '' : 'none';
    });

    // Update elements requiring all permissions
    container.querySelectorAll('[data-requires-all-permissions]').forEach(element => {
        element.style.display = shouldShowElement(element) ? '' : 'none';
    });

    // Update disabled states
    container.querySelectorAll('[data-permission-disabled]').forEach(element => {
        const requiredPermission = element.dataset.permissionDisabled;
        const hasRequired = hasPermission(requiredPermission);
        element.disabled = !hasRequired;
        element.classList.toggle('permission-disabled', !hasRequired);
    });
}

// Add styles for permission-disabled elements
const style = document.createElement('style');
style.textContent = `
    .permission-disabled {
        opacity: 0.6;
        cursor: not-allowed !important;
        pointer-events: none;
    }
`;
document.head.appendChild(style);