// Roles and permissions management module

// Define role levels in ascending order of access
export const ROLE_LEVELS = {
    GUEST: 0,
    NURSE: 1,
    HEAD_NURSE: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4
};

// Define available roles and their metadata
export const ROLES = {
    GUEST: {
        id: 'guest',
        name: 'Gestur',
        level: ROLE_LEVELS.GUEST,
        description: 'Limited access to public information only'
    },
    NURSE: {
        id: 'nurse',
        name: 'Hjúkrunarfræðingur',
        level: ROLE_LEVELS.NURSE,
        description: 'Basic access to patient care and scheduling'
    },
    HEAD_NURSE: {
        id: 'head_nurse',
        name: 'Yfirhjúkrunarfræðingur',
        level: ROLE_LEVELS.HEAD_NURSE,
        description: 'Department management and advanced scheduling'
    },
    ADMIN: {
        id: 'admin',
        name: 'Stjórnandi',
        level: ROLE_LEVELS.ADMIN,
        description: 'Full system access except super admin functions'
    },
    SUPER_ADMIN: {
        id: 'super_admin',
        name: 'Kerfisstjóri',
        level: ROLE_LEVELS.SUPER_ADMIN,
        description: 'Complete system access including configuration'
    }
};

// Define permissions and the minimum role level required
export const PERMISSIONS = {
    // Patient management
    view_patients: {
        level: ROLE_LEVELS.NURSE,
        description: 'View patient list and basic info'
    },
    edit_patients: {
        level: ROLE_LEVELS.NURSE,
        description: 'Edit patient information'
    },
    delete_patients: {
        level: ROLE_LEVELS.HEAD_NURSE,
        description: 'Remove patients from the system'
    },

    // Schedule management
    view_schedule: {
        level: ROLE_LEVELS.NURSE,
        description: 'View work schedule'
    },
    edit_schedule: {
        level: ROLE_LEVELS.HEAD_NURSE,
        description: 'Modify work schedule'
    },
    approve_schedule: {
        level: ROLE_LEVELS.HEAD_NURSE,
        description: 'Approve schedule changes'
    },

    // Inventory management
    view_inventory: {
        level: ROLE_LEVELS.NURSE,
        description: 'View inventory levels'
    },
    edit_inventory: {
        level: ROLE_LEVELS.NURSE,
        description: 'Modify inventory quantities'
    },
    manage_inventory: {
        level: ROLE_LEVELS.HEAD_NURSE,
        description: 'Add/remove inventory items'
    },

    // Staff management
    view_staff: {
        level: ROLE_LEVELS.NURSE,
        description: 'View staff list and basic info'
    },
    edit_staff: {
        level: ROLE_LEVELS.HEAD_NURSE,
        description: 'Edit staff information'
    },
    manage_staff: {
        level: ROLE_LEVELS.ADMIN,
        description: 'Add/remove staff members'
    },

    // Report management
    view_reports: {
        level: ROLE_LEVELS.NURSE,
        description: 'View basic reports'
    },
    generate_reports: {
        level: ROLE_LEVELS.HEAD_NURSE,
        description: 'Generate new reports'
    },
    manage_reports: {
        level: ROLE_LEVELS.ADMIN,
        description: 'Configure report templates'
    },

    // System management
    view_settings: {
        level: ROLE_LEVELS.ADMIN,
        description: 'View system settings'
    },
    edit_settings: {
        level: ROLE_LEVELS.ADMIN,
        description: 'Modify system settings'
    },
    manage_roles: {
        level: ROLE_LEVELS.SUPER_ADMIN,
        description: 'Manage user roles'
    }
};

/**
 * Check if a user has permission for an action
 * @param {string} permission - Permission to check
 * @param {string} userRole - User's role
 * @returns {boolean} Whether user has permission
 */
export function hasPermission(permission, userRole) {
    // Get the permission config
    const permissionConfig = PERMISSIONS[permission];
    if (!permissionConfig) {
        console.warn(`Unknown permission: ${permission}`);
        return false;
    }

    // Get the user's role level
    const roleConfig = ROLES[userRole?.toUpperCase()];
    if (!roleConfig) {
        console.warn(`Unknown role: ${userRole}`);
        return false;
    }

    // Check if user's role level is sufficient
    return roleConfig.level >= permissionConfig.level;
}

/**
 * Get all permissions available to a role
 * @param {string} role - Role to check
 * @returns {string[]} Array of permission names
 */
export function getRolePermissions(role) {
    const roleConfig = ROLES[role?.toUpperCase()];
    if (!roleConfig) {
        console.warn(`Unknown role: ${role}`);
        return [];
    }

    return Object.entries(PERMISSIONS)
        .filter(([_, config]) => roleConfig.level >= config.level)
        .map(([permission]) => permission);
}

