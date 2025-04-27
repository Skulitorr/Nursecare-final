import { validateSession, logout } from './auth.js';
import { generateShiftReport } from './ai.js';

console.log('Dashboard Module Loaded');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing dashboard...');
    
    if (!validateSession()) {
        return;
    }

    initializeDashboard();
});

function initializeDashboard() {
    setupButtons();
    setupNavigation();
    setupWelcomeMessage();
    setupAIFeatures();
    setupLogout();
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
        'generate-ai-report': generateAIReport
    };

    for (const [id, handler] of Object.entries(buttons)) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => {
                console.log(`Button clicked: ${id}`);
                handler();
            });
        } else {
            console.warn(`Button not found: ${id}`);
        }
    }
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
    }
}

function setupWelcomeMessage() {
    console.log('Setting up welcome message...');
    const userName = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');
    const greetingElement = document.querySelector('.greeting-message');
    
    if (greetingElement) {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Góðan daginn' : hour < 18 ? 'Góðan dag' : 'Gott kvöld';
        greetingElement.textContent = `${greeting}, ${userName || 'notandi'} – ${userRole || 'starfsmaður'}`;
    }
}

function setupAIFeatures() {
    console.log('Setting up AI features...');
    const reportButton = document.getElementById('generate-ai-report');
    if (!reportButton) {
        console.log('Adding AI report button to dashboard...');
        const aiSection = document.querySelector('.ai-insight-section');
        if (aiSection) {
            const button = document.createElement('button');
            button.id = 'generate-ai-report';
            button.className = 'btn-primary';
            button.innerHTML = '<i class="fas fa-robot"></i> Búa til AI vaktaskýrslu';
            aiSection.appendChild(button);
            button.addEventListener('click', generateAIReport);
        }
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
    }
}

async function generateAIReport() {
    console.log('Generating AI report...');
    const outputDiv = document.getElementById('ai-output') || createAIOutputDiv();
    
    try {
        outputDiv.innerHTML = '<div class="loading">Generating report...</div>';
        const summary = await generateShiftReport();
        outputDiv.innerHTML = `<div class="ai-summary">${summary}</div>`;
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
    
    return container;
}

// Dashboard action handlers
function refreshStats() {
    console.log('Refreshing dashboard stats...');
}

function viewMedications() {
    console.log('Opening medications view...');
}

function refreshAlerts() {
    console.log('Refreshing alerts...');
}

function updateInventory() {
    console.log('Updating inventory...');
}

function createHandover() {
    console.log('Creating handover report...');
}

function viewShift() {
    console.log('Opening shift overview...');
}

function handleHandover() {
    console.log('Handling shift handover...');
}

function clearAlerts() {
    console.log('Clearing all alerts...');
}

function openAIChat() {
    console.log('Opening AI chat interface...');
}