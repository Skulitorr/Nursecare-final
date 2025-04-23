/**
 * NurseCare AI - Staff Management
 * Handles all staff page functionality including:
 * - Staff data display and management
 * - Search and filtering
 * - Modal interactions
 * - Charts
 * - AI assistant
 */

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeDashboard();
    initializeStaffManagement();
    initializeCharts();
    initializeModalHandlers();
    initializeAIChat();
    initializeScrollToTop();
    
    // Set up event listeners for buttons and interactions
    setupEventListeners();
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
    // Update current date and time
    updateDateTime();
    
    // Initialize dropdowns
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
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
            sidebar.classList.toggle('expanded');
            
            // Update icon
            const icon = this.querySelector('i');
            if (sidebar.classList.contains('expanded')) {
                icon.className = 'fas fa-chevron-left';
            } else {
                icon.className = 'fas fa-bars';
            }
            
            // Update ARIA expanded state
            const isExpanded = sidebar.classList.contains('expanded');
            this.setAttribute('aria-expanded', isExpanded);
        });
    }
    
    // Theme toggle
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

// Update theme icon
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

// Update date and time 
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('is-IS', options);
    
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.innerHTML = `<i class="fas fa-calendar-alt" aria-hidden="true"></i> ${dateStr}`;
    }
    
    // Update every minute
    setTimeout(updateDateTime, 60000);
}

// Initialize staff management functionality
function initializeStaffManagement() {
    // Populate staff table initially
    populateStaffTable();
    
    // Initialize search and filters
    const searchInput = document.getElementById('staff-search');
    const roleFilter = document.getElementById('role-filter');
    const departmentFilter = document.getElementById('department-filter');
    const statusFilter = document.getElementById('status-filter');
    
    // Add event listeners for search and filters
    if (searchInput) {
        searchInput.addEventListener('input', filterStaffData);
    }
    
    if (roleFilter) {
        roleFilter.addEventListener('change', filterStaffData);
    }
    
    if (departmentFilter) {
        departmentFilter.addEventListener('change', filterStaffData);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterStaffData);
    }
    
    // Initialize pagination
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                updatePagination();
                populateStaffTable();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination();
                populateStaffTable();
            }
        });
    }
    
    // Initialize select all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            const checkboxes = document.querySelectorAll('.staff-select');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
                
                // Update selectedStaffIds
                const staffId = parseInt(checkbox.value);
                if (isChecked) {
                    if (!selectedStaffIds.includes(staffId)) {
                        selectedStaffIds.push(staffId);
                    }
                } else {
                    selectedStaffIds = selectedStaffIds.filter(id => id !== staffId);
                }
            });
            
            // Update remove button state
            updateRemoveButtonState();
        });
    }
    
    // Initialize export button
    const exportBtn = document.getElementById('export-staff-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportStaffData();
        });
    }
}

