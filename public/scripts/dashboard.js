import { validateAuth } from './auth.js';
import { hasPermission } from './roles.js';

/**
 * NurseCare AI Dashboard JavaScript
 * Enhanced version with fixes for charts, buttons, and AI chat
 */

// Global state tracking
const dashboardState = {
    aiWidgetInitialized: false,
    chartsInitialized: false,
    isWaitingForResponse: false,
    chatHistory: []
};

// Core dashboard functionality
let healthChart, medicationChart, inventoryChart;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Verify authentication first
    if (!validateAuth()) return;
    
    // Initialize components
    initializeUI();
    initializeCharts();
    setupEventListeners();
    startCountdownTimer();
    
    // Load initial data
    await loadDashboardData();
});

// Initialize UI components
function initializeUI() {
    // Set current date
    const dateElement = document.getElementById('current-date');
    const currentDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${currentDate.toLocaleDateString('is-IS', options)}`;
    
    // Set user greeting
    const username = localStorage.getItem('username');
    const greetingElement = document.getElementById('greeting-heading');
    if (greetingElement && username) {
        const hour = currentDate.getHours();
        let greeting = 'Góðan dag';
        if (hour < 12) greeting = 'Góðan morgun';
        else if (hour < 18) greeting = 'Góðan dag';
        else greeting = 'Gott kvöld';
        
        greetingElement.textContent = `${greeting}, ${username} – þú ert á morgunvaktinni í dag. 🌤️`;
    }
    
    // Setup theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
        }
        
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Setup scroll to top button
    setupScrollToTop();
}

// Initialize charts
function initializeCharts() {
    initializeMedicationChart();
    initializeInventoryChart();
    initializeHealthChart();
}

// Setup scroll to top functionality
function setupScrollToTop() {
    const scrollBtn = document.getElementById('scroll-top-btn');
    if (!scrollBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Setup event listeners for all interactive elements
function setupEventListeners() {
    // Notifications dropdown
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', () => {
            notificationsMenu.classList.toggle('show');
        });
    }
    
    // Profile dropdown
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', () => {
            profileMenu.classList.toggle('show');
        });
    }
    
    // Sidebar toggle
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // AI Chat widget toggle
    const aiToggle = document.getElementById('ai-widget-toggle');
    const aiContainer = document.getElementById('ai-widget-container');
    if (aiToggle && aiContainer) {
        aiToggle.addEventListener('click', () => {
            aiContainer.classList.toggle('open');
        });
    }
    
    // Clear notifications
    const clearAllBtn = document.querySelector('.clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllNotifications);
    }
    
    // Handle all refresh buttons
    document.querySelectorAll('[id$="-refresh-btn"]').forEach(btn => {
        btn.addEventListener('click', () => refreshSection(btn.id));
    });
    
    // Setup quick action buttons
    setupQuickActions();
}

// Initialize countdown timer
function startCountdownTimer() {
    const timerElement = document.getElementById('countdown-timer');
    if (!timerElement) return;
    
    function updateTimer() {
        const now = new Date();
        const nextShift = new Date();
        nextShift.setHours(15, 0, 0); // Next shift at 15:00
        
        if (now >= nextShift) {
            nextShift.setDate(nextShift.getDate() + 1);
        }
        
        const diff = nextShift - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Show loading state
        showLoading();
        
        // Load data in parallel
        await Promise.all([
            loadTasksData(),
            loadStaffData(),
            loadMedicationData(),
            loadInventoryData(),
            loadAlertsData()
        ]);
        
        // Hide loading state
        hideLoading();
        
        // Update last updated timestamp
        updateLastUpdated();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Villa kom upp við að sækja gögn');
    }
}

// Theme toggle functionality
function toggleTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const isDark = document.body.classList.toggle('dark-mode');
    
    if (isDark) {
        localStorage.setItem('theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
    }
    
    // Update charts for new theme
    updateChartsTheme();
}

// Show loading overlay
function showLoading() {
    document.querySelectorAll('.card').forEach(card => {
        if (!card.querySelector('.loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading"></div>';
            card.appendChild(overlay);
        }
    });
}

// Hide loading overlay
function hideLoading() {
    document.querySelectorAll('.loading-overlay').forEach(overlay => {
        overlay.remove();
    });
}

// Update last updated timestamp
function updateLastUpdated() {
    const lastUpdated = document.querySelector('.last-updated');
    if (lastUpdated) {
        const now = new Date();
        const options = { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
        lastUpdated.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            Síðast uppfært: ${now.toLocaleDateString('is-IS', options)}
        `;
    }
}

// Show error message
function showError(message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">Villa</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    });
}

// Initialize basic UI interactions
function initializeUI() {
    initializeNotifications();
    initializeProfile();
    initializeSidebar();
    initializeTheme();
}

function initializeNotifications() {
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsMenu.classList.toggle('show');
        });
    }
}

function initializeProfile() {
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
        });
    }
    
    // Close menus when clicking outside
    document.addEventListener('click', function(event) {
        if (notificationsMenu && !notificationsBtn.contains(event.target) && !notificationsMenu.contains(event.target)) {
            notificationsMenu.classList.remove('show');
        }
        if (profileMenu && !profileBtn.contains(event.target) && !profileMenu.contains(event.target)) {
            profileMenu.classList.remove('show');
        }
    });
}

function initializeSidebar() {
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', function() {
            sidebar.classList.toggle('expanded');
        });
    }
}

function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            updateThemeIcon();
            refreshAllCharts();
        });
    }
}

function updateThemeIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');
    const text = themeToggle.querySelector('span');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        icon.classList.replace('fa-moon', 'fa-sun');
        text.textContent = 'Light Mode';
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        text.textContent = 'Dark Mode';
    }
}

// Chart initialization and management
function initializeCharts() {
    initializeMedicationChart();
    initializeInventoryChart();
}

function initializeHealthChart() {
    const ctx = document.getElementById('patientHealthChart');
    if (!ctx) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    // Check if chart already exists
    if (healthChart && typeof healthChart.destroy === 'function') {
        healthChart.destroy();
    }
    
    // Last 7 days
    const days = ['Sun', 'Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau'];
    const today = new Date().getDay();
    const labels = Array(7).fill(0).map((_, i) => days[(today - 6 + i + 7) % 7]);
    
    healthChart = new Chart(ctx, {
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

// Refresh chart functions
function refreshHealthChart() {
    const loader = document.getElementById('health-chart-loader');
    if (loader) loader.style.display = 'flex';
    
    setTimeout(() => {
        if (healthChart) {
            // Generate slightly different values for temperatures
            const temps = healthChart.data.datasets[0].data.map(temp => {
                // Random fluctuation of ±0.2
                return Math.round((temp + (Math.random() * 0.4 - 0.2)) * 10) / 10;
            });
            
            // Generate slightly different values for pulse
            const pulse = healthChart.data.datasets[1].data.map(pulse => {
                // Random fluctuation of ±3
                return Math.round(pulse + (Math.random() * 6 - 3));
            });
            
            healthChart.data.datasets[0].data = temps;
            healthChart.data.datasets[1].data = pulse;
            healthChart.update();
        }
        
        if (loader) loader.style.display = 'none';
    }, 800);
}

function refreshMedicationChart() {
    const loader = document.getElementById('medication-chart-loader');
    if (loader) loader.style.display = 'flex';
    
    const given = Math.floor(Math.random() * 20) + 75;
    const remaining = 100 - given;
    
    setTimeout(() => {
        if (medicationChart) {
            medicationChart.data.datasets[0].data = [given, remaining];
            medicationChart.options.plugins.doughnutCenterText.text = given + '%';
            medicationChart.update();
            
            const medText = document.querySelector('.card:has(#medicationChart) p strong');
            if (medText) {
                medText.textContent = given + '% lyf';
            }
        }
        
        if (loader) loader.style.display = 'none';
    }, 800);
}

function refreshInventoryChart() {
    const loader = document.getElementById('inventory-chart-loader');
    if (loader) loader.style.display = 'flex';
    
    setTimeout(() => {
        if (inventoryChart) {
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
            
            inventoryChart.data.datasets[0].data = data;
            inventoryChart.data.datasets[0].backgroundColor = colors;
            inventoryChart.update();
        }
        
        if (loader) loader.style.display = 'none';
    }, 800);
}

function refreshAllCharts() {
    refreshMedicationChart();
    refreshInventoryChart();
    refreshHealthChart();
}

// Initialize countdown timer
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

// UI Helpers
function hideChartLoaders() {
    const loaders = document.querySelectorAll('.loading-overlay');
    loaders.forEach(loader => {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    });
}

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

// Action button handlers
function initializeActionButtons() {
    const buttonActions = {
        'view-shift-btn': () => {
            showToast('Vakt', 'Skoða yfirlit vaktar', 'info');
            scrollToElement('#countdown-timer');
        },
        'handover-btn': () => {
            showToast('Vaktaskipti', 'Vaktaskipti virkjuð', 'info');
        },
        'refresh-tasks-btn': function() {
            showToast('Verkefni', 'Verkefnalisti uppfærður', 'success');
            animateRefreshButton(this);
        },
        'refresh-stats-btn': function() {
            showToast('Yfirlit', 'Yfirlit uppfært', 'success');
            updateRandomProgress();
        },
        'view-all-staff-btn': () => {
            window.location.href = 'staff.html';
        }
    };

    Object.entries(buttonActions).forEach(([id, action]) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', action);
    });
}

function showToast(title, message, type = 'info') {
    // Implementation of toast notifications
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-title">${title}</span>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-body">${message}</div>
    `;

    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function animateRefreshButton(button) {
    const icon = button.querySelector('i');
    if (icon) {
        icon.classList.add('fa-spin');
        setTimeout(() => {
            icon.classList.remove('fa-spin');
        }, 1000);
    }
}

function updateRandomProgress() {
    const progressBar = document.querySelector('.tasks-progress .progress-bar');
    if (progressBar) {
        const progress = Math.floor(Math.random() * 15) + 80;
        progressBar.style.width = progress + '%';
    }
}

export {
    initializeUI,
    initializeCharts,
    showToast,
    refreshMedicationChart,
    refreshInventoryChart,
    refreshHealthChart,
    refreshAllCharts
};

// Initialize AI Chat Widget
function initializeAIChat() {
    if (dashboardState.aiWidgetInitialized) return;
    
    const widgetToggle = document.getElementById('ai-widget-toggle');
    const widgetContainer = document.getElementById('ai-widget-container');
    const widgetInput = document.getElementById('ai-widget-input');
    const widgetSend = document.getElementById('ai-widget-send');
    const widgetMessages = document.getElementById('ai-widget-messages');
    const minimizeBtn = document.getElementById('ai-minimize-btn');
    const clearBtn = document.getElementById('ai-clear-btn');
    
    // If any of these elements don't exist, we can't initialize
    if (!widgetToggle || !widgetContainer || !widgetInput || !widgetSend || !widgetMessages) return;
    
    // Toggle widget visibility
    widgetToggle.addEventListener('click', function() {
        widgetContainer.classList.toggle('open');
        if (widgetContainer.classList.contains('open')) {
            setTimeout(() => {
                widgetInput.focus();
            }, 300);
        }
    });
    
    // Initialize AI chat in the sidebar menu
    const aiChatButton = document.querySelector('.nav-item a[href="chatbot.html"]');
    if (aiChatButton) {
        aiChatButton.addEventListener('click', function(e) {
            e.preventDefault();
            widgetContainer.classList.add('open');
            setTimeout(() => {
                widgetInput.focus();
            }, 300);
        });
    }
    
    // Handle open AI chat button
    const openAIChatBtn = document.getElementById('open-ai-chat-btn');
    if (openAIChatBtn) {
        openAIChatBtn.addEventListener('click', function() {
            widgetContainer.classList.add('open');
            setTimeout(() => {
                widgetInput.focus();
            }, 300);
        });
    }
    
    // Handle ask AI button in quick actions
    const askAIBtn = document.getElementById('ask-ai-btn');
    if (askAIBtn) {
        askAIBtn.addEventListener('click', function() {
            widgetContainer.classList.add('open');
            setTimeout(() => {
                widgetInput.focus();
            }, 300);
        });
    }
    
    // Minimize widget
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', function() {
            widgetContainer.classList.remove('open');
        });
    }
    
    // Clear chat button
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            widgetMessages.innerHTML = '';
            dashboardState.chatHistory = [];
            
            // Add welcome message
            addMessage('assistant', 'Góðan daginn! Ég er NurseCare AI aðstoðarmaðurinn þinn. Hvernig get ég aðstoðað þig í dag?');
            
            // Show toast notification
            showToast('Spjall', 'Spjallferill hreinsaður', 'info');
        });
    }
    
    // Process input when send button is clicked
    widgetSend.addEventListener('click', function() {
        processUserInput();
    });
    
    // Process input when Enter key is pressed
    widgetInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            processUserInput();
        }
    });
    
    // Enable/disable send button based on input content
    widgetInput.addEventListener('input', function() {
        widgetSend.disabled = this.value.trim() === '';
        
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    // Add welcome message if no messages already exist
    if (widgetMessages.children.length === 0) {
        addMessage('assistant', 'Góðan daginn! Ég er NurseCare AI aðstoðarmaðurinn þinn. Hvernig get ég aðstoðað þig í dag?');
    }
    
    // Mark as initialized
    dashboardState.aiWidgetInitialized = true;
    console.log('AI Chat widget initialized');
}

// Process user input from AI widget
function processUserInput() {
    const widgetInput = document.getElementById('ai-widget-input');
    const widgetSend = document.getElementById('ai-widget-send');
    
    if (!widgetInput || !widgetSend) return;
    
    const message = widgetInput.value.trim();
    if (!message || dashboardState.isWaitingForResponse) return;
    
    // Add user message to chat
    addMessage('user', message);
    
    // Clear input and disable send button
    widgetInput.value = '';
    widgetSend.disabled = true;
    
    // Reset input height if it's a textarea
    widgetInput.style.height = 'auto';
    
    // Show typing indicator
    addTypingIndicator();
    
    // Set waiting state
    dashboardState.isWaitingForResponse = true;
    
    // Get chat history
    const chatHistory = Array.from(document.querySelectorAll('.message')).map(msg => {
        const isUser = msg.classList.contains('user-message');
        const content = msg.querySelector('.message-text').textContent;
        return {
            role: isUser ? 'user' : 'assistant',
            content: content
        };
    });
    
    // Make API call to backend
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: chatHistory
        })
    })
    .then(response => response.json())
    .then(data => {
        removeTypingIndicator();
        if (data.success && data.response) {
            addMessageWithAnimation('assistant', data.response);
        } else {
            addMessage('assistant', 'Því miður kom upp villa við að meðhöndla beiðnina. Vinsamlegast reyndu aftur.');
        }
        dashboardState.isWaitingForResponse = false;
        widgetSend.disabled = false;
    })
    .catch(error => {
        console.error('Error:', error);
        removeTypingIndicator();
        addMessage('assistant', 'Því miður kom upp villa við að meðhöndla beiðnina. Vinsamlegast reyndu aftur.');
        dashboardState.isWaitingForResponse = false;
        widgetSend.disabled = false;
    });
}

// Add a message to the chat
function addMessage(sender, message) {
    const widgetMessages = document.getElementById('ai-widget-messages');
    if (!widgetMessages) return;
    
    // Create timestamp
    const now = new Date();
    const time = now.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' });
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `${sender}-message message`;
    
    if (sender === 'user') {
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${formatMessage(message)}</div>
                <div class="message-time">${time}</div>
            </div>
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
        `;
    } else {
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${formatMessage(message)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }
    
    // Add to messages container
    widgetMessages.appendChild(messageElement);
    
    // Save to chat history
    dashboardState.chatHistory.push({
        sender,
        message,
        time
    });
    
    // Scroll to bottom
    scrollChatToBottom();
}

// Add typing indicator
function addTypingIndicator() {
    const widgetMessages = document.getElementById('ai-widget-messages');
    if (!widgetMessages) return;
    
    // Create typing indicator element
    const typingElement = document.createElement('div');
    typingElement.className = 'typing-indicator';
    typingElement.innerHTML = '<span></span><span></span><span></span>';
    
    // Add to messages container
    widgetMessages.appendChild(typingElement);
    
    // Scroll to bottom
    scrollChatToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Simulate AI response (replace with actual API call in production)
function simulateAIResponse(userMessage) {
    // Determine response time based on message length (to simulate thinking)
    const responseTime = Math.max(1000, Math.min(userMessage.length * 20, 3000));
    
    setTimeout(() => {
        // Remove typing indicator
        removeTypingIndicator();
        
        // Generate a response based on the user message
        let response;
        
        if (userMessage.toLowerCase().includes('verkefni') || userMessage.toLowerCase().includes('task')) {
            response = 'Þú hefur 14 af 16 verkefnum lokið í dag. Næstu verkefni eru lyfjagjöf fyrir Maríu Ólafsdóttur kl. 14:00 og útbúa skýrslu fyrir vaktaskil kl. 15:00.';
        } else if (userMessage.toLowerCase().includes('lyf') || userMessage.toLowerCase().includes('medication')) {
            response = '82% af áætluðum lyfjagjöfum hafa verið framkvæmdar í dag. Það eru 3 lyfjagjafir eftir sem þarf að framkvæma fyrir vaktarlok.';
        } else if (userMessage.toLowerCase().includes('birgðir') || userMessage.toLowerCase().includes('inventory')) {
            response = 'Birgðir af hönskum eru í 15% (BRÁÐAVARA). Birgðir af grímum eru í 45% (VARÚÐ). Við mælum með að panta fleiri hanska sem fyrst.';
        } else if (userMessage.toLowerCase().includes('sjúklingar') || userMessage.toLowerCase().includes('patient')) {
            response = 'Það eru 18 sjúklingar á deildinni í dag. Jón Jónsson í herbergi 204 þarf sérstakt eftirlit vegna hækkaðs hjartsláttar. María Ólafsdóttir þarf lyfjagjöf kl. 14:00.';
        } else if (userMessage.toLowerCase().includes('starfsfólk') || userMessage.toLowerCase().includes('staff')) {
            response = 'Það eru 8 starfsmenn á vakt í dag: 3 hjúkrunarfræðingar, 2 aðstoðarfólk og 3 sjúkraliðar. Næsta vakt byrjar kl. 15:00 með 5 starfsmönnum.';
        } else if (userMessage.toLowerCase().includes('hjálp') || userMessage.toLowerCase().includes('help')) {
            response = 'Ég get aðstoðað þig með upplýsingar um verkefni, lyfjagjafir, birgðir, sjúklinga, starfsfólk og fleira. Er eitthvað sérstakt sem þú þarft aðstoð með?';
        } else {
            response = 'Ég skil. Get ég aðstoðað þig með eitthvað annað? Ég get gefið þér upplýsingar um verkefni dagsins, lyfjagjafir, birgðastöðu, sjúklinga eða starfsfólk á vakt.';
        }
        
        // Add AI response with typing animation
        addMessageWithAnimation('assistant', response);
        
        // Reset waiting state
        dashboardState.isWaitingForResponse = false;
    }, responseTime);
}

// Add message with typing animation
function addMessageWithAnimation(sender, message) {
    const widgetMessages = document.getElementById('ai-widget-messages');
    if (!widgetMessages) return;
    
    // Create timestamp
    const now = new Date();
    const time = now.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' });
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `${sender}-message message`;
    
    if (sender === 'assistant') {
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text"></div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }
    
    // Add to messages container
    widgetMessages.appendChild(messageElement);
    
    // Get message text element
    const messageTextElement = messageElement.querySelector('.message-text');
    
    // Animate typing
    let index = 0;
    const typingSpeed = 30; // milliseconds per character
    
    function typeNextChar() {
        if (index < message.length) {
            // Add the next character
            messageTextElement.innerHTML = formatMessage(message.substring(0, index + 1));
            index++;
            
            // Scroll to bottom
            scrollChatToBottom();
            
            // Schedule next character
            setTimeout(typeNextChar, typingSpeed);
        } else {
            // Typing complete
            // Save to chat history
            dashboardState.chatHistory.push({
                sender,
                message,
                time
            });
        }
    }
    
    // Start typing animation
    typeNextChar();
}

// Format message text
function formatMessage(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Scroll chat to bottom
function scrollChatToBottom() {
    const widgetMessages = document.getElementById('ai-widget-messages');
    if (widgetMessages) {
        widgetMessages.scrollTop = widgetMessages.scrollHeight;
    }
}

// Initialize dropdowns
function initializeDropdowns() {
    // Handle notifications dropdown
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsMenu.classList.toggle('show');
            
            // Close other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== notificationsMenu) {
                    menu.classList.remove('show');
                }
            });
        });
    }
    
    // Handle profile dropdown
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
            
            // Close other dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== profileMenu) {
                    menu.classList.remove('show');
                }
            });
        });
    }
    
    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', function(e) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    });
    
    // Prevent dropdown close when clicking inside
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
}

// Initialize notifications
function initializeNotifications() {
    // Handle clear all notifications button
    const clearAllBtn = document.querySelector('.clear-all');
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            // Clear unread status from all notifications
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            
            // Hide notification badge
            const badge = document.querySelector('.badge');
            if (badge) {
                badge.style.display = 'none';
            }
            
            // Show toast
            showToast('Tilkynningar', 'Allar tilkynningar merktar sem lesnar', 'success');
        });
    }
}

// Initialize buttons
function initializeButtons() {
    // View shift button
    const viewShiftBtn = document.getElementById('view-shift-btn');
    if (viewShiftBtn) {
        viewShiftBtn.addEventListener('click', function() {
            showToast('Vakt', 'Vaktaupplýsingar sóttar', 'info');
        });
    }
    
    // Handover button
    const handoverBtn = document.getElementById('handover-btn');
    if (handoverBtn) {
        handoverBtn.addEventListener('click', function() {
            showToast('Vaktaskipti', 'Vaktaskiptaskýrsla opnuð', 'info');
        });
    }
    
    // Refresh tasks button
    const refreshTasksBtn = document.getElementById('refresh-tasks-btn');
    if (refreshTasksBtn) {
        refreshTasksBtn.addEventListener('click', function() {
            this.querySelector('i').classList.add('fa-spin');
            
            setTimeout(() => {
                this.querySelector('i').classList.remove('fa-spin');
                showToast('Verkefni', 'Verkefnalisti uppfærður', 'success');
            }, 1000);
        });
    }
    
    // Refresh stats button
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uppfæri...';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-sync-alt"></i> Uppfæra yfirlit';
                showToast('Yfirlit', 'Tölfræði uppfærð', 'success');
            }, 1000);
        });
    }
    
    // View medications button
    const viewMedicationsBtn = document.getElementById('view-medications-btn');
    if (viewMedicationsBtn) {
        viewMedicationsBtn.addEventListener('click', function() {
            showToast('Lyfjaskráning', 'Sæki lyfjaskráningu', 'info');
        });
    }
    
    // Refresh alerts button
    const refreshAlertsBtn = document.getElementById('refresh-alerts-btn');
    if (refreshAlertsBtn) {
        refreshAlertsBtn.addEventListener('click', function() {
            this.querySelector('i').classList.add('fa-spin');
            
            setTimeout(() => {
                this.querySelector('i').classList.remove('fa-spin');
                showToast('Viðvaranir', 'Viðvaranir uppfærðar', 'success');
            }, 1000);
        });
    }
    
    // Clear alerts button
    const clearAlertsBtn = document.getElementById('clear-alerts-btn');
    if (clearAlertsBtn) {
        clearAlertsBtn.addEventListener('click', function() {
            document.querySelectorAll('.alert-item').forEach(item => {
                item.style.opacity = '0.5';
                item.style.textDecoration = 'line-through';
            });
            
            showToast('Viðvaranir', 'Viðvaranir hreinsaðar', 'success');
        });
    }
    
    // Update inventory button
    const updateInventoryBtn = document.getElementById('update-inventory-btn');
    if (updateInventoryBtn) {
        updateInventoryBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uppfæri...';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-sync-alt"></i> Uppfæra birgðir';
                
                // Update chart with new data
                if (window.inventoryChart) {
                    window.inventoryChart.data.datasets[0].data = [20, 50, 85, 40, 95];
                    window.inventoryChart.update();
                }
                
                showToast('Birgðir', 'Birgðastaða uppfærð', 'success');
            }, 1000);
        });
    }
    
    // Create handover button
    const createHandoverBtn = document.getElementById('create-handover-btn');
    if (createHandoverBtn) {
        createHandoverBtn.addEventListener('click', function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Bý til skýrslu...';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-file-alt"></i> Búa til skýrslu fyrir afhendingu';
                showToast('Skýrsla', 'Vaktaskiptaskýrsla útbúin', 'success');
            }, 2000);
        });
    }
    
    // Refresh health chart button
    const refreshHealthChartBtn = document.getElementById('refresh-health-chart-btn');
    if (refreshHealthChartBtn) {
        refreshHealthChartBtn.addEventListener('click', function() {
            this.querySelector('i').classList.add('fa-spin');
            
            setTimeout(() => {
                this.querySelector('i').classList.remove('fa-spin');
                
                // Update chart with new data
                if (window.patientHealthChart) {
                    window.patientHealthChart.data.datasets[0].data = [74, 78, 82, 88, 94, 88, 76];
                    window.patientHealthChart.data.datasets[1].data = [122, 124, 128, 125, 128, 126, 123];
                    window.patientHealthChart.data.datasets[2].data = [97, 96, 95, 96, 94, 95, 97];
                    window.patientHealthChart.update();
                }
                
                showToast('Heilsufarsmælingar', 'Mælingar uppfærðar', 'success');
            }, 1000);
        });
    }
    
    // Health options button
    const healthOptionsBtn = document.getElementById('health-options-btn');
    if (healthOptionsBtn) {
        healthOptionsBtn.addEventListener('click', function() {
            showToast('Stillingar', 'Stillingar heilsufarsmælinga opnaðar', 'info');
        });
    }
    
    // Quick action buttons
    const quickActionButtons = {
        'create-schedule-btn': 'Vaktaáætlun',
        'add-staff-btn': 'Starfsmaður',
        'update-all-inventory-btn': 'Birgðir',
        'ask-ai-btn': 'AI Aðstoðarmaður'
    };
    
    for (const [id, title] of Object.entries(quickActionButtons)) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', function() {
                if (id === 'ask-ai-btn') {
                    // Open AI chat widget
                    const widgetContainer = document.getElementById('ai-widget-container');
                    if (widgetContainer) {
                        widgetContainer.classList.add('open');
                        
                        // Focus input
                        const widgetInput = document.getElementById('ai-widget-input');
                        if (widgetInput) {
                            setTimeout(() => {
                                widgetInput.focus();
                            }, 300);
                        }
                    }
                } else {
                    // Show action-specific toast
                    let message;
                    
                    switch (id) {
                        case 'create-schedule-btn':
                            message = 'Vaktaáætlun í vinnslu...';
                            break;
                        case 'add-staff-btn':
                            message = 'Bæta við starfsmanni...';
                            break;
                        case 'update-all-inventory-btn':
                            message = 'Uppfæra allar birgðir...';
                            break;
                        default:
                            message = 'Aðgerð valin';
                    }
                    
                    showToast(title, message, 'info');
                }
            });
        }
    }
}

