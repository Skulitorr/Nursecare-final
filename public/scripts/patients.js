import { validateSession } from './auth.js';
import { processChatMessage } from './ai.js';

console.log('Patients Module Loaded');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing patients page...');
    
    if (!validateSession()) {
        return;
    }

    initializePatientsPage();
});

function initializePatientsPage() {
    setupButtons();
    setupFilters();
    setupViewToggle();
    setupModals();
    loadPatients();
    initializeAIWidget();
}

function setupButtons() {
    console.log('Setting up patient page buttons...');
    const buttons = {
        'view-all-patients-btn': viewAllPatients,
        'add-patient-btn': showAddPatientModal,
        'reset-filters': resetFilters,
        'update-patient-btn': updatePatient,
        'add-vitals-btn': showAddVitalsModal,
        'add-note-btn': showAddNoteModal,
        'add-medication-btn': showAddMedicationModal
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

    // Setup dynamic buttons
    setupDynamicButtons();
}

function setupDynamicButtons() {
    // View patient buttons
    document.querySelectorAll('.view-patient-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const patientId = btn.dataset.patientId;
            console.log('View patient clicked:', patientId);
            viewPatient(patientId);
        });
    });

    // Mark resolved buttons
    document.querySelectorAll('.mark-resolved-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const alertCard = e.target.closest('.alert-card');
            console.log('Mark resolved clicked');
            if (alertCard) {
                resolveAlert(alertCard);
            }
        });
    });
}

function setupFilters() {
    console.log('Setting up filters...');
    const filters = ['patient-search', 'department-filter', 'status-filter', 'medication-filter'];
    
    filters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                console.log(`Filter changed: ${id}`);
                applyFilters();
            });
        }
    });
}

function setupViewToggle() {
    console.log('Setting up view toggle...');
    const viewButtons = document.querySelectorAll('.view-btn');
    const cardView = document.getElementById('card-view');
    const tableView = document.getElementById('table-view');

    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            console.log('View changed to:', view);
            
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (view === 'card') {
                cardView.style.display = 'block';
                tableView.style.display = 'none';
            } else {
                cardView.style.display = 'none';
                tableView.style.display = 'block';
            }
        });
    });
}

function setupModals() {
    console.log('Setting up modals...');
    const modals = ['add-patient-modal', 'view-patient-modal', 'add-note-modal', 'add-vitals-modal'];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Close button
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    console.log(`Closing modal: ${modalId}`);
                    modal.classList.remove('show');
                });
            }

            // Cancel buttons
            const cancelBtns = modal.querySelectorAll('.cancel-btn');
            cancelBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    console.log(`Canceling modal: ${modalId}`);
                    modal.classList.remove('show');
                });
            });

            // Form submissions
            const form = modal.querySelector('form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    console.log(`Form submitted in modal: ${modalId}`);
                    handleFormSubmit(modalId, form);
                });
            }
        }
    });
}

async function initializeAIWidget() {
    console.log('Initializing AI widget...');
    const aiWidget = document.getElementById('ai-widget-container');
    const toggleBtn = document.getElementById('ai-widget-toggle');
    const sendBtn = document.getElementById('ai-widget-send');
    const input = document.getElementById('ai-widget-input');

    if (toggleBtn && aiWidget) {
        toggleBtn.addEventListener('click', () => {
            console.log('Toggling AI widget');
            aiWidget.classList.toggle('open');
        });
    }

    if (input && sendBtn) {
        input.addEventListener('input', () => {
            sendBtn.disabled = !input.value.trim();
        });

        sendBtn.addEventListener('click', async () => {
            const message = input.value.trim();
            if (message) {
                console.log('Sending message to AI:', message);
                await sendAIMessage(message);
                input.value = '';
                sendBtn.disabled = true;
            }
        });
    }

    // Setup suggestion buttons
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const query = btn.dataset.query;
            if (query) {
                console.log('Using AI suggestion:', query);
                await sendAIMessage(query);
            }
        });
    });
}

async function sendAIMessage(message) {
    const messagesContainer = document.getElementById('ai-widget-messages');
    if (!messagesContainer) return;

    // Add user message
    addMessage(messagesContainer, message, 'user');

    try {
        // Show typing indicator
        showTypingIndicator(messagesContainer);

        // Process message
        const response = await processChatMessage(message);

        // Remove typing indicator and add AI response
        removeTypingIndicator(messagesContainer);
        addMessage(messagesContainer, response.message, 'assistant');

    } catch (error) {
        console.error('AI chat error:', error);
        removeTypingIndicator(messagesContainer);
        addMessage(messagesContainer, 'Sorry, I encountered an error processing your message.', 'assistant', true);
    }
}

function addMessage(container, text, type, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${type === 'user' ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div class="message-content">
            <div class="message-text ${isError ? 'error' : ''}">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function showTypingIndicator(container) {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator(container) {
    const indicator = container.querySelector('.typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Modal handlers
function showAddPatientModal() {
    const modal = document.getElementById('add-patient-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function showAddVitalsModal() {
    const modal = document.getElementById('add-vitals-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function showAddNoteModal() {
    const modal = document.getElementById('add-note-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

function showAddMedicationModal() {
    // Implementation pending medication modal
    console.log('Add medication modal not yet implemented');
}

function viewAllPatients() {
    console.log('View all patients button clicked');
    // Implement logic to show all patients, e.g., reset filters and reload
    resetFilters();
    loadPatients();
}

// Form submission handlers
async function handleFormSubmit(modalId, form) {
    console.log(`Handling form submission for ${modalId}`);
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        switch (modalId) {
            case 'add-patient-modal':
                await addPatient(data);
                break;
            case 'add-vitals-modal':
                await addVitals(data);
                break;
            case 'add-note-modal':
                await addNote(data);
                break;
        }

        // Close modal and show success message
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
        showToast('success', 'Data saved successfully');
        
    } catch (error) {
        console.error('Form submission error:', error);
        showToast('error', 'Error saving data: ' + error.message);
    }
}

// API handlers
async function loadPatients() {
    console.log('Loading patients...');
    try {
        // Implementation pending API integration
        console.log('API integration pending');
    } catch (error) {
        console.error('Error loading patients:', error);
        showToast('error', 'Error loading patients: ' + error.message);
    }
}

async function addPatient(data) {
    console.log('Adding patient:', data);
    // Implementation pending API integration
}

async function addVitals(data) {
    console.log('Adding vitals:', data);
    // Implementation pending API integration
}

async function addNote(data) {
    console.log('Adding note:', data);
    // Implementation pending API integration
}

async function updatePatient(data) {
    console.log('Updating patient:', data);
    // Implementation pending API integration
}

// Filter handlers
function applyFilters() {
    console.log('Applying filters...');
    // Implementation pending
}

function resetFilters() {
    console.log('Resetting filters...');
    const filters = ['patient-search', 'department-filter', 'status-filter', 'medication-filter'];
    
    filters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'text') {
                element.value = '';
            } else {
                element.selectedIndex = 0;
            }
        }
    });

    applyFilters();
}

// Utility functions
function showToast(type, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation-triangle'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${type === 'success' ? 'Success' : 'Error'}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Add close button handler
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}