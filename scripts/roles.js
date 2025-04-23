/**
 * Role definitions and their allowed pages/features
 */
export const roles = {
    admin: {
        pages: ['index', 'dashboard', 'schedule', 'staff', 'patients', 'inventory', 'medications', 'chatbot', 'reports', 'settings'],
        permissions: ['create_user', 'edit_user', 'delete_user', 'manage_roles', 'manage_settings', 'view_all_reports'],
        displayName: 'Kerfisstjóri'
    },
    nurse: {
        pages: ['index', 'dashboard', 'schedule', 'patients', 'inventory', 'medications', 'chatbot'],
        permissions: ['manage_patients', 'manage_medications', 'view_reports'],
        displayName: 'Hjúkrunarfræðingur'
    },
    staff: {
        pages: ['index', 'dashboard', 'schedule', 'patients', 'chatbot'],
        permissions: ['view_patients', 'view_schedule'],
        displayName: 'Starfsmaður'
    },
    inventory: {
        pages: ['index', 'dashboard', 'inventory', 'medications', 'chatbot'],
        permissions: ['manage_inventory', 'manage_medications', 'view_reports'],
        displayName: 'Birgðastjóri'
    }
};

/**
 * Check if user has access to specified page
 */
export function isAuthorized(page, role = localStorage.getItem('userRole')) {
    if (!role) return false;
    const allowedPages = roles[role]?.pages || [];
    const cleanPage = page.replace('.html', '');
    return allowedPages.includes(cleanPage);
}

/**
 * Check if user has specific permission
 */
export function hasPermission(permission, role = localStorage.getItem('userRole')) {
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

export function getCurrentPage() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop() || 'index.html';
    return pageName;
}

export function getUserRole() {
    return localStorage.getItem('userRole');
}

export function isPageAllowedForRole(page, role) {
    if (!role) return false;
    const allowedPages = roles[role]?.pages || [];
    const cleanPage = page.replace('.html', '');
    return allowedPages.includes(cleanPage);
}

export default {
    roles,
    isAuthorized,
    hasPermission,
    getRoleDisplayName,
    getRolePermissions,
    getRolePages,
    getCurrentPage,
    getUserRole,
    isPageAllowedForRole
};