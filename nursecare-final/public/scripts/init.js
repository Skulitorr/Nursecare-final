// Core initialization module
import { roles, isAuthorized } from './roles.js';

/**
 * Core UI initialization
 */
export function initializeUI() {
    initializeTheme();
    initializeSidebar();
    initializeDropdowns();
    initializeNotifications();
    initializeDateTime();
}

/**
 * Initialize theme functionality
 */
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');
    
    // Apply saved theme or system preference
    if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
    
    // Theme toggle handler
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            updateThemeIcon(isDarkMode);
            
            // Update charts if they exist
            if (typeof updateChartsForTheme === 'function') {
                updateChartsForTheme(isDarkMode);
            }
        });
    }
}

/**
 * Initialize sidebar functionality
 */
function initializeSidebar() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    // Apply saved state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar?.classList.add('collapsed');
    }
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            
            // Update icon
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = sidebar.classList.contains('collapsed') 
                    ? 'fas fa-chevron-right' 
                    : 'fas fa-bars';
            }
        });
    }
}

/**
 * Initialize dropdown menus
 */
function initializeDropdowns() {
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    // Setup notifications dropdown
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsMenu.classList.toggle('show');
            profileMenu?.classList.remove('show');
        });
    }
    
    // Setup profile dropdown
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
 * Initialize notifications
 */
function initializeNotifications() {
    // Setup notification badge
    const badge = document.querySelector('#notifications-btn .badge');
    if (badge) {
        const count = localStorage.getItem('notificationCount') || '0';
        badge.textContent = count;
        badge.style.display = count === '0' ? 'none' : 'flex';
    }
}

/**
 * Initialize date/time display
 */
function initializeDateTime() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const updateDateTime = () => {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            dateElement.textContent = now.toLocaleDateString('is-IS', options);
        };
        
        updateDateTime();
        setInterval(updateDateTime, 60000);
    }
}

/**
 * Update theme toggle icon
 */
function updateThemeIcon(isDarkMode) {
    const themeIcon = document.querySelector('#theme-toggle i');
    const themeText = document.querySelector('#theme-toggle span');
    
    if (themeIcon) {
        if (isDarkMode) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            if (themeText) themeText.textContent = 'Light Mode';
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            if (themeText) themeText.textContent = 'Dark Mode';
        }
    }
}