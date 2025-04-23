/**
 * patients.js - Patient Management System
 * 
 * Handles all functionality for the patients page including:
 * - Patient data display and management
 * - Search and filtering
 * - View toggling (card vs. table)
 * - Modal interactions
 * - AI assistant integration
 * - Charts and visualizations
 */

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    initializePatientData();
    initializeCharts();
    initializeAIAssistant();
    setupEventListeners();
    initializeScrollToTop();
});

// Global variables
let currentPage = 1;
const patientsPerPage = 6;
let filteredPatients = [];
let currentViewMode = 'card';

/**
 * Initialize page components
 */
function initializePage() {
    // Set current date
    updateDateTime();
    
    // Initialize theme based on stored preference
    initializeTheme();
    
    // Initialize dropdowns
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    // Add event listeners for dropdowns
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsMenu.classList.toggle('show');
            
            // Update ARIA attributes
            const isHidden = !notificationsMenu.classList.contains('show');
            notificationsMenu.setAttribute('aria-hidden', isHidden);
            
            // Close other dropdowns
            if (profileMenu) profileMenu.classList.remove('show');
        });
    }
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
            
            // Update ARIA attributes
            const isHidden = !profileMenu.classList.contains('show');
            profileMenu.setAttribute('aria-hidden', isHidden);
            
            // Close other dropdowns
            if (notificationsMenu) notificationsMenu.classList.remove('show');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        if (notificationsMenu) {
            notificationsMenu.classList.remove('show');
            notificationsMenu.setAttribute('aria-hidden', 'true');
        }
        if (profileMenu) {
            profileMenu.classList.remove('show');
            profileMenu.setAttribute('aria-hidden', 'true');
        }
    });
    
    // Initialize sidebar toggle
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Update icon
            const icon = this.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.className = 'fas fa-chevron-right';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
    }
}

/**
 * Initialize theme
 */
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon(true);
        }
        
        themeToggle.addEventListener('click', function() {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            updateThemeIcon(isDarkMode);
            
            // Save preference to localStorage
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Update charts for the theme
            updateChartsForTheme();
            
            showToast('Þema', isDarkMode ? 'Dökkt þema virkt' : 'Bjart þema virkt', 'info');
        });
    }
}

/**
 * Update theme icon
 * @param {boolean} isDarkMode - Whether dark mode is active
 */
function updateThemeIcon(isDarkMode) {
    const icon = document.querySelector('#theme-toggle i');
    const text = document.querySelector('#theme-toggle span');
    if (icon && text) {
        if (isDarkMode) {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark Mode';
        }
    }
}

/**
 * Update date and time
 */
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('is-IS', options);
    
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${dateStr}`;
    }
}

/**
 * Initialize patient data
 */
function initializePatientData() {
    // Filter patients for initial view
    filteredPatients = [...patientsData];
    
    // Render patients
    renderPatients();
    
    // Update pagination info
    updatePagination();
}

/**
 * Render patients based on current view mode and filters
 */
function renderPatients() {
    // Get current page data
    const startIndex = (currentPage - 1) * patientsPerPage;
    const endIndex = startIndex + patientsPerPage;
    const currentPageData = filteredPatients.slice(startIndex, endIndex);
    
    // Render based on view mode
    if (currentViewMode === 'card') {
        renderCardView(currentPageData);
    } else {
        renderTableView(currentPageData);
    }
}

/**
 * Render card view of patients
 * @param {Array} patients - Array of patient objects to render
 */
function renderCardView(patients) {
    const patientsGrid = document.getElementById('patients-grid');
    if (!patientsGrid) return;
    
    // Clear previous content
    patientsGrid.innerHTML = '';
    
    // Check if there are patients to display
    if (patients.length === 0) {
        patientsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Engir sjúklingar fundust sem passa við leitarskilyrði.</p>
                <button class="btn-outline" id="reset-search">Endurstilla leit</button>
            </div>
        `;
        
        // Add event listener to reset search button
        const resetBtn = document.getElementById('reset-search');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetFilters);
        }
        
        return;
    }
    
    // Create cards for each patient
    patients.forEach(patient => {
        // Create a patient card
        const patientCard = document.createElement('div');
        patientCard.className = 'patient-card';
        patientCard.dataset.patientId = patient.id;
        
        // Determine status class
        let statusClass = 'stable';
        if (patient.condition === 'attention') {
            statusClass = 'attention';
        } else if (patient.condition === 'critical') {
            statusClass = 'critical';
        }
        
        // Determine medication status
        let medicationStatus = '';
        if (patient.medications.some(med => med.status === 'pending')) {
            medicationStatus = '<span class="badge medication-pending">Lyf í bið</span>';
        } else if (patient.medications.some(med => med.status === 'missed')) {
            medicationStatus = '<span class="badge medication-missed">Lyf misst</span>';
        }
        
        // Build the card HTML
        patientCard.innerHTML = `
            <div class="patient-card-header">
                <div class="patient-avatar">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.id}" alt="${patient.firstName} ${patient.lastName}">
                </div>
                <div class="patient-card-info">
                    <h3 class="patient-name">${patient.firstName} ${patient.lastName}</h3>
                    <div class="patient-meta">
                        <span class="patient-room"><i class="fas fa-door-open"></i> Herbergi ${patient.room}</span>
                        <span class="patient-age"><i class="fas fa-birthday-cake"></i> ${calculateAge(patient.dateOfBirth)} ára</span>
                    </div>
                </div>
                <div class="status-badge ${statusClass}">
                    ${getConditionLabel(patient.condition)}
                </div>
            </div>
            <div class="patient-card-body">
                <div class="patient-info-row">
                    <div class="patient-info-item">
                        <span class="info-label">Aðalgreining</span>
                        <span class="info-value">${patient.primaryDiagnosis}</span>
                    </div>
                    <div class="patient-info-item">
                        <span class="info-label">Deild</span>
                        <span class="info-value">${getDepartmentLabel(patient.department)}</span>
                    </div>
                </div>
                <div class="vitals-summary">
                    <div class="vital-mini">
                        <i class="fas fa-heartbeat"></i>
                        <span>${patient.vitals.bloodPressure}</span>
                    </div>
                    <div class="vital-mini">
                        <i class="fas fa-heart"></i>
                        <span>${patient.vitals.pulse}</span>
                    </div>
                    <div class="vital-mini">
                        <i class="fas fa-thermometer-half"></i>
                        <span>${patient.vitals.temperature}°C</span>
                    </div>
                    <div class="vital-mini">
                        <i class="fas fa-lungs"></i>
                        <span>${patient.vitals.oxygenSaturation}%</span>
                    </div>
                </div>
                ${medicationStatus ? `<div class="medication-alert">${medicationStatus}</div>` : ''}
                <div class="nurse-assigned">
                    <i class="fas fa-user-nurse"></i>
                    <span>Umsjón: ${patient.assignedNurse}</span>
                </div>
            </div>
            <div class="patient-card-footer">
                <button class="btn-sm btn-outline view-patient-btn" data-patient-id="${patient.id}">
                    <i class="fas fa-eye"></i> Skoða
                </button>
                <button class="btn-sm btn-outline add-note-btn" data-patient-id="${patient.id}">
                    <i class="fas fa-sticky-note"></i> Athugasemd
                </button>
                <button class="btn-sm btn-outline medication-btn" data-patient-id="${patient.id}">
                    <i class="fas fa-pills"></i> Lyf
                </button>
            </div>
        `;
        
        // Add event listeners for card buttons
        patientsGrid.appendChild(patientCard);
    });
    
    // Add event listeners to all patient card buttons
    addPatientCardButtonListeners();
}

/**
 * Render table view of patients
 * @param {Array} patients - Array of patient objects to render
 */
function renderTableView(patients) {
    const patientsTableBody = document.getElementById('patients-table-body');
    if (!patientsTableBody) return;
    
    // Clear previous content
    patientsTableBody.innerHTML = '';
    
    // Check if there are patients to display
    if (patients.length === 0) {
        patientsTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="no-results-cell">
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <p>Engir sjúklingar fundust sem passa við leitarskilyrði.</p>
                        <button class="btn-outline" id="reset-search">Endurstilla leit</button>
                    </div>
                </td>
            </tr>
        `;
        
        // Add event listener to reset search button
        const resetBtn = document.getElementById('reset-search');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetFilters);
        }
        
        return;
    }
    
    // Create rows for each patient
    patients.forEach(patient => {
        // Create a table row
        const patientRow = document.createElement('tr');
        patientRow.dataset.patientId = patient.id;
        
        // Determine status class
        let statusBadge = '';
        if (patient.condition === 'stable') {
            statusBadge = '<span class="status-badge stable">Stöðugt</span>';
        } else if (patient.condition === 'attention') {
            statusBadge = '<span class="status-badge attention">Þarfnast athygli</span>';
        } else if (patient.condition === 'critical') {
            statusBadge = '<span class="status-badge critical">Alvarlegt</span>';
        }
        
        // Determine medication status
        let medicationBadge = '';
        if (patient.medications.some(med => med.status === 'pending')) {
            medicationBadge = '<span class="badge medication-pending">Í bið</span>';
        } else if (patient.medications.some(med => med.status === 'missed')) {
            medicationBadge = '<span class="badge medication-missed">Misst</span>';
        } else {
            medicationBadge = '<span class="badge medication-completed">Lokið</span>';
        }
        
        // Build the row HTML
        patientRow.innerHTML = `
            <td>
                <input type="checkbox" name="select-patient" aria-label="Velja sjúkling ${patient.firstName} ${patient.lastName}">
            </td>
            <td>
                <div class="patient-cell">
                    <div class="patient-avatar small">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.id}" alt="${patient.firstName} ${patient.lastName}">
                    </div>
                    <div class="patient-cell-info">
                        <div class="patient-name">${patient.firstName} ${patient.lastName}</div>
                        <div class="patient-age">${calculateAge(patient.dateOfBirth)} ára</div>
                    </div>
                </div>
            </td>
            <td>${patient.room}</td>
            <td>${calculateAge(patient.dateOfBirth)}</td>
            <td>${statusBadge}</td>
            <td>${medicationBadge}</td>
            <td>${formatDate(patient.vitalsHistory[0].timestamp)}</td>
            <td>${patient.assignedNurse}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn view-patient-btn" data-patient-id="${patient.id}" aria-label="Skoða sjúkling">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn add-note-btn" data-patient-id="${patient.id}" aria-label="Bæta við athugasemd">
                        <i class="fas fa-sticky-note"></i>
                    </button>
                    <button class="action-btn medication-btn" data-patient-id="${patient.id}" aria-label="Skoða lyf">
                        <i class="fas fa-pills"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Add the row to the table
        patientsTableBody.appendChild(patientRow);
    });
    
    // Add event listeners to all table action buttons
    addPatientTableButtonListeners();
}

/**
 * Add event listeners to patient card buttons
 */
function addPatientCardButtonListeners() {
    // View patient buttons
    const viewButtons = document.querySelectorAll('.view-patient-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const patientId = this.dataset.patientId;
            openPatientDetailsModal(patientId);
        });
    });
    
    // Add note buttons
    const noteButtons = document.querySelectorAll('.add-note-btn');
    noteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const patientId = this.dataset.patientId;
            openAddNoteModal(patientId);
        });
    });
    
    // Medication buttons
    const medicationButtons = document.querySelectorAll('.medication-btn');
    medicationButtons.forEach(button => {
        button.addEventListener('click', function() {
            const patientId = this.dataset.patientId;
            openPatientDetailsModal(patientId, 'medications');
        });
    });
}

/**
 * Add event listeners to patient table buttons
 */
function addPatientTableButtonListeners() {
    // The same functions as card buttons, just different selectors
    addPatientCardButtonListeners();
}

/**
 * Update pagination information
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredPatients.length / patientsPerPage) || 1;
    
    // Update UI elements
    const showingStartElement = document.getElementById('showing-start');
    const showingEndElement = document.getElementById('showing-end');
    const totalEntriesElement = document.getElementById('total-entries');
    const currentPageElement = document.querySelector('.current-page');
    const totalPagesElement = document.getElementById('total-pages');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    // Calculate start and end indices
    const startIndex = filteredPatients.length > 0 ? (currentPage - 1) * patientsPerPage + 1 : 0;
    const endIndex = Math.min(startIndex + patientsPerPage - 1, filteredPatients.length);
    
    if (showingStartElement) showingStartElement.textContent = startIndex;
    if (showingEndElement) showingEndElement.textContent = endIndex;
    if (totalEntriesElement) totalEntriesElement.textContent = filteredPatients.length;
    if (currentPageElement) currentPageElement.textContent = currentPage;
    if (totalPagesElement) totalPagesElement.textContent = totalPages;
    
    // Enable/disable pagination buttons
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
}

/**
 * Setup event listeners for all interactive elements
 */
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('patient-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterPatients();
        });
    }
    
    // Filter selects
    const departmentFilter = document.getElementById('department-filter');
    const statusFilter = document.getElementById('status-filter');
    const medicationFilter = document.getElementById('medication-filter');
    
    [departmentFilter, statusFilter, medicationFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', function() {
                filterPatients();
            });
        }
    });
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // View toggle buttons
    const viewToggleBtns = document.querySelectorAll('.view-btn');
    viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const viewMode = this.dataset.view;
            
            // Update active state
            viewToggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            setViewMode(viewMode);
        });
    });
    
    // Pagination buttons
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderPatients();
                updatePagination();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderPatients();
                updatePagination();
            }
        });
    }
    
    // Add patient button
    const addPatientBtn = document.getElementById('add-patient-btn');
    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', function() {
            openAddPatientModal();
        });
    }
    
    // Close modal buttons and overlays
    const closeModalButtons = document.querySelectorAll('.close-modal, .cancel-btn');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Patient modal tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Update active state
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            switchTab(tabName);
        });
    });
    
    // Add note form buttons
    const addNoteBtn = document.getElementById('add-note-btn');
    const cancelNoteBtn = document.getElementById('cancel-note-btn');
    const saveNoteBtn = document.getElementById('save-note-btn');
    
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', function() {
            const newNoteForm = document.getElementById('new-note-form');
            if (newNoteForm) {
                newNoteForm.style.display = 'block';
                document.getElementById('note-content').focus();
            }
        });
    }
    
    if (cancelNoteBtn) {
        cancelNoteBtn.addEventListener('click', function() {
            const newNoteForm = document.getElementById('new-note-form');
            if (newNoteForm) {
                newNoteForm.style.display = 'none';
                document.getElementById('note-content').value = '';
            }
        });
    }
    
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', saveNewNote);
    }
    
    // Add vitals button
    const addVitalsBtn = document.getElementById('add-vitals-btn');
    if (addVitalsBtn) {
        addVitalsBtn.addEventListener('click', function() {
            const addVitalsModal = document.getElementById('add-vitals-modal');
            if (addVitalsModal) {
                addVitalsModal.classList.add('show');
            }
        });
    }
    
    // Mark alert as resolved buttons
    const markResolvedBtns = document.querySelectorAll('.mark-resolved-btn');
    markResolvedBtns.forEach(button => {
        button.addEventListener('click', function() {
            const alertCard = this.closest('.alert-card');
            if (alertCard) {
                alertCard.style.opacity = '0.5';
                alertCard.style.pointerEvents = 'none';
                showToast('Viðvörun', 'Viðvörun merkt sem leyst', 'success');
            }
        });
    });
    
    // Select all checkbox for table
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('input[name="select-patient"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
}

/**
 * Filter patients based on search term and filter settings
 */
