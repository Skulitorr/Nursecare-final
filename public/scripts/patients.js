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
    
    // Special handling for update patient button - requires ID parameter
    const updatePatientBtn = document.getElementById('update-patient-btn');
    if (updatePatientBtn) {
        updatePatientBtn.addEventListener('click', () => {
            console.log('Update patient button clicked');
            // Get patient ID from hidden input or data attribute if available
            const patientIdField = document.querySelector('#edit-patient-form [name="patient-id"]');
            const patientId = patientIdField ? patientIdField.value : null;
            
            if (patientId) {
                updatePatient(patientId);
            } else {
                console.error('Cannot update patient: No patient ID provided');
                showToast('error', 'Cannot update patient: No ID provided');
            }
        });
    }

    // Setup dynamic buttons
    setupDynamicButtons();
}

function setupDynamicButtons() {
    console.log('Setting up dynamic patient buttons...');
    
    // View patient buttons
    document.querySelectorAll('.view-patient-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const patientId = btn.dataset.patientId;
            console.log('View patient clicked:', patientId);
            viewPatient(patientId);
        });
    });

    // Edit patient buttons
    document.querySelectorAll('.edit-patient-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const patientId = btn.dataset.patientId;
            console.log('Edit patient clicked:', patientId);
            editPatient(patientId);
        });
    });

    // Remove patient buttons
    document.querySelectorAll('.remove-patient-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const patientId = btn.dataset.patientId;
            console.log('Remove patient clicked:', patientId);
            confirmRemovePatient(patientId);
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

    console.log('Dynamic buttons setup complete');
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
    const patientsGrid = document.getElementById('patients-grid');
    const patientTable = document.getElementById('patients-table-body');
    
    // Try to use the designated containers first
    if (!patientsGrid && !patientTable) {
        console.error('Patient containers not found');
        showToast('error', 'Could not find patient containers');
        return;
    }
    
    // Show loading indicators
    if (patientsGrid) patientsGrid.innerHTML = '<div class="loading-spinner">Loading patients...</div>';
    if (patientTable) patientTable.innerHTML = '<tr><td colspan="9" class="loading-cell">Loading patients...</td></tr>';
    
    try {
        // In a real app, this would be an API call
        // Simulate API loading time
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Use mock data since we're working with a static deployment
        const patientData = getMockPatientData();
        console.log(`Loaded ${patientData.length} patients`);
        
        if (patientData.length === 0) {
            if (patientsGrid) patientsGrid.innerHTML = '<div class="no-data">No patients found</div>';
            if (patientTable) patientTable.innerHTML = '<tr><td colspan="9" class="no-data">No patients found</td></tr>';
            return;
        }
        
        // Render patients
        renderPatients(patientData, patientsGrid, patientTable);
        
        // After rendering, set up the dynamic buttons again
        setupDynamicButtons();
        
    } catch (error) {
        console.error('Error loading patients:', error);
        if (patientsGrid) patientsGrid.innerHTML = '<div class="error-message">Failed to load patients</div>';
        if (patientTable) patientTable.innerHTML = '<tr><td colspan="9" class="error-cell">Failed to load patients</td></tr>';
        showToast('error', 'Error loading patients: ' + (error.message || 'Unknown error'));
    }
}

function getMockPatientData() {
    // Mock patient data for demonstration
    return [
        {
            id: 'P001',
            name: 'Jón Jónsson',
            age: 78,
            room: '101A',
            status: 'Stable',
            department: 'Wing A',
            careLevel: 'Medium',
            avatar: 'jon',
            medicalConditions: ['Alzheimer\'s', 'Hypertension'],
            medications: ['Donepezil', 'Lisinopril'],
            vitals: {
                heartRate: 72,
                bloodPressure: '130/85',
                temperature: 36.8,
                respRate: 16
            }
        },
        {
            id: 'P002',
            name: 'Guðrún Jónsdóttir',
            age: 82,
            room: '102B',
            status: 'Needs Attention',
            department: 'Wing A',
            careLevel: 'High',
            avatar: 'gudrun',
            medicalConditions: ['Diabetes Type 2', 'Osteoporosis'],
            medications: ['Metformin', 'Calcium supplements'],
            vitals: {
                heartRate: 80,
                bloodPressure: '140/90',
                temperature: 37.2,
                respRate: 18
            }
        },
        {
            id: 'P003',
            name: 'Sigurður Gunnarsson',
            age: 71,
            room: '103A',
            status: 'Stable',
            department: 'Wing B',
            careLevel: 'Low',
            avatar: 'sigurdur',
            medicalConditions: ['Arthritis', 'Glaucoma'],
            medications: ['Ibuprofen', 'Eye drops'],
            vitals: {
                heartRate: 68,
                bloodPressure: '125/80',
                temperature: 36.6,
                respRate: 14
            }
        },
        {
            id: 'P004',
            name: 'Helga Magnúsdóttir',
            age: 85,
            room: '104B',
            status: 'Critical',
            department: 'Wing A',
            careLevel: 'High',
            avatar: 'helga',
            medicalConditions: ['Congestive Heart Failure', 'COPD'],
            medications: ['Digoxin', 'Albuterol'],
            vitals: {
                heartRate: 90,
                bloodPressure: '150/95',
                temperature: 38.1,
                respRate: 22
            }
        },
        {
            id: 'P005',
            name: 'Ólafur Ólafsson',
            age: 69,
            room: '105A',
            status: 'Stable',
            department: 'Wing B',
            careLevel: 'Medium',
            avatar: 'olafur',
            medicalConditions: ['Parkinson\'s', 'Depression'],
            medications: ['Levodopa', 'Sertraline'],
            vitals: {
                heartRate: 65,
                bloodPressure: '120/75',
                temperature: 36.5,
                respRate: 15
            }
        }
    ];
}

function renderPatients(patients, listContainer, tableContainer) {
    // Render card view if container exists
    if (listContainer) {
        listContainer.innerHTML = '';
        patients.forEach(patient => {
            const statusClass = getStatusClass(patient.status);
            const patientCard = document.createElement('div');
            patientCard.className = 'patient-card';
            patientCard.innerHTML = `
                <div class="patient-header">
                    <div class="patient-avatar">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.avatar || patient.name}" alt="${patient.name}">
                    </div>
                    <div class="patient-info">
                        <h3 class="patient-name">${patient.name}</h3>
                        <div class="patient-meta">
                            <span>Room ${patient.room}</span> | <span>Age ${patient.age}</span>
                        </div>
                        <span class="status-badge ${statusClass}">${patient.status}</span>
                    </div>
                </div>
                <div class="patient-body">
                    <div class="patient-detail">
                        <span class="label">Department:</span>
                        <span class="value">${patient.department}</span>
                    </div>
                    <div class="patient-detail">
                        <span class="label">Care Level:</span>
                        <span class="value">${patient.careLevel}</span>
                    </div>
                    <div class="patient-detail">
                        <span class="label">Medical Conditions:</span>
                        <span class="value">${patient.medicalConditions.join(', ')}</span>
                    </div>
                </div>
                <div class="patient-actions">
                    <button class="action-btn view-patient-btn" data-patient-id="${patient.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn edit-patient-btn" data-patient-id="${patient.id}">
                        <i class="fas fa-pencil-alt"></i> Edit
                    </button>
                    <button class="action-btn remove-patient-btn" data-patient-id="${patient.id}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            `;
            listContainer.appendChild(patientCard);
        });
        console.log(`Rendered ${patients.length} patient cards`);
    }
    
    // Render table view if container exists
    if (tableContainer) {
        tableContainer.innerHTML = '';
        patients.forEach(patient => {
            const statusClass = getStatusClass(patient.status);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="patient-name-cell">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.avatar || patient.name}" 
                             alt="${patient.name}" class="patient-avatar-small">
                        <span class="patient-name">${patient.name}</span>
                    </div>
                </td>
                <td>${patient.room}</td>
                <td>${patient.age}</td>
                <td><span class="status-badge ${statusClass}">${patient.status}</span></td>
                <td>${patient.department}</td>
                <td class="actions-cell">
                    <button class="action-btn view-patient-btn" data-patient-id="${patient.id}" aria-label="View ${patient.name}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-patient-btn" data-patient-id="${patient.id}" aria-label="Edit ${patient.name}">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="action-btn remove-patient-btn" data-patient-id="${patient.id}" aria-label="Remove ${patient.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableContainer.appendChild(row);
        });
        console.log(`Rendered ${patients.length} patient table rows`);
    }
}

