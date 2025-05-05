import { validateSession, logout } from './auth.js';
import { generateShiftReport } from './ai.js';
import { initDashboardCharts } from './dashboard-charts.js';

console.log('Dashboard Module Loaded');

window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', { msg, url, lineNo, columnNo, error });
    return false;
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing dashboard...');
    
    if (!validateSession()) {
        console.warn("Session validation failed, redirecting to login");
        return;
    }

    initializeDashboard();
});

function initializeDashboard() {
    console.log("Dashboard initialization started");
    setupButtons();
    setupNavigation();
    setupWelcomeMessage();
    setupAIFeatures();
    setupLogout();
    setupCharts();
    console.log("Dashboard initialization completed");
}

function setupButtons() {
    console.log('Setting up dashboard buttons...');
    const buttons = {
        'refresh-stats-btn': refreshStats,
        'view-medications-btn': viewMedications,
        'refresh-alerts-btn': refreshAlerts,
        'update-inventory-btn': updateInventory,
        'create-handover-btn': createHandover,
        'view-shift-btn': viewShift,
        'handover-btn': handleHandover,
        'clear-alerts-btn': clearAlerts,
        'open-ai-chat-btn': openAIChat,
        'generate-ai-report': generateAIReport,
        'refresh-health-chart-btn': refreshHealthChart,
        'health-options-btn': showHealthOptions,
        'create-schedule-btn': createSchedule,
        'add-staff-btn': addStaff,
        'update-all-inventory-btn': updateAllInventory,
        'ask-ai-btn': askAI,
        'scroll-top-btn': scrollToTop
    };

    for (const [id, handler] of Object.entries(buttons)) {
        const button = document.getElementById(id);
        if (button) {
            console.debug(`Adding event listener for button: ${id}`);
            button.addEventListener('click', () => {
                console.log(`Button clicked: ${id}`);
                handler();
            });
        } else {
            console.warn(`Button not found: ${id}`);
        }
    }
    console.log('All dashboard buttons initialized');
}

function setupNavigation() {
    console.log('Setting up navigation...');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            console.log('Toggling sidebar');
            sidebar.classList.toggle('expanded');
        });
    } else {
        console.warn('Navigation elements not found');
    }
}

function setupWelcomeMessage() {
    console.log('Setting up welcome message...');
    const userName = localStorage.getItem('username') || 'Anna';
    const userRole = localStorage.getItem('userRole') || 'Vaktstjóri';
    const greetingElement = document.querySelector('.greeting-message');
    
    if (greetingElement) {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Góðan daginn' : hour < 18 ? 'Góðan dag' : 'Gott kvöld';
        greetingElement.textContent = `${greeting}, ${userName} – þú ert á morgunvaktinni í dag. 🌤️`;
        console.debug(`Welcome message set for ${userName}`);
    } else {
        console.warn('Greeting element not found');
    }
}

function setupCharts() {
    console.log('Setting up charts...');
    try {
        // Only initialize if containers exist
        if (document.getElementById('medicationChart') || document.getElementById('inventoryChart') || document.getElementById('patientHealthChart')) {
            initDashboardCharts();
            console.debug('Charts loaded successfully');
        } else {
            console.warn('No chart containers found in DOM');
        }
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

function setupAIFeatures() {
    console.log('Setting up AI features...');
    const reportButton = document.getElementById('generate-ai-report');
    if (reportButton) {
        reportButton.addEventListener('click', () => {
            console.log('AI report button clicked');
            generateAIReport();
        });
    }
}

function setupLogout() {
    console.log('Setting up logout functionality...');
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logging out...');
            logout();
        });
        console.debug('Logout button initialized');
    } else {
        console.warn('Logout button not found');
    }
}

async function generateAIReport() {
    console.log('Generating AI report...');
    const outputDiv = document.getElementById('ai-output') || createAIOutputDiv();
    
    try {
        outputDiv.innerHTML = '<div class="loading">Generating report...</div>';
        const summary = await generateShiftReport();
        outputDiv.innerHTML = `<div class="ai-summary">${summary}</div>`;
        console.debug('AI report generated successfully');
    } catch (error) {
        console.error('Error generating report:', error);
        outputDiv.innerHTML = `<div class="error">Error generating report: ${error.message}</div>`;
    }
}

function createAIOutputDiv() {
    console.log('Creating AI output container...');
    const container = document.createElement('div');
    container.id = 'ai-output';
    container.className = 'ai-output-container';
    
    const aiSection = document.querySelector('.ai-insight-section');
    if (aiSection) {
        aiSection.appendChild(container);
    } else {
        document.querySelector('.main-content').appendChild(container);
    }
    console.debug('AI output container created');
    return container;
}

// Dashboard action handlers
function refreshStats() {
    console.log('Refreshing dashboard stats...');
    // Show a success toast to indicate the action was performed
    showToast('Tölfræði uppfærð', 'Tölfræðilegar upplýsingar hafa verið uppfærðar.', 'success');
}

function viewMedications() {
    console.log('Opening medications view...');
    window.location.href = '/medications';
}

function refreshAlerts() {
    console.log('Refreshing alerts...');
    showToast('Viðvaranir uppfærðar', 'Allar viðvaranir hafa verið uppfærðar.', 'info');
}

function updateInventory() {
    console.log('Updating inventory...');
    showToast('Birgðir uppfærðar', 'Birgðaupplýsingar hafa verið uppfærðar.', 'success');
}

function createHandover() {
    console.log('Creating handover report...');
    showToast('Skýrsla búin til', 'Vaktaskiptaskýrsla hefur verið búin til.', 'success');
}

function viewShift() {
    console.log('Opening shift overview...');
    window.location.href = '/schedule';
}

function handleHandover() {
    console.log('Handling shift handover...');
    showToast('Vaktaskipti', 'Vaktaskipti hafa verið skráð.', 'info');
}

function clearAlerts() {
    console.log('Clearing all alerts...');
    const alertItems = document.querySelectorAll('.alert-item');
    alertItems.forEach(item => {
        item.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            item.remove();
        }, 300);
    });
    showToast('Viðvaranir hreinsaðar', 'Allar viðvaranir hafa verið hreinsaðar.', 'success');
}

function openAIChat() {
    console.log('Opening AI chat interface...');
    const aiWidget = document.getElementById('ai-widget-container');
    if (aiWidget) {
        aiWidget.classList.add('open');
    } else {
        console.warn('AI widget container not found');
    }
}

function refreshHealthChart() {
    console.log('Refreshing health chart...');
    showToast('Heilsufarsgögn uppfærð', 'Heilsufarsgögn sjúklinga hafa verið uppfærð.', 'info');
}

function showHealthOptions() {
    console.log('Showing health chart options...');
    // Implementation would go here
}

function createSchedule() {
    console.log('Creating schedule...');
    window.location.href = '/schedule?action=create';
}

function addStaff() {
    console.log('Adding staff member...');
    window.location.href = '/staff?action=add';
}

function updateAllInventory() {
    console.log('Updating all inventory...');
    window.location.href = '/inventory?action=update';
}

function askAI() {
    console.log('Opening AI assistant...');
    openAIChat();
}

function scrollToTop() {
    console.log('Scrolling to top...');
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Helper function to show toast notifications
function showToast(title, message, type = 'info') {
    console.log(`Showing toast: ${title} - ${message} (${type})`);
    
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const iconClass = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Close notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add close event listener
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}