// Filter staff data based on search and filters
function filterStaffData() {
    const searchTerm = document.getElementById('staff-search')?.value.toLowerCase();
    const roleFilter = document.getElementById('role-filter')?.value;
    const departmentFilter = document.getElementById('department-filter')?.value;
    const statusFilter = document.getElementById('status-filter')?.value;
    
    // Reset to page 1 when filtering
    currentPage = 1;
    
    filteredData = staffData.filter(staff => {
        // Search term filter
        const matchesSearch = !searchTerm || 
            staff.name.toLowerCase().includes(searchTerm) ||
            staff.email.toLowerCase().includes(searchTerm) ||
            staff.role.toLowerCase().includes(searchTerm);
        
        // Role filter
        const matchesRole = !roleFilter || staff.role === roleFilter;
        
        // Department filter
        const matchesDepartment = !departmentFilter || staff.department === departmentFilter;
        
        // Status filter
        const matchesStatus = !statusFilter || staff.status === statusFilter;
        
        return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
    
    // Update pagination after filtering
    updatePagination();
    
    // Repopulate table with filtered data
    populateStaffTable();
}

// Populate staff table with data
function populateStaffTable() {
    const tableBody = document.getElementById('staff-table-body');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
    
    // Display current page data
    for (let i = startIndex; i < endIndex; i++) {
        const staff = filteredData[i];
        const row = document.createElement('tr');
        
        // Add selected class if staff is selected
        if (selectedStaffIds.includes(staff.id)) {
            row.classList.add('selected');
        }
        
        // Create status badge
        let statusBadge = '';
        switch (staff.status) {
            case 'Á vakt':
                statusBadge = '<span class="status-badge status-active">Á vakt</span>';
                break;
            case 'Veikur':
                statusBadge = '<span class="status-badge status-sick">Veikur</span>';
                break;
            case 'Frí':
                statusBadge = '<span class="status-badge status-off">Frí</span>';
                break;
            default:
                statusBadge = staff.status;
        }
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="staff-select" value="${staff.id}" 
                    aria-label="Velja ${staff.name}" ${selectedStaffIds.includes(staff.id) ? 'checked' : ''}>
            </td>
            <td>${staff.name}</td>
            <td>${staff.role}</td>
            <td>${staff.department}</td>
            <td>${statusBadge}</td>
            <td>${staff.shift || '-'}</td>
            <td>${staff.email}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" data-staff-id="${staff.id}" 
                        aria-label="Skoða ${staff.name}" data-tooltip="Skoða">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" data-staff-id="${staff.id}" 
                        aria-label="Breyta ${staff.name}" data-tooltip="Breyta">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-staff-id="${staff.id}" 
                        aria-label="Eyða ${staff.name}" data-tooltip="Eyða">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn contact-btn" data-staff-id="${staff.id}" 
                        aria-label="Hafa samband við ${staff.name}" data-tooltip="Hafa samband">
                        <i class="fas fa-envelope"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
    
    // Add checkbox event listeners
    const checkboxes = document.querySelectorAll('.staff-select');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const staffId = parseInt(this.value);
            
            if (this.checked) {
                if (!selectedStaffIds.includes(staffId)) {
                    selectedStaffIds.push(staffId);
                }
                this.closest('tr').classList.add('selected');
            } else {
                selectedStaffIds = selectedStaffIds.filter(id => id !== staffId);
                this.closest('tr').classList.remove('selected');
                
                // Uncheck "select all" if any individual checkbox is unchecked
                const selectAllCheckbox = document.getElementById('select-all');
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = false;
                }
            }
            
            // Update remove button state
            updateRemoveButtonState();
        });
    });
    
    // Add event listeners for action buttons
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            viewStaffDetails(staffId);
        });
    });
    
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            editStaff(staffId);
        });
    });
    
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            confirmDeleteStaff(staffId);
        });
    });
    
    const contactButtons = document.querySelectorAll('.contact-btn');
    contactButtons.forEach(button => {
        button.addEventListener('click', function() {
            const staffId = parseInt(this.getAttribute('data-staff-id'));
            contactStaff(staffId);
        });
    });
}

// Update pagination information
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const showingStart = filteredData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
    const showingEnd = Math.min(currentPage * rowsPerPage, filteredData.length);
    
    // Update pagination elements
    document.getElementById('showing-start').textContent = showingStart;
    document.getElementById('showing-end').textContent = showingEnd;
    document.getElementById('total-entries').textContent = filteredData.length;
    document.getElementById('total-pages').textContent = totalPages;
    document.querySelector('.current-page').textContent = currentPage;
    
    // Enable/disable pagination buttons
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

// Update remove button state based on selected staff
function updateRemoveButtonState() {
    const removeBtn = document.getElementById('remove-selected-btn');
    if (removeBtn) {
        removeBtn.disabled = selectedStaffIds.length === 0;
    }
}

// View staff details
function viewStaffDetails(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) return;
    
    // Populate staff details modal
    document.getElementById('detail-staff-name').textContent = staff.name;
    document.getElementById('detail-staff-role').textContent = staff.role;
    document.getElementById('detail-staff-email').textContent = staff.email;
    document.getElementById('detail-staff-phone').textContent = staff.phone || 'Ekki skráð';
    document.getElementById('detail-staff-department').textContent = staff.department;
    document.getElementById('detail-staff-status').textContent = staff.status;
    document.getElementById('detail-staff-shift').textContent = staff.shift || 'Ekki á vakt';
    document.getElementById('detail-staff-certification').textContent = staff.certification || 'Engin sérhæfing skráð';
    document.getElementById('detail-staff-notes').textContent = staff.notes || 'Engar athugasemdir skráðar.';
    
    // Set avatar
    const staffAvatar = document.getElementById('staff-avatar');
    staffAvatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.avatar || staff.name.toLowerCase().replace(/\s/g, '')}`;
    
    // Create attendance chart
    createStaffAttendanceChart();
    
    // Populate shift history
    populateShiftHistory(staffId);
    
    // Show the modal
    const modal = document.getElementById('staff-details-modal');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Add event listener for edit button
    const editDetailsBtn = document.getElementById('edit-staff-details-btn');
    if (editDetailsBtn) {
        editDetailsBtn.onclick = function() {
            // Close this modal
            closeModal('staff-details-modal');
            // Open edit modal
            editStaff(staffId);
        };
    }
    
    // Add event listener for print button
    const printProfileBtn = document.getElementById('print-profile-btn');
    if (printProfileBtn) {
        printProfileBtn.onclick = function() {
            showToast('Prenta', 'Prentun á starfsupplýsingum sett í bið...', 'info');
        };
    }
}

// Create attendance chart for individual staff member
function createStaffAttendanceChart() {
    const ctx = document.getElementById('staff-attendance-chart');
    if (!ctx) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    // Sample data - in a real app, this would come from the database
    const attendanceData = {
        labels: ['Vika 1', 'Vika 2', 'Vika 3', 'Vika 4'],
        datasets: [{
            label: 'Viðvera',
            data: [90, 100, 100, 80],
            backgroundColor: 'rgba(46, 196, 182, 0.5)',
            borderColor: '#2ec4b6',
            borderWidth: 2,
            borderRadius: 4
        }]
    };
    
    if (window.staffAttendanceChart && typeof window.staffAttendanceChart.destroy === 'function') {
        window.staffAttendanceChart.destroy();
    }
    
    window.staffAttendanceChart = new Chart(ctx, {
        type: 'bar',
        data: attendanceData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '%';
                        }
                    }
                }
            }
        }
    });
}

// Populate shift history for staff details
function populateShiftHistory(staffId) {
    const historyBody = document.getElementById('shift-history-body');
    if (!historyBody) return;
    
    // Clear existing rows
    historyBody.innerHTML = '';
    
    // Sample shift history data - in a real app, this would come from the database
    const shiftHistory = [
        { day: 'Mánudagur', date: '14. apríl', shift: 'Morgunvakt (07:00-15:00)', department: 'Deild A', status: 'Mætt' },
        { day: 'Þriðjudagur', date: '15. apríl', shift: 'Morgunvakt (07:00-15:00)', department: 'Deild A', status: 'Mætt' },
        { day: 'Miðvikudagur', date: '16. apríl', shift: 'Morgunvakt (07:00-15:00)', department: 'Deild A', status: 'Mætt' },
        { day: 'Fimmtudagur', date: '17. apríl', shift: 'Frí', department: '-', status: '-' },
        { day: 'Föstudagur', date: '18. apríl', shift: 'Frí', department: '-', status: '-' },
        { day: 'Laugardagur', date: '19. apríl', shift: 'Morgunvakt (07:00-15:00)', department: 'Deild A', status: 'Áætluð' },
        { day: 'Sunnudagur', date: '20. apríl', shift: 'Morgunvakt (07:00-15:00)', department: 'Deild A', status: 'Áætluð' }
    ];
    
    // Add rows to the table
    shiftHistory.forEach(shift => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${shift.day}</td>
            <td>${shift.date}</td>
            <td>${shift.shift}</td>
            <td>${shift.department}</td>
            <td>${shift.status}</td>
        `;
        historyBody.appendChild(row);
    });
}

// Edit staff
function editStaff(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) return;
    
    // Populate edit form with staff data
    document.getElementById('edit-staff-id').value = staff.id;
    document.getElementById('edit-staff-name').value = staff.name;
    document.getElementById('edit-staff-role').value = staff.role;
    document.getElementById('edit-staff-email').value = staff.email;
    document.getElementById('edit-staff-phone').value = staff.phone || '';
    document.getElementById('edit-staff-department').value = staff.department;
    document.getElementById('edit-staff-status').value = staff.status;
    document.getElementById('edit-staff-shift').value = staff.shift || '';
    document.getElementById('edit-staff-certification').value = staff.certification || '';
    document.getElementById('edit-staff-notes').value = staff.notes || '';
    
    // Show the modal
    const modal = document.getElementById('edit-staff-modal');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

// Contact staff
function contactStaff(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) return;
    
    // In a real app, this would open an email or messaging interface
    showToast('Hafðu samband', `Opna samskiptaleiðir við ${staff.name}`, 'info');
}

// Confirm delete staff
function confirmDeleteStaff(staffId) {
    const staff = staffData.find(s => s.id === staffId);
    if (!staff) return;
    
    // Set confirm modal content
    document.getElementById('confirm-title').textContent = 'Eyða starfsmanni';
    document.getElementById('confirm-message').textContent = `Ertu viss um að þú viljir eyða ${staff.name} úr kerfinu? Þessi aðgerð er óafturkræf.`;
    
    // Set up confirm action
    const confirmAction = document.getElementById('confirm-action');
    confirmAction.onclick = function() {
        deleteStaff(staffId);
        closeModal('confirm-modal');
    };
    
    // Show the modal
    const modal = document.getElementById('confirm-modal');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

// Delete staff member
function deleteStaff(staffId) {
    // Find the index of the staff member in the staffData array
    const staffIndex = staffData.findIndex(staff => staff.id === staffId);
    if (staffIndex === -1) return;
    
    // Get staff name for the toast message
    const staffName = staffData[staffIndex].name;
    
    // Remove from staffData
    staffData.splice(staffIndex, 1);
    
    // Remove from selectedStaffIds if present
    selectedStaffIds = selectedStaffIds.filter(id => id !== staffId);
    
    // Update filtered data and repopulate table
    filterStaffData();
    
    // Update charts
    updateStaffCharts();
    
    // Show success toast
    showToast('Eytt!', `${staffName} hefur verið eytt úr kerfinu.`, 'success');
}

// Delete selected staff
function deleteSelectedStaff() {
    if (selectedStaffIds.length === 0) return;
    
    // Set confirm modal content
    document.getElementById('confirm-title').textContent = 'Eyða völdum starfsmönnum';
    document.getElementById('confirm-message').textContent = `Ertu viss um að þú viljir eyða ${selectedStaffIds.length} völdum starfsmönnum? Þessi aðgerð er óafturkræf.`;
    
    // Set up confirm action
    const confirmAction = document.getElementById('confirm-action');
    confirmAction.onclick = function() {
        // Remove all selected staff members
        selectedStaffIds.forEach(staffId => {
            const staffIndex = staffData.findIndex(staff => staff.id === staffId);
            if (staffIndex !== -1) {
                staffData.splice(staffIndex, 1);
            }
        });
        
        // Clear selected staff IDs
        selectedStaffIds = [];
        
        // Update filtered data and repopulate table
        filterStaffData();
        
        // Update remove button state
        updateRemoveButtonState();
        
        // Update charts
        updateStaffCharts();
        
        // Show success toast
        showToast('Eytt!', `${selectedStaffIds.length} starfsmönnum hefur verið eytt úr kerfinu.`, 'success');
        
        // Close the modal
        closeModal('confirm-modal');
    };
    
    // Show the modal
    const modal = document.getElementById('confirm-modal');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

// Export staff data
function exportStaffData() {
    // In a real app, this would generate a CSV or Excel file
    showToast('Flytja út', 'Starfsmannalisti fluttur út í Excel format', 'success');
}

// Initialize charts
function initializeCharts() {
    createRoleDistributionChart();
    createSicknessChart();
}

// Create role distribution chart
function createRoleDistributionChart() {
    const ctx = document.getElementById('roleDistributionChart');
    if (!ctx) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    // Count staff by role
    const roleCount = {};
    staffData.forEach(staff => {
        roleCount[staff.role] = (roleCount[staff.role] || 0) + 1;
    });
    
    // Prepare chart data
    const labels = Object.keys(roleCount);
    const data = Object.values(roleCount);
    const backgroundColors = [
        '#3a86ff', '#4361ee', '#4cc9f0', '#2ec4b6', '#ff9f1c', '#e71d36'
    ];
    
    // Check if chart exists and is a valid Chart.js instance
    if (window.roleDistributionChart && typeof window.roleDistributionChart.destroy === 'function') {
        window.roleDistributionChart.destroy();
    }
    
    window.roleDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + ' (' + 
                                Math.round((context.raw / staffData.length) * 100) + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Create sickness chart
function createSicknessChart() {
    const ctx = document.getElementById('sicknessChart');
    if (!ctx) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    // Sample data for sickness over the week
    const sicknessByDay = [1, 2, 3, 2, 1, 0, 0];
    const days = ['Mánudagur', 'Þriðjudagur', 'Miðvikudagur', 'Fimmtudagur', 'Föstudagur', 'Laugardagur', 'Sunnudagur'];
    
    if (window.sicknessChart && typeof window.sicknessChart.destroy === 'function') {
        window.sicknessChart.destroy();
    }
    
    window.sicknessChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Fjöldi veikinda',
                data: sicknessByDay,
                backgroundColor: '#e71d36',
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// Update charts when data changes
function updateStaffCharts() {
    createRoleDistributionChart();
    createSicknessChart();
}

// Update charts for theme changes
function updateChartsForTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Update role distribution chart
    if (window.roleDistributionChart && typeof window.roleDistributionChart.destroy === 'function') {
        window.roleDistributionChart.destroy();
    }
    
    window.roleDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + ' (' + 
                                Math.round((context.raw / staffData.length) * 100) + '%)';
                        }
                    }
                }
            }
        }
    });
    
    // Update sickness chart
    if (window.sicknessChart && typeof window.sicknessChart.destroy === 'function') {
        window.sicknessChart.destroy();
    }
    
    window.sicknessChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Fjöldi veikinda',
                data: sicknessByDay,
                backgroundColor: '#e71d36',
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
    
    // Update staff attendance chart if visible
    if (window.staffAttendanceChart && typeof window.staffAttendanceChart.destroy === 'function') {
        window.staffAttendanceChart.destroy();
    }
    
    window.staffAttendanceChart = new Chart(ctx, {
        type: 'bar',
        data: attendanceData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: textColor
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '%';
                        }
                    }
                }
            }
        }
    });
}

// Initialize modal handlers
function initializeModalHandlers() {
    // Get all modals
    const modals = document.querySelectorAll('.modal');
    
    // Add close handlers for each modal
    modals.forEach(modal => {
        // Close modal when clicking the close button
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                closeModal(modal.id);
            });
        });
        
        // Close modal when clicking the overlay
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                closeModal(modal.id);
            });
        }
        
        // Close modal when pressing escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.classList.contains('show')) {
                closeModal(modal.id);
            }
        });
        
        // Handle cancel buttons
        const cancelButtons = modal.querySelectorAll('.cancel-btn');
        cancelButtons.forEach(button => {
            button.addEventListener('click', () => {
                closeModal(modal.id);
            });
        });
    });
    
    // Handle add staff form submission
    const addStaffForm = document.getElementById('add-staff-form');
    if (addStaffForm) {
        addStaffForm.addEventListener('submit', function(event) {
            event.preventDefault();
            addNewStaff();
        });
    }
    
    // Handle edit staff form submission
    const editStaffForm = document.getElementById('edit-staff-form');
    if (editStaffForm) {
        editStaffForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveStaffChanges();
        });
    }
    
    // Handle add staff button click
    const addStaffBtn = document.getElementById('add-staff-btn');
    if (addStaffBtn) {
        addStaffBtn.addEventListener('click', function() {
            openAddStaffModal();
        });
    }
    
    // Handle remove selected button click
    const removeSelectedBtn = document.getElementById('remove-selected-btn');
    if (removeSelectedBtn) {
        removeSelectedBtn.addEventListener('click', function() {
            if (selectedStaffIds.length > 0) {
                deleteSelectedStaff();
            }
        });
    }
}

// Open add staff modal
function openAddStaffModal() {
    // Reset form
    document.getElementById('add-staff-form').reset();
    
    // Show modal
    const modal = document.getElementById('add-staff-modal');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus on the first input field
    setTimeout(() => {
        document.getElementById('staff-name').focus();
    }, 100);
}

// Close a modal by ID
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

// Add new staff
function addNewStaff() {
    // Get form values
    const name = document.getElementById('staff-name').value;
    const role = document.getElementById('staff-role').value;
    const email = document.getElementById('staff-email').value;
    const phone = document.getElementById('staff-phone').value;
    const department = document.getElementById('staff-department').value;
    const status = document.getElementById('staff-status').value;
    const shift = document.getElementById('staff-shift').value;
    const certification = document.getElementById('staff-certification').value;
    const notes = document.getElementById('staff-notes').value;
    
    // Generate new ID (in a real app, this would be done server-side)
    const newId = Math.max(...staffData.map(staff => staff.id)) + 1;
    
    // Create new staff object
    const newStaff = {
        id: newId,
        name,
        role,
        department,
        status,
        shift,
        email,
        phone,
        certification,
        notes,
        avatar: name.toLowerCase().replace(/\s/g, '') // Generate avatar seed from name
    };
    
    // Add to staff data
    staffData.push(newStaff);
    
    // Update filtered data
    filterStaffData();
    
    // Update charts
    updateStaffCharts();
    
    // Close the modal
    closeModal('add-staff-modal');
    
    // Show success toast
    showToast('Bætt við', `${name} hefur verið bætt við sem ${role}`, 'success');
}

