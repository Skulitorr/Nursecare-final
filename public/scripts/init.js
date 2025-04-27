import { initAuth } from './auth.js';
import { initializeNavigation } from './navigation.js';
import errorHandler from './error-handler.js';

console.log('Core Initialization Module Loaded');

export async function initializeUI() {
    console.log('Initializing core UI...');
    try {
        if (!initAuth()) {
            console.log('Authentication failed, stopping initialization');
            return false;
        }

        initializeNavigation();
        initializeTheme();
        initializeDropdowns();
        setupNotifications();
        setupUserProfile();
        initializeDateTime();
        
        return true;
    } catch (error) {
        console.error('Error during UI initialization:', error);
        errorHandler.showError('Error initializing application');
        return false;
    }
}

function initializeTheme() {
    console.log('Initializing theme...');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    updateThemeIcon(savedTheme === 'dark');
}

function initializeDropdowns() {
    console.log('Initializing dropdowns...');
    setupDropdownHandlers('notifications-btn', 'notifications-menu');
    setupDropdownHandlers('profile-btn', 'profile-menu');
}

function setupDropdownHandlers(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    
    if (btn && menu) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
            console.log(`Toggled ${menuId}`);
        });
        
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
    } else {
        console.warn(`Dropdown elements not found: ${btnId} or ${menuId}`);
    }
}

function setupNotifications() {
    console.log('Setting up notifications...');
    const clearAllBtn = document.querySelector('.clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            const notificationItems = document.querySelectorAll('.notification-item');
            notificationItems.forEach(item => {
                item.style.animation = 'slideOutRight 0.3s forwards';
                setTimeout(() => item.remove(), 300);
            });
        });
    }
}

function setupUserProfile() {
    console.log('Setting up user profile...');
    const userName = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');
    
    const nameElement = document.querySelector('.dropdown-header h3');
    const roleElement = document.querySelector('.dropdown-header span');
    
    if (nameElement) nameElement.textContent = userName || 'User';
    if (roleElement) roleElement.textContent = userRole || 'Guest';
}

function initializeDateTime() {
    console.log('Initializing date/time display...');
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const updateDateTime = () => {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.innerHTML = `
                <i class="fas fa-calendar-alt"></i>
                ${now.toLocaleDateString('is-IS', options)}
            `;
        };
        
        updateDateTime();
        setInterval(updateDateTime, 60000); // Update every minute
    }
}

function updateThemeIcon(isDark) {
    const icon = document.querySelector('#theme-toggle i');
    const text = document.querySelector('#theme-toggle span');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    if (text) text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUI);