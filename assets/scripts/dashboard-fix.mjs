/**
 * NurseCare AI Dashboard - Fix Script
 * Adds missing event listeners and ensures charts are properly initialized
 * IMPORTANT: This script does NOT modify AI or chatbot functionality
 */

// Import functions from dashboard.js
import { initializeCharts, showToast, initializeMedicationChart, initializeInventoryChart } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard fix script loaded');
    
    // Initialize dashboard components
    initializeUI();
    initializeActionButtons();
    initializeCharts();
    initializeHealthChart();
    initializeCountdown();
    setupScrollToTop();
    
    // After a slight delay, hide the loading overlays
    setTimeout(hideChartLoaders, 1500);
});

/**
 * Initialize basic UI interactions
 */
function initializeUI() {
    // Toggle notifications dropdown
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', function() {
            notificationsMenu.classList.toggle('show');
        });
    }
    
    // Toggle profile dropdown
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', function() {
            profileMenu.classList.toggle('show');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        if (notificationsMenu && !notificationsBtn.contains(event.target) && !notificationsMenu.contains(event.target)) {
            notificationsMenu.classList.remove('show');
        }
        
        if (profileMenu && !profileBtn.contains(event.target) && !profileMenu.contains(event.target)) {
            profileMenu.classList.remove('show');
        }
    });
    
    // Toggle sidebar
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', function() {
            sidebar.classList.toggle('expanded');
        });
    }
    
    // Toggle dark mode
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
            showToast('Þema', 
                document.body.classList.contains('dark-mode') ? 
                'Dökkt þema virkjað' : 'Ljóst þema virkjað', 
                'info');
        });
    }
}

/**
 * Initialize all action buttons on the dashboard
 */
function initializeActionButtons() {
    // Object mapping button IDs to their actions
    const buttons = {
        // Header buttons
        'view-shift-btn': function() {
            showToast('Vakt', 'Skoða yfirlit vaktar', 'info');
            scrollToElement('#countdown-timer');
        },
        'handover-btn': function() {
            showToast('Vaktaskipti', 'Vaktaskipti virkjuð', 'info');
        },
        
        // Card action buttons
        'refresh-tasks-btn': function() {
            showToast('Verkefni', 'Verkefnalisti uppfærður', 'success');
            animateRefreshButton(this);
        },
        'refresh-stats-btn': function() {
            showToast('Yfirlit', 'Yfirlit uppfært', 'success');
            const progressBar = document.querySelector('.tasks-progress .progress-bar');
            if (progressBar) {
                // Random progress between 80% and 95%
                const progress = Math.floor(Math.random() * 15) + 80;
                progressBar.style.width = progress + '%';
            }
        },
        'view-all-staff-btn': function() {
            window.location.href = 'staff.html';
        },
        'refresh-medication-btn': function() {
            showToast('Lyfjaskráning', 'Lyfjaskráning uppfærð', 'success');
            refreshMedicationChart();
            animateRefreshButton(this);
        },
        'view-medications-btn': function() {
            window.location.href = 'medications.html';
        },
        'refresh-alerts-btn': function() {
            showToast('Viðvaranir', 'Viðvaranir uppfærðar', 'success');
            animateRefreshButton(this);
        },
        'clear-alerts-btn': function() {
            showToast('Viðvaranir', 'Viðvaranir hreinsaðar', 'success');
            const alerts = document.querySelectorAll('.alert-item');
            alerts.forEach(alert => {
                alert.style.opacity = '0.5';
                alert.style.textDecoration = 'line-through';
            });
        },
        'refresh-inventory-btn': function() {
            showToast('Birgðir', 'Birgðir uppfærðar', 'success');
            refreshInventoryChart();
            animateRefreshButton(this);
        },
        'update-inventory-btn': function() {
            showToast('Birgðir', 'Birgðaskráning uppfærð', 'success');
        },
        'view-schedule-btn': function() {
            window.location.href = 'schedule.html';
        },
        'create-handover-btn': function() {
            showToast('Skýrsla', 'Skýrsla fyrir afhendingu tilbúin', 'success');
        },
        'refresh-ai-btn': function() {
            showToast('AI', 'AI upplýsingar uppfærðar', 'success');
            animateRefreshButton(this);
        },
        'open-ai-chat-btn': function() {
            // Toggle chat widget visibility
            const widgetContainer = document.getElementById('ai-widget-container');
            if (widgetContainer) {
                widgetContainer.style.display = 'flex';
                
                // Focus input field
                setTimeout(() => {
                    const input = document.getElementById('ai-widget-input');
                    if (input) input.focus();
                }, 300);
            }
        },
        
        // Health chart buttons
        'refresh-health-chart-btn': function() {
            showToast('Heilsufar', 'Heilsufarsgögn uppfærð', 'success');
            refreshHealthChart();
            animateRefreshButton(this);
        },
        'health-options-btn': function() {
            showToast('Stillingar', 'Heilsufars stillingar', 'info');
        },
        
        // Quick action buttons
        'create-schedule-btn': function() {
            showToast('Vaktaáætlun', 'Vaktaáætlun tilbúin', 'success');
            window.location.href = 'schedule.html';
        },
        'add-staff-btn': function() {
            showToast('Starfsfólk', 'Bæta við starfsmanni', 'info');
            window.location.href = 'staff.html?action=add';
        },
        'update-all-inventory-btn': function() {
            showToast('Birgðir', 'Uppfæra allar birgðir', 'info');
            window.location.href = 'inventory.html';
        },
        'ask-ai-btn': function() {
            // Toggle chat widget visibility
            const widgetContainer = document.getElementById('ai-widget-container');
            if (widgetContainer) {
                widgetContainer.style.display = 'flex';
                
                // Focus input field
                setTimeout(() => {
                    const input = document.getElementById('ai-widget-input');
                    if (input) input.focus();
                }, 300);
            }
        }
    };
    
    // Add event listeners to all buttons
    Object.entries(buttons).forEach(([id, action]) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', action);
        }
    });
}