function getStatusClass(status) {
    status = status.toLowerCase();
    if (status.includes('critical')) return 'status-critical';
    if (status.includes('attention')) return 'status-warning';
    if (status.includes('stable')) return 'status-stable';
    return 'status-normal';
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

function resolveAlert(alertCard) {
    console.log('Resolving alert...');
    alertCard.classList.add('fade-out');
    setTimeout(() => {
        alertCard.remove();
    }, 300);
    showToast('success', 'Alert marked as resolved');
}

function viewPatient(patientId) {
    console.log(`Viewing patient with ID: ${patientId}`);
    const modal = document.getElementById('view-patient-modal');
    if (!modal) {
        console.error('Patient view modal not found');
        showToast('error', 'Could not load patient view: Modal not found');
        return;
    }
    
    // Get patient data
    const patientData = getMockPatientData();
    const patient = patientData.find(p => p.id === patientId) || 
                   { id: patientId, name: 'Unknown Patient', status: 'Unknown', room: 'Unknown' };
    
    // Safely update modal title if it exists
    const modalTitle = modal.querySelector('#view-modal-title');
    if (modalTitle) {
        modalTitle.textContent = `${patient.name}`;
    }
    
    // Get tab content container
    const tabOverview = modal.querySelector('#tab-overview');
    if (!tabOverview) {
        // If tab overview doesn't exist, use the modal body
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `<div class="loading-spinner">Loading patient data...</div>`;
            
            // Simulate loading data
            setTimeout(() => {
                modalBody.innerHTML = createPatientViewContent(patient);
            }, 800);
        }
    } else {
        // If tab structure exists, update profile information
        updatePatientProfileData(modal, patient);
    }
    
    // Show the modal
    modal.classList.add('show');
}

// Helper function to create patient view content
function createPatientViewContent(patient) {
    return `
        <div class="patient-details">
            <h4>Patient Information</h4>
            <p><strong>ID:</strong> ${patient.id}</p>
            <p><strong>Name:</strong> ${patient.name}</p>
            <p><strong>Status:</strong> ${patient.status}</p>
            <p><strong>Room:</strong> ${patient.room || 'Not assigned'}</p>
            
            <h4>Medical Information</h4>
            <p><strong>Medical Conditions:</strong> ${patient.medicalConditions ? patient.medicalConditions.join(', ') : 'None reported'}</p>
            <p><strong>Medications:</strong> ${patient.medications ? patient.medications.join(', ') : 'None'}</p>
            
            <h4>Latest Vitals</h4>
            <div class="vitals-grid">
                <div class="vital-item">
                    <span class="vital-icon"><i class="fas fa-heartbeat"></i></span>
                    <span class="vital-value">${patient.vitals ? patient.vitals.heartRate + ' bpm' : 'Not measured'}</span>
                    <span class="vital-label">Heart Rate</span>
                </div>
                <div class="vital-item">
                    <span class="vital-icon"><i class="fas fa-stethoscope"></i></span>
                    <span class="vital-value">${patient.vitals ? patient.vitals.bloodPressure : 'Not measured'}</span>
                    <span class="vital-label">Blood Pressure</span>
                </div>
                <div class="vital-item">
                    <span class="vital-icon"><i class="fas fa-thermometer-half"></i></span>
                    <span class="vital-value">${patient.vitals ? patient.vitals.temperature + '°C' : 'Not measured'}</span>
                    <span class="vital-label">Temperature</span>
                </div>
                <div class="vital-item">
                    <span class="vital-icon"><i class="fas fa-lungs"></i></span>
                    <span class="vital-value">${patient.vitals ? patient.vitals.respRate + ' rpm' : 'Not measured'}</span>
                    <span class="vital-label">Respiratory Rate</span>
                </div>
            </div>
        </div>
    `;
}

// Helper function to update patient profile data in the tabbed modal
function updatePatientProfileData(modal, patient) {
    // Update patient profile fields if they exist
    const updateElement = (id, value) => {
        const element = modal.querySelector(`#${id}`);
        if (element) element.textContent = value;
    };
    
    // Update profile image
    const profileImage = modal.querySelector('#patient-profile-image');
    if (profileImage) {
        profileImage.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.avatar || patient.name}`;
        profileImage.alt = `Profile image for ${patient.name}`;
    }
    
    // Update text fields
    updateElement('patient-profile-name', patient.name);
    updateElement('patient-profile-age', patient.age ? `${patient.age} ára` : 'Aldur óþekktur');
    updateElement('patient-profile-room', `Herbergi ${patient.room || 'óþekkt'}`);
    updateElement('patient-profile-department', patient.department || 'Deild óþekkt');
    
    // Update status badge
    const statusBadge = modal.querySelector('#patient-profile-status');
    if (statusBadge) {
        const statusClass = getStatusClass(patient.status);
        statusBadge.className = `status-badge ${statusClass}`;
        statusBadge.textContent = patient.status;
    }
    
    // Update vitals if they exist
    if (patient.vitals) {
        updateElement('patient-bp', patient.vitals.bloodPressure + ' mmHg');
        updateElement('patient-pulse', patient.vitals.heartRate + ' slög/mín');
        updateElement('patient-temp', patient.vitals.temperature + '°C');
        updateElement('patient-o2', (patient.vitals.o2 || '96') + '%');
    }
    
    // Setup tab buttons if they exist
    setupPatientModalTabs(modal);
}

function editPatient(patientId) {
    console.log(`Editing patient with ID: ${patientId}`);
    
    // Find the edit modal
    const modal = document.getElementById('edit-patient-modal');
    if (!modal) {
        console.error('Edit patient modal not found');
        showToast('error', 'Could not open edit form: Modal not found');
        return;
    }
    
    // Set the patient ID in the form
    const patientIdField = modal.querySelector('[name="patient-id"]');
    if (patientIdField) {
        patientIdField.value = patientId;
    }
    
    // Get patient name (optional, for display purposes)
    const patientElement = document.querySelector(`[data-patient-id="${patientId}"]`);
    const patientCard = patientElement?.closest('.patient-card');
    const patientName = patientCard?.querySelector('.patient-name')?.textContent || 'Patient';
    
    // Set modal title if we have an element for it
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Edit Patient: ${patientName}`;
    }
    
    // Here you would typically fetch existing patient data and pre-fill the form
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        // You might want to show loading state while fetching data
        modalBody.classList.add('loading');
        
        // Simulate API call to fetch patient data (replace with actual implementation)
        setTimeout(() => {
            // Remove loading state
            modalBody.classList.remove('loading');
            
            // Pre-fill form fields with patient data (example)
            const nameField = modal.querySelector('[name="patient-name"]');
            if (nameField) nameField.value = patientName;
            
            // More fields would be filled here with actual patient data
            
            console.log(`Patient edit form loaded for patient ID: ${patientId}`);
        }, 800);
    }
    
    // Show the modal
    modal.classList.add('show');
}

function confirmRemovePatient(patientId) {
    console.log(`Confirming removal of patient with ID: ${patientId}`);
    
    // Find patient information for the confirmation message
    const patientElement = document.querySelector(`[data-patient-id="${patientId}"]`);
    const patientCard = patientElement?.closest('.patient-card');
    const patientRow = patientElement?.closest('tr');
    const patientName = patientCard?.querySelector('.patient-name')?.textContent || 
                        patientRow?.querySelector('.patient-name')?.textContent ||
                        'this patient';
    
    // Check if we have a confirm modal
    let confirmModal = document.getElementById('confirm-modal');
    
    // If we don't have a confirmation modal, create one
    if (!confirmModal) {
        console.log('Confirmation modal not found, creating one');
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirm-modal';
        confirmModal.className = 'modal';
        confirmModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container confirm-container">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Confirm Action</h3>
                    <button class="close-modal" aria-label="Close modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="confirm-message">Are you sure you want to remove ${patientName}?</p>
                    <div class="form-actions">
                        <button class="btn-outline cancel-btn">Cancel</button>
                        <button class="btn-danger confirm-btn">Remove</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
        
        // Setup the close and cancel buttons
        const closeBtn = confirmModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                confirmModal.classList.remove('show');
            });
        }
        
        const cancelBtn = confirmModal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                confirmModal.classList.remove('show');
            });
        }
    } else {
        // Set confirmation message in existing modal
        const messageElement = confirmModal.querySelector('.confirm-message');
        if (messageElement) {
            messageElement.textContent = `Are you sure you want to remove ${patientName}?`;
        }
    }
    
    // Get the confirm button
    const confirmButton = confirmModal.querySelector('.confirm-btn');
    if (confirmButton) {
        // Remove any existing event listeners and create a new button
        const newConfirmBtn = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmBtn, confirmButton);
        
        // Add event listener to the new button
        newConfirmBtn.addEventListener('click', () => {
            console.log(`Removal confirmed for patient ID: ${patientId}`);
            confirmModal.classList.remove('show');
            removePatient(patientId);
        });
    }
    
    // Show the confirm modal
    confirmModal.classList.add('show');
}

function removePatient(patientId) {
    console.log(`Removing patient with ID: ${patientId}`);
    
    try {
        // Find patient card or row
        const patientElement = document.querySelector(`[data-patient-id="${patientId}"]`);
        const patientCard = patientElement?.closest('.patient-card');
        const patientRow = patientElement?.closest('tr');
        
        // Get name for toast message
        const patientName = patientCard?.querySelector('.patient-name')?.textContent || 
                             patientRow?.querySelector('.patient-name')?.textContent || 
                             'Patient';
        
        // Remove from UI with animation
        if (patientCard) {
            patientCard.classList.add('fade-out');
            setTimeout(() => {
                patientCard.remove();
            }, 300);
        } else if (patientRow) {
            patientRow.classList.add('fade-out');
            setTimeout(() => {
                patientRow.remove();
            }, 300);
        } else {
            console.warn(`Could not find patient element with ID: ${patientId}`);
        }
        
        // Here you would typically make an API call to remove the patient from the database
        // For now, we'll just show a success message
        showToast('success', `${patientName} has been removed`);
        
    } catch (error) {
        console.error('Error removing patient:', error);
        showToast('error', 'Failed to remove patient: ' + error.message);
    }
}

// Update patient data
function updatePatient(patientId) {
    console.log(`Updating patient with ID: ${patientId}`);
    
    const modal = document.getElementById('edit-patient-modal');
    if (!modal) {
        console.error('Edit patient modal not found');
        showToast('error', 'Could not update patient: Edit form not found');
        return;
    }
    
    // Show loading state in modal if it exists
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = '<div class="loading-spinner">Loading patient data...</div>';
    }
    
    // Show the modal
    modal.classList.add('show');
    
    try {
        // Find patient data (in a real app this would be fetched from API)
        const patients = getMockPatientData();
        const patient = patients.find(p => p.id === patientId);
        
        if (!patient) {
            throw new Error(`Patient with ID ${patientId} not found`);
        }
        
        console.log(`Found patient data for ID ${patientId}:`, patient.name);
        
        // If we have a form, populate it after a short delay to simulate API fetch
        setTimeout(() => {
            const form = modal.querySelector('form');
            if (!form) {
                console.error('Patient edit form not found');
                if (modalBody) {
                    modalBody.innerHTML = '<div class="error-message">Error loading patient form</div>';
                }
                return;
            }
            
            // Populate form with patient data
            if (modalBody) {
                modalBody.innerHTML = `
                    <form id="edit-patient-form">
                        <input type="hidden" name="patient-id" value="${patient.id}">
                        
                        <div class="form-group">
                            <label for="patient-name">Name</label>
                            <input type="text" id="patient-name" name="patient-name" value="${patient.name}" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="patient-age">Age</label>
                                <input type="number" id="patient-age" name="patient-age" value="${patient.age}" required>
                            </div>
                            <div class="form-group">
                                <label for="patient-room">Room</label>
                                <input type="text" id="patient-room" name="patient-room" value="${patient.room}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="patient-status">Status</label>
                                <select id="patient-status" name="patient-status" required>
                                    <option value="Stable" ${patient.status === 'Stable' ? 'selected' : ''}>Stable</option>
                                    <option value="Needs Attention" ${patient.status === 'Needs Attention' ? 'selected' : ''}>Needs Attention</option>
                                    <option value="Critical" ${patient.status === 'Critical' ? 'selected' : ''}>Critical</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="patient-department">Department</label>
                                <select id="patient-department" name="patient-department" required>
                                    <option value="Wing A" ${patient.department === 'Wing A' ? 'selected' : ''}>Wing A</option>
                                    <option value="Wing B" ${patient.department === 'Wing B' ? 'selected' : ''}>Wing B</option>
                                    <option value="Wing C" ${patient.department === 'Wing C' ? 'selected' : ''}>Wing C</option>
                                    <option value="Wing D" ${patient.department === 'Wing D' ? 'selected' : ''}>Wing D</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="patient-medical">Medical Conditions (comma separated)</label>
                            <input type="text" id="patient-medical" name="patient-medical" value="${patient.medicalConditions.join(', ')}">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Save Changes</button>
                            <button type="button" class="btn-outline cancel-btn">Cancel</button>
                        </div>
                    </form>
                `;
                
                // Add event listeners to the new form
                const newForm = modalBody.querySelector('form');
                if (newForm) {
                    newForm.addEventListener('submit', function(e) {
                        e.preventDefault();
                        savePatientChanges(patient.id);
                        modal.classList.remove('show');
                        showToast('success', `${patient.name} updated successfully`);
                    });
                    
                    const cancelBtn = newForm.querySelector('.cancel-btn');
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', () => {
                            modal.classList.remove('show');
                        });
                    }
                }
            }
        }, 800);
        
    } catch (error) {
        console.error('Error updating patient:', error);
        showToast('error', 'Error updating patient: ' + error.message);
        
        if (modalBody) {
            modalBody.innerHTML = '<div class="error-message">Error loading patient data</div>';
        }
    }
}

