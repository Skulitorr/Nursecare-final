import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { USER_ROLES } from './roles.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const SUPABASE_URL = 'https://djyenuibpesszqqonhqt.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWVudWlicGVzc3pxcW9uaHF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMzA2MDgsImV4cCI6MjA2MDgwNjYwOH0.0rSV7e_EBqhEvBM4xA7UdHQCjd3lUTs2pwRXodx3Hzc';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get DOM elements
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const loginContainer = document.querySelector('.login-container');

    // Handle form submission
    loginForm.addEventListener('submit', handleLogin);

    // Function to show error with animation
    function showError(message) {
        const errorSpan = errorMessage.querySelector('span');
        if (errorSpan) {
            errorSpan.textContent = message;
        }
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        
        // Add shake animation
        loginContainer.classList.add('shake');
        
        // Remove animation class after it completes
        setTimeout(() => {
            loginContainer.classList.remove('shake');
        }, 600);
    }

    // Add shake animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .shake {
            animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
    `;
    document.head.appendChild(style);

    // Focus on username input when page loads
    usernameInput.focus();

    // Check if user is already logged in
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        try {
            // Validate token
            const tokenData = JSON.parse(atob(authToken));
            if (tokenData.exp > Date.now()) {
                window.location.href = '/index.html';
            } else {
                // Clear expired token
                localStorage.clear();
            }
        } catch (e) {
            // Clear invalid token
            localStorage.clear();
        }
    }

    // Clear any existing auth data
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
});

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simulate authentication - in real app this would be an API call
    const mockUsers = {
        'admin': { role: USER_ROLES.ADMIN, password: 'admin123' },
        'nurse': { role: USER_ROLES.NURSE, password: 'nurse123' },
        'staff': { role: USER_ROLES.STAFF, password: 'staff123' },
        'inventory': { role: USER_ROLES.INVENTORY, password: 'inv123' }
    };
    
    const user = mockUsers[username];
    if (user && user.password === password) {
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', username);
        window.location.href = '/dashboard.html';
    } else {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = 'Invalid username or password';
            errorDiv.style.display = 'block';
        }
    }
}