// Initialize scroll to top button
function initializeScrollToTop() {
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    
    if (scrollTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        });
        
        // Scroll to top when button is clicked
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Update countdown timer
function updateCountdownTimer() {
    const countdownTimer = document.getElementById('countdown-timer');
    
    if (!countdownTimer) return;
    
    // Set target time to 15:00 (3 PM) today
    const now = new Date();
    const targetTime = new Date(now);
    targetTime.setHours(15, 0, 0, 0);
    
    // If it's already past 15:00, set target to tomorrow
    if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
    }
    
    // Update timer
    function updateTimer() {
        const now = new Date();
        const timeDiff = targetTime - now;
        
        if (timeDiff <= 0) {
            // Timer has expired, reset to next day
            targetTime.setDate(targetTime.getDate() + 1);
            updateTimer();
            return;
        }
        
        // Calculate hours, minutes, seconds
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        // Format display
        const formattedTime = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
        
        // Update display
        countdownTimer.textContent = formattedTime;
        
        // Schedule next update
        setTimeout(updateTimer, 1000);
    }
    
    // Start timer
    updateTimer();
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Get icon based on type
    let icon;
    switch (type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-times-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    // Set toast content
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add close button event
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode === toastContainer) {
                toast.remove();
            }
        }, 300);
    }, 5000);
}