/**
 * Check if user has sufficient role level
 * @param {string} requiredRole - Required role
 * @param {string} userRole - User's role
 * @returns {boolean} Whether user has sufficient role
 */
export function hasRole(requiredRole, userRole) {
    const required = ROLES[requiredRole?.toUpperCase()];
    const user = ROLES[userRole?.toUpperCase()];

    if (!required || !user) {
        console.warn('Invalid role comparison:', { requiredRole, userRole });
        return false;
    }

    return user.level >= required.level;
}

/**
 * Format role name for display
 * @param {string} role - Role to format
 * @returns {string} Formatted role name
 */
export function formatRoleName(role) {
    const roleConfig = ROLES[role?.toUpperCase()];
    return roleConfig ? roleConfig.name : role;
}

/**
 * Get role description
 * @param {string} role - Role to get description for
 * @returns {string} Role description
 */
export function getRoleDescription(role) {
    const roleConfig = ROLES[role?.toUpperCase()];
    return roleConfig ? roleConfig.description : '';
}

/**
 * Get permission description
 * @param {string} permission - Permission to get description for
 * @returns {string} Permission description
 */
export function getPermissionDescription(permission) {
    const permissionConfig = PERMISSIONS[permission];
    return permissionConfig ? permissionConfig.description : '';
}

/**
 * Get minimum role required for a permission
 * @param {string} permission - Permission to check
 * @returns {string|null} Role ID or null if permission not found
 */
export function getRequiredRole(permission) {
    const permissionConfig = PERMISSIONS[permission];
    if (!permissionConfig) return null;

    const role = Object.entries(ROLES)
        .find(([_, config]) => config.level === permissionConfig.level);

    return role ? role[0].toLowerCase() : null;
}

/**
 * Check if a component should be rendered based on permissions
 * @param {string[]} requiredPermissions - Required permissions (any)
 * @param {string} userRole - User's role
 * @returns {boolean} Whether component should be rendered
 */
export function canRenderComponent(requiredPermissions, userRole) {
    if (!requiredPermissions || !requiredPermissions.length) return true;
    return requiredPermissions.some(permission => hasPermission(permission, userRole));
}

/**
 * Create a permission guard for routes
 * @param {string[]} requiredPermissions - Required permissions (all)
 * @param {string} userRole - User's role
 * @param {string} redirectPath - Path to redirect to if unauthorized
 * @returns {boolean} Whether access is allowed
 */
export function guardRoute(requiredPermissions, userRole, redirectPath = '/unauthorized') {
    if (!requiredPermissions || !requiredPermissions.length) return true;

    const hasAccess = requiredPermissions.every(permission => 
        hasPermission(permission, userRole)
    );

    if (!hasAccess) {
        window.location.href = redirectPath;
    }

    return hasAccess;
}

/**
 * Get UI configuration for role management
 * @returns {Object} Role management UI configuration
 */
export function getRoleManagementConfig() {
    return {
        roles: Object.entries(ROLES).map(([id, config]) => ({
            id: id.toLowerCase(),
            ...config,
            permissions: getRolePermissions(id)
        })),
        permissions: Object.entries(PERMISSIONS).map(([id, config]) => ({
            id,
            ...config,
            requiredRole: getRequiredRole(id)
        }))
    };
}

// Make functions globally available
window.hasPermission = hasPermission;
window.getRolePermissions = getRolePermissions;
window.hasRole = hasRole;
window.formatRoleName = formatRoleName;
window.getRoleDescription = getRoleDescription;
window.getPermissionDescription = getPermissionDescription;
window.getRequiredRole = getRequiredRole;
window.canRenderComponent = canRenderComponent;
window.guardRoute = guardRoute;
window.getRoleManagementConfig = getRoleManagementConfig;

// Make constants globally available
window.ROLE_LEVELS = ROLE_LEVELS;
window.ROLES = ROLES;
window.PERMISSIONS = PERMISSIONS;

// Example usage:
/*
const currentUser = {
    role: 'nurse'
};

// Check specific permission
if (hasPermission('edit_patients', currentUser.role)) {
    // Allow editing patients
}

// Protect entire component
function ProtectedComponent({ requiredPermissions, userRole, children }) {
    if (!canRenderComponent(requiredPermissions, userRole)) {
        return null;
    }
    return children;
}

// Guard route
function AdminRoute({ userRole, children }) {
    useEffect(() => {
        guardRoute(['manage_staff', 'edit_settings'], userRole);
    }, [userRole]);
    
    return children;
}
*/