function filterPatients() {
    const searchTerm = document.getElementById('patient-search')?.value.toLowerCase() || '';
    const departmentFilter = document.getElementById('department-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const medicationFilter = document.getElementById('medication-filter')?.value || '';
    
    // Reset to first page when filtering
    currentPage = 1;
    
    // Filter the patients
    filteredPatients = patientsData.filter(patient => {
        // Search term filter
        const matchesSearch = !searchTerm || 
            `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm) ||
            patient.room.toString().includes(searchTerm) ||
            patient.primaryDiagnosis.toLowerCase().includes(searchTerm);
        
        // Department filter
        const matchesDepartment = !departmentFilter || getDepartmentLabel(patient.department) === departmentFilter;
        
        // Condition filter
        const matchesCondition = !statusFilter || getConditionLabel(patient.condition) === statusFilter;
        
        // Medication filter
        let matchesMedication = true;
        if (medicationFilter) {
            const medicationMatch = patient.medications.some(med => 
                med.name.toLowerCase().includes(medicationFilter.toLowerCase())
            );
            matchesMedication = medicationMatch;
        }
        
        return matchesSearch && matchesDepartment && matchesCondition && matchesMedication;
    });
    
    // Update the UI
    renderPatients();
    updatePagination();
}

/**
 * Reset all filters and search
 */
function resetFilters() {
    // Reset search input
    const searchInput = document.getElementById('patient-search');
    if (searchInput) searchInput.value = '';
    
    // Reset filter selects
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.value = '';
    });
    
    // Reset filtered data
    filteredPatients = [...patientsData];
    currentPage = 1;
    
    // Update UI
    renderPatients();
    updatePagination();
    
    // Show toast notification
    showToast('Síur', 'Síur endurstilltar', 'info');
}

/**
 * Set the current view mode (card or table)
 * @param {string} mode - View mode ('card' or 'table')
 */
function setViewMode(mode) {
    currentViewMode = mode;
    
    // Update view visibility
    const cardView = document.getElementById('card-view');
    const tableView = document.getElementById('table-view');
    
    if (cardView && tableView) {
        if (mode === 'card') {
            cardView.style.display = 'block';
            tableView.style.display = 'none';
        } else {
            cardView.style.display = 'none';
            tableView.style.display = 'block';
        }
    }
}

/**
 * Open patient details modal
 * @param {string} patientId - ID of the patient
 * @param {string} [activeTab='overview'] - Which tab to activate initially
 */
function openPatientDetailsModal(patientId, activeTab = 'overview') {
    const patient = patientsData.find(p => p.id === patientId);
    if (!patient) return;
    
    const modal = document.getElementById('view-patient-modal');
    if (!modal) return;
    
    // Set patient data in the modal
    // Basic info
    document.getElementById('patient-profile-name').textContent = `${patient.firstName} ${patient.lastName}`;
    document.getElementById('patient-profile-age').textContent = `${calculateAge(patient.dateOfBirth)} ára`;
    document.getElementById('patient-profile-room').textContent = `Herbergi ${patient.room}`;
    document.getElementById('patient-profile-department').textContent = getDepartmentLabel(patient.department);
    document.getElementById('patient-profile-image').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.id}`;
    
    // Status badge
    const statusBadge = document.getElementById('patient-profile-status');
    statusBadge.className = 'status-badge ' + patient.condition;
    statusBadge.textContent = getConditionLabel(patient.condition);
    
    // Vitals
    document.getElementById('patient-bp').textContent = patient.vitals.bloodPressure;
    document.getElementById('patient-pulse').textContent = patient.vitals.pulse;
    document.getElementById('patient-temp').textContent = patient.vitals.temperature + '°C';
    document.getElementById('patient-o2').textContent = patient.vitals.oxygenSaturation + '%';
    
    // Conditions list
    const diagnosesList = document.getElementById('patient-diagnoses');
    diagnosesList.innerHTML = '';
    patient.conditions.forEach(condition => {
        const li = document.createElement('li');
        li.textContent = condition.name;
        diagnosesList.appendChild(li);
    });
    
    // Medications list
    const medicationsList = document.getElementById('patient-medications-list');
    medicationsList.innerHTML = '';
    patient.medications.forEach(medication => {
        const li = document.createElement('li');
        li.textContent = `${medication.name} ${medication.dosage} - ${medication.frequency}`;
        if (medication.status === 'missed') {
            li.classList.add('text-error');
        }
        medicationsList.appendChild(li);
    });
    
    // Allergies list
    const allergiesList = document.getElementById('patient-allergies');
    allergiesList.innerHTML = '';
    patient.allergies.forEach(allergy => {
        const li = document.createElement('li');
        li.textContent = allergy;
        allergiesList.appendChild(li);
    });
    
    // Show modal
    modal.classList.add('show');
    
    // Activate specified tab
    const tabButton = document.querySelector(`.tab-btn[data-tab="${activeTab}"]`);
    if (tabButton) {
        tabButton.click();
    }
    
    // Initialize charts when the vitals tab is selected
    if (activeTab === 'vitals') {
        setTimeout(() => {
            initializeVitalsChart(patient.vitalsHistory);
        }, 300);
    }
}

/**
 * Switch between tabs in the patient details modal
 * @param {string} tabName - Name of the tab to switch to
 */
function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show the selected tab content
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // If switching to vitals tab, reinitialize the chart
    if (tabName === 'vitals') {
        const patientName = document.getElementById('patient-profile-name')?.textContent;
        if (patientName) {
            const patient = patientsData.find(p => `${p.firstName} ${p.lastName}` === patientName);
            if (patient) {
                initializeVitalsChart(patient.vitalsHistory);
            }
        }
    }
}

/**
 * Open the add patient modal
 */
function openAddPatientModal() {
    const modal = document.getElementById('add-patient-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Open the add note modal
 * @param {string} patientId - ID of the patient
 */
function openAddNoteModal(patientId) {
    openPatientDetailsModal(patientId, 'notes');
}

/**
 * Close all open modals
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });
}

/**
 * Save a new note for a patient
 */
function saveNewNote() {
    // Get the current patient name from the modal
    const patientName = document.getElementById('patient-profile-name')?.textContent;
    if (!patientName) return;
    
    // Find the patient by name
    const patient = patientsData.find(p => `${p.firstName} ${p.lastName}` === patientName);
    if (!patient) return;
    
    // Get note content and type
    const noteType = document.getElementById('note-type').value;
    const noteContent = document.getElementById('note-content').value;
    
    // Validate
    if (!noteContent.trim()) {
        showToast('Villa', 'Athugasemd má ekki vera tóm', 'error');
        return;
    }
    
    // Create new note
    const now = new Date();
    const newNote = {
        id: `note_${Date.now()}`,
        type: noteType || 'general',
        content: noteContent,
        date: now.toISOString(),
        author: 'Anna Sigurðardóttir, Hjúkrunarfræðingur'
    };
    
    // Add to patient's notes at the beginning of the array
    patient.notes.unshift(newNote);
    
    // Create note card element
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';
    noteCard.innerHTML = `
        <div class="note-header">
            <div class="note-info">
                <span class="note-date">${formatDate(now.toISOString())} - ${formatTime(now)}</span>
                <span class="note-author">Anna Sigurðardóttir, Hjúkrunarfræðingur</span>
            </div>
            <div class="note-type ${noteType}">${getNoteTypeLabel(noteType)}</div>
        </div>
        <div class="note-content">
            <p>${noteContent}</p>
        </div>
        <div class="note-actions">
            <button class="btn-outline-sm">
                <i class="fas fa-edit"></i> Breyta
            </button>
            <button class="btn-outline-sm">
                <i class="fas fa-share"></i> Deila
            </button>
        </div>
    `;
    
    // Add to notes list at the beginning
    const notesList = document.getElementById('patient-notes-list');
    if (notesList) {
        notesList.insertBefore(noteCard, notesList.firstChild);
    }
    
    // Hide form and reset it
    const newNoteForm = document.getElementById('new-note-form');
    if (newNoteForm) {
        newNoteForm.style.display = 'none';
        document.getElementById('note-type').value = 'general';
        document.getElementById('note-content').value = '';
    }
    
    // Show success toast
    showToast('Athugasemd', 'Athugasemd hefur verið vistuð', 'success');
}

/**
 * Initialize charts for the dashboard
 */
function initializeCharts() {
    // Initialize vitals chart for the first patient
    if (patientsData.length > 0) {
        initializeVitalsChart(patientsData[0].vitalsHistory);
    }
}

/**
 * Initialize vitals chart in patient details modal
 * @param {Array} vitalsHistory - History of patient vitals
 */
function initializeVitalsChart(vitalsHistory) {
    if (!vitalsHistory || vitalsHistory.length === 0) return;
    
    const ctx = document.getElementById('vitals-chart');
    if (!ctx) return;
    
    // Filter for the last 10 records
    const filteredHistory = [...vitalsHistory].slice(0, 10).reverse();
    
    // Prepare data
    const labels = filteredHistory.map(entry => formatTime(new Date(entry.timestamp)));
    const systolicData = filteredHistory.map(entry => parseInt(entry.bloodPressure.split('/')[0]));
    const diastolicData = filteredHistory.map(entry => parseInt(entry.bloodPressure.split('/')[1]));
    const pulseData = filteredHistory.map(entry => parseInt(entry.pulse));
    const temperatureData = filteredHistory.map(entry => parseFloat(entry.temperature));
    const oxygenData = filteredHistory.map(entry => parseInt(entry.oxygenSaturation));
    
    // Destroy previous chart if it exists
    if (window.vitalsChart) {
        window.vitalsChart.destroy();
    }
    
    // Get colors based on theme
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Create new chart
    window.vitalsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Slagbilsþrýstingur',
                    data: systolicData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Hlébilsþrýstingur',
                    data: diastolicData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Púls',
                    data: pulseData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Hiti (°C)',
                    data: temperatureData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    hidden: true
                },
                {
                    label: 'Súrefnismettun (%)',
                    data: oxygenData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y2',
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tími',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Blóðþrýstingur/Púls',
                        color: textColor
                    },
                    position: 'left',
                    min: 40,
                    max: 180,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y1: {
                    title: {
                        display: true,
                        text: 'Hiti (°C)',
                        color: textColor
                    },
                    position: 'right',
                    min: 35,
                    max: 40,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        display: false
                    }
                },
                y2: {
                    display: false,
                    min: 80,
                    max: 100
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
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.label === 'Hiti (°C)') {
                                return label + context.parsed.y + '°C';
                            } else if (context.dataset.label === 'Súrefnismettun (%)') {
                                return label + context.parsed.y + '%';
                            } else {
                                return label + context.parsed.y;
                            }
                        }
                    }
                }
            }
        }
    });
    
    // Set up event listeners for chart timeframe buttons
    const timeframeButtons = document.querySelectorAll('.timeframe-btn');
    timeframeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            timeframeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update chart based on selected timeframe
            // This would filter the data based on the selected timeframe
            // For demo purposes, we'll just show the same data
        });
    });
    
    // Set up event listeners for vital selector buttons
    const vitalButtons = document.querySelectorAll('.vital-btn');
    vitalButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            vitalButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Get selected vital
            const vital = this.dataset.vital;
            
            // Show/hide datasets based on selection
            if (window.vitalsChart) {
                if (vital === 'all') {
                    window.vitalsChart.data.datasets[0].hidden = false; // Systolic
                    window.vitalsChart.data.datasets[1].hidden = false; // Diastolic
                    window.vitalsChart.data.datasets[2].hidden = false; // Pulse
                    window.vitalsChart.data.datasets[3].hidden = true;  // Temperature
                    window.vitalsChart.data.datasets[4].hidden = true;  // Oxygen
                } else if (vital === 'bp') {
                    window.vitalsChart.data.datasets[0].hidden = false; // Systolic
                    window.vitalsChart.data.datasets[1].hidden = false; // Diastolic
                    window.vitalsChart.data.datasets[2].hidden = true;  // Pulse
                    window.vitalsChart.data.datasets[3].hidden = true;  // Temperature
                    window.vitalsChart.data.datasets[4].hidden = true;  // Oxygen
                } else if (vital === 'pulse') {
                    window.vitalsChart.data.datasets[0].hidden = true;  // Systolic
                    window.vitalsChart.data.datasets[1].hidden = true;  // Diastolic
                    window.vitalsChart.data.datasets[2].hidden = false; // Pulse
                    window.vitalsChart.data.datasets[3].hidden = true;  // Temperature
                    window.vitalsChart.data.datasets[4].hidden = true;  // Oxygen
                } else if (vital === 'temp') {
                    window.vitalsChart.data.datasets[0].hidden = true;  // Systolic
                    window.vitalsChart.data.datasets[1].hidden = true;  // Diastolic
                    window.vitalsChart.data.datasets[2].hidden = true;  // Pulse
                    window.vitalsChart.data.datasets[3].hidden = false; // Temperature
                    window.vitalsChart.data.datasets[4].hidden = true;  // Oxygen
                } else if (vital === 'o2') {
                    window.vitalsChart.data.datasets[0].hidden = true;  // Systolic
                    window.vitalsChart.data.datasets[1].hidden = true;  // Diastolic
                    window.vitalsChart.data.datasets[2].hidden = true;  // Pulse
                    window.vitalsChart.data.datasets[3].hidden = true;  // Temperature
                    window.vitalsChart.data.datasets[4].hidden = false; // Oxygen
                }
                
                window.vitalsChart.update();
            }
        });
    });
}

