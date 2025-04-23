// Main application entry point
import { initializeUI } from './init.js';
import { initializeCharts, updateChartsForTheme } from './charts.js';
import { chatbot } from './chatbot.js';
import { showToast, showLoading, hideLoading } from './utils.js';
import { checkAuthorization, setupNavigation } from './auth.js';

// Initialize all dashboard components
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Initializing dashboard components...');
        
        // Check authorization first
        const currentPage = window.location.pathname.split('/').pop()?.replace('.html', '');
        if (!checkAuthorization(currentPage)) {
            return;
        }
        
        // Setup navigation based on user role
        setupNavigation();
        
        // Initialize core UI components
        initializeUI();
        
        // Initialize charts with loading state
        const chartLoading = showLoading('Sæki gögn fyrir gröf...');
        await initializeCharts();
        hideLoading(chartLoading);
        
        // Initialize action buttons
        initializeActionButtons();
        
        // Initialize refresh buttons
        initializeRefreshButtons();
        
        showToast('Tilbúið', 'Kerfi er tilbúið', 'success');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showToast('Villa', 'Villa kom upp við að hlaða kerfi', 'error');
    }
});

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
                this.disabled = true;
                showToast(config.title, config.loadingMsg, 'info');

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                showToast(config.title, config.successMsg, 'success');

            } catch (error) {
                console.error(`Error in ${id}:`, error);
                showToast('Villa', 'Villa kom upp við að framkvæma aðgerð', 'error');
            } finally {
                this.disabled = false;
            }
        });
    });
}

// Refresh buttons initialization
function initializeRefreshButtons() {
    const refreshButtons = {
        'refresh-overview': { title: 'Yfirlit', action: refreshOverview },
        'refresh-charts': { title: 'Tölfræði', action: updateChartsForTheme },
        'refresh-insights': { title: 'AI Innsýn', action: refreshInsights },
        'refresh-performance': { title: 'Árangur', action: refreshPerformance }
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
                const icon = this.querySelector('i');
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

// Refresh AI insights
async function refreshInsights() {
    // Simulate API call to get new insights
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const insights = [
        'Starfsmenn eru að vinna 15% hraðar en síðasta vika',
        'Birgðir af handklæðum munu tæmast á 3 daga ef ekki pantað',
        'Sjúklingur #12 sýnir bættan svefnmynstur',
        'Vaktaskipting er ójöfn milli deilda'
    ];
    
    const insightsContainer = document.getElementById('ai-insights');
    if (insightsContainer) {
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

// Refresh performance data
async function refreshPerformance() {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update performance metrics
    const metrics = document.querySelectorAll('.performance-metric');
    metrics.forEach(metric => {
        const value = metric.querySelector('.metric-value');
        if (value) {
            const currentValue = parseInt(value.textContent);
            const newValue = currentValue + Math.floor(Math.random() * 5) - 2;
            value.textContent = `${Math.max(0, newValue)}%`;
        }
    });
}