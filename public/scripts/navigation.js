import { getUserRole, getRolePages } from './roles.js';

console.log('Navigation Module Loaded');

const routes = {
    dashboard: '/',
    patients: '/patients',
    staff: '/staff',
    inventory: '/inventory',
    schedule: '/schedule',
    reports: '/reports',
    settings: '/settings',
    chatbot: '/chatbot',
    login: '/login',
    unauthorized: '/unauthorized'
};

export function initializeNavigation() {
    console.log('Initializing navigation...');
    setupSidebar();
    setupActiveLinks();
    handleUrlChanges();
}

function setupSidebar() {
    console.log('Setting up sidebar...');
    const userRole = getUserRole();
    const allowedPages = getRolePages(userRole);
    
    const sidebarNav = document.querySelector('.sidebar-nav ul');
    if (!sidebarNav) return;

    // Clear existing items
    sidebarNav.innerHTML = '';

    // Add navigation items based on role permissions
    const navItems = [
        { path: routes.dashboard, icon: 'tachometer-alt', text: 'Mælaborð' },
        { path: routes.schedule, icon: 'calendar-alt', text: 'Vaktaplan' },
        { path: routes.staff, icon: 'user-nurse', text: 'Starfsfólk' },
        { path: routes.patients, icon: 'user-injured', text: 'Sjúklingar' },
        { path: routes.inventory, icon: 'box', text: 'Birgðir' },
        { path: routes.reports, icon: 'chart-bar', text: 'Skýrslur' },
        { path: routes.settings, icon: 'cog', text: 'Stillingar' },
        { path: routes.chatbot, icon: 'comments', text: 'Spjallforrit' }
    ];

    navItems.forEach(item => {
        const pageName = item.path.replace('/', '') || 'dashboard';
        if (allowedPages.includes(pageName)) {
            const li = document.createElement('li');
            li.className = 'nav-item';
            if (isCurrentPage(item.path)) {
                li.classList.add('active');
            }
            
            li.innerHTML = `
                <a href="${item.path}">
                    <i class="fas fa-${item.icon}"></i>
                    <span>${item.text}</span>
                </a>
            `;
            sidebarNav.appendChild(li);
        }
    });
}

function setupActiveLinks() {
    console.log('Setting up active links...');
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && isMatchingPath(link.getAttribute('href'), currentPath)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function handleUrlChanges() {
    console.log('Setting up URL change handler...');
    window.addEventListener('popstate', () => {
        setupActiveLinks();
    });
}

function isCurrentPage(path) {
    const currentPath = window.location.pathname;
    return isMatchingPath(path, currentPath);
}

function isMatchingPath(path, currentPath) {
    // Normalize paths
    const normalizedPath = path.replace(/\.html$/, '');
    const normalizedCurrentPath = currentPath.replace(/\.html$/, '');
    
    // Handle root path special case
    if (normalizedPath === '/' && normalizedCurrentPath === '/dashboard') {
        return true;
    }
    
    return normalizedPath === normalizedCurrentPath;
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeNavigation);