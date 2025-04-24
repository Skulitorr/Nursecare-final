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
    const loginError = document.getElementById('login-error');
    const loginContainer = document.querySelector('.login-container');

    // Only redirect if we have both token and role
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    if (authToken && userRole) {
        window.location.href = '/dashboard.html';
        return;
    }

    // Clear any stale auth data
    localStorage.clear();

    // Focus on username input
    usernameInput.focus();

    // Handle form submission
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Validate inputs
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }
        
        // Mock authentication - in real app this would be an API call
        const mockUsers = {
            'admin': { role: USER_ROLES.ADMIN, password: 'admin123' },
            'nurse': { role: USER_ROLES.NURSE, password: 'nurse123' },
            'staff': { role: USER_ROLES.STAFF, password: 'staff123' },
            'inventory': { role: USER_ROLES.INVENTORY, password: 'inv123' }
        };
        
        const user = mockUsers[username];
        if (user && user.password === password) {
            // Set auth data
            const token = btoa(JSON.stringify({
                username,
                role: user.role,
                exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            }));
            
            localStorage.setItem('authToken', token);
            localStorage.setItem('userRole', user.role);
            localStorage.setItem('username', username);
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } else {
            showError('Invalid username or password');
            passwordInput.value = ''; // Clear password on error
        }
    });

    function showError(message) {
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
            
            // Add shake animation
            loginContainer.classList.add('shake');
            setTimeout(() => {
                loginContainer.classList.remove('shake');
            }, 600);
        }
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
});