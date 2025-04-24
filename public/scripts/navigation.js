import { getUserRole, getRolePages } from './roles.js';

/**
 * Generate navigation items based on user role
 * @param {string} currentPage - The current page name
 * @returns {string} HTML string of navigation items
 */
export function generateNavigation(currentPage) {
    const userRole = getUserRole();
    const allowedPages = getRolePages(userRole);
    
    const navItems = [
        { id: 'dashboard', icon: 'tachometer-alt', label: 'Dashboard' },
        { id: 'schedule', icon: 'calendar-alt', label: 'Schedule' },
        { id: 'staff', icon: 'user-nurse', label: 'Staff' },
        { id: 'patients', icon: 'user-injured', label: 'Patients' },
        { id: 'inventory', icon: 'box', label: 'Inventory' },
        { id: 'reports', icon: 'chart-bar', label: 'Reports' },
        { id: 'settings', icon: 'cog', label: 'Settings' }
    ];

    return navItems
        .filter(item => allowedPages.includes(item.id))
        .map(item => `
            <li class="nav-item${currentPage === item.id ? ' active' : ''}">
                <a href="/public/${item.id}.html"${currentPage === item.id ? ' aria-current="page"' : ''}>
                    <i class="fas fa-${item.icon}"></i>
                    <span>${item.label}</span>
                </a>
            </li>
        `).join('');
}

/**
 * Initialize navigation by inserting it into the sidebar
 */
export function initializeNavigation() {
    const currentPage = window.location.pathname.split('/').pop()?.replace('.html', '') || 'dashboard';
    const sidebarNav = document.querySelector('.sidebar-nav ul');
    
    if (sidebarNav) {
        sidebarNav.innerHTML = generateNavigation(currentPage);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeNavigation);