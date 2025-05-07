export const SESSION_KEYS = {
    TOKEN: 'authToken',
    ROLE: 'userRole',
    USERNAME: 'username'
};

// Decode token and validate the structure
export function parseToken(token) {
    try {
        // For browser compatibility, use atob instead of Buffer
        const data = JSON.parse(atob(token));
        if (!data.exp || data.exp <= Date.now()) return null;
        return data;
    } catch (error) {
        console.error('Auth initialization error:', error);
        return null;
    }
}

export function validateTokenData(tokenData, expectedRole = null) {
    if (!tokenData.exp || tokenData.exp <= Date.now()) return false;
    if (expectedRole && tokenData.role !== expectedRole) return false;
    return true;
}