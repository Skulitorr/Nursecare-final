// Login page functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('login-error');

    // Clear any existing auth data
    localStorage.clear();

    // Focus username input on page load
    usernameInput?.focus();

    loginBtn?.addEventListener('click', () => {
        const username = usernameInput?.value;
        const password = passwordInput?.value;

        if (!username || !password) {
            showError("Please enter both username and password");
            return;
        }

        // Disable button while processing
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        // Mock authentication
        if (username === "admin" && password === "admin123") {
            // Create auth token with expiration
            const userData = {
                username: "admin",
                role: "admin",
                exp: Date.now() + (8 * 60 * 60 * 1000) // 8 hour expiration
            };
            
            // Store auth data
            localStorage.setItem("authToken", btoa(JSON.stringify(userData)));
            localStorage.setItem("userRole", "admin");
            
            // Redirect to dashboard without /public/ prefix since Vercel handles this
            window.location.href = "/dashboard";
        } else {
            showError("Invalid username or password");
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
            passwordInput.value = ''; // Clear password on error
            passwordInput.focus();
        }
    });

    // Handle form submission
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        loginBtn?.click();
    });

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            
            // Add shake animation to form
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 600);
        }
    }
});