/**
 * Update charts based on theme changes
 */
function updateChartsForTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Update vitals chart
    if (window.vitalsChart) {
        // Update axis colors
        window.vitalsChart.options.scales.x.ticks.color = textColor;
        window.vitalsChart.options.scales.y.ticks.color = textColor;
        window.vitalsChart.options.scales.y1.ticks.color = textColor;
        
        window.vitalsChart.options.scales.x.title.color = textColor;
        window.vitalsChart.options.scales.y.title.color = textColor;
        window.vitalsChart.options.scales.y1.title.color = textColor;
        
        window.vitalsChart.options.scales.x.grid.color = gridColor;
        window.vitalsChart.options.scales.y.grid.color = gridColor;
        
        // Update legend colors
        window.vitalsChart.options.plugins.legend.labels.color = textColor;
        
        window.vitalsChart.update();
    }
}

/**
 * Initialize AI Assistant
 */
function initializeAIAssistant() {
    const aiWidgetButton = document.getElementById('ai-widget-toggle');
    const aiWidgetContainer = document.getElementById('ai-widget-container');
    const aiMinimizeBtn = document.getElementById('ai-minimize-btn');
    const aiClearBtn = document.getElementById('ai-clear-btn');
    const aiInput = document.getElementById('ai-widget-input');
    const aiSendBtn = document.getElementById('ai-widget-send');
    const aiMessages = document.getElementById('ai-widget-messages');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    
    // Add initial greeting message
    if (aiMessages && aiMessages.childElementCount === 0) {
        addMessageToChat('assistant', 'Sæl/sæll. Ég er NurseCare AI aðstoðarmaðurinn þinn. Hvernig get ég aðstoðað þig varðandi sjúklinga, lyf eða annað tengt umönnun?');
    }
    
    // Toggle AI widget visibility
    if (aiWidgetButton && aiWidgetContainer) {
        aiWidgetButton.addEventListener('click', function() {
            aiWidgetContainer.classList.toggle('open');
        });
    }
    
    // Minimize AI widget
    if (aiMinimizeBtn && aiWidgetContainer) {
        aiMinimizeBtn.addEventListener('click', function() {
            aiWidgetContainer.classList.remove('open');
        });
    }
    
    // Clear chat history
    if (aiClearBtn && aiMessages) {
        aiClearBtn.addEventListener('click', function() {
            // Keep only the initial greeting
            aiMessages.innerHTML = '';
            addMessageToChat('assistant', 'Spjallferill hefur verið hreinsaður. Hvernig get ég aðstoðað þig?');
            showToast('Spjall', 'Spjallferill hreinsaður', 'info');
        });
    }
    
    // Enable/disable send button based on input
    if (aiInput && aiSendBtn) {
        aiInput.addEventListener('input', function() {
            aiSendBtn.disabled = this.value.trim() === '';
        });
        
        // Send message on Enter key
        aiInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && this.value.trim() !== '') {
                e.preventDefault();
                sendChatMessage();
            }
        });
        
        // Send message on button click
        aiSendBtn.addEventListener('click', function() {
            if (aiInput.value.trim() !== '') {
                sendChatMessage();
            }
        });
    }
    
    // Add suggestion button functionality
    if (suggestionBtns) {
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const query = this.dataset.query;
                if (aiInput) {
                    aiInput.value = query;
                    aiSendBtn.disabled = false;
                    sendChatMessage();
                }
            });
        });
    }
}

