import { 
    initializeCharts, 
    initializeAIChat, 
    addMessageToChat,
    loadInventoryItems,
    initializeScrollToTop,
    updateChartsForTheme
} from './dashboard.js';

// Initialize all dashboard components
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Initializing dashboard components...');
        
        // Core UI initialization
        initializeDateDisplay();
        initializeThemeToggle();
        initializeSidebar();
        
        // Initialize scroll to top functionality
        initializeScrollToTop();
        
        // Initialize charts with loading state
        showToast('Hleð', 'Sæki gögn fyrir gröf...', 'info');
        await initializeCharts();
        
        // Initialize AI chat with loading state
        showToast('Hleð', 'Tengist gervigreind...', 'info');
        await initializeAIChat();
        
        // Add welcome message
        addMessageToChat('assistant', 'Velkomin/n í hjúkrunarheimilið! Hvernig get ég aðstoðað þig í dag?');
        
        // Initialize remaining components
        await loadInventoryItems();
        initializeNotifications();
        initializeActionButtons();
        
        console.log('Dashboard initialization complete');
        showToast('Tilbúið', 'Mælaborð er tilbúið', 'success');
        
        // Initialize AI Widget properly
        const ai = DashboardAI.getInstance();
        window.DashboardAI = DashboardAI; // Make it globally available if needed
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showToast('Villa', 'Villa kom upp við að hlaða mælaborði', 'error');
    }

    // Initialize AI Widget
    DashboardAI.getInstance();
});

// Date display initialization
function initializeDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('is-IS', options);
}

// Theme toggle initialization
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        if (isDarkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        
        // Update charts for theme
        updateChartsForTheme(isDarkMode);
        
        // Show toast notification
        showToast(
            'Þema', 
            isDarkMode ? 'Dökkt þema virkjað' : 'Ljóst þema virkjað', 
            'info'
        );
    });
}

// Sidebar initialization
function initializeSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (!sidebarToggle || !sidebar) return;
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
    });
}

// Notifications initialization
function initializeNotifications() {
    const notificationBtn = document.getElementById('notification-btn');
    if (!notificationBtn) return;

    notificationBtn.addEventListener('click', function() {
        showToast('Tilkynningar', '3 ólesnar tilkynningar', 'info');
        setTimeout(() => {
            const count = notificationBtn.querySelector('.notification-count');
            if (count) {
                count.textContent = '0';
                count.style.display = 'none';
            }
        }, 1000);
    });
}

// Action buttons initialization
function initializeActionButtons() {
    const buttons = {
        'approve-staffing': {
            title: 'Mönnun',
            successMsg: 'Beiðni um viðbótarstarfsmann samþykkt',
            loadingMsg: 'Vinn beiðni...'
        },
        'generate-report': {
            title: 'Skýrsla',
            successMsg: 'Vaktaskýrsla tilbúin',
            loadingMsg: 'Bý til skýrslu...'
        },
        'view-inventory': {
            title: 'Birgðir',
            successMsg: 'Birgðalisti uppfærður',
            loadingMsg: 'Sæki birgðalista...'
        }
    };

    Object.entries(buttons).forEach(([id, config]) => {
        const btn = document.getElementById(id);
        if (!btn) return;

        btn.addEventListener('click', async function() {
            try {
                // Show loading state
                this.disabled = true;
                showToast(config.title, config.loadingMsg, 'info');

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Show success
                showToast(config.title, config.successMsg, 'success');
            } catch (error) {
                console.error(`Error in ${id}:`, error);
                showToast('Villa', 'Villa kom upp við að framkvæma aðgerð', 'error');
            } finally {
                this.disabled = false;
            }
        });
    });

    // Initialize refresh buttons
    initializeRefreshButtons();
}

// Enhanced refresh buttons
function initializeRefreshButtons() {
    const refreshButtons = {
        'refresh-overview': { title: 'Yfirlit', action: refreshOverview },
        'refresh-charts': { title: 'Tölfræði', action: updateCharts },
        'refresh-insights': { title: 'AI Innsýn', action: refreshInsights },
        'refresh-performance': { title: 'Árangur', action: updatePerformanceChart }
    };

    Object.entries(refreshButtons).forEach(([id, config]) => {
        const btn = document.getElementById(id);
        if (!btn) return;

        btn.addEventListener('click', async function() {
            try {
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-spin');
                }
                this.disabled = true;

                showToast(config.title, `Uppfæri ${config.title.toLowerCase()}...`, 'info');
                await config.action();
                showToast(config.title, `${config.title} uppfært`, 'success');

            } catch (error) {
                console.error(`Error refreshing ${config.title}:`, error);
                showToast('Villa', `Villa kom upp við að uppfæra ${config.title.toLowerCase()}`, 'error');
            } finally {
                if (icon) {
                    icon.classList.remove('fa-spin');
                }
                this.disabled = false;
            }
        });
    });
}

