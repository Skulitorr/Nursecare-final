/**
 * NurseCare AI - Staff Management
 * Handles all staff page functionality including:
 * - Staff data display and management
 * - Search and filtering
 * - Modal interactions
 * - Charts
 * - AI assistant
 */

import { validateSession, logout } from './auth.js';

console.log('Staff Management Module Loaded');

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Staff Management page...');
    
    // Set global chart defaults
    if (window.Chart) {
        console.log('Setting Chart.js defaults');
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
        Chart.defaults.plugins.legend.display = true;
        Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    } else {
        console.error('Chart.js library not found! Charts will not render.');
    }
    
    if (!validateSession()) {
        console.warn("Session validation failed, redirecting to login");
        return;
    }

    // Initialize components with proper console debugging
    console.log("Starting staff page initialization");
    initializeDashboard();
    initializeStaffManagement();
    initializeCharts();
    initializeModalHandlers();
    initializeAIChat();
    initializeScrollToTop();
    
    // Set up event listeners for buttons and interactions
    setupEventListeners();
    console.log("Staff page initialization completed");
});

// Mock staff data for demonstration
const staffData = [
    {
        id: 1,
        name: 'Anna Jónsdóttir',
        role: 'Hjúkrunarfræðingur',
        department: 'Deild A',
        status: 'Á vakt',
        shift: 'Morgunvakt (07:00-15:00)',
        email: 'anna@nursecare.is',
        phone: '555-1234',
        certification: 'Hjúkrunardiplóma, Sérhæfing í öldrunarhjúkrun',
        notes: 'Vaktstjóri á morgunvakt',
        avatar: 'anna'
    },
    {
        id: 2,
        name: 'Jón Gunnarsson',
        role: 'Sjúkraliði',
        department: 'Deild B',
        status: 'Á vakt',
        shift: 'Morgunvakt (07:00-15:00)',
        email: 'jon@nursecare.is',
        phone: '555-2345',
        certification: 'Sjúkraliðapróf',
        notes: 'Mikil reynsla í umönnun heilabilaðra',
        avatar: 'jon'
    },
    {
        id: 3,
        name: 'Guðrún Pálsdóttir',
        role: 'Hjúkrunarfræðingur',
        department: 'Deild A',
        status: 'Veikur',
        shift: '',
        email: 'gudrun@nursecare.is',
        phone: '555-3456',
        certification: 'Hjúkrunardiplóma',
        notes: 'Tilkynnti veikindi í dag, búið að manna afleysingu',
        avatar: 'gudrun'
    },
    {
        id: 4,
        name: 'Ólafur Sigurðsson',
        role: 'Læknir',
        department: 'Deild C',
        status: 'Á vakt',
        shift: 'Dagvakt (09:00-17:00)',
        email: 'olafur@nursecare.is',
        phone: '555-4567',
        certification: 'Sérfræðingur í öldrunarlækningum',
        notes: '',
        avatar: 'olafur'
    },
    {
        id: 5,
        name: 'Kristín Jónsdóttir',
        role: 'Sjúkraliði',
        department: 'Deild B',
        status: 'Frí',
        shift: '',
        email: 'kristin@nursecare.is',
        phone: '555-5678',
        certification: 'Sjúkraliðapróf',
        notes: 'Kemur aftur til vinnu á morgun',
        avatar: 'kristin'
    },
    {
        id: 6,
        name: 'Gunnar Pétursson',
        role: 'Aðstoðarfólk',
        department: 'Deild A',
        status: 'Á vakt',
        shift: 'Morgunvakt (07:00-15:00)',
        email: 'gunnar@nursecare.is',
        phone: '555-6789',
        certification: '',
        notes: '',
        avatar: 'gunnar'
    },
    {
        id: 7,
        name: 'Lilja Björnsdóttir',
        role: 'Hjúkrunarfræðingur',
        department: 'Deild C',
        status: 'Á vakt',
        shift: 'Dagvakt (09:00-17:00)',
        email: 'lilja@nursecare.is',
        phone: '555-7890',
        certification: 'Hjúkrunardiplóma, sérhæfing í sykursýki',
        notes: '',
        avatar: 'lilja'
    },
    {
        id: 8,
        name: 'Magnús Þórðarson',
        role: 'Læknir',
        department: 'Deild D',
        status: 'Á vakt',
        shift: 'Dagvakt (09:00-17:00)',
        email: 'magnus@nursecare.is',
        phone: '555-8901',
        certification: 'Sérfræðingur í innkirtlalækningum',
        notes: '',
        avatar: 'magnus'
    },
    {
        id: 9,
        name: 'Sigrún Ólafsdóttir',
        role: 'Sjúkraliði',
        department: 'Deild D',
        status: 'Veikur',
        shift: '',
        email: 'sigrun@nursecare.is',
        phone: '555-9012',
        certification: 'Sjúkraliðapróf',
        notes: 'Hefur verið veik í 2 daga',
        avatar: 'sigrun'
    },
    {
        id: 10,
        name: 'Helgi Jónsson',
        role: 'Aðstoðarfólk',
        department: 'Deild B',
        status: 'Á vakt',
        shift: 'Kvöldvakt (15:00-23:00)',
        email: 'helgi@nursecare.is',
        phone: '555-0123',
        certification: '',
        notes: '',
        avatar: 'helgi'
    },
    {
        id: 11,
        name: 'Katrín Sveinsdóttir',
        role: 'Ræsting',
        department: 'Deild A',
        status: 'Á vakt',
        shift: 'Morgunvakt (07:00-15:00)',
        email: 'katrin@nursecare.is',
        phone: '555-1234',
        certification: '',
        notes: '',
        avatar: 'katrin'
    },
    {
        id: 12,
        name: 'Arnar Guðmundsson',
        role: 'Hjúkrunarfræðingur',
        department: 'Deild D',
        status: 'Frí',
        shift: '',
        email: 'arnar@nursecare.is',
        phone: '555-2345',
        certification: 'Hjúkrunardiplóma',
        notes: '',
        avatar: 'arnar'
    },
    {
        id: 13,
        name: 'Eva Björnsdóttir',
        role: 'Sjúkraliði',
        department: 'Deild C',
        status: 'Á vakt',
        shift: 'Morgunvakt (07:00-15:00)',
        email: 'eva@nursecare.is',
        phone: '555-3456',
        certification: 'Sjúkraliðapróf',
        notes: '',
        avatar: 'eva'
    },
    {
        id: 14,
        name: 'Stefán Sigurðsson',
        role: 'Aðstoðarfólk',
        department: 'Deild D',
        status: 'Á vakt',
        shift: 'Kvöldvakt (15:00-23:00)',
        email: 'stefan@nursecare.is',
        phone: '555-4567',
        certification: '',
        notes: '',
        avatar: 'stefan'
    },
    {
        id: 15,
        name: 'Þóra Magnúsdóttir',
        role: 'Hjúkrunarfræðingur',
        department: 'Deild B',
        status: 'Á vakt',
        shift: 'Morgunvakt (07:00-15:00)',
        email: 'thora@nursecare.is',
        phone: '555-5678',
        certification: 'Hjúkrunardiplóma',
        notes: '',
        avatar: 'thora'
    },
    {
        id: 16,
        name: 'Haraldur Gíslason',
        role: 'Ræsting',
        department: 'Deild C',
        status: 'Frí',
        shift: '',
        email: 'haraldur@nursecare.is',
        phone: '555-6789',
        certification: '',
        notes: '',
        avatar: 'haraldur'
    },
    {
        id: 17,
        name: 'Dagný Ólafsdóttir',
        role: 'Sjúkraliði',
        department: 'Deild A',
        status: 'Á vakt',
        shift: 'Kvöldvakt (15:00-23:00)',
        email: 'dagny@nursecare.is',
        phone: '555-7890',
        certification: 'Sjúkraliðapróf',
        notes: '',
        avatar: 'dagny'
    },
    {
        id: 18,
        name: 'Bjarni Jónsson',
        role: 'Hjúkrunarfræðingur',
        department: 'Deild C',
        status: 'Á vakt',
        shift: 'Kvöldvakt (15:00-23:00)',
        email: 'bjarni@nursecare.is',
        phone: '555-8901',
        certification: 'Hjúkrunardiplóma',
        notes: '',
        avatar: 'bjarni'
    },
    {
        id: 19,
        name: 'Halldóra Guðmundsdóttir',
        role: 'Aðstoðarfólk',
        department: 'Deild A',
        status: 'Á vakt',
        shift: 'Kvöldvakt (15:00-23:00)',
        email: 'halldora@nursecare.is',
        phone: '555-9012',
        certification: '',
        notes: '',
        avatar: 'halldora'
    },
    {
        id: 20,
        name: 'Tómas Jóhannsson',
        role: 'Aðstoðarfólk',
        department: 'Deild B',
        status: 'Frí',
        shift: '',
        email: 'tomas@nursecare.is',
        phone: '555-0123',
        certification: '',
        notes: '',
        avatar: 'tomas'
    },
    {
        id: 21,
        name: 'Ásta Valentínusdóttir',
        role: 'Sjúkraliði',
        department: 'Deild D',
        status: 'Á vakt',
        shift: 'Morgunvakt (07:00-15:00)',
        email: 'asta@nursecare.is',
        phone: '555-1234',
        certification: 'Sjúkraliðapróf',
        notes: '',
        avatar: 'asta'
    },
    {
        id: 22,
        name: 'Friðrik Þórsson',
        role: 'Læknir',
        department: 'Deild A',
        status: 'Á vakt',
        shift: 'Dagvakt (09:00-17:00)',
        email: 'fridrik@nursecare.is',
        phone: '555-2345',
        certification: 'Sérfræðingur í tauga- og öldrunarlækningum',
        notes: '',
        avatar: 'fridrik'
    }
];

// Global variables to track current state
let currentPage = 1;
const rowsPerPage = 8;
let filteredData = [...staffData];
let selectedStaffIds = [];

// Initialize dashboard functionality
function initializeDashboard() {
    console.log('Initializing staff dashboard components...');
    
    // Update current date and time
    updateDateTime();
    
    // Initialize dropdowns
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', function() {
            console.debug('Toggling notifications menu');
            notificationsMenu.classList.toggle('show');
        });
    } else {
        console.warn("Notifications elements not found");
    }
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', function() {
            console.debug('Toggling profile menu');
            profileMenu.classList.toggle('show');
        });
    } else {
        console.warn("Profile elements not found");
    }
    
    // Set up theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            updateThemeIcon(true);
        }
        
        themeToggle.addEventListener('click', function() {
            console.debug('Toggling dark mode');
            const isDark = document.body.classList.toggle('dark-mode');
            updateThemeIcon(isDark);
            localStorage.setItem('darkMode', isDark);
            updateChartsForTheme();
        });
    } else {
        console.warn("Theme toggle button not found");
    }
    
    console.debug('Dashboard initialization complete');
}

// Update theme icon based on current mode
function updateThemeIcon(isDarkMode) {
    console.debug(`Updating theme icon, dark mode: ${isDarkMode}`);
    const iconElement = document.querySelector('#theme-toggle i');
    const textElement = document.querySelector('#theme-toggle span');
    
    if (iconElement && textElement) {
        if (isDarkMode) {
            iconElement.className = 'fas fa-sun';
            textElement.textContent = 'Light Mode';
        } else {
            iconElement.className = 'fas fa-moon';
            textElement.textContent = 'Dark Mode';
        }
    }
}

