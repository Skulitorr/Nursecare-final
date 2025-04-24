// Converted from ES module and moved to public/scripts/
(function() {
    // Initialize basic UI interactions
    function initializeUI() {
        setupDropdowns();
        setupSidebar();
        setupThemeToggle();
        setupScrollToTop();
    }

    function setupDropdowns() {
        const notificationsBtn = document.getElementById('notifications-btn');
        const notificationsMenu = document.getElementById('notifications-menu');
        const profileBtn = document.getElementById('profile-btn');
        const profileMenu = document.getElementById('profile-menu');
        
        if (notificationsBtn && notificationsMenu) {
            notificationsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                notificationsMenu.classList.toggle('show');
            });
        }
        
        if (profileBtn && profileMenu) {
            profileBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                profileMenu.classList.toggle('show');
            });
        }
        
        document.addEventListener('click', function(event) {
            if (notificationsMenu && !notificationsBtn?.contains(event.target) && !notificationsMenu.contains(event.target)) {
                notificationsMenu.classList.remove('show');
            }
            if (profileMenu && !profileBtn?.contains(event.target) && !profileMenu.contains(event.target)) {
                profileMenu.classList.remove('show');
            }
        });
    }

    function setupSidebar() {
        const toggleSidebarBtn = document.getElementById('toggle-sidebar');
        const sidebar = document.querySelector('.sidebar');
        
        if (toggleSidebarBtn && sidebar) {
            toggleSidebarBtn.addEventListener('click', function() {
                sidebar.classList.toggle('expanded');
            });
        }
    }

    function setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                document.body.classList.toggle('dark-mode');
                
                const icon = themeToggle.querySelector('i');
                const text = themeToggle.querySelector('span');
                
                if (document.body.classList.contains('dark-mode')) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                    text.textContent = 'Light Mode';
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                    text.textContent = 'Dark Mode';
                }
                
                // Update charts for dark mode
                refreshAllCharts();
                
                // Show toast
                showToast('Theme', 
                    document.body.classList.contains('dark-mode') ? 
                    'Dark mode enabled' : 'Light mode enabled', 
                    'info');
            });
        }
    }

    function refreshAllCharts() {
        refreshMedicationChart();
        refreshInventoryChart();
        refreshHealthChart();
    }

    function refreshHealthChart() {
        const loader = document.getElementById('health-chart-loader');
        if (loader) loader.style.display = 'flex';
        
        setTimeout(() => {
            if (window.healthChart) {
                // Generate slightly different values for temperatures
                const temps = window.healthChart.data.datasets[0].data.map(temp => {
                    // Random fluctuation of ±0.2
                    return Math.round((temp + (Math.random() * 0.4 - 0.2)) * 10) / 10;
                });
                
                // Generate slightly different values for pulse
                const pulse = window.healthChart.data.datasets[1].data.map(pulse => {
                    // Random fluctuation of ±3
                    return Math.round(pulse + (Math.random() * 6 - 3));
                });
                
                window.healthChart.data.datasets[0].data = temps;
                window.healthChart.data.datasets[1].data = pulse;
                window.healthChart.update();
            }
            
            if (loader) loader.style.display = 'none';
        }, 800);
    }

    function refreshInventoryChart() {
        const loader = document.getElementById('inventory-chart-loader');
        if (loader) loader.style.display = 'flex';
        
        setTimeout(() => {
            if (window.inventoryChart) {
                // Random data for inventory items
                const data = [
                    Math.floor(Math.random() * 30) + 10,   // Gloves (critically low)
                    Math.floor(Math.random() * 30) + 70,   // Masks
                    Math.floor(Math.random() * 30) + 30,   // Syringes
                    Math.floor(Math.random() * 30) + 70,   // Bandages
                    Math.floor(Math.random() * 50) + 90    // Sanitizer
                ];
                
                // Update colors based on values
                const colors = data.map(value => {
                    if (value < 30) return '#ef4444'; // Critical (red)
                    if (value < 60) return '#f59e0b'; // Warning (yellow)
                    return '#10b981'; // Good (green)
                });
                
                window.inventoryChart.data.datasets[0].data = data;
                window.inventoryChart.data.datasets[0].backgroundColor = colors;
                window.inventoryChart.update();
            }
            
            if (loader) loader.style.display = 'none';
        }, 800);
    }

    function refreshMedicationChart() {
        const loader = document.getElementById('medication-chart-loader');
        if (loader) loader.style.display = 'flex';
        
        setTimeout(() => {
            if (window.medicationChart) {
                // Generate slightly different values for medications
                const data = window.medicationChart.data.datasets[0].data.map(value => {
                    // Random fluctuation of ±10%
                    return Math.max(0, Math.round(value * (1 + (Math.random() * 0.2 - 0.1))));
                });
                
                window.medicationChart.data.datasets[0].data = data;
                window.medicationChart.update();
            }
            
            if (loader) loader.style.display = 'none';
        }, 800);
    }

    function setupScrollToTop() {
        const scrollToTopButton = document.getElementById('scroll-to-top');
        if (!scrollToTopButton) return;
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                scrollToTopButton.classList.add('show');
            } else {
                scrollToTopButton.classList.remove('show');
            }
        });
        
        scrollToTopButton.addEventListener('click', function() {
            window.scrollTo({ 
                top: 0, 
                behavior: 'smooth' 
            });
        });
    }

    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon;
        switch(type) {
            case 'success': icon = 'check-circle'; break;
            case 'error': icon = 'times-circle'; break;
            case 'warning': icon = 'exclamation-triangle'; break;
            default: icon = 'info-circle';
        }
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${icon}"></i>
                <div class="toast-message">
                    <strong>${title}</strong>
                    <p>${message}</p>
                </div>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initialize everything when DOM is loaded
    document.addEventListener('DOMContentLoaded', initializeUI);

    // Export functions to window
    window.dashboardFixes = {
        refreshAllCharts,
        refreshHealthChart,
        refreshInventoryChart, 
        refreshMedicationChart,
        showToast
    };
})();