// Save patient changes from form
function savePatientChanges(patientId) {
    console.log(`Saving changes for patient ID: ${patientId}`);
    
    // In a real app, this would send data to an API
    // For now, just log the action
    console.log('Patient data would be saved to API/database');
    
    // Reload patient list to show changes
    setTimeout(() => {
        loadPatients();
    }, 500);
}

// Setup the tab navigation in the patient modal
function setupPatientModalTabs(modal) {
    const tabButtons = modal.querySelectorAll('.tab-btn');
    if (!tabButtons.length) return;
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Remove active class from all tab buttons and content
            tabButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab content
            const tabContents = modal.querySelectorAll('.tab-content');
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Show the selected tab content
            const activeContent = modal.querySelector(`#tab-${tabId}`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
}

function confirmRemovePatient(patientId) {
    console.log(`Confirming removal of patient with ID: ${patientId}`);
    
    // Find patient information for the confirmation message
    const patientElement = document.querySelector(`[data-patient-id="${patientId}"]`);
    const patientCard = patientElement?.closest('.patient-card');
    const patientRow = patientElement?.closest('tr');
    const patientName = patientCard?.querySelector('.patient-name')?.textContent || 
                        patientRow?.querySelector('.patient-name')?.textContent ||
                        'this patient';
    
    // Check if we have a confirm modal
    let confirmModal = document.getElementById('confirm-modal');
    
    // If we don't have a confirmation modal, create one
    if (!confirmModal) {
        console.log('Confirmation modal not found, creating one');
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirm-modal';
        confirmModal.className = 'modal';
        confirmModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container confirm-container">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Confirm Action</h3>
                    <button class="close-modal" aria-label="Close modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="confirm-message">Are you sure you want to remove ${patientName}?</p>
                    <div class="form-actions">
                        <button class="btn-outline cancel-btn">Cancel</button>
                        <button class="btn-danger confirm-btn">Remove</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
        
        // Setup the close and cancel buttons
        const closeBtn = confirmModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                confirmModal.classList.remove('show');
            });
        }
        
        const cancelBtn = confirmModal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                confirmModal.classList.remove('show');
            });
        }
    } else {
        // Set confirmation message in existing modal
        const messageElement = confirmModal.querySelector('.confirm-message');
        if (messageElement) {
            messageElement.textContent = `Are you sure you want to remove ${patientName}?`;
        }
    }
    
    // Get the confirm button
    const confirmButton = confirmModal.querySelector('.confirm-btn');
    if (confirmButton) {
        // Remove any existing event listeners and create a new button
        const newConfirmBtn = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmBtn, confirmButton);
        
        // Add event listener to the new button
        newConfirmBtn.addEventListener('click', () => {
            console.log(`Removal confirmed for patient ID: ${patientId}`);
            confirmModal.classList.remove('show');
            removePatient(patientId);
        });
    }
    
    // Show the confirm modal
    confirmModal.classList.add('show');
}