// Update date and time display
function updateDateTime() {
    console.debug('Updating date and time display');
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('is-IS', options);
        dateElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${dateString}`;
    } else {
        console.warn("Date element not found");
    }
}

// Initialize staff management functionality
function initializeStaffManagement() {
    console.log('Initializing staff management...');
    
    // Initialize search functionality
    const searchInput = document.getElementById('staff-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            console.debug('Search input changed, filtering staff data');
            filterStaffData();
        });
    } else {
        console.warn("Search input not found");
    }
    
    // Initialize filter selects
    const filters = ['role-filter', 'department-filter', 'status-filter'];
    filters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', function() {
                console.debug(`Filter ${filterId} changed, filtering staff data`);
                filterStaffData();
            });
        } else {
            console.warn(`Filter element not found: ${filterId}`);
        }
    });
    
    // Initialize pagination
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', function() {
            if (currentPage > 1) {
                console.debug('Moving to previous page');
                currentPage--;
                populateStaffTable();
            }
        });
        
        nextButton.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            if (currentPage < totalPages) {
                console.debug('Moving to next page');
                currentPage++;
                populateStaffTable();
            }
        });
    } else {
        console.warn("Pagination buttons not found");
    }
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            console.debug(`Select all checkbox toggled: ${this.checked}`);
            const checked = this.checked;
            
            // Get all visible checkboxes
            const start = (currentPage - 1) * rowsPerPage;
            const end = Math.min(start + rowsPerPage, filteredData.length);
            const visibleStaffIds = filteredData.slice(start, end).map(staff => staff.id);
            
            // Update selected state
            if (checked) {
                // Add all visible IDs that aren't already selected
                visibleStaffIds.forEach(id => {
                    if (!selectedStaffIds.includes(id)) {
                        selectedStaffIds.push(id);
                    }
                });
            } else {
                // Remove all visible IDs
                selectedStaffIds = selectedStaffIds.filter(id => !visibleStaffIds.includes(id));
            }
            
            // Update checkboxes
            updateStaffCheckboxes();
            
            // Update remove button state
            updateRemoveButtonState();
        });
    } else {
        console.warn("Select all checkbox not found");
    }
    
    // Initialize remove selected button
    const removeSelectedBtn = document.getElementById('remove-selected-btn');
    if (removeSelectedBtn) {
        removeSelectedBtn.addEventListener('click', function() {
            console.debug('Remove selected button clicked');
            if (selectedStaffIds.length > 0) {
                openConfirmModal('Fjarlægja valið starfsfólk?', 
                    `Ertu viss um að þú viljir fjarlægja ${selectedStaffIds.length} starfsmenn?`, 
                    deleteSelectedStaff);
            }
        });
    } else {
        console.warn("Remove selected button not found");
    }
    
    // Initialize export button
    const exportBtn = document.getElementById('export-staff-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            console.debug('Export staff button clicked');
            exportStaffData();
        });
    } else {
        console.warn("Export button not found");
    }
    
    // Initially populate table
    populateStaffTable();
    console.debug('Staff management initialization complete');
}

// Filter staff data based on search and filters
function filterStaffData() {
    console.debug('Filtering staff data');
    
    const searchTerm = document.getElementById('staff-search')?.value?.toLowerCase() || '';
    const roleFilter = document.getElementById('role-filter')?.value || '';
    const departmentFilter = document.getElementById('department-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    
    filteredData = staffData.filter(staff => {
        // Search filter
        const nameMatch = staff.name.toLowerCase().includes(searchTerm);
        const emailMatch = staff.email.toLowerCase().includes(searchTerm);
        const searchMatch = nameMatch || emailMatch;
        
        // Role filter
        const roleMatch = !roleFilter || staff.role === roleFilter;
        
        // Department filter
        const departmentMatch = !departmentFilter || staff.department === departmentFilter;
        
        // Status filter
        const statusMatch = !statusFilter || staff.status === statusFilter;
        
        return searchMatch && roleMatch && departmentMatch && statusMatch;
    });
    
    // Reset to first page when filters change
    currentPage = 1;
    
    // Update table with filtered data
    populateStaffTable();
    
    // Update staff charts with filtered data
    updateStaffCharts();
    
    console.debug(`Filtered data: ${filteredData.length} staff members match criteria`);
}

// Populate staff table with data
function populateStaffTable() {
    console.debug('Populating staff table');
    
    const tableBody = document.getElementById('staff-table-body');
    
    if (!tableBody) {
        console.error("Staff table body element not found");
        return;
    }
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Get current page data
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredData.length);
    const pageData = filteredData.slice(start, end);
    
    // Check if we have no data
    if (pageData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" class="no-data">Enginn starfsmaður fannst</td>`;
        tableBody.appendChild(row);
    }
    
    // Add rows
    pageData.forEach(staff => {
        const row = document.createElement('tr');
        row.dataset.id = staff.id;
        
        const isSelected = selectedStaffIds.includes(staff.id);
        const statusClass = staff.status === 'Veikur' ? 'status-sick' : 
                           staff.status === 'Frí' ? 'status-off' : 'status-active';
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="staff-checkbox" data-id="${staff.id}" 
                       aria-label="Velja ${staff.name}" ${isSelected ? 'checked' : ''}>
            </td>
            <td class="staff-name">
                <div class="staff-name-cell">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.avatar || staff.name}" 
                         alt="Avatar for ${staff.name}" class="staff-avatar-small">
                    ${staff.name}
                </div>
            </td>
            <td>${staff.role}</td>
            <td>${staff.department}</td>
            <td><span class="status-badge ${statusClass}">${staff.status}</span></td>
            <td>${staff.shift || '—'}</td>
            <td>${staff.email}</td>
            <td class="actions-cell">
                <button class="action-btn view-btn" data-id="${staff.id}" aria-label="Skoða ${staff.name}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" data-id="${staff.id}" aria-label="Breyta ${staff.name}">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${staff.id}" aria-label="Eyða ${staff.name}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to row buttons
    addStaffRowEventListeners();
    
    // Update pagination information
    updatePagination();
    
    // Update select all checkbox
    updateSelectAllCheckbox();
    
    console.debug(`Table populated with ${pageData.length} staff members`);
}

// Add event listeners to staff table row buttons
function addStaffRowEventListeners() {
    console.debug('Adding event listeners to staff table rows');
    
    // Staff checkboxes
    document.querySelectorAll('.staff-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const staffId = parseInt(this.dataset.id);
            if (this.checked) {
                if (!selectedStaffIds.includes(staffId)) {
                    selectedStaffIds.push(staffId);
                }
            } else {
                selectedStaffIds = selectedStaffIds.filter(id => id !== staffId);
            }
            
            // Update remove button state
            updateRemoveButtonState();
            
            // Update the select all checkbox
            updateSelectAllCheckbox();
        });
    });
    
    // View buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const staffId = parseInt(this.dataset.id);
            console.debug(`View button clicked for staff ID: ${staffId}`);
            viewStaffDetails(staffId);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const staffId = parseInt(this.dataset.id);
            console.debug(`Edit button clicked for staff ID: ${staffId}`);
            editStaff(staffId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const staffId = parseInt(this.dataset.id);
            console.debug(`Delete button clicked for staff ID: ${staffId}`);
            confirmDeleteStaff(staffId);
        });
    });
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all');
    if (!selectAllCheckbox) return;
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredData.length);
    const visibleStaffIds = filteredData.slice(start, end).map(staff => staff.id);
    
    // Check if all visible staff are selected
    const allSelected = visibleStaffIds.length > 0 && 
                        visibleStaffIds.every(id => selectedStaffIds.includes(id));
    
    selectAllCheckbox.checked = allSelected;
}

// Update all staff checkboxes to match selection state
function updateStaffCheckboxes() {
    document.querySelectorAll('.staff-checkbox').forEach(checkbox => {
        const staffId = parseInt(checkbox.dataset.id);
        checkbox.checked = selectedStaffIds.includes(staffId);
    });
}

// Update pagination information
function updatePagination() {
    console.debug('Updating pagination');
    
    const showingStart = document.getElementById('showing-start');
    const showingEnd = document.getElementById('showing-end');
    const totalEntries = document.getElementById('total-entries');
    const totalPages = document.getElementById('total-pages');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const currentPageDisplay = document.querySelector('.current-page');
    
    if (!showingStart || !showingEnd || !totalEntries || !totalPages || !prevButton || !nextButton || !currentPageDisplay) {
        console.warn("Pagination elements not found");
        return;
    }
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredData.length);
    const total = filteredData.length;
    const pages = Math.ceil(total / rowsPerPage);
    
    showingStart.textContent = total > 0 ? start + 1 : 0;
    showingEnd.textContent = end;
    totalEntries.textContent = total;
    totalPages.textContent = pages;
    currentPageDisplay.textContent = currentPage;
    
    // Update button states
    prevButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= pages;
}

// Update remove button state based on selected staff
function updateRemoveButtonState() {
    console.debug(`Updating remove button state, selected staff: ${selectedStaffIds.length}`);
    
    const removeSelectedBtn = document.getElementById('remove-selected-btn');
    if (removeSelectedBtn) {
        removeSelectedBtn.disabled = selectedStaffIds.length === 0;
    }
}

