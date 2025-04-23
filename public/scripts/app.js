// Core application functionality
const app = {
    init() {
        this.setupTheme();
        this.setupNotifications();
        this.setupUserProfile();
        this.updateDateTime();
        
        // Update date/time every minute
        setInterval(() => this.updateDateTime(), 60000);
    },

    setupTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            });

            // Apply saved theme
            if (localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark-mode');
            }
        }
    },

    setupNotifications() {
        const notificationsBtn = document.getElementById('notifications-btn');
        const notificationsMenu = document.getElementById('notifications-menu');
        
        if (notificationsBtn && notificationsMenu) {
            notificationsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationsMenu.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!notificationsMenu.contains(e.target)) {
                    notificationsMenu.classList.remove('show');
                }
            });
        }
    },

    setupUserProfile() {
        const profileBtn = document.getElementById('profile-btn');
        const profileMenu = document.getElementById('profile-menu');
        
        if (profileBtn && profileMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!profileMenu.contains(e.target)) {
                    profileMenu.classList.remove('show');
                }
            });
        }
    },

    updateDateTime() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            dateElement.textContent = now.toLocaleDateString('is-IS', options);
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());