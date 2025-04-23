import { roles, isAuthorized } from './roles.js';

// Setup navigation based on user role
function setupNavigation() {
    const userRole = localStorage.getItem('userRole');
    const allowedPages = roles[userRole] || [];
    
    document.querySelectorAll('nav a').forEach(link => {
        const page = link.getAttribute('href').split('/').pop().replace('.html', '');
        if (!allowedPages.includes(page)) {
            link.style.display = 'none';
        }
    });
}

// Check authentication
function checkAuth() {
    if (!localStorage.getItem('authToken')) {
        window.location.href = '/pages/unauthorized.html';
        return false;
    }
    return true;
}

// Page authorization
function authorizeUser(page) {
    if (!checkAuth()) return;
    if (!isAuthorized(page)) {
        window.location.href = '/pages/unauthorized.html';
    }
}

export { setupNavigation, checkAuth, authorizeUser };