// View staff details
function viewStaffDetails(staffId) {
    console.log(`Viewing details for staff ID: ${staffId}`);
    
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) {
        console.error(`Staff with ID ${staffId} not found`);
        showToast('Error', 'Staff member not found', 'error');
        return;
    }
    
    // Check if required DOM elements exist
    const nameElement = document.getElementById('detail-staff-name');
    const roleElement = document.getElementById('detail-staff-role');
    const emailElement = document.getElementById('detail-staff-email');
    const phoneElement = document.getElementById('detail-staff-phone');
    const departmentElement = document.getElementById('detail-staff-department');
    const statusElement = document.getElementById('detail-staff-status');
    const shiftElement = document.getElementById('detail-staff-shift');
    const certificationElement = document.getElementById('detail-staff-certification');
    const notesElement = document.getElementById('detail-staff-notes');
    const avatarElement = document.getElementById('staff-avatar');
    const detailsModal = document.getElementById('staff-details-modal');
    
    // Exit early if any essential elements are missing
    if (!nameElement || !detailsModal) {
        console.error('Required DOM elements for staff details are missing');
        showToast('Error', 'Could not display staff details due to missing elements', 'error');
        return;
    }
    
    // Populate staff details modal safely
    if (nameElement) nameElement.textContent = staff.name;
    if (roleElement) roleElement.textContent = staff.role;
    if (emailElement) emailElement.textContent = staff.email;
    if (phoneElement) phoneElement.textContent = staff.phone || 'None provided';
    if (departmentElement) departmentElement.textContent = staff.department;
    if (statusElement) statusElement.textContent = staff.status;
    if (shiftElement) shiftElement.textContent = staff.shift || 'Not scheduled';
    if (certificationElement) certificationElement.textContent = staff.certification || 'None';
    if (notesElement) notesElement.textContent = staff.notes || 'No notes available';
    
    // Update avatar if element exists
    if (avatarElement) {
        avatarElement.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.avatar || staff.name}`;
        avatarElement.alt = `Avatar for ${staff.name}`;
    }
    
    // Create attendance chart
    createStaffAttendanceChart();
    
    // Populate shift history
    populateShiftHistory(staffId);
    
    // Open the modal
    detailsModal.classList.add('show');
}

// Main chart initialization function
function initializeCharts() {
    console.log('Initializing staff charts...');
    
    try {
        // Set default chart options
        if (window.Chart) {
            console.log('Setting Chart.js defaults');
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;
        }
        
        // Initialize role distribution chart
        initializeRoleDistributionChart();
        
        // Initialize sickness chart
        initializeSicknessChart();
        
        // Initialize staff allocation chart if it exists
        initializeStaffAllocationChart();
        
        // Initialize workload chart if it exists
        initializeWorkloadChart();
        
        // Initialize shift distribution chart if it exists
        initializeShiftDistributionChart();
        
        console.debug('All staff charts initialized successfully');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

// Initialize role distribution chart
function initializeRoleDistributionChart() {
    console.debug('Initializing role distribution chart...');
    
    // Check if the chart container exists
    const chartCanvas = document.getElementById('roleDistributionChart');
    if (!chartCanvas) {
        console.warn("Role distribution chart canvas not found");
        return;
    }
    
    // Set height on parent container for proper sizing
    const container = chartCanvas.parentElement;
    if (container && container.style.height === '') {
        container.style.height = '400px';
        console.debug('Set height on role chart container');
    }
    
    // Destroy existing chart instance if it exists
    if (window.roleDistributionChart instanceof Chart) {
        window.roleDistributionChart.destroy();
        console.debug('Destroyed existing role distribution chart');
    }
    
    // Count staff by role
    const roleData = {};
    staffData.forEach(staff => {
        if (!roleData[staff.role]) {
            roleData[staff.role] = 0;
        }
        roleData[staff.role]++;
    });
    
    const labels = Object.keys(roleData);
    const data = labels.map(role => roleData[role]);
    const backgroundColor = [
        '#3a86ff', '#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'
    ];
    
    try {
        window.roleDistributionChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor,
                    borderColor: 'white',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Role distribution chart loaded successfully');
    } catch (error) {
        console.error('Error creating role distribution chart:', error);
    }
}

// Initialize sickness chart
function initializeSicknessChart() {
    console.debug('Initializing sickness chart...');
    
    const chartCanvas = document.getElementById('sicknessChart');
    if (!chartCanvas) {
        console.warn("Sickness chart canvas not found");
        return;
    }
    
    // Set height on parent container for proper sizing
    const container = chartCanvas.parentElement;
    if (container && container.style.height === '') {
        container.style.height = '300px';
        console.debug('Set height on sickness chart container');
    }
    
    // Destroy existing chart instance if it exists
    if (window.sicknessChart instanceof Chart) {
        window.sicknessChart.destroy();
        console.debug('Destroyed existing sickness chart');
    }
    
    // Mock data for week days
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const data = [2, 3, 1, 3, 2, 0, 0];
    
    try {
        window.sicknessChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Sick Employees',
                    data,
                    backgroundColor: '#ff006e',
                    borderColor: '#ff006e',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        console.log('Sickness chart loaded successfully');
    } catch (error) {
        console.error('Error creating sickness chart:', error);
    }
}

// Initialize staff allocation chart
function initializeStaffAllocationChart() {
    console.debug('Initializing staff allocation chart...');
    
    const chartCanvas = document.getElementById('staffAllocationChart');
    if (!chartCanvas) {
        console.warn("Staff allocation chart canvas not found");
        return; // Skip if chart doesn't exist
    }
    
    // Set height on parent container for proper sizing
    const container = chartCanvas.parentElement;
    if (container && container.style.height === '') {
        container.style.height = '300px';
        console.debug('Set height on staff allocation chart container');
    }
    
    // Destroy existing chart instance if it exists
    if (window.staffAllocationChart instanceof Chart) {
        window.staffAllocationChart.destroy();
        console.debug('Destroyed existing staff allocation chart');
    }
    
    // Mock data for departments
    const departments = ["Wing A", "Wing B", "Wing C", "Wing D"];
    const morningShift = [6, 5, 4, 3];
    const eveningShift = [4, 3, 3, 2];
    const nightShift = [2, 2, 1, 1];
    
    try {
        window.staffAllocationChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: departments,
                datasets: [
                    {
                        label: 'Morning Shift',
                        data: morningShift,
                        backgroundColor: '#3a86ff',
                        borderColor: '#3a86ff',
                        borderWidth: 1
                    },
                    {
                        label: 'Evening Shift',
                        data: eveningShift,
                        backgroundColor: '#ff006e',
                        borderColor: '#ff006e',
                        borderWidth: 1
                    },
                    {
                        label: 'Night Shift',
                        data: nightShift,
                        backgroundColor: '#8338ec',
                        borderColor: '#8338ec',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        console.log('Staff allocation chart loaded successfully');
    } catch (error) {
        console.error('Error creating staff allocation chart:', error);
    }
}

// Initialize workload chart
function initializeWorkloadChart() {
    console.debug('Initializing workload chart...');
    
    const chartCanvas = document.getElementById('workloadChart');
    if (!chartCanvas) {
        console.warn("Workload chart canvas not found");
        return; // Skip if chart doesn't exist
    }
    
    // Set height on parent container for proper sizing
    const container = chartCanvas.parentElement;
    if (container && container.style.height === '') {
        container.style.height = '300px';
        console.debug('Set height on workload chart container');
    }
    
    // Destroy existing chart instance if it exists
    if (window.workloadChart instanceof Chart) {
        window.workloadChart.destroy();
        console.debug('Destroyed existing workload chart');
    }
    
    // Mock data for workload
    const roles = ["Nurses", "Doctors", "Assistants", "Cleaning", "Admin"];
    const capacity = [10, 5, 15, 8, 5];
    const actual = [12, 3, 12, 7, 4];
    
    try {
        window.workloadChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: roles,
                datasets: [
                    {
                        label: 'Optimal Capacity',
                        data: capacity,
                        backgroundColor: 'rgba(58, 134, 255, 0.2)',
                        borderColor: '#3a86ff',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Actual Staff',
                        data: actual,
                        backgroundColor: 'rgba(231, 29, 54, 0.2)',
                        borderColor: '#e71d36',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 2
                        }
                    }
                }
            }
        });
        
        console.log('Workload chart loaded successfully');
    } catch (error) {
        console.error('Error creating workload chart:', error);
    }
}

// Initialize shift distribution chart
function initializeShiftDistributionChart() {
    console.debug('Initializing shift distribution chart...');
    
    const chartCanvas = document.getElementById('shiftDistributionChart');
    if (!chartCanvas) {
        console.warn("Shift distribution chart canvas not found");
        return; // Skip if chart doesn't exist
    }
    
    // Set height on parent container for proper sizing
    const container = chartCanvas.parentElement;
    if (container && container.style.height === '') {
        container.style.height = '300px';
        console.debug('Set height on shift distribution chart container');
    }
    
    // Destroy existing chart instance if it exists
    if (window.shiftDistributionChart instanceof Chart) {
        window.shiftDistributionChart.destroy();
        console.debug('Destroyed existing shift distribution chart');
    }
    
    // Count staff by shift
    const shiftCounts = {
        'Morning Shift': 0,
        'Evening Shift': 0,
        'Night Shift': 0,
        'Day Off': 0
    };
    
    staffData.forEach(staff => {
        if (staff.shift && staff.shift.includes('Morgun')) {
            shiftCounts['Morning Shift']++;
        } else if (staff.shift && staff.shift.includes('Kvöld')) {
            shiftCounts['Evening Shift']++;
        } else if (staff.shift && staff.shift.includes('Nætru')) {
            shiftCounts['Night Shift']++;
        } else {
            shiftCounts['Day Off']++;
        }
    });
    
    // Prepare data for chart
    const labels = Object.keys(shiftCounts);
    const data = Object.values(shiftCounts);
    const backgroundColor = [
        '#3a86ff', // Morning shift
        '#ff006e', // Evening shift
        '#8338ec', // Night shift
        '#adb5bd'  // Day off
    ];
    
    try {
        window.shiftDistributionChart = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: 'white',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} staff (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Shift distribution chart loaded successfully');
    } catch (error) {
        console.error('Error creating shift distribution chart:', error);
    }
}

// Initialize AI Chat
function initializeAIChat() {
    console.log('Initializing AI chat widget...');
    
    const toggleButton = document.getElementById('ai-widget-toggle');
    const minimizeButton = document.getElementById('ai-minimize-btn');
    const chatContainer = document.getElementById('ai-widget-container');
    const sendButton = document.getElementById('ai-widget-send');
    const inputField = document.getElementById('ai-widget-input');
    const clearButton = document.getElementById('ai-clear-btn');
    
    // Toggle chat widget visibility
    if (toggleButton && chatContainer) {
        toggleButton.addEventListener('click', function() {
            console.debug('Toggling AI chat widget');
            chatContainer.classList.toggle('open');
        });
    } else {
        console.warn("AI chat toggle button or container not found");
    }
    
    // Minimize chat widget
    if (minimizeButton && chatContainer) {
        minimizeButton.addEventListener('click', function() {
            console.debug('Minimizing AI chat widget');
            chatContainer.classList.remove('open');
        });
    }
    
    // Send message when button clicked
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            console.debug('Send button clicked');
            handleChatMessage();
        });
    }
    
    // Send message when Enter key pressed (but allow Shift+Enter for new line)
    if (inputField) {
        inputField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatMessage();
            }
        });
        
        // Enable/disable send button based on input
        inputField.addEventListener('input', function() {
            if (sendButton) {
                sendButton.disabled = !this.value.trim();
            }
        });
    }
    
    // Clear chat messages
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            console.debug('Clearing chat messages');
            const messagesContainer = document.getElementById('ai-widget-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                
                // Add welcome message
                addMessageToChat('assistant', 'Hæ! Ég er AI Aðstoðarmaðurinn þinn. Hvernig get ég aðstoðað þig með starfsmannahaldið í dag?');
            }
        });
    }
    
    // Add initial welcome message
    addMessageToChat('assistant', 'Hæ! Ég er AI Aðstoðarmaðurinn þinn. Hvernig get ég aðstoðað þig með starfsmannahaldið í dag?');
    
    console.debug('AI chat widget initialization complete');
}

// Handle chat message
function handleChatMessage() {
    const inputField = document.getElementById('ai-widget-input');
    const message = inputField?.value?.trim();
    
    if (!message) return;
    
    // Clear input field
    if (inputField) {
        inputField.value = '';
    }
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to AI and get response
    sendToAI(message).then(response => {
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add AI response to chat
        addMessageToChat('assistant', response);
    }).catch(error => {
        console.error('Error sending message to AI:', error);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Show error message
        addMessageToChat('assistant', 'Því miður get ég ekki svarað núna. Vinsamlegast reyndu aftur síðar.');
    });
}

// Send message to AI
async function sendToAI(message) {
    console.log('Sending message to AI service');
    
    try {
        // Try to call our API endpoint
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: message,
                context: {
                    page: 'staff',
                    staffCount: staffData.length,
                    onShiftCount: staffData.filter(s => s.status === 'Á vakt').length,
                    sickCount: staffData.filter(s => s.status === 'Veikur').length
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('API response error');
        }
        
        const data = await response.json();
        console.debug('Received AI response');
        return data.summary;
    } catch (error) {
        console.error('Error calling AI service:', error);
        
        // Use fallback if API fails
        return generateFallbackResponse(message);
    }
}

// Generate fallback response when API is unavailable
function generateFallbackResponse(message) {
    console.debug('Generating fallback AI response');
    
    // Very simple keyword matching for a few common queries in Icelandic
    const lowercaseMsg = message.toLowerCase();
    
    if (lowercaseMsg.includes('hæ') || lowercaseMsg.includes('halló') || lowercaseMsg.includes('hallo')) {
        return 'Hæ! Hvernig get ég aðstoðað þig með starfsmannamálin í dag?';
    } 
    
    if (lowercaseMsg.includes('veik') || lowercaseMsg.includes('sjúk')) {
        return 'Það eru 3 starfsmenn veikir í dag. Viltu ég sendi tilkynningu á alla vaktstjóra?';
    }
    
    if (lowercaseMsg.includes('vakt')) {
        return 'Á morgunvakt í dag eru 8 starfsmenn, á kvöldvakt eru 5 starfsmenn og á næturvakt eru 3 starfsmenn.';
    }
    
    if (lowercaseMsg.includes('starfsfólk') || lowercaseMsg.includes('starfsmaður') || lowercaseMsg.includes('starfsmenn')) {
        return 'Samtals eru 22 starfsmenn skráðir í kerfið. 18 eru á vakt í dag, 3 eru veikir og 1 er í fríi.';
    }
    
    // Default response
    return 'Ég skil. Í venjulegum aðstæðum myndi ég tengja við OpenAI API en það er ekki í boði núna. Get ég aðstoðað með eitthvað annað varðandi starfsmannamál?';
}

// Add message to chat
function addMessageToChat(sender, text) {
    console.debug(`Adding ${sender} message to chat`);
    
    const messagesContainer = document.getElementById('ai-widget-messages');
    if (!messagesContainer) {
        console.warn("Messages container not found");
        return;
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Create avatar based on sender
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (sender === 'user') {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    } else {
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
    }
    
    // Create message content
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = text;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-time';
    timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Assemble message
    content.appendChild(messageText);
    content.appendChild(timestamp);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    // Add to container
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('ai-widget-messages');
    if (!messagesContainer) return;
    
    // Create typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    // Create three dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        typingDiv.appendChild(dot);
    }
    
    // Add to container
    messagesContainer.appendChild(typingDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Initialize modal handlers
function initializeModalHandlers() {
    console.log('Initializing modal handlers...');
    
    // Get all modals
    const modals = document.querySelectorAll('.modal');
    
    // Close buttons
    document.querySelectorAll('.close-modal, .modal-overlay, .cancel-btn').forEach(element => {
        element.addEventListener('click', function() {
            // Find the closest modal
            const modal = this.closest('.modal');
            if (modal) {
                console.debug(`Closing modal: ${modal.id}`);
                modal.classList.remove('show');
            }
        });
    });
    
    // Add staff button
    const addStaffBtn = document.getElementById('add-staff-btn');
    if (addStaffBtn) {
        addStaffBtn.addEventListener('click', function() {
            console.debug('Add staff button clicked');
            openAddStaffModal();
        });
    }
    
    // Edit staff details button in details modal
    const editStaffDetailsBtn = document.getElementById('edit-staff-details-btn');
    if (editStaffDetailsBtn) {
        editStaffDetailsBtn.addEventListener('click', function() {
            console.debug('Edit staff details button clicked');
            
            // Get staff ID from somewhere in the details modal
            const nameElement = document.getElementById('detail-staff-name');
            if (nameElement) {
                const staffName = nameElement.textContent;
                const staff = staffData.find(s => s.name === staffName);
                
                if (staff) {
                    // Close details modal
                    document.getElementById('staff-details-modal').classList.remove('show');
                    
                    // Open edit modal with this staff
                    editStaff(staff.id);
                }
            }
        });
    }
    
    // Print profile button
    const printProfileBtn = document.getElementById('print-profile-btn');
    if (printProfileBtn) {
        printProfileBtn.addEventListener('click', function() {
            console.debug('Print profile button clicked');
            window.print();
        });
    }
    
    // Add staff form submission
    const addStaffForm = document.getElementById('add-staff-form');
    if (addStaffForm) {
        addStaffForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.debug('Add staff form submitted');
            addNewStaff();
        });
    }
    
    // Edit staff form submission
    const editStaffForm = document.getElementById('edit-staff-form');
    if (editStaffForm) {
        editStaffForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.debug('Edit staff form submitted');
            saveStaffChanges();
        });
    }
    
    console.debug('Modal handlers initialization complete');
}

// Open add staff modal
function openAddStaffModal() {
    console.log('Opening add staff modal');
    
    // Reset form
    const form = document.getElementById('add-staff-form');
    if (form) {
        form.reset();
    }
    
    // Show modal
    const modal = document.getElementById('add-staff-modal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Initialize scroll to top button
function initializeScrollToTop() {
    console.log('Initializing scroll to top button...');
    
    const scrollButton = document.getElementById('scroll-to-top');
    
    if (scrollButton) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollButton.classList.add('show');
            } else {
                scrollButton.classList.remove('show');
            }
        });
        
        // Scroll to top when clicked
        scrollButton.addEventListener('click', function() {
            console.debug('Scroll to top button clicked');
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    } else {
        console.warn("Scroll to top button not found");
    }
}

// Setup other event listeners
function setupEventListeners() {
    console.log('Setting up additional event listeners...');
    
    // Resolve alert button
    const resolveAlertBtn = document.getElementById('resolve-alert-btn');
    if (resolveAlertBtn) {
        resolveAlertBtn.addEventListener('click', function() {
            console.debug('Resolve alert button clicked');
            
            // Get the alert message
            const alertMessage = document.querySelector('.alert-message');
            const message = alertMessage?.textContent || 'alert';
            
            // Show animation
            const alertCard = this.closest('.alert-card');
            if (alertCard) {
                alertCard.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => {
                    alertCard.style.display = 'none';
                }, 500);
            }
            
            // Show toast
            showToast('Viðvörun leyst', `"${message}" hefur verið leyst.`, 'success');
        });
    }
    
    // Setup logout button
    document.querySelectorAll('.dropdown-item').forEach(item => {
        if (item.textContent.includes('Útskrá')) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Logout clicked');
                logout();
            });
        }
    });
    
    console.debug('Additional event listeners setup complete');
}

// Show toast notification
function showToast(title, message, type = 'info') {
    console.debug(`Showing toast notification: ${title}`);
    
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.warn("Toast container not found");
        return;
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Get icon class based on type
    const iconClass = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';
    
    // Create toast content
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Loka tilkynningu">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
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
    
    // Auto dismiss after 5 seconds
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

// Create staff attendance chart for the details modal
function createStaffAttendanceChart() {
    console.debug('Creating staff attendance chart');
    
    const chartCanvas = document.getElementById('staff-attendance-chart');
    if (!chartCanvas) {
        console.warn("Staff attendance chart canvas not found");
        return;
    }
    
    try {
        // Mock data for last 14 days (present, absent, leave)
        const days = Array.from({length: 14}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (13 - i));
            return date.toLocaleDateString('is-IS', {day: '2-digit', month: '2-digit'});
        });
        
        // Random attendance data - 1=present, 0=absent, 0.5=half day
        const attendanceData = [1, 1, 1, 0, 0, 0.5, 1, 1, 1, 1, 0.5, 1, 1, 1];
        
        // Clear any previous chart
        if (window.staffAttendanceChart instanceof Chart) {
            window.staffAttendanceChart.destroy();
        }
        
        // Create chart colors based on attendance
        const backgroundColor = attendanceData.map(value => {
            if (value === 1) return '#10b981'; // Present - green
            if (value === 0.5) return '#f59e0b'; // Half day - yellow
            return '#ef4444'; // Absent - red
        });
        
        // Create new chart
        window.staffAttendanceChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Mæting',
                    data: attendanceData,
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        ticks: {
                            stepSize: 0.5,
                            callback: function(value) {
                                if (value === 0) return 'Fjarverandi';
                                if (value === 0.5) return 'Hálfur dagur';
                                if (value === 1) return 'Mætt(ur)';
                                return '';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                if (value === 0) return 'Fjarverandi';
                                if (value === 0.5) return 'Hálfur dagur';
                                return 'Mætt(ur)';
                            }
                        }
                    }
                }
            }
        });
        
        console.debug('Staff attendance chart created successfully');
    } catch (error) {
        console.error('Error creating staff attendance chart:', error);
    }
}

// Populate shift history in staff details modal
function populateShiftHistory(staffId) {
    console.debug(`Populating shift history for staff ID: ${staffId}`);
    
    const shiftHistoryContainer = document.getElementById('staff-shift-history');
    if (!shiftHistoryContainer) {
        console.warn("Shift history container not found");
        return;
    }
    
    // Clear existing content
    shiftHistoryContainer.innerHTML = '';
    
    // Mock shift history data for the selected staff
    const shiftHistory = [
        {
            date: '2025-05-04',
            shift: 'Morgunvakt (07:00-15:00)',
            department: 'Deild A',
            status: 'Lokið'
        },
        {
            date: '2025-05-03',
            shift: 'Morgunvakt (07:00-15:00)',
            department: 'Deild A',
            status: 'Lokið'
        },
        {
            date: '2025-05-02',
            shift: 'Dagvakt (09:00-17:00)',
            department: 'Deild B',
            status: 'Lokið'
        },
        {
            date: '2025-05-01',
            shift: 'Frí',
            department: '-',
            status: '-'
        },
        {
            date: '2025-04-30',
            shift: 'Morgunvakt (07:00-15:00)',
            department: 'Deild A',
            status: 'Lokið'
        }
    ];
    
    // Create shift history table
    const table = document.createElement('table');
    table.className = 'shift-history-table';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Dagsetning</th>
            <th>Vakt</th>
            <th>Deild</th>
            <th>Staða</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Add rows for each shift
    shiftHistory.forEach(shift => {
        const row = document.createElement('tr');
        
        // Format date from ISO to localized format
        const dateObj = new Date(shift.date);
        const formattedDate = dateObj.toLocaleDateString('is-IS', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${shift.shift}</td>
            <td>${shift.department}</td>
            <td>${shift.status}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    shiftHistoryContainer.appendChild(table);
    
    console.debug('Shift history populated successfully');
}

// Update charts for theme change
function updateChartsForTheme() {
    console.debug('Updating charts for theme change');
    
    try {
        // Re-initialize charts to apply theme
        initializeRoleDistributionChart();
        initializeSicknessChart();
        
        // Update staff attendance chart if it exists
        if (document.getElementById('staff-attendance-chart') && window.staffAttendanceChart instanceof Chart) {
            createStaffAttendanceChart();
        }
        
        console.debug('Charts updated for theme change');
    } catch (error) {
        console.error('Error updating charts for theme:', error);
    }
}

// Edit staff member
function editStaff(staffId) {
    console.log(`Editing staff member with ID: ${staffId}`);
    
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) {
        console.error(`Staff with ID ${staffId} not found`);
        showToast('Error', 'Staff member not found', 'error');
        return;
    }
    
    // Check if edit staff form and modal exist
    const form = document.getElementById('edit-staff-form');
    const modal = document.getElementById('edit-staff-modal');
    
    if (!form || !modal) {
        console.error('Edit staff form or modal not found');
        showToast('Error', 'Cannot edit staff member due to missing elements', 'error');
        return;
    }
    
    // Populate form fields
    const fields = [
        { id: 'edit-staff-name', value: staff.name },
        { id: 'edit-staff-role', value: staff.role },
        { id: 'edit-staff-email', value: staff.email },
        { id: 'edit-staff-phone', value: staff.phone },
        { id: 'edit-staff-department', value: staff.department },
        { id: 'edit-staff-status', value: staff.status },
        { id: 'edit-staff-shift', value: staff.shift },
        { id: 'edit-staff-certification', value: staff.certification },
        { id: 'edit-staff-notes', value: staff.notes }
    ];
    
    // Set form field values if they exist
    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            if (element.tagName === 'SELECT') {
                // For select elements, find the matching option
                const option = Array.from(element.options).find(opt => opt.value === field.value);
                if (option) {
                    element.value = field.value;
                }
            } else {
                // For other elements (input, textarea)
                element.value = field.value || '';
            }
        }
    });
    
    // Store staff ID in form for retrieval during save
    form.dataset.staffId = staffId;
    
    // Show modal
    modal.classList.add('show');
    
    console.debug(`Edit staff form populated for staff ID: ${staffId}`);
}

// Confirm and handle staff deletion
function confirmDeleteStaff(staffId) {
    console.log(`Confirming deletion for staff ID: ${staffId}`);
    
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) {
        console.error(`Staff with ID ${staffId} not found`);
        showToast('Error', 'Staff member not found', 'error');
        return;
    }
    
    // Create and show a confirmation modal
    openConfirmModal('Eyða starfsmanni?', 
        `Ertu viss um að þú viljir eyða ${staff.name} úr kerfinu?`,
        () => {
            console.debug(`Confirmed deletion for staff ID: ${staffId}`);
            deleteStaff(staffId);
        });
}

// Open a confirmation modal with a message and callback
function openConfirmModal(title, message, confirmCallback) {
    console.debug(`Opening confirmation modal: ${title}`);
    
    const modal = document.getElementById('confirm-modal');
    
    if (!modal) {
        console.error('Confirmation modal not found');
        showToast('Error', 'Cannot show confirmation dialog', 'error');
        return;
    }
    
    // Set modal content
    const modalTitle = modal.querySelector('.modal-title');
    const modalMessage = modal.querySelector('.modal-message');
    const confirmButton = modal.querySelector('.confirm-btn');
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;
    
    // Remove existing event listeners and add new one
    if (confirmButton) {
        const newConfirmBtn = confirmButton.cloneNode(true);
        if (confirmButton.parentNode) {
            confirmButton.parentNode.replaceChild(newConfirmBtn, confirmButton);
        }
        
        newConfirmBtn.addEventListener('click', function() {
            // Hide modal
            modal.classList.remove('show');
            
            // Execute callback
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
        });
    }
    
    // Show modal
    modal.classList.add('show');
}

// Delete a staff member
function deleteStaff(staffId) {
    console.log(`Deleting staff with ID: ${staffId}`);
    
    // Find staff index
    const staffIndex = staffData.findIndex(s => s.id === staffId);
    if (staffIndex === -1) {
        console.error(`Staff with ID ${staffId} not found`);
        return;
    }
    
    // Get staff name for notification
    const staffName = staffData[staffIndex].name;
    
    // Remove from data array
    staffData.splice(staffIndex, 1);
    
    // Remove from selected IDs if present
    selectedStaffIds = selectedStaffIds.filter(id => id !== staffId);
    
    // Update table
    filterStaffData();
    
    // Update charts
    updateStaffCharts();
    
    // Show toast notification
    showToast('Starfsmaður fjarlægður', `${staffName} hefur verið eytt úr kerfinu.`, 'success');
    
    console.debug(`Staff with ID ${staffId} deleted successfully`);
}

// Delete selected staff members
function deleteSelectedStaff() {
    console.log(`Deleting ${selectedStaffIds.length} selected staff members`);
    
    // Nothing to do if no staff selected
    if (selectedStaffIds.length === 0) return;
    
    // Keep count of deleted staff
    let deletedCount = 0;
    
    // Process each selected staff ID
    for (const staffId of [...selectedStaffIds]) {
        const staffIndex = staffData.findIndex(s => s.id === staffId);
        if (staffIndex !== -1) {
            // Remove from data array
            staffData.splice(staffIndex, 1);
            deletedCount++;
        }
    }
    
    // Clear selected IDs
    selectedStaffIds = [];
    
    // Update table
    filterStaffData();
    
    // Update charts
    updateStaffCharts();
    
    // Show toast notification
    showToast('Starfsfólk fjarlægt', `${deletedCount} starfsmenn hafa verið eytt úr kerfinu.`, 'success');
    
    // Update remove button state
    updateRemoveButtonState();
    
    console.debug(`${deletedCount} staff members deleted successfully`);
}

// Update staff charts based on filtered data
function updateStaffCharts() {
    console.debug('Updating staff charts with filtered data');
    
    // Generate data summary for filtered staff
    const roleData = {};
    const departmentData = {};
    const statusData = {};
    
    filteredData.forEach(staff => {
        // Count by role
        if (!roleData[staff.role]) {
            roleData[staff.role] = 0;
        }
        roleData[staff.role]++;
        
        // Count by department
        if (!departmentData[staff.department]) {
            departmentData[staff.department] = 0;
        }
        departmentData[staff.department]++;
        
        // Count by status
        if (!statusData[staff.status]) {
            statusData[staff.status] = 0;
        }
        statusData[staff.status]++;
    });
    
    // Log filtered data summaries
    console.debug('Filtered staff by role:', roleData);
    console.debug('Filtered staff by department:', departmentData);
    console.debug('Filtered staff by status:', statusData);
    
    // Check if chart containers exist before updating
    const roleChartCanvas = document.getElementById('roleDistributionChart');
    const sicknessChartCanvas = document.getElementById('sicknessChart');
    
    // Re-create charts with new data if they exist
    if (roleChartCanvas) {
        initializeRoleDistributionChart();
    }
    
    if (sicknessChartCanvas) {
        initializeSicknessChart();
    }
    
    console.debug('Staff charts updated with filtered data');
}

// Export staff data to CSV
function exportStaffData() {
    console.log('Exporting staff data to CSV');
    
    try {
        // CSV header
        let csvContent = 'ID,Name,Role,Department,Status,Shift,Email,Phone,Certification,Notes\n';
        
        // Add each staff member as a row
        filteredData.forEach(staff => {
            // Escape fields that might contain commas
            const escapeCsvField = (field) => {
                if (!field) return '';
                field = field.toString();
                if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            };
            
            const row = [
                staff.id,
                escapeCsvField(staff.name),
                escapeCsvField(staff.role),
                escapeCsvField(staff.department),
                escapeCsvField(staff.status),
                escapeCsvField(staff.shift),
                escapeCsvField(staff.email),
                escapeCsvField(staff.phone),
                escapeCsvField(staff.certification),
                escapeCsvField(staff.notes)
            ].join(',');
            
            csvContent += row + '\n';
        });
        
        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Set up download
        link.setAttribute('href', url);
        link.setAttribute('download', 'staff_data.csv');
        link.style.visibility = 'hidden';
        
        // Add to document, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show toast notification
        showToast('Export successful', `${filteredData.length} staff records exported to CSV.`, 'success');
        
        console.debug('Staff data exported to CSV successfully');
    } catch (error) {
        console.error('Error exporting staff data:', error);
        showToast('Export failed', 'There was an error exporting staff data.', 'error');
    }
}

// Add new staff member
function addNewStaff() {
    console.log('Adding new staff member');
    
    const form = document.getElementById('add-staff-form');
    if (!form) {
        console.error('Add staff form not found');
        return;
    }
    
    try {
        // Get form data
        const formData = new FormData(form);
        
        // Create new staff object
        const newStaff = {
            id: staffData.length > 0 ? Math.max(...staffData.map(s => s.id)) + 1 : 1,
            name: formData.get('staff-name'),
            role: formData.get('staff-role'),
            department: formData.get('staff-department'),
            status: formData.get('staff-status'),
            shift: formData.get('staff-shift'),
            email: formData.get('staff-email'),
            phone: formData.get('staff-phone'),
            certification: formData.get('staff-certification'),
            notes: formData.get('staff-notes'),
            avatar: formData.get('staff-name').toLowerCase().split(' ')[0] // Use first name as avatar seed
        };
        
        // Validate required fields
        if (!newStaff.name || !newStaff.role || !newStaff.department) {
            showToast('Error', 'Name, role, and department are required.', 'error');
            return;
        }
        
        // Add to data array
        staffData.push(newStaff);
        
        // Close modal
        const modal = document.getElementById('add-staff-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        // Update table
        filterStaffData();
        
        // Show toast notification
        showToast('Starfsmaður bætt við', `${newStaff.name} has been added successfully.`, 'success');
        
        console.debug(`New staff member added with ID: ${newStaff.id}`);
    } catch (error) {
        console.error('Error adding new staff:', error);
        showToast('Error', 'Failed to add new staff member.', 'error');
    }
}

// Save changes to staff member
function saveStaffChanges() {
    console.log('Saving staff changes');
    
    const form = document.getElementById('edit-staff-form');
    if (!form) {
        console.error('Edit staff form not found');
        return;
    }
    
    try {
        // Get staff ID from form dataset
        const staffId = parseInt(form.dataset.staffId);
        if (isNaN(staffId)) {
            throw new Error('Invalid staff ID');
        }
        
        // Find staff in data
        const staffIndex = staffData.findIndex(s => s.id === staffId);
        if (staffIndex === -1) {
            throw new Error(`Staff with ID ${staffId} not found`);
        }
        
        // Get form data
        const formData = new FormData(form);
        
        // Update staff object
        const updatedStaff = {
            ...staffData[staffIndex],
            name: formData.get('edit-staff-name'),
            role: formData.get('edit-staff-role'),
            department: formData.get('edit-staff-department'),
            status: formData.get('edit-staff-status'),
            shift: formData.get('edit-staff-shift'),
            email: formData.get('edit-staff-email'),
            phone: formData.get('edit-staff-phone'),
            certification: formData.get('edit-staff-certification'),
            notes: formData.get('edit-staff-notes')
        };
        
        // Validate required fields
        if (!updatedStaff.name || !updatedStaff.role || !updatedStaff.department) {
            showToast('Error', 'Name, role, and department are required.', 'error');
            return;
        }
        
        // Update data array
        staffData[staffIndex] = updatedStaff;
        
        // Close modal
        const modal = document.getElementById('edit-staff-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        // Update table
        filterStaffData();
        
        // Show toast notification
        showToast('Starfsmaður uppfærður', `${updatedStaff.name} has been updated successfully.`, 'success');
        
        console.debug(`Staff member with ID ${staffId} updated successfully`);
    } catch (error) {
        console.error('Error saving staff changes:', error);
        showToast('Error', 'Failed to save staff changes.', 'error');
    }
}