// Authentication Module
console.log('Auth Module Loaded');

export const SESSION_KEYS = {
    TOKEN: 'authToken',
    ROLE: 'userRole',
    USERNAME: 'username'
};

let currentUser = null;

export function initAuth() {
    console.log('Initializing authentication...');
    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const role = localStorage.getItem(SESSION_KEYS.ROLE);
    
    if (!token || !role) {
        console.debug('No token or role found in localStorage');
        clearSession();
        redirectToLogin();
        return false;
    }
    
    try {
        const tokenData = JSON.parse(atob(token));
        if (!tokenData.exp || tokenData.exp <= Date.now()) {
            console.log('Token expired');
            clearSession();
            redirectToLogin();
            return false;
        }
        
        currentUser = tokenData;
        console.debug('Auth initialized successfully for user:', tokenData.username);
        updateUserInfo();
        return true;
    } catch (error) {
        console.error('Auth initialization error:', error);
        clearSession();
        redirectToLogin();
        return false;
    }
}

export function validateSession() {
    console.log('Validating session...');
    const currentPath = window.location.pathname;
    
    // Allow access to login and unauthorized pages without auth
    if (currentPath.includes('/login') || currentPath.includes('/unauthorized')) {
        console.debug('No authentication needed for:', currentPath);
        return true;
    }
    
    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const role = localStorage.getItem(SESSION_KEYS.ROLE);
    
    if (!token || !role) {
        console.debug('No token or role found during validation');
        redirectToUnauthorized();
        return false;
    }
    
    try {
        const tokenData = JSON.parse(atob(token));
        if (!tokenData.exp || !tokenData.role || 
            tokenData.exp <= Date.now() || 
            tokenData.role !== role) {
            console.debug('Invalid token data:', tokenData);
            clearSession();
            redirectToUnauthorized();
            return false;
        }
        console.debug('Session validated successfully for role:', role);
        return true;
    } catch (error) {
        console.error('Session validation error:', error);
        clearSession();
        redirectToUnauthorized();
        return false;
    }
}

export async function login(username, password) {
    console.log('Attempting login for user:', username);
    try {
        // Clear any existing session
        clearSession();
        
        // Mock authentication - replace with real API call
        const mockUsers = {
            'admin': { role: 'ADMIN', name: 'Administrator', password: 'admin123' },
            'nurse': { role: 'NURSE', name: 'Anna', password: 'nurse123' },
            'staff': { role: 'STAFF', name: 'Staff Member', password: 'staff123' }
        };
        
        const user = mockUsers[username.toLowerCase()];
        if (!user || user.password !== password) {
            console.debug('Login failed: invalid credentials');
            throw new Error('Invalid username or password');
        }
        
        // Create session token
        const tokenData = {
            username,
            name: user.name,
            role: user.role,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        const token = btoa(JSON.stringify(tokenData));
        
        // Store session data
        localStorage.setItem(SESSION_KEYS.TOKEN, token);
        localStorage.setItem(SESSION_KEYS.ROLE, user.role);
        localStorage.setItem(SESSION_KEYS.USERNAME, username);
        currentUser = tokenData;
        
        console.debug('Login successful for user:', username, 'with role:', user.role);
        updateUserInfo();
        return { success: true, role: user.role };
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

export function logout() {
    console.log('Logging out...');
    clearSession();
    redirectToLogin();
}

function clearSession() {
    console.log('Clearing session...');
    localStorage.removeItem(SESSION_KEYS.TOKEN);
    localStorage.removeItem(SESSION_KEYS.ROLE);
    localStorage.removeItem(SESSION_KEYS.USERNAME);
    currentUser = null;
}

function redirectToLogin() {
    console.debug('Redirecting to login page');
    window.location.href = '/login.html';
}

function redirectToUnauthorized() {
    console.debug('Redirecting to unauthorized page');
    window.location.href = '/unauthorized.html';
}

function updateUserInfo() {
    console.debug('Updating user info display...');
    
    try {
        const userNameElement = document.querySelector('.user-name');
        const userRoleElement = document.querySelector('.user-role');
        const profileAvatar = document.querySelector('.profile-btn img');
        
        if (userNameElement) {
            userNameElement.textContent = currentUser?.name || 'User';
        }
        
        if (userRoleElement) {
            userRoleElement.textContent = currentUser?.role || 'Guest';
        }
        
        // Update profile avatar if present
        if (profileAvatar && currentUser) {
            const seed = currentUser.username || currentUser.name;
            profileAvatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            profileAvatar.alt = `Profile Avatar for ${currentUser.name}`;
        }
        
        console.debug('User info display updated');
    } catch (error) {
        console.warn('Error updating user info display:', error);
        // Non-critical error, don't throw
    }
}

// Export current user to be accessible in other modules
export function getCurrentUser() {
    return currentUser;
}

// Initialize auth when DOM is loaded if we're not on login page
// NOTE: This is a browser only method, not compliant with NODEJS server
// document.addEventListener('DOMContentLoaded', () => {
//     const isLoginPage = window.location.pathname.includes('/login');
//     if (!isLoginPage) {
//         initAuth();
//     }
// });
