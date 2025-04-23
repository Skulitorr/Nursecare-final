// Mock user data for demo purposes
const users = {
    admin: { 
        password: 'admin123', 
        role: 'admin',
        name: 'Admin User',
        permissions: ['create_user', 'edit_user', 'delete_user', 'manage_roles', 'manage_settings', 'view_all_reports']
    },
    nurse: { 
        password: 'nurse123', 
        role: 'nurse',
        name: 'Anna Sigurðardóttir',
        permissions: ['manage_patients', 'manage_medications', 'view_reports']
    },
    staff: { 
        password: 'staff123', 
        role: 'staff',
        name: 'Jón Jónsson',
        permissions: ['view_patients', 'view_schedule']
    },
    inventory: {
        password: 'inventory123',
        role: 'inventory',
        name: 'Sara Björnsdóttir',
        permissions: ['manage_inventory', 'manage_medications', 'view_reports']
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginButton = loginForm.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = loginForm.username.value;
        const password = loginForm.password.value;

        // Disable button and show loading state
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        errorMessage.style.display = 'none';

        try {
            // In a real app, this would be an API call
            if (users[username] && users[username].password === password) {
                // Store user data in localStorage
                const userData = {
                    username,
                    name: users[username].name,
                    role: users[username].role,
                    permissions: users[username].permissions,
                    exp: Date.now() + (8 * 60 * 60 * 1000) // 8 hour expiration
                };

                localStorage.setItem('authToken', btoa(JSON.stringify(userData)));
                localStorage.setItem('userRole', users[username].role);
                localStorage.setItem('userName', users[username].name);
                localStorage.setItem('userPermissions', JSON.stringify(users[username].permissions));

                // Redirect to dashboard
                window.location.href = '/pages/dashboard.html';
            } else {
                throw new Error('Invalid username or password');
            }
        } catch (error) {
            // Show error message
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            
            // Reset button state
            loginButton.disabled = false;
            loginButton.textContent = 'Log In';
        }
    });

    // Clear any existing auth data on login page load
    localStorage.clear();
});