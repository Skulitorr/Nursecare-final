// Core initialization module
import { getRoleDisplayName } from './roles.js';
import { SESSION_KEYS } from './auth.js';

/**
 * Core UI initialization
 */
export async function initializeUI() {
    initializeTheme();
    initializeDropdowns();
    initializeDateTime();
    await setupUserProfile();
    return true;
}

/**
 * Initialize theme functionality
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }

    // Setup theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            updateThemeIcon(isDarkMode);
        });
    }
}

/**
 * Initialize dropdown menus
 */
function initializeDropdowns() {
    setupNotificationsDropdown();
    setupProfileDropdown();
}

/**
 * Setup notifications dropdown
 */
function setupNotificationsDropdown() {
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!notificationsMenu.contains(e.target)) {
                notificationsMenu.classList.remove('show');
            }
        });
    }
}

/**
 * Setup profile dropdown
 */
function setupProfileDropdown() {
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target)) {
                profileMenu.classList.remove('show');
            }
        });

        // Setup logout handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '/public/login.html';
            });
        }
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
            dateElement.textContent = now.toLocaleDateString('en-US', options);
        };
        
        updateDateTime();
        setInterval(updateDateTime, 60000); // Update every minute
    }
}

/**
 * Setup user profile information
 */
async function setupUserProfile() {
    const username = localStorage.getItem(SESSION_KEYS.USERNAME);
    const userRole = localStorage.getItem(SESSION_KEYS.ROLE);
    
    // Update profile elements if they exist
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');
    
    if (userNameElement && username) {
        userNameElement.textContent = username;
    }
    
    if (userRoleElement && userRole) {
        userRoleElement.textContent = getRoleDisplayName(userRole);
    }
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

/**
 * Get current theme
 */
export function getCurrentTheme() {
    return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
}