// Save staff changes
function saveStaffChanges() {
    // Get form values
    const id = parseInt(document.getElementById('edit-staff-id').value);
    const name = document.getElementById('edit-staff-name').value;
    const role = document.getElementById('edit-staff-role').value;
    const email = document.getElementById('edit-staff-email').value;
    const phone = document.getElementById('edit-staff-phone').value;
    const department = document.getElementById('edit-staff-department').value;
    const status = document.getElementById('edit-staff-status').value;
    const shift = document.getElementById('edit-staff-shift').value;
    const certification = document.getElementById('edit-staff-certification').value;
    const notes = document.getElementById('edit-staff-notes').value;
    
    // Find staff in the data
    const staffIndex = staffData.findIndex(staff => staff.id === id);
    if (staffIndex === -1) return;
    
    // Update staff data
    staffData[staffIndex] = {
        ...staffData[staffIndex],
        name,
        role,
        email,
        phone,
        department,
        status,
        shift,
        certification,
        notes
    };
    
    // Update filtered data
    filterStaffData();
    
    // Update charts
    updateStaffCharts();
    
    // Close the modal
    closeModal('edit-staff-modal');
    
    // Show success toast
    showToast('Vistað', `Upplýsingar fyrir ${name} hafa verið uppfærðar`, 'success');
}

// Initialize AI Chat
function initializeAIChat() {
    // Get the messages container once
    const aiWidgetMessages = document.getElementById('ai-widget-messages');
    
    // Add initial greeting message
    if (aiWidgetMessages && aiWidgetMessages.children.length === 0) {
        addMessageToChat('assistant', 'Góðan dag! Ég er NurseCare AI aðstoðarmaðurinn þinn. Hvernig get ég aðstoðað þig með starfsmannamál í dag?');
    }

    // Set up clear chat button
    const aiClearBtn = document.getElementById('ai-clear-btn');
    
    if (aiClearBtn && aiWidgetMessages) {
        aiClearBtn.addEventListener('click', function() {
            // Clear all messages
            aiWidgetMessages.innerHTML = '';
            
            // Add initial greeting again
            addMessageToChat('assistant', 'Góðan dag! Ég er NurseCare AI aðstoðarmaðurinn þinn. Hvernig get ég aðstoðað þig með starfsmannamál í dag?');
            
            // Show toast notification
            showToast('Spjall', 'Spjallferill hreinsaður', 'info');
        });
    }
    
    // Set up chat toggle
    const aiWidgetToggle = document.getElementById('ai-widget-toggle');
    const aiWidgetContainer = document.getElementById('ai-widget-container');
    
    if (aiWidgetToggle && aiWidgetContainer) {
        aiWidgetToggle.addEventListener('click', function() {
            aiWidgetContainer.classList.toggle('open');
            if (aiWidgetContainer.classList.contains('open')) {
                document.getElementById('ai-widget-input')?.focus();
            }
        });
    }
    
    // Set up minimize button
    const aiMinimizeBtn = document.getElementById('ai-minimize-btn');
    if (aiMinimizeBtn && aiWidgetContainer) {
        aiMinimizeBtn.addEventListener('click', function() {
            aiWidgetContainer.classList.remove('open');
        });
    }
    
    // Handle chat input
    const aiWidgetInput = document.getElementById('ai-widget-input');
    const aiWidgetSend = document.getElementById('ai-widget-send');
    
    if (aiWidgetInput && aiWidgetSend) {
        // Enable send button when input has text
        aiWidgetInput.addEventListener('input', function() {
            aiWidgetSend.disabled = this.value.trim() === '';
        });
        
        // Handle enter key
        aiWidgetInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey && this.value.trim() !== '') {
                e.preventDefault();
                handleChatMessage();
            }
        });
        
        // Handle send button click
        aiWidgetSend.addEventListener('click', function() {
            if (aiWidgetInput.value.trim() !== '') {
                handleChatMessage();
            }
        });
    }
    
    // "Ask AI" button on quick actions
    const askAiBtn = document.getElementById('ask-ai-btn');
    if (askAiBtn) {
        askAiBtn.addEventListener('click', function() {
            // Open AI chat
            if (aiWidgetContainer) {
                aiWidgetContainer.classList.add('open');
                // Focus input field
                setTimeout(() => {
                    document.getElementById('ai-widget-input')?.focus();
                }, 300);
            }
        });
    }
    
    // Handle AI alert resolve button
    const resolveAlertBtn = document.getElementById('resolve-alert-btn');
    if (resolveAlertBtn) {
        resolveAlertBtn.addEventListener('click', function() {
            const alertCard = this.closest('.alert-card');
            if (alertCard) {
                alertCard.style.opacity = '0.5';
                this.disabled = true;
                this.innerHTML = '<i class="fas fa-check"></i> Leyst';
                
                showToast('Viðvörun', 'Mönnunarvandamál hefur verið leyst', 'success');
            }
        });
    }
}