/**
 * Send a message to the AI chat
 */
function sendChatMessage() {
    const aiInput = document.getElementById('ai-widget-input');
    const aiSendBtn = document.getElementById('ai-widget-send');
    const message = aiInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input and disable send button
    aiInput.value = '';
    aiSendBtn.disabled = true;
    
    // Add typing indicator
    showTypingIndicator();
    
    // Simulate API call with fetch
    setTimeout(() => {
        fetchAIResponse(message)
            .then(response => {
                // Remove typing indicator
                removeTypingIndicator();
                
                // Add AI response to chat
                addMessageToChat('assistant', response);
            })
            .catch(error => {
                console.error('Error fetching AI response:', error);
                
                // Remove typing indicator
                removeTypingIndicator();
                
                // Add error message
                addMessageToChat('assistant', 'Því miður kom upp villa við að svara fyrirspurninni. Vinsamlegast reyndu aftur.');
                
                // Show error toast
                showToast('Villa', 'Gat ekki tengst gervigreind', 'error');
            });
    }, 500);
}

/**
 * Add a message to the AI chat
 * @param {string} sender - Message sender ('user' or 'assistant')
 * @param {string} message - Message text
 */
function addMessageToChat(sender, message) {
    const aiMessages = document.getElementById('ai-widget-messages');
    if (!aiMessages) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('is-IS', {hour: '2-digit', minute: '2-digit'});
    
    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${sender}-message`;
    
    const iconClass = sender === 'user' ? 'fa-user' : 'fa-robot';
    
    messageEl.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="message-bubble">
            <div class="message-text">${message}</div>
            <div class="message-time">${timeString}</div>
        </div>
    `;
    
    aiMessages.appendChild(messageEl);
    
    // Scroll to bottom
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

/**
 * Show typing indicator in AI chat
 */
function showTypingIndicator() {
    const aiMessages = document.getElementById('ai-widget-messages');
    if (!aiMessages) return;
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'ai-message assistant-message typing-indicator';
    typingIndicator.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-bubble typing">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    aiMessages.appendChild(typingIndicator);
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

/**
 * Remove typing indicator from AI chat
 */
function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Fetch AI response from API (simulation)
 * @param {string} message - User message
 * @returns {Promise<string>} - AI response
 */
async function fetchAIResponse(message) {
    // In a real app, this would be an API call to a backend
    try {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // This is where you would make an actual fetch request to your AI backend
        // For demo purposes, we'll use some logic to generate responses
        
        const messageLower = message.toLowerCase();
        
        // Check for patient-related queries
        if (messageLower.includes('sjúklinga') || messageLower.includes('sjúklingur') || messageLower.includes('jón')) {
            if (messageLower.includes('áhættu') || messageLower.includes('viðvörun')) {
                return `Það eru 2 sjúklingar í áhættuhópi í dag:\n\n- Jón Jónsson (herbergi 107): Hækkaður blóðþrýstingur, missti af morgundós af Lisinopril\n- María Guðmundsdóttir (herbergi 112): Hækkaður hiti, möguleg sýking í þvagfærum`;
            } else if (messageLower.includes('lífsmörk') || messageLower.includes('vital')) {
                return `Síðustu lífsmörk fyrir Jón Jónsson (herbergi 107):\n\n- Blóðþrýstingur: 170/95 mmHg (hækkað)\n- Púls: 92 slög/mín\n- Hiti: 37.2°C\n- Súrefnismettun: 96%\n\nMælt með áframhaldandi eftirliti á 2 klst. fresti.`;
            } else if (messageLower.includes('deild 3') || messageLower.includes('alzheimer')) {
                return `Deild 3 - Alzheimer er með 12 sjúklinga í dag. 2 sjúklingar þarfnast athygli vegna frávika í lífsmörkum og 1 hefur tapað lyfjaskammti. Það eru 3 læknisheimsóknir áætlaðar í dag.`;
            }
            
            // General patient info
            return `Í dag eru 12 sjúklingar skráðir á vaktina þína. 10 eru í stöðugu ástandi, 2 þarfnast athygli. Sjúklingalistann er hægt að sjá í yfirliti neðar á síðunni.`;
        }
        
        // Check for medication-related queries
        if (messageLower.includes('lyf') || messageLower.includes('lyfjagjöf') || messageLower.includes('skammt')) {
            if (messageLower.includes('næsta') || messageLower.includes('klukkutíma')) {
                return `Næstu lyfjagjafir:\n\n- Kl. 16:00: María Guðmundsdóttir (herbergi 112) - Paracetamol 1000mg\n- Kl. 16:30: Jón Jónsson (herbergi 107) - Metformin 500mg\n- Kl. 17:00: Guðrún Jónsdóttir (herbergi 103) - Insulin 10 einingar`;
            } else if (messageLower.includes('misst') || messageLower.includes('gleymst')) {
                return `Eftirfarandi lyf hafa ekki verið gefin í dag:\n\n- Jón Jónsson (herbergi 107) - Lisinopril 10mg (morgundós)\n- Guðrún Jónsdóttir (herbergi 103) - Furosemide 40mg (morgundós)`;
            }
            
            // General medication info
            return `Lyfjagjöf er 85% lokið í dag. 2 sjúklingar hafa ekki fengið morgundós. Næstu lyfjagjafir eru áætlaðar kl. 16:00.`;
        }
        
        // Check for staff-related queries
        if (messageLower.includes('starfsfólk') || messageLower.includes('starfsma')) {
            return `Á vaktinni í dag eru:\n\n- Anna Sigurðardóttir (vaktstjóri)\n- Gunnar Þórsson (hjúkrunarfræðingur)\n- Jóhanna Kristjánsdóttir (sjúkraliði)\n- Pétur Jónsson (sjúkraliði)\n\nÓlafur Gunnarsson (læknir) er á vakt til kl. 16:00.`;
        }
        
        // Check for help or general queries
        if (messageLower.includes('hjálp') || messageLower.includes('hvernig') || messageLower.includes('hvað geturðu')) {
            return `Ég get aðstoðað þig með upplýsingar um:\n\n- Sjúklinga og heilsufarsástand þeirra\n- Lyfjagjafir og áætlanir\n- Viðvaranir og frávik í lífsmörkum\n- Starfsfólk á vakt\n- Birgðastöðu og áhöld\n\nÞú getur einnig spurt um ákveðna sjúklinga eða deild. Hvernig get ég aðstoðað þig?`;
        }
        
        // Generic response for other queries
        return `Takk fyrir fyrirspurnina. Ég mun reyna að aðstoða þig sem best. Þú getur spurt mig um sjúklinga, lyfjagjafir, viðvaranir og fleira tengt hjúkrun. Hafðu í huga að ég er ennþá að læra og þróast, svo vinsamlegast hafðu samband við vaktstjóra ef þú þarft nákvæmari upplýsingar.`;
    } catch (error) {
        console.error('Error in fetchAIResponse:', error);
        throw new Error('Failed to get response from AI service');
    }
}

/**
 * Initialize scroll to top functionality
 */
function initializeScrollToTop() {
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    
    if (scrollTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });
        
        // Scroll to top when clicked
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Show a toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type ('success', 'error', 'warning', 'info')
 */
function showToast(title, message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    
    // Get appropriate icon
    let iconClass;
    switch (type) {
        case 'success':
            iconClass = 'fa-check-circle';
            break;
        case 'error':
            iconClass = 'fa-times-circle';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle';
            break;
        default:
            iconClass = 'fa-info-circle';
    }
    
    // Set toast content
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Loka tilkynningu">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add close functionality
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date of birth string (YYYY-MM-DD)
 * @returns {number} Age in years
 */
function calculateAge(dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * Format a date string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('is-IS', options);
}

/**
 * Format a time
 * @param {Date} date - Date object
 * @returns {string} Formatted time (HH:MM)
 */
function formatTime(date) {
    return date.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get condition label based on condition value
 * @param {string} condition - Condition value
 * @returns {string} Human-readable condition label
 */
function getConditionLabel(condition) {
    switch (condition) {
        case 'stable':
            return 'Stöðugt';
        case 'attention':
            return 'Þarfnast athygli';
        case 'critical':
            return 'Alvarlegt';
        default:
            return condition;
    }
}

/**
 * Get department label based on department value
 * @param {string} department - Department value
 * @returns {string} Human-readable department label
 */
function getDepartmentLabel(department) {
    switch (department) {
        case 'alzheimer':
            return 'Deild 3 – Alzheimer';
        case 'general':
            return 'Deild 2 – Almenn';
        case 'rehab':
            return 'Deild 1 – Endurhæfing';
        default:
            return department;
    }
}

/**
 * Get note type label based on type value
 * @param {string} type - Note type value
 * @returns {string} Human-readable note type label
 */
function getNoteTypeLabel(type) {
    switch (type) {
        case 'general':
            return 'Almenn athugasemd';
        case 'medical':
            return 'Læknisfræðileg athugasemd';
        case 'nursing':
            return 'Hjúkrunarathugasemd';
        case 'behavior':
            return 'Hegðunarathugasemd';
        default:
            return type;
    }
}

/**
 * Generate random vitals history for demo purposes
 * @returns {Array} Random vitals history
 */
function generateRandomVitalsHistory() {
    const history = [];
    const now = new Date();
    
    // Generate data for the past 24 hours
    for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        
        // Generate random vitals with some variation but trending values
        const systolic = 120 + Math.floor(Math.random() * 30) - 15;
        const diastolic = 80 + Math.floor(Math.random() * 20) - 10;
        const pulse = 70 + Math.floor(Math.random() * 20) - 10;
        const temp = 36.5 + (Math.random() * 1) - 0.5;
        const o2 = 95 + Math.floor(Math.random() * 5);
        
        history.push({
            timestamp: timestamp.toISOString(),
            bloodPressure: `${systolic}/${diastolic}`,
            pulse: pulse.toString(),
            temperature: temp.toFixed(1),
            oxygenSaturation: o2.toString()
        });
    }
    
    return history;
}

/**
 * Mock patient data for demonstration
 */
const patientsData = [
    {
        id: "1",
        firstName: "Jón",
        lastName: "Jónsson",
        dateOfBirth: "1953-05-15",
        gender: "male",
        room: "107",
        department: "alzheimer",
        condition: "attention",
        primaryDiagnosis: "Alzheimer's",
        conditions: [
            { name: "Alzheimer's sjúkdómur", primary: true },
            { name: "Háþrýstingur", primary: false },
            { name: "Sykursýki af tegund 2", primary: false }
        ],
        allergies: ["Penicillín", "Sulfa lyf"],
        medications: [
            { 
                id: "med_1_1", 
                name: "Lisinopril", 
                dosage: "10mg", 
                frequency: "Daglega að morgni", 
                status: "missed"
            },
            { 
                id: "med_1_2", 
                name: "Metformin", 
                dosage: "500mg", 
                frequency: "Tvisvar á dag", 
                status: "pending"
            },
            { 
                id: "med_1_3", 
                name: "Donepezil", 
                dosage: "5mg", 
                frequency: "Daglega að kvöldi", 
                status: "completed"
            }
        ],
        vitals: {
            bloodPressure: "170/95",
            pulse: "92",
            temperature: "37.2",
            oxygenSaturation: "96"
        },
        vitalsHistory: generateRandomVitalsHistory(),
        notes: [
            {
                id: "note_1_1",
                type: "medical",
                content: "Sjúklingur hefur misst af morgundós af Lisinopril. Blóðþrýstingur mældist 170/95 mmHg. Sjúklingur segist hafa fundið fyrir höfuðverk frá kl. 14:00. Gaf 500mg af parasetamól við 15:30. Fylgist með blóðþrýstingi á 2 klst. fresti.",
                date: "2025-04-16T15:45:00",
                author: "Anna Sigurðardóttir, Hjúkrunarfræðingur"
            },
            {
                id: "note_1_2",
                type: "general",
                content: "Læknisheimsókn. Reglubundin skoðun. Blóðþrýstingur enn hár þrátt fyrir meðferð með Lisinopril 10mg daglega. Sykurgildi í blóði innan eðlilegra marka. Vitrænir þættir: vaxandi gleymsla, en sjúklingur þekkir enn fjölskyldumeðlimi. Áætlun: Halda áfram með núverandi lyfjagjöf. Hugsanlega þörf á að endurmeta skammta Lisinopril ef blóðþrýstingur helst hár. Mælt með daglegri skráningu blóðþrýstings næstu tvær vikur.",
                date: "2025-04-15T10:20:00",
                author: "Gunnar Þórsson, Læknir"
            }
        ],
        assignedNurse: "Anna Sigurðardóttir"
    },
    {
        id: "2",
        firstName: "María",
        lastName: "Guðmundsdóttir",
        dateOfBirth: "1948-09-23",
        gender: "female",
        room: "112",
        department: "alzheimer",
        condition: "attention",
        primaryDiagnosis: "Þvagfærasýking",
        conditions: [
            { name: "Þvagfærasýking", primary: true },
            { name: "Alzheimer's sjúkdómur", primary: false },
            { name: "Hjartasjúkdómur", primary: false }
        ],
        allergies: ["Latex"],
        medications: [
            { 
                id: "med_2_1", 
                name: "Ciprofloxacin", 
                dosage: "500mg", 
                frequency: "Tvisvar á dag", 
                status: "completed"
            },
            { 
                id: "med_2_2", 
                name: "Paracetamol", 
                dosage: "1000mg", 
                frequency: "Eftir þörfum", 
                status: "pending"
            },
            { 
                id: "med_2_3", 
                name: "Memantine", 
                dosage: "10mg", 
                frequency: "Daglega", 
                status: "completed"
            }
        ],
        vitals: {
            bloodPressure: "125/80",
            pulse: "88",
            temperature: "38.5",
            oxygenSaturation: "95"
        },
        vitalsHistory: generateRandomVitalsHistory(),
        notes: [
            {
                id: "note_2_1",
                type: "medical",
                content: "Sjúklingur með hækkað hitastig (38.5°C). Sýni tekið og sent í ræktun, grunur um þvagfærasýkingu. Byrjað á sýklalyfjameðferð með Ciprofloxacin. Gefið Paracetamol 1000mg kl. 14:00 við hita.",
                date: "2025-04-16T14:30:00",
                author: "Gunnar Þórsson, Læknir"
            }
        ],
        assignedNurse: "Jóhanna Kristjánsdóttir"
    },
    {
        id: "3",
        firstName: "Gunnar",
        lastName: "Sigurðsson",
        dateOfBirth: "1940-12-10",
        gender: "male",
        room: "105",
        department: "alzheimer",
        condition: "stable",
        primaryDiagnosis: "Alzheimer's",
        conditions: [
            { name: "Alzheimer's sjúkdómur", primary: true },
            { name: "Liðagigt", primary: false }
        ],
        allergies: [],
        medications: [
            { 
                id: "med_3_1", 
                name: "Donepezil", 
                dosage: "10mg", 
                frequency: "Daglega", 
                status: "completed"
            },
            { 
                id: "med_3_2", 
                name: "Ibuprofen", 
                dosage: "400mg", 
                frequency: "Eftir þörfum", 
                status: "completed"
            }
        ],
        vitals: {
            bloodPressure: "130/85",
            pulse: "72",
            temperature: "36.5",
            oxygenSaturation: "98"
        },
        vitalsHistory: generateRandomVitalsHistory(),
        notes: [],
        assignedNurse: "Pétur Jónsson"
    },
    {
        id: "4",
        firstName: "Guðrún",
        lastName: "Jónsdóttir",
        dateOfBirth: "1935-03-08",
        gender: "female",
        room: "103",
        department: "alzheimer",
        condition: "stable",
        primaryDiagnosis: "Alzheimer's",
        conditions: [
            { name: "Alzheimer's sjúkdómur", primary: true },
            { name: "Hjartabilun", primary: false },
            { name: "Nýrnabilun", primary: false }
        ],
        allergies: ["Penisillín", "Aspirin"],
        medications: [
            { 
                id: "med_4_1", 
                name: "Furosemide", 
                dosage: "40mg", 
                frequency: "Daglega", 
                status: "missed"
            },
            { 
                id: "med_4_2", 
                name: "Donepezil", 
                dosage: "5mg", 
                frequency: "Daglega", 
                status: "completed"
            }
        ],
        vitals: {
            bloodPressure: "145/85",
            pulse: "78",
            temperature: "36.8",
            oxygenSaturation: "94"
        },
        vitalsHistory: generateRandomVitalsHistory(),
        notes: [],
        assignedNurse: "Pétur Jónsson"
    },
    {
        id: "5",
        firstName: "Ólafur",
        lastName: "Magnússon",
        dateOfBirth: "1950-07-20",
        gender: "male",
        room: "109",
        department: "alzheimer",
        condition: "stable",
        primaryDiagnosis: "Alzheimer's",
        conditions: [
            { name: "Alzheimer's sjúkdómur", primary: true },
            { name: "Sykursýki af tegund 2", primary: false }
        ],
        allergies: [],
        medications: [
            { 
                id: "med_5_1", 
                name: "Metformin", 
                dosage: "850mg", 
                frequency: "Tvisvar á dag", 
                status: "completed"
            },
            { 
                id: "med_5_2", 
                name: "Donepezil", 
                dosage: "5mg", 
                frequency: "Daglega", 
                status: "pending"
            }
        ],
        vitals: {
            bloodPressure: "135/80",
            pulse: "75",
            temperature: "36.7",
            oxygenSaturation: "97"
        },
        vitalsHistory: generateRandomVitalsHistory(),
        notes: [],
        assignedNurse: "Jóhanna Kristjánsdóttir"
    },
    {
        id: "6",
        firstName: "Kristín",
        lastName: "Jóhannsdóttir",
        dateOfBirth: "1945-02-15",
        gender: "female",
        room: "110",
        department: "alzheimer",
        condition: "stable",
        primaryDiagnosis: "Alzheimer's",
        conditions: [
            { name: "Alzheimer's sjúkdómur", primary: true },
            { name: "Háþrýstingur", primary: false }
        ],
        allergies: ["Sulfa lyf"],
        medications: [
            { 
                id: "med_6_1", 
                name: "Amlodipine", 
                dosage: "5mg", 
                frequency: "Daglega", 
                status: "completed"
            },
            { 
                id: "med_6_2", 
                name: "Donepezil", 
                dosage: "10mg", 
                frequency: "Daglega", 
                status: "completed"
            }
        ],
        vitals: {
            bloodPressure: "140/85",
            pulse: "80",
            temperature: "36.6",
            oxygenSaturation: "96"
        },
        vitalsHistory: generateRandomVitalsHistory(),
        notes: [],
        assignedNurse: "Anna Sigurðardóttir"
    }
];