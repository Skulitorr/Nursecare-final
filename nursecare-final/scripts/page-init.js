import { checkAuth, authorizeUser, setupNavigation } from './common.js';
import {
    initializeDashboard,
    initializePatients,
    initializeStaff,
    initializeInventory,
    initializeReports,
    initializeSettings,
    initializeSchedule
} from './page-specific-init.js';

/**
 * Initialize page functionality
 */
export function initializePage() {
    const currentPage = getCurrentPage();

    // Check authentication and authorization
    if (!checkAuth()) return;
    authorizeUser(currentPage);
    
    // Setup navigation based on user role
    setupNavigation();
    
    // Initialize UI components
    initializeUI();
    
    // Additional page-specific initialization if needed
    if (typeof window.initializePageSpecific === 'function') {
        window.initializePageSpecific();
    }
}

/**
 * Get current page name from URL
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const pageName = path.split('/').pop() || 'index.html';
    return pageName;
}

/**
 * Initialize common UI components
 */
function initializeUI() {
    // Initialize sidebar
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
        });
    }

    // Initialize theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon(true);
        }

        themeToggle.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            updateThemeIcon(isDarkMode);
        });
    }

    // Initialize dropdowns
    initializeDropdowns();
}

/**
 * Initialize dropdown menus
 */
function initializeDropdowns() {
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');

    // Toggle notifications dropdown
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsMenu.classList.toggle('show');
            profileMenu?.classList.remove('show');
        });
    }

    // Toggle profile dropdown
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
            notificationsMenu?.classList.remove('show');
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        notificationsMenu?.classList.remove('show');
        profileMenu?.classList.remove('show');
    });
}

/**
 * Update theme toggle icon
 */
function updateThemeIcon(isDarkMode) {
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}