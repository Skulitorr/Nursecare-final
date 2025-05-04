// Login page functionality
import { login } from './auth.js';

console.log('Login Module Loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing login page...');
    
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('login-error');

    // Clear any existing auth data
    localStorage.clear();
    console.debug('Auth data cleared on login page load');

    // Focus username input on page load
    if (usernameInput) {
        usernameInput.focus();
        console.debug('Username input focused');
    } else {
        console.warn('Username input not found');
    }

    if (loginBtn) {
        console.debug('Adding event listener to login button');
        loginBtn.addEventListener('click', handleLogin);
    } else {
        console.warn('Login button not found');
    }

    // Handle form submission
    if (loginForm) {
        console.debug('Adding event listener to login form');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
    } else {
        console.warn('Login form not found');
    }

    // Set up demo account info if present in the UI
    const demoAccounts = document.querySelectorAll('.demo-account');
    if (demoAccounts.length > 0) {
        console.debug('Setting up demo account click handlers');
        demoAccounts.forEach(account => {
            account.addEventListener('click', (e) => {
                e.preventDefault();
                const username = account.getAttribute('data-username');
                const password = account.getAttribute('data-password');
                
                if (username && password && usernameInput && passwordInput) {
                    usernameInput.value = username;
                    passwordInput.value = password;
                    console.debug(`Demo account selected: ${username}`);
                }
            });
        });
    }

    async function handleLogin() {
        console.log('Login attempt initiated');
        
        const username = usernameInput?.value;
        const password = passwordInput?.value;

        if (!username || !password) {
            console.warn('Missing username or password');
            showError("Please enter both username and password");
            return;
        }

        // Disable button while processing
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        }

        try {
            console.debug('Attempting login with auth module');
            const result = await login(username, password);
            
            console.log('Login successful, redirecting to dashboard');
            // Use correct path for Vercel static deployment
            window.location.href = "/dashboard.html";
        } catch (error) {
            console.error('Login failed:', error);
            showError(error.message || "Invalid username or password");
            
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
            
            if (passwordInput) {
                passwordInput.value = ''; // Clear password on error
                passwordInput.focus();
            }
        }
    }

    function showError(message) {
        console.warn('Showing login error:', message);
        
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            // Add shake animation to form
            if (loginForm) {
                loginForm.classList.add('shake');
                setTimeout(() => loginForm.classList.remove('shake'), 600);
            }
        } else {
            console.warn('Error message element not found');
            alert(message); // Fallback to alert if element not found
        }
    }
});