/**
 * Initialize health chart
 */
function initializeHealthChart() {
    const ctx = document.getElementById('patientHealthChart');
    if (!ctx) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    // Check if chart already exists
    if (window.healthChart && typeof window.healthChart.destroy === 'function') {
        window.healthChart.destroy();
    }
    
    // Last 7 days
    const days = ['Sun', 'Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau'];
    const today = new Date().getDay();
    const labels = Array(7).fill(0).map((_, i) => days[(today - 6 + i + 7) % 7]);
    
    window.healthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Meðalhiti (°C)',
                    data: [36.8, 36.7, 36.9, 37.1, 36.9, 36.7, 36.8],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Meðal púls (slög/mín)',
                    data: [72, 74, 78, 82, 79, 76, 75],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            animation: {
                duration: 750
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Hiti (°C)',
                        color: textColor
                    },
                    min: 36,
                    max: 38,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    }
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Púls (slög/mín)',
                        color: textColor
                    },
                    min: 60,
                    max: 100,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        display: false
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

/**
 * Refresh medication chart with new data
 */
function refreshMedicationChart() {
    // Show loader
    const loader = document.getElementById('medication-chart-loader');
    if (loader) loader.style.display = 'flex';
    
    // Random percentage between 75% and 95%
    const given = Math.floor(Math.random() * 20) + 75;
    const remaining = 100 - given;
    
    setTimeout(() => {
        if (window.medicationChart) {
            window.medicationChart.data.datasets[0].data = [given, remaining];
            window.medicationChart.options.plugins.doughnutCenterText.text = given + '%';
            window.medicationChart.update();
            
            // Update text below chart
            const medText = document.querySelector('.card:has(#medicationChart) p strong');
            if (medText) {
                medText.textContent = given + '% lyf';
            }
        }
        
        // Hide loader
        if (loader) loader.style.display = 'none';
    }, 800);
}

/**
 * Refresh inventory chart with new data
 */
function refreshInventoryChart() {
    // Show loader
    const loader = document.getElementById('inventory-chart-loader');
    if (loader) loader.style.display = 'flex';
    
    setTimeout(() => {
        if (window.inventoryChart) {
            // Random data for inventory items
            const data = [
                Math.floor(Math.random() * 30) + 10,   // Hanskar (critically low)
                Math.floor(Math.random() * 30) + 70,   // Grímur
                Math.floor(Math.random() * 30) + 30,   // Sprautur
                Math.floor(Math.random() * 30) + 70,   // Sáraumbúðir
                Math.floor(Math.random() * 50) + 90    // Spritt
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
        
        // Hide loader
        if (loader) loader.style.display = 'none';
    }, 800);
}

/**
 * Refresh health chart with new data
 */
function refreshHealthChart() {
    // Show loader
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
        
        // Hide loader
        if (loader) loader.style.display = 'none';
    }, 800);
}

/**
 * Refresh all charts
 */
function refreshAllCharts() {
    refreshMedicationChart();
    refreshInventoryChart();
    refreshHealthChart();
}

/**
 * Initialize countdown timer to next shift
 */
function initializeCountdown() {
    const countdownTimer = document.getElementById('countdown-timer');
    if (!countdownTimer) return;
    
    // Set target time to 15:00 today
    const now = new Date();
    const target = new Date(now);
    target.setHours(15, 0, 0, 0);
    
    // If it's past 15:00, set target to tomorrow
    if (now > target) {
        target.setDate(target.getDate() + 1);
    }
    
    // Update countdown every second
    function updateCountdown() {
        const now = new Date();
        const diff = target - now;
        
        // Calculate hours, minutes, seconds
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Format with leading zeros
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        
        // Update timer display
        countdownTimer.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
    
    // Initial update
    updateCountdown();
    
    // Update every second
    setInterval(updateCountdown, 1000);
}

/**
 * Hide chart loaders after initialization
 */
function hideChartLoaders() {
    const loaders = document.querySelectorAll('.loading-overlay');
    loaders.forEach(loader => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    });
}

/**
 * Set up scroll to top button
 */
function setupScrollToTop() {
    const scrollToTopButton = document.getElementById('scroll-to-top');
    if (!scrollToTopButton) return;
    
    // Show button when scrolled down
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopButton.classList.add('show');
        } else {
            scrollToTopButton.classList.remove('show');
        }
    });
    
    // Scroll to top when clicked
    scrollToTopButton.addEventListener('click', function() {
        window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
        });
    });
}

/**
 * Animate refresh button rotation
 * @param {HTMLElement} button - The button to animate
 */
function animateRefreshButton(button) {
    const icon = button.querySelector('i');
    if (icon) {
        icon.classList.add('fa-spin');
        setTimeout(() => {
            icon.classList.remove('fa-spin');
        }, 1000);
    }
}

/**
 * Scroll to an element smoothly
 * @param {string} selector - CSS selector for the target element
 */
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
} 