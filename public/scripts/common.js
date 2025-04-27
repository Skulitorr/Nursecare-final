import { validateSession, logout } from './auth.js';

console.log('Common Module Loaded');

export function initializeApp() {
    console.log('Initializing application...');
    return validateSession();
}

export function setupCommonUI() {
    console.log('Setting up common UI elements...');
    setupTheme();
    setupNotifications();
    setupUserProfile();
    setupNavigation();
}

function setupTheme() {
    console.log('Setting up theme...');
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('dark-mode', savedTheme === 'dark');
        updateThemeIcon(savedTheme === 'dark');
        
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
            console.log('Theme toggled:', isDark ? 'dark' : 'light');
        });
    }
}

function updateThemeIcon(isDark) {
    const icon = document.querySelector('#theme-toggle i');
    const text = document.querySelector('#theme-toggle span');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    if (text) {
        text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }
}

function setupNotifications() {
    console.log('Setting up notifications...');
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsMenu.classList.toggle('show');
            console.log('Notifications toggled');
        });
        
        document.addEventListener('click', (e) => {
            if (!notificationsMenu.contains(e.target)) {
                notificationsMenu.classList.remove('show');
            }
        });
    }
}

function setupUserProfile() {
    console.log('Setting up user profile...');
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
            console.log('Profile menu toggled');
        });
        
        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target)) {
                profileMenu.classList.remove('show');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logout clicked');
            logout();
        });
    }
}

function setupNavigation() {
    console.log('Setting up navigation...');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
            console.log('Sidebar toggled');
        });
    }
    
    // Handle active nav item
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && (link.getAttribute('href') === currentPath || 
                    link.getAttribute('href') === currentPath + '.html')) {
            item.classList.add('active');
        }
    });
}

// Initialize common functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (initializeApp()) {
        setupCommonUI();
    }
});