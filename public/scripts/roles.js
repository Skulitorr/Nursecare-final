console.log('Roles Module Loaded');

export const ROLES = {
    ADMIN: 'ADMIN',
    NURSE: 'NURSE',
    STAFF: 'STAFF',
    DOCTOR: 'DOCTOR'
};

const rolePermissions = {
    [ROLES.ADMIN]: ['dashboard', 'patients', 'staff', 'inventory', 'schedule', 'reports', 'settings', 'chatbot'],
    [ROLES.NURSE]: ['dashboard', 'patients', 'schedule', 'inventory', 'chatbot'],
    [ROLES.STAFF]: ['dashboard', 'schedule', 'inventory', 'chatbot'],
    [ROLES.DOCTOR]: ['dashboard', 'patients', 'schedule', 'reports', 'chatbot']
};

const publicPages = ['login', 'unauthorized', '404'];

export function getUserRole() {
    return localStorage.getItem('userRole') || null;
}

export function getRolePages(role) {
    console.log('Getting pages for role:', role);
    return rolePermissions[role] || [];
}

export function hasPermission(page, role = getUserRole()) {
    if (publicPages.includes(page)) {
        return true;
    }
    
    if (!role || !rolePermissions[role]) {
        return false;
    }
    
    // Normalize page name
    const normalizedPage = page.replace(/^\//, '').replace(/\.html$/, '') || 'dashboard';
    
    return rolePermissions[role].includes(normalizedPage);
}

export function validatePageAccess(page) {
    const role = getUserRole();
    console.log('Validating access:', { page, role });
    
    if (!hasPermission(page, role)) {
        console.warn('Access denied:', { page, role });
        // Store attempted path for potential redirect after login
        sessionStorage.setItem('unauthorizedPath', page);
        return false;
    }
    
    return true;
}