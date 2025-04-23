// Authentication module
import { ROLES, hasPermission } from './roles.js';
import { showToast } from './utils.js';

// Session storage keys
const SESSION_KEYS = {
    USER: 'currentUser',
    TOKEN: 'authToken',
    REFRESH_TOKEN: 'refreshToken',
    EXPIRES_AT: 'tokenExpiresAt'
};

// Default session duration in milliseconds (4 hours)
const DEFAULT_SESSION_DURATION = 4 * 60 * 60 * 1000;

// Current user state
let currentUser = null;

/**
 * Initialize authentication
 */
export function initAuth() {
    // Load user from session storage if available
    const savedUser = sessionStorage.getItem(SESSION_KEYS.USER);
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            validateSession();
        } catch (error) {
            console.error('Failed to parse saved user:', error);
            clearSession();
        }
    }

    // Set up session expiry check
    setInterval(validateSession, 60000); // Check every minute
}

/**
 * Validate current session
 */
function validateSession() {
    const expiresAt = sessionStorage.getItem(SESSION_KEYS.EXPIRES_AT);
    if (!expiresAt || Date.now() >= parseInt(expiresAt)) {
        // Session expired
        clearSession();
        showToast('Seta útrunnin', 'Vinsamlegast skráðu þig inn aftur', 'warning');
        window.location.href = '/login';
    }
}

/**
 * Clear current session
 */
export function clearSession() {
    currentUser = null;
    Object.values(SESSION_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
    });
}

/**
 * Get current user
 * @returns {Object|null} Current user object or null if not logged in
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Check if user is logged in
 * @returns {boolean} Whether user is logged in
 */
export function isLoggedIn() {
    return !!currentUser && !!sessionStorage.getItem(SESSION_KEYS.TOKEN);
}

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Login result
 */
export async function login(username, password) {
    try {
        // Show loading state
        const loginBtn = document.querySelector('#login-btn');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Skrái inn...';
        }

        // TODO: Replace with actual API call
        const mockApi = await mockLoginApi(username, password);
        
        // Store session data
        sessionStorage.setItem(SESSION_KEYS.USER, JSON.stringify(mockApi.user));
        sessionStorage.setItem(SESSION_KEYS.TOKEN, mockApi.token);
        sessionStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, mockApi.refreshToken);
        sessionStorage.setItem(
            SESSION_KEYS.EXPIRES_AT, 
            (Date.now() + DEFAULT_SESSION_DURATION).toString()
        );

        currentUser = mockApi.user;

        // Show success message
        showToast('Velkomin/n', `Velkomin/n aftur ${currentUser.name}!`, 'success');

        // Redirect to dashboard
        window.location.href = '/dashboard';

        return { success: true };
    } catch (error) {
        console.error('Login failed:', error);
        showToast('Villa', error.message || 'Villa kom upp við innskráningu', 'error');
        return { success: false, error };
    } finally {
        // Reset login button
        const loginBtn = document.querySelector('#login-btn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Skrá inn';
        }
    }
}

/**
 * Mock login API call
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Mock API response
 */