// Refresh overview data
async function refreshOverview() {
    // Simulate API call to refresh overview data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update overview cards with new data
    const cards = document.querySelectorAll('.overview-card');
    cards.forEach(card => {
        const valueElement = card.querySelector('.card-value');
        if (valueElement) {
            // Generate a random value for demonstration
            const currentValue = parseInt(valueElement.textContent);
            const newValue = currentValue + Math.floor(Math.random() * 10) - 5;
            valueElement.textContent = newValue > 0 ? newValue : 0;
        }
    });
}

// Update all charts
async function updateCharts() {
    // Simulate API call to refresh chart data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Re-initialize charts with new data
    await initializeCharts();
}

// Refresh AI insights
async function refreshInsights() {
    // Simulate API call to refresh AI insights
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update insights with new data
    const insightsContainer = document.getElementById('ai-insights');
    if (insightsContainer) {
        const insights = [
            'Starfsmenn eru að vinna 15% hraðar en síðasta vika',
            'Birgðir af handklæðum munu tæmast á 3 daga ef ekki pantað',
            'Sjúklingur #12 sýnir bættan svefnmynstur',
            'Vaktaskipting er ójöfn milli deilda'
        ];
        
        // Clear existing insights
        insightsContainer.innerHTML = '';
        
        // Add new insights
        insights.forEach(insight => {
            const insightElement = document.createElement('div');
            insightElement.className = 'insight-item';
            insightElement.innerHTML = `
                <i class="fas fa-lightbulb"></i>
                <span>${insight}</span>
            `;
            insightsContainer.appendChild(insightElement);
        });
    }
}

// Update performance chart
async function updatePerformanceChart() {
    // Simulate API call to refresh performance data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update performance chart with new data
    const performanceChart = document.getElementById('performance-chart');
    if (performanceChart) {
        // This is a placeholder - in a real app, you would update the chart with new data
        console.log('Performance chart updated');
    }
}

// Toast notification function
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon;
    switch (type) {
        case 'success': icon = 'fa-check-circle'; break;
        case 'error': icon = 'fa-times-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        default: icon = 'fa-info-circle';
    }
    
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
    
    toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
    }
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode === toastContainer) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// AI Widget Implementation
class DashboardAI {
    static instance = null;

    constructor() {
        if (DashboardAI.instance) {
            return DashboardAI.instance;
        }
        
        this.form = document.getElementById('ai-form');
        this.input = document.getElementById('ai-input');
        this.output = document.getElementById('ai-output');
        this.isProcessing = false;
        
        DashboardAI.instance = this;
        this.initializeEventListeners();
        
        return this; // Ensure we return the instance
    }

    static getInstance() {
        if (!DashboardAI.instance) {
            DashboardAI.instance = new DashboardAI();
        }
        return DashboardAI.instance;
    }

    // Add static method for direct access
    static async processMessage(message) {
        const instance = DashboardAI.getInstance();
        return instance.processUserMessage(message);
    }

    async processUserMessage(message) {
        if (this.isProcessing) {
            throw new Error('Already processing a message');
        }

        try {
            this.isProcessing = true;
            return await this.sendToAI(message);
        } finally {
            this.isProcessing = false;
        }
    }

    initializeEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isProcessing) return;
        
        const message = this.input.value.trim();
        if (!message) return;

        try {
            this.isProcessing = true;
            this.input.disabled = true;
            this.showTypingIndicator();

            const response = await this.processUserMessage(message);
            this.displayResponse(response);
            this.input.value = '';

        } catch (error) {
            console.error('AI Error:', error);
            this.displayError();
        } finally {
            this.isProcessing = false;
            this.input.disabled = false;
            this.input.focus();
            this.hideTypingIndicator();
        }
    }

    async sendToAI(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: message }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.response;
    }

    showTypingIndicator() {
        this.output.innerHTML = '<div class="typing-indicator">AI is thinking...</div>';
    }

    hideTypingIndicator() {
        const indicator = this.output.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }

    displayResponse(response) {
        this.output.textContent = response;
    }

    displayError() {
        this.output.innerHTML = `
            <div class="error-message">
                Sorry, something went wrong. Please try again.
            </div>
        `;
    }
}

// Export both the class and a singleton instance
export const dashboardAI = DashboardAI.getInstance();
export { DashboardAI };