// Handle chat message
function handleChatMessage() {
    const aiWidgetInput = document.getElementById('ai-widget-input');
    const aiWidgetSend = document.getElementById('ai-widget-send');
    
    if (!aiWidgetInput || !aiWidgetSend) return;
    
    const userMessage = aiWidgetInput.value;
    
    // Add user message to chat
    addMessageToChat('user', userMessage);
    
    // Clear input
    aiWidgetInput.value = '';
    
    // Disable send button
    aiWidgetSend.disabled = true;
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send message to AI
    sendToAI(userMessage)
        .then(response => {
            // Hide typing indicator
            hideTypingIndicator();
            
            // Add AI response to chat
            addMessageToChat('assistant', response);
        })
        .catch(error => {
            console.error('Error getting AI response:', error);
            
            // Hide typing indicator
            hideTypingIndicator();
            
            // Add fallback message
            addMessageToChat('assistant', 'Því miður kom upp villa við að tengjast gervigreind. Vinsamlegast reyndu aftur síðar.');
            
            // Show error toast
            showToast('Villa', 'Ekki tókst að tengjast gervigreind', 'error');
        });
}

// Send message to AI
async function sendToAI(message) {
    try {
        // Get chat history from the DOM
        const chatHistory = Array.from(document.querySelectorAll('.message'))
            .slice(-10) // Get last 10 messages
            .map(msg => {
                const messageContent = msg.querySelector('.message-content');
                if (!messageContent) return null;
                
                const isUser = msg.classList.contains('user');
                
                // Try different selectors to find the message text
                let messageText = '';
                const pElement = messageContent.querySelector('p');
                const messageTextElement = messageContent.querySelector('.message-text');
                
                if (pElement) {
                    messageText = pElement.textContent.trim();
                } else if (messageTextElement) {
                    messageText = messageTextElement.textContent.trim();
                } else {
                    // If no specific element is found, use the content of message-content
                    messageText = messageContent.textContent.trim();
                }
                
                return {
                    role: isUser ? 'user' : 'assistant',
                    content: messageText
                };
            })
            .filter(msg => msg !== null); // Remove any null entries

        // Use the correct API endpoint
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: message,
                history: chatHistory
            })
        });

        if (!response.ok) {
            console.warn(`Server responded with status: ${response.status}`);
            // Return a friendly fallback message in Icelandic
            return "Því miður er gervigreindarþjónustan ekki aðgengileg í augnablikinu. Vinsamlegast reyndu aftur síðar.";
        }

        const data = await response.json();
        if (!data.result) {
            console.warn('Invalid response format from server');
            return "Því miður kom upp villa við að vinna úr svari. Vinsamlegast reyndu aftur.";
        }

        return data.result;
    } catch (error) {
        console.error('Error sending message to AI:', error);
        // Return a friendly error message in Icelandic
        return "Því miður kom upp villa við að tengjast gervigreind. Vinsamlegast reyndu aftur síðar.";
    }
}

