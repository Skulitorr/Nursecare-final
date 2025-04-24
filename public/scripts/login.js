// Mock user data for demo purposes
const mockUsers = {
    'admin': { role: 'ADMIN', password: 'admin123' },
    'nurse': { role: 'NURSE', password: 'nurse123' },
    'staff': { role: 'STAFF', password: 'staff123' },
    'inventory': { role: 'INVENTORY', password: 'inv123' }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('login-error');

    // Clear any stale auth data on login page load
    localStorage.clear();

    // Focus username input
    usernameInput?.focus();

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Validate inputs
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }

        // Disable button during validation
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        
        try {
            const user = mockUsers[username];
            if (!user || user.password !== password) {
                throw new Error('Invalid username or password');
            }

            // Create session token with expiration
            const tokenData = {
                username,
                role: user.role,
                exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            
            // Only set auth data after successful validation
            const token = btoa(JSON.stringify(tokenData));
            localStorage.setItem('authToken', token);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('username', username);
            
            // Redirect to dashboard
            window.location.href = '/public/dashboard.html';
        } catch (error) {
            showError(error.message);
            passwordInput.value = ''; // Clear password on error
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            // Add shake animation
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 600);
        }
    }
});