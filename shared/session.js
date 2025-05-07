export const SESSION_KEYS = {
    TOKEN: 'authToken',
    ROLE: 'userRole',
    USERNAME: 'username'
};

// Decode token and validate the structure
export function parseToken(token) {
    try {
        const data = JSON.parse(Buffer.from(token, 'base64').toString());
        if (!data.exp || data.exp <= Date.now()) return null;
        return data;
    } catch {
        console.error('Auth initialization error:', error);
        return null;
    }
}

export function validateTokenData(tokenData, expectedRole = null) {
    if (!tokenData.exp || tokenData.exp <= Date.now()) return false;
    if (expectedRole && tokenData.role !== expectedRole) return false;
    return true;
}
