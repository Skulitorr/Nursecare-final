// Role definitions and permissions
export const roles = {
    ADMIN: {
        displayName: 'Administrator',
        pages: ['dashboard', 'patients', 'staff', 'inventory', 'reports', 'settings', 'schedule'],
        permissions: ['manage_users', 'manage_roles', 'manage_settings', 'view_all', 'edit_all']
    },
    NURSE: {
        displayName: 'Nurse',
        pages: ['dashboard', 'patients', 'reports', 'schedule'],
        permissions: ['manage_patients', 'view_reports', 'view_schedule']
    },
    STAFF: {
        displayName: 'Staff',
        pages: ['dashboard', 'patients', 'schedule'],
        permissions: ['view_patients', 'view_schedule']
    },
    INVENTORY: {
        displayName: 'Inventory Manager',
        pages: ['dashboard', 'inventory', 'reports'],
        permissions: ['manage_inventory', 'view_reports']
    }
};

/**
 * Get current page name from URL
 */
export function getCurrentPage() {
    const path = window.location.pathname;
    return path.split('/').pop()?.replace('.html', '') || 'index';
}

/**
 * Get user's current role
 */
export function getUserRole() {
    return localStorage.getItem('userRole')?.toUpperCase();
}

/**
 * Check if page is allowed for role
 */
export function isAuthorized(page) {
    const role = getUserRole();
    if (!role) return false;
    const allowedPages = roles[role]?.pages || [];
    const cleanPage = page.replace('.html', '');
    return allowedPages.includes(cleanPage);
}

/**
 * Check if user has specific permission
 */
export function hasPermission(permission) {
    const role = getUserRole();
    if (!role) return false;
    const permissions = roles[role]?.permissions || [];
    return permissions.includes(permission);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role) {
    return roles[role]?.displayName || role;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role) {
    return roles[role]?.permissions || [];
}

/**
 * Get all allowed pages for a role
 */
export function getRolePages(role) {
    return roles[role]?.pages || [];
}