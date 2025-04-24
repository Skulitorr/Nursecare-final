import { validateSession, SESSION_KEYS } from './auth.js';
import { hasPermission } from './roles.js';

/**
 * Initialize page requirements
 */
export function initializePage() {
    // Validate auth first
    if (!validateSession()) {
        return false;
    }

    // Get current page name from path
    const pageName = getCurrentPageName();
    const userRole = localStorage.getItem(SESSION_KEYS.ROLE);
    
    try {
        // Check page-specific permissions
        if (!hasPagePermission(pageName, userRole)) {
            window.location.href = '/public/unauthorized.html';
            return false;
        }
        
        setupUI();
        return true;
    } catch (e) {
        console.error('Page initialization failed:', e);
        return false;
    }
}

/**
 * Get current page name from path
 */
function getCurrentPageName() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '');
    return pageName || 'dashboard';
}

/**
 * Check if user has permission for the current page
 */
function hasPagePermission(pageName, userRole) {
    const pagePermissions = {
        'dashboard': ['ADMIN', 'NURSE', 'STAFF', 'INVENTORY'],
        'patients': ['ADMIN', 'NURSE', 'STAFF'],
        'inventory': ['ADMIN', 'INVENTORY'],
        'staff': ['ADMIN'],
        'reports': ['ADMIN', 'NURSE'],
        'settings': ['ADMIN']
    };

    const allowedRoles = pagePermissions[pageName] || ['ADMIN'];
    return allowedRoles.includes(userRole.toUpperCase());
}

/**
 * Setup common UI elements
 */
function setupUI() {
    setupSidebar();
    setupHeader();
    setupThemeToggle();
    setupLogoutHandler();
}

/**
 * Setup sidebar navigation
 */
function setupSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
        });
    }
}

/**
 * Setup header components
 */
function setupHeader() {
    const username = localStorage.getItem(SESSION_KEYS.USERNAME);
    const userRole = localStorage.getItem(SESSION_KEYS.ROLE);
    
    // Update user info if elements exist
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');
    
    if (userNameElement) {
        userNameElement.textContent = username || 'User';
    }
    if (userRoleElement) {
        userRoleElement.textContent = userRole || 'Guest';
    }
}

/**
 * Setup theme toggle
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon(themeToggle, true);
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(themeToggle, isDark);
        });
    }
}

/**
 * Update theme toggle icon
 */
function updateThemeIcon(button, isDark) {
    const icon = button.querySelector('i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

/**
 * Setup logout handler
 */
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = '/public/login.html';
        });
    }
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', initializePage);