// Role-based access control configuration
window.USER_ROLES = {
    ADMIN: "admin",
    NURSE: "nurse", 
    STAFF: "staff",
    INVENTORY: "inventory"
};

window.ROUTES_BY_ROLE = {
    admin: ["dashboard.html", "patients.html", "reports.html", "staff.html", "inventory.html", "settings.html"],
    nurse: ["dashboard.html", "patients.html", "reports.html"],
    staff: ["dashboard.html", "patients.html"],
    inventory: ["dashboard.html", "inventory.html"]
};

window.PERMISSIONS_BY_ROLE = {
    admin: ["manage_patients", "manage_inventory", "manage_staff", "manage_settings"],
    nurse: ["view_patients", "write_reports"],
    staff: ["view_patients"],
    inventory: ["manage_inventory"]
};

// Helper functions
export function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
}

export function getUserRole() {
    return localStorage.getItem('userRole');
}

export function isAuthorized(page) {
    const userRole = getUserRole();
    if (!userRole) return false;
    
    // Clean up page name - ensure .html extension
    let cleanPage = page.toLowerCase();
    if (!cleanPage.endsWith('.html')) {
        cleanPage += '.html';
    }
    const allowedRoutes = window.ROUTES_BY_ROLE[userRole] || [];
    return allowedRoutes.includes(cleanPage);
}

export function hasPermission(permission) {
    const userRole = getUserRole();
    if (!userRole) return false;
    
    const userPermissions = window.PERMISSIONS_BY_ROLE[userRole] || [];
    return userPermissions.includes(permission);
}

export function getRoleDisplayName(role) {
    const displayNames = {
        admin: "Administrator",
        nurse: "Nurse",
        staff: "Staff Member",
        inventory: "Inventory Manager"
    };
    return displayNames[role] || role;
}