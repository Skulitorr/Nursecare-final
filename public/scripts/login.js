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

        if (username === "admin" && password === "admin123") {
            localStorage.setItem("userRole", "admin");
            window.location.href = "/dashboard.html";
        } else {
            showError("Invalid credentials");
            passwordInput.value = ''; // Clear password on error
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
            
            // Add shake animation
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 600);
        }
    }
});