// Generate fallback response when API is unavailable
function generateFallbackResponse(message) {
    // Convert message to lowercase for easier matching
    const userMessage = message.toLowerCase();
    
    // Different response categories
    if (userMessage.includes('hæ') || userMessage.includes('halló') || userMessage.includes('góðan dag')) {
        return 'Góðan dag! Hvernig get ég aðstoðað þig með starfsmannamál í dag?';
    }
    else if (userMessage.includes('hver') && userMessage.includes('vakt')) {
        return 'Á núverandi vakt eru 18 starfsmenn virkir, þar af 7 hjúkrunarfræðingar, 5 sjúkraliðar, 4 aðstoðarfólk og 2 læknar. Viltu sjá nákvæma skiptingu eftir deildum?';
    }
    else if (userMessage.includes('veikindi') || userMessage.includes('veikur')) {
        return 'Það eru 3 starfsmenn veikir í dag: Guðrún Pálsdóttir, Sigrún Ólafsdóttir og Birkir Jónsson. Veikindahlutfall vikunnar er 4.5% sem er innan eðlilegra marka.';
    }
    else if (userMessage.includes('fundur') || userMessage.includes('fundir')) {
        return 'Næsti teymisfundur er áætlaður kl. 14:00 í dag í fundarherbergi B. 12 starfsmenn eru skráðir á fundinn. Á ég að senda þér fundarboð?';
    }
    else if (userMessage.includes('afleysing') || userMessage.includes('afleysa')) {
        return 'Fyrir veikindi Guðrúnar í dag er Helga Björnsdóttir að koma inn á afleysingu. Hún hefur staðfest mætingu á morgunvakt.';
    }
    else if (userMessage.includes('skrá') && userMessage.includes('vakt')) {
        return 'Til að skrá nýja vakt, smelltu á "Vaktaplan" í hliðarvalmyndinni og veldu svo "Bæta við vakt". Langar þig til að skrá nýja vakt núna?';
    }
    else if (userMessage.includes('bæta') && userMessage.includes('starfsmann')) {
        return 'Þú getur bætt við nýjum starfsmanni með því að smella á "Bæta við starfsmanni" hnappinn efst í hægra horninu á starfsmannalistanum. Viltu að ég opni formið fyrir þig?';
    }
    else if (userMessage.includes('vaktatöfluna') || userMessage.includes('vaktaplan')) {
        return 'Vaktaplönin fyrir næstu viku eru tilbúin. Á ég að senda þér yfirlit yfir vaktir næstu viku?';
    }
    else if (userMessage.includes('undirmanna') || userMessage.includes('vantar starfsfólk')) {
        return 'Já, kvöldvaktin í dag í Deild A er undirmönnuð. Það vantar einn hjúkrunarfræðing. Kerfið hefur sent fyrirspurnir til 3 hjúkrunarfræðinga um aukavakt. Á ég að senda fleiri fyrirspurnir?';
    }
    else if (userMessage.includes('vaktaskipti') || userMessage.includes('skiptir um vakt')) {
        return 'Hægt er að skrá vaktaskipti í kerfinu. Ég sé að Anna Jónsdóttir hefur beðið um vaktaskipti fyrir laugardaginn 20. apríl. Viltu sjá mögulega starfsmenn til að skipta við?';
    }
    else if (userMessage.includes('takk') || userMessage.includes('þakka')) {
        return 'Ekkert mál! Er eitthvað annað sem ég get aðstoðað þig með?';
    }
    else if (userMessage.includes('bless') || userMessage.includes('bless bless')) {
        return 'Bless bless! Gott að geta aðstoðað þig. Velkomin/n aftur þegar þú þarft á mér að halda.';
    }
    else {
        return 'Ég skil hvað þú ert að spyrja um. Hjálplegt væri að vita meira um starfsmannamálin sem þú ert að vinna með. Ég get hjálpað þér með vaktaskipulag, mönnunarmál, veikindaskráningar, og fleira. Hvað get ég aðstoðað þig með nákvæmlega?';
    }
}

// Add message to chat
function addMessageToChat(sender, text) {
    const aiWidgetMessages = document.getElementById('ai-widget-messages');
    if (!aiWidgetMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' });
    
    const avatarIcon = sender === 'user' ? 
        '<i class="fas fa-user" aria-hidden="true"></i>' : 
        '<i class="fas fa-robot" aria-hidden="true"></i>';
    
    const senderLabel = sender === 'user' ? 'Þú' : 'AI Aðstoðarmaður';
    
    messageElement.innerHTML = `
        <div class="message-avatar" aria-label="${senderLabel}">
            ${avatarIcon}
        </div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${timeString}</div>
        </div>
    `;
    
    aiWidgetMessages.appendChild(messageElement);
    
    // Scroll to bottom
    aiWidgetMessages.scrollTop = aiWidgetMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const aiWidgetMessages = document.getElementById('ai-widget-messages');
    if (!aiWidgetMessages) return;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'message assistant-message typing-indicator';
    typingElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot" aria-hidden="true"></i>
        </div>
        <div class="message-content">
            <div class="message-text">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    aiWidgetMessages.appendChild(typingElement);
    
    // Scroll to bottom
    aiWidgetMessages.scrollTop = aiWidgetMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Initialize scroll to top button
function initializeScrollToTop() {
    const scrollBtn = document.getElementById('scroll-top-btn');
    if (!scrollBtn) return;
    
    // Show button when page is scrolled down
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });
    
    // Scroll to top when button is clicked
    scrollBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Setup other event listeners
function setupEventListeners() {
    // Any additional event listeners not covered elsewhere
}

// Toast notification function
function showToast(title, message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    let icon;
    switch (type) {
        case 'success': icon = 'fa-check-circle'; break;
        case 'error': icon = 'fa-times-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        default: icon = 'fa-info-circle';
    }
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon}" aria-hidden="true"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Loka tilkynningu">
            <i class="fas fa-times" aria-hidden="true"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        });
    }
    
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