async function mockLoginApi(username, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock user validation
    if (username === 'admin' && password === 'admin123') {
        return {
            user: {
                id: '1',
                username: 'admin',
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'ADMIN',
                department: 'Administration',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token'
        };
    }

    if (username === 'nurse' && password === 'nurse123') {
        return {
            user: {
                id: '2',
                username: 'nurse',
                name: 'Jane Doe',
                email: 'nurse@example.com',
                role: 'NURSE',
                department: 'Medical',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nurse'
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token'
        };
    }

    throw new Error('Rangt notandanafn eða lykilorð');
}

/**
 * Logout user
 */
export function logout() {
    clearSession();
    showToast('Útskráning', 'Þú hefur verið skráð/ur út', 'info');
    window.location.href = '/login';
}

/**
 * Check if current user has permission
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether user has permission
 */
export function hasActionAccess(permission) {
    if (!currentUser) return false;
    return hasPermission(permission, currentUser.role);
}

/**
 * Refresh authentication token
 * @returns {Promise<boolean>} Whether refresh was successful
 */
export async function refreshToken() {
    try {
        const refreshToken = sessionStorage.getItem(SESSION_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        // TODO: Replace with actual API call
        const response = await mockRefreshToken(refreshToken);
        
        sessionStorage.setItem(SESSION_KEYS.TOKEN, response.token);
        sessionStorage.setItem(
            SESSION_KEYS.EXPIRES_AT,
            (Date.now() + DEFAULT_SESSION_DURATION).toString()
        );

        return true;
    } catch (error) {
        console.error('Token refresh failed:', error);
        clearSession();
        return false;
    }
}

/**
 * Mock token refresh API call
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} Mock API response
 */
async function mockRefreshToken(refreshToken) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock token refresh
    if (refreshToken === 'mock-refresh-token') {
        return {
            token: 'new-mock-jwt-token'
        };
    }

    throw new Error('Invalid refresh token');
}

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Update result
 */
export async function updateProfile(updates) {
    try {
        if (!currentUser) {
            throw new Error('No user logged in');
        }

        // TODO: Replace with actual API call
        const updatedUser = await mockUpdateProfile(currentUser.id, updates);
        
        // Update current user
        currentUser = {
            ...currentUser,
            ...updatedUser
        };

        // Update session storage
        sessionStorage.setItem(SESSION_KEYS.USER, JSON.stringify(currentUser));

        showToast('Uppfært', 'Upplýsingar uppfærðar', 'success');
        return { success: true, user: currentUser };
    } catch (error) {
        console.error('Profile update failed:', error);
        showToast('Villa', error.message || 'Villa kom upp við að uppfæra upplýsingar', 'error');
        return { success: false, error };
    }
}

/**
 * Mock profile update API call
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Mock API response
 */
async function mockUpdateProfile(userId, updates) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate updates
    const allowedFields = ['name', 'email', 'department'];
    const invalidFields = Object.keys(updates)
        .filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
        throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
    }

    return {
        ...currentUser,
        ...updates,
        updatedAt: new Date().toISOString()
    };
}

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Change result
 */
export async function changePassword(currentPassword, newPassword) {
    try {
        if (!currentUser) {
            throw new Error('No user logged in');
        }

        // TODO: Replace with actual API call
        await mockChangePassword(currentUser.id, currentPassword, newPassword);
        
        showToast('Uppfært', 'Lykilorði breytt', 'success');
        return { success: true };
    } catch (error) {
        console.error('Password change failed:', error);
        showToast('Villa', error.message || 'Villa kom upp við að breyta lykilorði', 'error');
        return { success: false, error };
    }
}

/**
 * Mock password change API call
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
async function mockChangePassword(userId, currentPassword, newPassword) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock password validation
    if (currentPassword !== 'admin123' && currentPassword !== 'nurse123') {
        throw new Error('Núverandi lykilorð er rangt');
    }

    // Mock password requirements
    if (newPassword.length < 8) {
        throw new Error('Nýtt lykilorð verður að vera að minnsta kosti 8 stafir');
    }
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset request result
 */
export async function requestPasswordReset(email) {
    try {
        // TODO: Replace with actual API call
        await mockRequestPasswordReset(email);
        
        showToast(
            'Endurstilling send', 
            'Leiðbeiningar um endurstillingu lykilorðs hafa verið sendar á netfangið þitt',
            'success'
        );
        return { success: true };
    } catch (error) {
        console.error('Password reset request failed:', error);
        showToast('Villa', error.message || 'Villa kom upp við að senda beiðni', 'error');
        return { success: false, error };
    }
}

/**
 * Mock password reset request API call
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
async function mockRequestPasswordReset(email) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock email validation
    if (!email.includes('@')) {
        throw new Error('Ógilt netfang');
    }

    // Mock known email check
    const knownEmails = ['admin@example.com', 'nurse@example.com'];
    if (!knownEmails.includes(email)) {
        throw new Error('Ekkert aðgangi fannst með þessu netfangi');
    }
}

// Initialize authentication when module loads
initAuth();