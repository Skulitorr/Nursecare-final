// Role definitions and permission management
export const ROLE_LEVELS = {
    GUEST: 0,
    STAFF: 1,
    NURSE: 2,
    HEAD_NURSE: 3,
    ADMIN: 4
};

// Define available roles
export const ROLES = {
    GUEST: {
        id: 'guest',
        name: 'Guest',
        level: ROLE_LEVELS.GUEST,
        pages: ['index', 'login'],
        permissions: []
    },
    STAFF: {
        id: 'staff',
        name: 'Staff',
        level: ROLE_LEVELS.STAFF,
        pages: ['index', 'dashboard', 'schedule', 'patients', 'chatbot'],
        permissions: ['view_patients', 'view_schedule']
    },
    NURSE: {
        id: 'nurse',
        name: 'Nurse',
        level: ROLE_LEVELS.NURSE,
        pages: ['index', 'dashboard', 'schedule', 'patients', 'inventory', 'medications', 'chatbot'],
        permissions: ['manage_patients', 'manage_medications', 'view_reports', 'view_inventory']
    },
    HEAD_NURSE: {
        id: 'head_nurse',
        name: 'Head Nurse',
        level: ROLE_LEVELS.HEAD_NURSE,
        pages: ['index', 'dashboard', 'schedule', 'staff', 'patients', 'inventory', 'medications', 'chatbot', 'reports'],
        permissions: ['manage_patients', 'manage_medications', 'manage_schedule', 'view_staff', 'manage_inventory', 'generate_reports']
    },
    ADMIN: {
        id: 'admin',
        name: 'Administrator',
        level: ROLE_LEVELS.ADMIN,
        pages: ['index', 'dashboard', 'schedule', 'staff', 'patients', 'inventory', 'medications', 'chatbot', 'reports', 'settings'],
        permissions: ['manage_patients', 'manage_medications', 'manage_schedule', 'manage_staff', 'manage_inventory', 'manage_reports', 'manage_settings']
    }
};

/**
 * Check if a user has permission for a page or action
 */
export function hasPermission(permission, userRole) {
    const role = ROLES[userRole?.toUpperCase()];
    if (!role) return false;
    
    // Allow access to basic pages without specific permissions
    if (['index', 'login', 'unauthorized'].includes(permission)) {
        return true;
    }
    
    // Check if page access is allowed
    if (role.pages.includes(permission)) {
        return true;
    }
    
    // Check specific permission
    return role.permissions.includes(permission);
}

/**
 * Get allowed pages for a role
 */
export function getAllowedPages(role) {
    return ROLES[role?.toUpperCase()]?.pages || [];
}

/**
 * Get role permissions
 */
export function getRolePermissions(role) {
    return ROLES[role?.toUpperCase()]?.permissions || [];
}

/**
 * Check if user has sufficient role level
 */
export function hasRole(requiredRole, userRole) {
    const requiredLevel = ROLE_LEVELS[requiredRole?.toUpperCase()];
    const userLevel = ROLE_LEVELS[userRole?.toUpperCase()];
    
    if (requiredLevel === undefined || userLevel === undefined) {
        return false;
    }
    
    return userLevel >= requiredLevel;
}

/**
 * Validate user's access to current page
 */
export function validatePageAccess(page = window.location.pathname) {
    const currentPage = page.split('/').pop().replace('.html', '');
    const userRole = localStorage.getItem('userRole');
    
    // Allow access to public pages
    if (['login', 'unauthorized', 'index'].includes(currentPage)) {
        return true;
    }
    
    return hasPermission(currentPage, userRole);
}

// Make functions available globally for legacy support
window.hasPermission = hasPermission;
window.getAllowedPages = getAllowedPages;
window.getRolePermissions = getRolePermissions;
window.hasRole = hasRole;
window.validatePageAccess = validatePageAccess;