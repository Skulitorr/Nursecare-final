/**
 * NurseCare AI - Nursing Home Scheduling System
 * schedule.js - Handles all scheduling functionality
 */

// ===== CONSTANTS =====
const SHIFT_TYPES = {
    MORNING: { id: 'morning', label: 'Morgunvakt', time: '07:00-15:00', icon: 'sun', color: '#2196F3' }, // Blue
    EVENING: { id: 'evening', label: 'Kvöldvakt', time: '15:00-23:00', icon: 'moon', color: '#FFC107' }, // Yellow
    NIGHT: { id: 'night', label: 'Næturvakt', time: '23:00-07:00', icon: 'star', color: '#9C27B0' } // Purple
};

const DAYS_OF_WEEK = [
    'Mánudagur', 'Þriðjudagur', 'Miðvikudagur', 
    'Fimmtudagur', 'Föstudagur', 'Laugardagur', 'Sunnudagur'
];

const DAYS_SHORT = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];

const MAX_HOURS_PER_WEEK = 40;
const HOURS_PER_SHIFT = 8;
const MAX_AI_RETRIES = 3;
const MAX_SHIFTS_PER_DAY = 3; // Maximum shifts per day for a staff member
const MAX_STAFF_PER_SHIFT = 10; // Maximum staff members per shift

// Update any image paths
const logo = '../assets/images/logo.png';
// Update any API endpoints or other paths

// ===== STATE =====
let staffList = [];
let scheduleData = {}; // Format: { 'dayIndex-shiftType': [staffId1, staffId2, ...] }
let staffPreferences = {}; // Format: { staffId: { avoidDays: [0, 6], preferredShifts: ['morning'] } }
let sortableInstances = [];
let currentDepartmentFilter = 'all';
let isDragging = false;
let isLoading = false;
let aiRecommendations = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', initSchedule);

/**
 * Initialize the schedule page
 */
function initSchedule() {
    console.log("Initializing Schedule Page");
    
    // Load sample staff data
    loadStaffData();
    
    // Load staff preferences
    loadStaffPreferences();
    
    // Initialize the staff list
    initStaffList();
    
    // Initialize the schedule grid
    initScheduleGrid();
    
    // Set up sortable for drag and drop
    initSortable();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for dark mode
    applyThemeSettings();
    
    // Generate AI suggestions based on current schedule
    setTimeout(() => {
        generateAISuggestions();
    }, 1000);
    
    // Add current date to header
    updateCurrentDate();

    // Create initial mock assignments
    createMockAssignments();
    
    // Show welcome message
    showToast("Vaktaáætlun hlaðin", "success");
}

/**
 * Create initial mock assignments for demonstration purposes
 */
function createMockAssignments() {
    // Mock shift data with specific staff members, days and shift types
    const mockShifts = [
        { staffId: '1', dayIndex: 0, shiftType: 'morning' },  // Anna - Monday morning
        { staffId: '2', dayIndex: 1, shiftType: 'morning' },  // Björn - Tuesday morning
        { staffId: '3', dayIndex: 1, shiftType: 'evening' },  // Guðrún - Tuesday evening
        { staffId: '4', dayIndex: 2, shiftType: 'evening' },  // Magnús - Wednesday evening
        { staffId: '5', dayIndex: 3, shiftType: 'morning' },  // Sigríður - Thursday morning
        { staffId: '1', dayIndex: 4, shiftType: 'evening' },  // Anna - Friday evening
        { staffId: '2', dayIndex: 4, shiftType: 'night' },    // Björn - Friday night
        { staffId: '3', dayIndex: 5, shiftType: 'morning' },  // Guðrún - Saturday morning
        { staffId: '4', dayIndex: 6, shiftType: 'night' }     // Magnús - Sunday night
    ];

    // Add each mock shift to the schedule
    mockShifts.forEach(shift => {
        addAssignment(shift.staffId, shift.dayIndex, shift.shiftType, false);
    });

    // Refresh the grid to display the mock assignments
    refreshScheduleGrid();
    updateScheduleStats();
}

/**
 * Update the current date display
 */
function updateCurrentDate() {
    const currentDateEl = document.getElementById('current-date');
    if (currentDateEl) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('is-IS', options);
    }
}

/**
 * Load sample staff data
 */
function loadStaffData() {
    // Sample staff data
    staffList = [
        {
            id: '1',
            name: 'Anna Jónsdóttir',
            role: 'Registered Nurse',
            department: 'Medical',
            status: 'available',
            shifts: ['morning', 'evening'],
            color: '#2196F3',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anna',
            hoursWorked: 0
        },
        {
            id: '2',
            name: 'Björn Sigurðsson',
            role: 'Licensed Practical Nurse',
            department: 'Surgical',
            status: 'available',
            shifts: ['morning', 'night'],
            color: '#4CAF50',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bjorn',
            hoursWorked: 0
        },
        {
            id: '3',
            name: 'Guðrún Einarsdóttir',
            role: 'Registered Nurse',
            department: 'Medical',
            status: 'available',
            shifts: ['evening', 'night'],
            color: '#FFC107',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gudrun',
            hoursWorked: 0
        },
        {
            id: '4',
            name: 'Magnús Ólafsson',
            role: 'Licensed Practical Nurse',
            department: 'Surgical',
            status: 'available',
            shifts: ['morning', 'evening', 'night'],
            color: '#9C27B0',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=magnus',
            hoursWorked: 0
        },
        {
            id: '5',
            name: 'Sigríður Björnsdóttir',
            role: 'Registered Nurse',
            department: 'Medical',
            status: 'available',
            shifts: ['morning', 'evening'],
            color: '#F44336',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sigridur',
            hoursWorked: 0
        }
    ];
}

/**
 * Load staff preferences
 */
function loadStaffPreferences() {
    // Sample staff preferences
    staffPreferences = {
        2: { // Björn Sigurðsson
            avoidDays: [6], // Avoids Sundays
            preferredShifts: ['morning']
        },
        3: { // Guðrún Einarsdóttir
            avoidShifts: ['night'], // Never works night shifts
            preferredDays: [1, 2, 3] // Prefers mid-week
        }
    };
}

/**
 * Initialize staff list in the sidebar
 */
function initStaffList() {
    const staffListContainer = document.getElementById('staff-list');
    if (!staffListContainer) {
        console.error("Staff list container not found");
        return;
    }
    
    // Clear existing content
    staffListContainer.innerHTML = '';
    
    // Add staff members
    staffList.forEach(staff => {
        const staffItem = document.createElement('div');
        staffItem.className = 'staff-item';
        staffItem.setAttribute('data-id', staff.id);
        staffItem.setAttribute('data-department', staff.department);
        staffItem.setAttribute('draggable', 'true');
        staffItem.style.borderLeftColor = staff.color;
        
        // Create shift badges
        const shiftBadges = staff.shifts.map(shift => {
            const shiftType = SHIFT_TYPES[Object.keys(SHIFT_TYPES).find(key => 
                SHIFT_TYPES[key].id === shift
            )];
            
            return `<span class="shift-badge" 
                        style="background-color: ${shiftType.color};" 
                        title="${shiftType.label}">
                        <i class="fas fa-${shiftType.icon}"></i>
                    </span>`;
        }).join('');
        
        // Add preferences indicator if any
        let preferencesIcon = '';
        if (staffPreferences[staff.id]) {
            preferencesIcon = `<span class="preferences-badge" title="Has preferences">
                                <i class="fas fa-star"></i>
                              </span>`;
        }
        
        staffItem.innerHTML = `
            <div class="staff-avatar">
                <img src="${staff.avatar}" alt="${staff.name}">
                <span class="status-indicator ${staff.status}"></span>
            </div>
            <div class="staff-info">
                <div class="staff-name">${staff.name}</div>
                <div class="staff-role">${staff.role}</div>
                <div class="staff-meta">
                    <div class="staff-shifts">${shiftBadges}</div>
                    <div class="staff-hours">${staff.hoursWorked}h</div>
                    ${preferencesIcon}
                </div>
            </div>
        `;
        
        // Make staff item draggable
        staffItem.addEventListener('dragstart', handleDragStart);
        staffItem.addEventListener('dragend', handleDragEnd);
        
        // Add click listener for edit
        staffItem.addEventListener('click', () => showEditStaffModal(staff.id));
        
        staffListContainer.appendChild(staffItem);
    });

    // Populate staff filter dropdown
    populateStaffFilter();
}

/**
 * Populate the staff filter dropdown
 */
function populateStaffFilter() {
    const staffFilter = document.getElementById('staff-filter');
    if (!staffFilter) return;

    // Clear previous options except the first one
    while(staffFilter.options.length > 1) {
        staffFilter.remove(1);
    }

    // Add staff members to the filter
    staffList.forEach(staff => {
        const option = document.createElement('option');
        option.value = staff.id;
        option.textContent = staff.name;
        staffFilter.appendChild(option);
    });
}

/**
 * Initialize the schedule grid
 */
function initScheduleGrid() {
    const scheduleGrid = document.getElementById('schedule-grid');
    if (!scheduleGrid) {
        console.error("Schedule grid not found");
        return;
    }
    
    // Clear existing content
    scheduleGrid.innerHTML = '';
    
    // Create grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'schedule-grid';
    
    // Create header row
    const headerRow = document.createElement('div');
    headerRow.className = 'schedule-row header-row';
    
    // Add shift type header (empty cell)
    const emptyHeader = document.createElement('div');
    emptyHeader.className = 'header-cell empty-header';
    headerRow.appendChild(emptyHeader);
    
    // Add day headers
    DAYS_OF_WEEK.forEach((day, index) => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'header-cell day-header';
        dayHeader.innerHTML = `
            <span class="day-full">${day}</span>
            <span class="day-short">${DAYS_SHORT[index]}</span>
        `;
        headerRow.appendChild(dayHeader);
    });
    
    gridContainer.appendChild(headerRow);
    
    // Create shift rows
    Object.values(SHIFT_TYPES).forEach(shiftType => {
        const shiftRow = document.createElement('div');
        shiftRow.className = 'schedule-row shift-row';
        
        // Add shift label
        const shiftLabel = document.createElement('div');
        shiftLabel.className = 'shift-label';
        shiftLabel.innerHTML = `
            <div class="shift-label-content">
                <i class="fas fa-${shiftType.icon}"></i>
                <span>${shiftType.label}</span>
            </div>
            <div class="shift-time">${shiftType.time}</div>
        `;
        shiftLabel.style.borderLeftColor = shiftType.color;
        shiftRow.appendChild(shiftLabel);
        
        // Add schedule cells for each day
        DAYS_OF_WEEK.forEach((day, dayIndex) => {
            const cell = document.createElement('div');
            cell.className = 'schedule-cell dropzone';
            cell.setAttribute('data-day', dayIndex);
            cell.setAttribute('data-shift', shiftType.id);
            
            // Create cell content container
            const cellContent = document.createElement('div');
            cellContent.className = 'cell-content';
            
            // Add shift icons
            const shiftIcons = document.createElement('div');
            shiftIcons.className = 'shift-icons';
            shiftIcons.innerHTML = `
                <span class="shift-icon" style="color: ${shiftType.color}">
                    <i class="fas fa-${shiftType.icon}" title="${shiftType.label}"></i>
                </span>
                <span class="department-icon">
                    <i class="fas fa-hospital" title="Department"></i>
                </span>
            `;
            
            // Add assignments container
            const assignmentsContainer = document.createElement('div');
            assignmentsContainer.className = 'assignments-container';
            
            // Add placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'cell-placeholder';
            placeholder.innerHTML = `
                <i class="fas fa-plus"></i>
                <span>Drag staff here</span>
            `;
            
            // Add cell controls
            const cellControls = document.createElement('div');
            cellControls.className = 'cell-controls';
            cellControls.innerHTML = `
                <button class="cell-add-btn" title="Add staff to this shift">
                    <i class="fas fa-plus"></i>
                </button>
            `;
            
            // Add click listener to add button
            cellControls.querySelector('.cell-add-btn').addEventListener('click', () => {
                showAddToShiftModal(dayIndex, shiftType.id);
            });
            
            // Assemble cell content
            cellContent.appendChild(shiftIcons);
            cellContent.appendChild(assignmentsContainer);
            cellContent.appendChild(placeholder);
            cellContent.appendChild(cellControls);
            
            cell.appendChild(cellContent);
            
            // Make cell a drop target
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragenter', handleDragEnter);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
            
            shiftRow.appendChild(cell);
        });
        
        gridContainer.appendChild(shiftRow);
    });
    
    // Add the grid to the container
    scheduleGrid.appendChild(gridContainer);
    
    // Add AI suggestions section
    addAISuggestionsSection();
    
    // Update cells with current schedule data
    refreshScheduleGrid();
    
    // Update stats
    updateScheduleStats();

    // Highlight today's cells
    highlightToday();
}

/**
 * Highlight today's column in the schedule
 */
function highlightToday() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.
    
    // Convert to our format (0=Monday, 6=Sunday)
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Find all cells for today and add the 'today' class
    document.querySelectorAll(`.schedule-cell[data-day="${dayIndex}"]`).forEach(cell => {
        cell.classList.add('today');
    });
}

/**
 * Refresh the schedule grid based on current data
 */
function refreshScheduleGrid() {
    // Update each cell with its assignments
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        const dayIndex = parseInt(cell.getAttribute('data-day'));
        const shiftType = cell.getAttribute('data-shift');
        const key = `${dayIndex}-${shiftType}`;
        
        const assignmentsContainer = cell.querySelector('.assignments-container');
        const placeholder = cell.querySelector('.cell-placeholder');
        
        // Clear existing assignments
        assignmentsContainer.innerHTML = '';
        
        // Get staff assigned to this shift
        const staffIds = scheduleData[key] || [];
        
        // Show or hide placeholder based on assignments
        if (staffIds.length === 0) {
            placeholder.style.display = 'flex';
            cell.classList.remove('has-assignments');
        } else {
            placeholder.style.display = 'none';
            cell.classList.add('has-assignments');
            
            // Add assignments
            staffIds.forEach(staffId => {
                const staff = staffList.find(s => s.id === staffId);
                if (staff) {
                    addAssignmentToCell(assignmentsContainer, staff, dayIndex, shiftType);
                }
            });
        }
        
        // Add staff count badge if multiple staff
        if (staffIds.length > 0) {
            const countBadge = document.createElement('div');
            countBadge.className = 'staff-count-badge';
            countBadge.innerHTML = `<span>${staffIds.length}</span>`;
            cell.appendChild(countBadge);
        } else {
            const existingBadge = cell.querySelector('.staff-count-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
        }
        
        // Add understaffed/overstaffed indicators
        const recommendedStaff = getRecommendedStaffCount(dayIndex, shiftType);
        cell.classList.remove('understaffed', 'overstaffed', 'well-staffed');
        
        if (staffIds.length < recommendedStaff) {
            cell.classList.add('understaffed');
        } else if (staffIds.length > recommendedStaff) {
            cell.classList.add('overstaffed');
        } else {
            cell.classList.add('well-staffed');
        }
    });
}

/**
 * Get recommended staff count for a shift
 */
function getRecommendedStaffCount(dayIndex, shiftType) {
    // This is a simplified version - in a real app, this would depend on
    // patient needs, department requirements, etc.
    
    // Base count
    let count = 2;
    
    // Weekend needs more staff
    if (dayIndex >= 5) { // Weekend (Sat, Sun)
        count = 3;
    }
    
    // Night shifts need fewer staff
    if (shiftType === 'night') {
        count = Math.max(1, count - 1);
    }
    
    return count;
}

/**
 * Add assignment element to cell
 */
function addAssignmentToCell(container, staff, dayIndex, shiftType) {
    const assignment = document.createElement('div');
    assignment.className = 'staff-assignment';
    assignment.setAttribute('data-staff-id', staff.id);
    assignment.style.borderLeftColor = staff.color;
    
    assignment.innerHTML = `
        <div class="assignment-avatar">
            <img src="${staff.avatar}" alt="${staff.name}">
        </div>
        <div class="assignment-info">
            <div class="assignment-name">${staff.name}</div>
            <div class="assignment-role">${staff.role}</div>
        </div>
        <button class="remove-assignment" title="Remove assignment">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add event listener to remove button
    assignment.querySelector('.remove-assignment').addEventListener('click', (e) => {
        e.stopPropagation();
        removeAssignment(staff.id, dayIndex, shiftType);
    });
    
    // Add click event to show details
    assignment.addEventListener('click', () => {
        showAssignmentDetails(staff, dayIndex, shiftType);
    });
    
    container.appendChild(assignment);
}

/**
 * Show assignment details modal
 */
function showAssignmentDetails(staff, dayIndex, shiftType) {
    const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'assignment-details-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-info-circle"></i>
                    ${staff.name} - ${DAYS_SHORT[dayIndex]} ${shiftTypeObj.label}
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="assignment-details">
                    <div class="assignment-header">
                        <div class="assignment-avatar large">
                            <img src="${staff.avatar}" alt="${staff.name}">
                        </div>
                        <div class="assignment-header-info">
                            <h4>${staff.name}</h4>
                            <p>${staff.role}</p>
                            <p><i class="fas fa-hospital-alt"></i> ${staff.department}</p>
                        </div>
                    </div>
                    
                    <div class="assignment-shift-details">
                        <div class="detail-item">
                            <span class="detail-label">Day:</span>
                            <span class="detail-value">${DAYS_OF_WEEK[dayIndex]}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Shift:</span>
                            <span class="detail-value" style="color: ${shiftTypeObj.color}">
                                <i class="fas fa-${shiftTypeObj.icon}"></i> ${shiftTypeObj.label}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Time:</span>
                            <span class="detail-value">${shiftTypeObj.time}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Hours:</span>
                            <span class="detail-value">${HOURS_PER_SHIFT}h (${staff.hoursWorked}h total)</span>
                        </div>
                    </div>
                    
                    ${getStaffPreferencesHtml(staff.id, dayIndex, shiftType)}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn danger-btn" id="remove-assignment-btn">
                    <i class="fas fa-trash"></i> Remove Assignment
                </button>
                <button class="btn secondary-btn" id="swap-assignment-btn">
                    <i class="fas fa-exchange-alt"></i> Swap Shift
                </button>
                <button class="btn cancel-btn" id="close-details-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .assignment-details {
            padding: 0.5rem 0;
        }
        
        .assignment-header {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .assignment-avatar.large img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
        }
        
        .assignment-header-info h4 {
            margin: 0 0 0.5rem 0;
            font-size: 1.2rem;
        }
        
        .assignment-header-info p {
            margin: 0 0 0.25rem 0;
            color: var(--text-secondary);
        }
        
        .assignment-shift-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .detail-item {
            display: flex;
            flex-direction: column;
        }
        
        .detail-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-bottom: 0.25rem;
        }
        
        .detail-value {
            font-weight: 500;
        }
        
        .preference-note {
            padding: 0.75rem;
            background-color: var(--bg-secondary);
            border-radius: 6px;
            margin-top: 1rem;
            border-left: 3px solid #FFC107;
        }
        
        .preference-note h5 {
            margin: 0 0 0.5rem 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #FFC107;
        }
        
        .preference-note p {
            margin: 0;
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(style);
    
    // Show the modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    document.getElementById('close-details-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    document.getElementById('remove-assignment-btn').addEventListener('click', () => {
        removeAssignment(staff.id, dayIndex, shiftType);
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    document.getElementById('swap-assignment-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
            showSwapShiftModal(staff.id, dayIndex, shiftType);
        }, 300);
    });
}

/**
 * Get HTML for staff preferences
 */
function getStaffPreferencesHtml(staffId, dayIndex, shiftType) {
    const preferences = staffPreferences[staffId];
    if (!preferences) return '';
    
    let message = '';
    
    if (preferences.avoidDays && preferences.avoidDays.includes(dayIndex)) {
        message = `This staff member prefers not to work on ${DAYS_OF_WEEK[dayIndex]}.`;
    } else if (preferences.avoidShifts && preferences.avoidShifts.includes(shiftType)) {
        message = `This staff member prefers not to work ${SHIFT_TYPES[Object.keys(SHIFT_TYPES).find(key => 
            SHIFT_TYPES[key].id === shiftType
        )].label} shifts.`;
    } else if (preferences.preferredDays && !preferences.preferredDays.includes(dayIndex)) {
        const preferredDays = preferences.preferredDays.map(d => DAYS_SHORT[d]).join(', ');
        message = `This staff member prefers to work on: ${preferredDays}`;
    } else if (preferences.preferredShifts && !preferences.preferredShifts.includes(shiftType)) {
        const preferredShifts = preferences.preferredShifts.map(s => 
            SHIFT_TYPES[Object.keys(SHIFT_TYPES).find(key => SHIFT_TYPES[key].id === s)].label
        ).join(', ');
        message = `This staff member prefers: ${preferredShifts} shifts`;
    }
    
    if (!message) return '';
    
    return `
        <div class="preference-note">
            <h5><i class="fas fa-star"></i> Staff Preference</h5>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Show modal to add staff to shift
 */
function showAddToShiftModal(dayIndex, shiftType) {
    // Find eligible staff for this shift
    const eligibleStaff = staffList.filter(staff => {
        if (staff.status !== 'available') return false;
        if (!staff.shifts.includes(shiftType)) return false;
        
        // Check if staff is already assigned to this shift
        const key = `${dayIndex}-${shiftType}`;
        const currentAssignments = scheduleData[key] || [];
        if (currentAssignments.includes(staff.id)) return false;
        
        return true;
    });
    
    if (eligibleStaff.length === 0) {
        showToast("No eligible staff available for this shift", "warning");
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'add-to-shift-modal';
    
    const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-plus-circle"></i>
                    Add Staff to ${DAYS_SHORT[dayIndex]} ${shiftTypeObj.label}
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="add-to-shift-form">
                    <div class="form-group">
                        <label for="shift-staff">Select Staff Member</label>
                        <select id="shift-staff" class="form-control" required>
                            <option value="">Select staff member</option>
                            ${eligibleStaff.map(staff => `
                                <option value="${staff.id}">${staff.name} (${staff.role})</option>
                            `).join('')}
                        </select>
                        <small class="form-text">You can add more staff members after creating the shift.</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn cancel-btn" id="cancel-add-to-shift">Cancel</button>
                <button class="btn primary-btn" id="confirm-add-to-shift">
                    <i class="fas fa-plus"></i> Add to Shift
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    document.getElementById('cancel-add-to-shift').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    document.getElementById('confirm-add-to-shift').addEventListener('click', () => {
        const staffSelect = document.getElementById('shift-staff');
        const staffId = staffSelect.value;
        
        if (!staffId) {
            showToast("Please select a staff member", "warning");
            return;
        }
        
        // Add staff to shift
        addAssignment(staffId, dayIndex, shiftType);
        
        // Close modal
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
}

/**
 * Show modal to swap a shift
 */
function showSwapShiftModal(staffId, dayIndex, shiftType) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    
    // Find eligible staff for swapping
    const eligibleStaff = staffList.filter(s => {
        if (s.id === staffId) return false; // Exclude current staff
        if (s.status !== 'available') return false;
        if (!s.shifts.includes(shiftType)) return false;
        
        return true;
    });
    
    if (eligibleStaff.length === 0) {
        showToast("No eligible staff available for swapping", "warning");
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'swap-shift-modal';
    
    const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-exchange-alt"></i>
                    Swap Shift with Another Staff
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="swap-info">
                    <p>Swapping ${staff.name}'s shift on ${DAYS_OF_WEEK[dayIndex]} (${shiftTypeObj.label})</p>
                </div>
                <form id="swap-shift-form">
                    <div class="form-group">
                        <label for="swap-staff">Select Staff to Swap With</label>
                        <select id="swap-staff" class="form-control" required>
                            <option value="">Select staff member</option>
                            ${eligibleStaff.map(s => `
                                <option value="${s.id}">${s.name} (${s.role})</option>
                            `).join('')}
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn cancel-btn" id="cancel-swap">Cancel</button>
                <button class="btn primary-btn" id="confirm-swap">
                    <i class="fas fa-exchange-alt"></i> Swap Shift
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    document.getElementById('cancel-swap').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    document.getElementById('confirm-swap').addEventListener('click', () => {
        const swapStaffSelect = document.getElementById('swap-staff');
        const swapStaffId = swapStaffSelect.value;
        
        if (!swapStaffId) {
            showToast("Please select a staff member", "warning");
            return;
        }
        
        // Remove current staff from shift
        removeAssignment(staffId, dayIndex, shiftType, false);
        
        // Add new staff to shift
        addAssignment(swapStaffId, dayIndex, shiftType);
        
        // Show success message
        const swapStaff = staffList.find(s => s.id === swapStaffId);
        if (swapStaff) {
            showToast(`Shift swapped from ${staff.name} to ${swapStaff.name}`, "success");
        }
        
        // Close modal
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
}

/**
 * Add AI suggestions section
 */
function addAISuggestionsSection() {
    const scheduleGrid = document.getElementById('schedule-grid');
    if (!scheduleGrid) return;
    
    // Check if suggestions container already exists
    let suggestionsContainer = document.getElementById('ai-suggestions-container');
    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.id = 'ai-suggestions-container';
        suggestionsContainer.className = 'ai-suggestions-container';
        
        suggestionsContainer.innerHTML = `
            <div class="ai-suggestions-header">
                <h3><i class="fas fa-robot"></i> AI Ráðleggingar</h3>
                <div class="ai-suggestions-controls">
                    <button class="toggle-suggestions-btn" title="Toggle suggestions">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button class="refresh-suggestions-btn" title="Refresh suggestions">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
            <div class="ai-suggestions-content" id="ai-suggestions-content">
                <div class="ai-loading">
                    <div class="ai-spinner"></div>
                    <p>Greini vaktaáætlun...</p>
                </div>
            </div>
        `;
        
        // Add event listeners
        suggestionsContainer.querySelector('.refresh-suggestions-btn').addEventListener('click', generateAISuggestions);
        suggestionsContainer.querySelector('.toggle-suggestions-btn').addEventListener('click', () => {
            const content = suggestionsContainer.querySelector('.ai-suggestions-content');
            const icon = suggestionsContainer.querySelector('.toggle-suggestions-btn i');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                content.style.display = 'none';
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        });
        
        // Position and style the container
        suggestionsContainer.style.position = 'fixed';
        suggestionsContainer.style.bottom = '20px';
        suggestionsContainer.style.right = '20px';
        suggestionsContainer.style.width = '350px';
        suggestionsContainer.style.maxHeight = '500px';
        suggestionsContainer.style.zIndex = '1000';
        suggestionsContainer.style.backgroundColor = 'var(--bg-color)';
        suggestionsContainer.style.borderRadius = '12px';
        suggestionsContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        suggestionsContainer.style.border = '1px solid var(--border-color)';
        
        // Add styles for the content
        const style = document.createElement('style');
        style.textContent = `
            .ai-suggestions-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid var(--border-color);
                background-color: var(--bg-secondary);
                border-radius: 12px 12px 0 0;
            }
            
            .ai-suggestions-header h3 {
                margin: 0;
                font-size: 1.1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-primary);
            }
            
            .ai-suggestions-controls {
                display: flex;
                gap: 0.5rem;
            }
            
            .ai-suggestions-controls button {
                background: none;
                border: none;
                padding: 0.5rem;
                cursor: pointer;
                color: var(--text-secondary);
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            
            .ai-suggestions-controls button:hover {
                background-color: var(--bg-hover);
                color: var(--text-primary);
            }
            
            .ai-suggestions-content {
                padding: 1rem;
                overflow-y: auto;
                max-height: 400px;
            }
            
            .ai-suggestion-item {
                display: flex;
                gap: 1rem;
                padding: 1rem;
                margin-bottom: 0.75rem;
                background-color: var(--bg-secondary);
                border-radius: 8px;
                border-left: 4px solid var(--border-color);
                transition: all 0.2s ease;
            }
            
            .ai-suggestion-item:hover {
                transform: translateX(4px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .ai-suggestion-item.warning {
                border-left-color: #FFC107;
            }
            
            .ai-suggestion-item.info {
                border-left-color: #2196F3;
            }
            
            .ai-suggestion-item.error {
                border-left-color: #F44336;
            }
            
            .suggestion-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background-color: var(--bg-hover);
                color: var(--text-secondary);
            }
            
            .suggestion-content {
                flex: 1;
            }
            
            .suggestion-content p {
                margin: 0 0 0.5rem 0;
                color: var(--text-primary);
                font-size: 0.95rem;
                line-height: 1.4;
            }
            
            .suggestion-action-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0.75rem;
                background-color: var(--bg-hover);
                border: none;
                border-radius: 6px;
                color: var(--text-primary);
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .suggestion-action-btn:hover {
                background-color: var(--bg-active);
                transform: translateY(-1px);
            }
            
            .ai-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                padding: 2rem;
            }
            
            .ai-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--border-color);
                border-top-color: var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(suggestionsContainer);
    }
}

/**
 * Generate AI suggestions for the current schedule
 */
function generateAISuggestions() {
    const suggestionsContent = document.getElementById('ai-suggestions-content');
    if (!suggestionsContent) return;
    
    // Show loading
    suggestionsContent.innerHTML = `
        <div class="ai-loading">
            <div class="ai-spinner"></div>
            <p>Greini vaktaáætlun...</p>
        </div>
    `;
    
    // Generate suggestions
    setTimeout(() => {
        const suggestions = generateScheduleSuggestions();
        
        if (suggestions.length === 0) {
            suggestionsContent.innerHTML = `
                <div class="ai-no-suggestions">
                    <i class="fas fa-check-circle"></i>
                    <p>Vaktaáætlunin lítur vel út!</p>
                </div>
            `;
            return;
        }
        
        suggestionsContent.innerHTML = `
            <div class="ai-suggestions-list">
                ${suggestions.map((suggestion, index) => `
                    <div class="ai-suggestion-item ${suggestion.type}">
                        <div class="suggestion-icon">
                            <i class="fas fa-${getSuggestionIcon(suggestion.type)}"></i>
                        </div>
                        <div class="suggestion-content">
                            <p>${suggestion.message}</p>
                            ${suggestion.action ? `
                                <button class="suggestion-action-btn" data-action="${suggestion.action}" data-index="${index}">
                                    <i class="fas fa-${getSuggestionActionIcon(suggestion.action)}"></i>
                                    ${getSuggestionActionText(suggestion.action)}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add event listeners to action buttons
        document.querySelectorAll('.suggestion-action-btn').forEach(button => {
            button.addEventListener('click', handleSuggestionAction);
        });
    }, 1500);
}

/**
 * Generate schedule suggestions
 */
function generateScheduleSuggestions() {
    const suggestions = [];
    
    // Check for unfilled shifts
    for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length; dayIndex++) {
        for (const shiftType of Object.values(SHIFT_TYPES).map(t => t.id)) {
            const key = `${dayIndex}-${shiftType}`;
            const staffIds = scheduleData[key] || [];
            
            if (staffIds.length === 0) {
                // Create suggestion for unfilled shift
                const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
                
                // Find a recommended staff for this shift
                const recommendedStaff = findRecommendedStaff(dayIndex, shiftType);
                
                if (recommendedStaff) {
                    suggestions.push({
                        type: 'warning',
                        message: `${DAYS_OF_WEEK[dayIndex]} ${shiftTypeObj.label} er ómönnuð. Við mælum með ${recommendedStaff.name}.`,
                        action: 'assign',
                        data: {
                            dayIndex,
                            shiftType,
                            staffId: recommendedStaff.id
                        }
                    });
                } else {
                    suggestions.push({
                        type: 'warning',
                        message: `${DAYS_OF_WEEK[dayIndex]} ${shiftTypeObj.label} er ómönnuð.`,
                        action: 'fill_shift',
                        data: {
                            dayIndex,
                            shiftType
                        }
                    });
                }
            }
        }
    }
    
    // Check for staff preferences
    for (const key in scheduleData) {
        const [dayIndex, shiftType] = key.split('-');
        const staffIds = scheduleData[key] || [];
        
        staffIds.forEach(staffId => {
            const preferences = staffPreferences[staffId];
            if (preferences) {
                const staff = staffList.find(s => s.id === staffId);
                if (!staff) return;
                
                if (preferences.avoidDays && preferences.avoidDays.includes(parseInt(dayIndex))) {
                    // Staff is assigned to a day they prefer to avoid
                    suggestions.push({
                        type: 'info',
                        message: `${staff.name} er á vakt á ${DAYS_OF_WEEK[dayIndex]} en kýs venjulega að vinna ekki þann dag.`,
                        action: 'swap',
                        data: {
                            staffId,
                            dayIndex: parseInt(dayIndex),
                            shiftType
                        }
                    });
                } else if (preferences.avoidShifts && preferences.avoidShifts.includes(shiftType)) {
                    // Staff is assigned to a shift type they prefer to avoid
                    const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
                    suggestions.push({
                        type: 'info',
                        message: `${staff.name} er á ${shiftTypeObj.label} en kýs venjulega ekki þá vakt.`,
                        action: 'swap',
                        data: {
                            staffId,
                            dayIndex: parseInt(dayIndex),
                            shiftType
                        }
                    });
                }
            }
        });
    }
    
    // Check for staff with too many shifts
    staffList.forEach(staff => {
        const hours = calculateStaffHours(staff.id);
        if (hours > MAX_HOURS_PER_WEEK * 0.8) {
            // Staff is approaching max hours
            suggestions.push({
                type: hours > MAX_HOURS_PER_WEEK ? 'error' : 'warning',
                message: `${staff.name} er með ${hours} klst af ${MAX_HOURS_PER_WEEK} hámarki.`,
                action: hours > MAX_HOURS_PER_WEEK ? 'reduce_hours' : null,
                data: {
                    staffId: staff.id,
                    hours
                }
            });
        }
    });
    
    return suggestions;
}

/**
 * Find recommended staff for a shift
 */
function findRecommendedStaff(dayIndex, shiftType) {
    // Find staff who can work this shift
    const eligibleStaff = staffList.filter(staff => {
        if (staff.status !== 'available') return false;
        if (!staff.shifts.includes(shiftType)) return false;
        
        // Check if staff already has too many shifts
        const hours = calculateStaffHours(staff.id);
        if (hours + HOURS_PER_SHIFT > MAX_HOURS_PER_WEEK) return false;
        
        // Check if staff already has a shift on this day
        const key = `${dayIndex}-${shiftType}`;
        const staffIds = scheduleData[key] || [];
        for (const type of Object.values(SHIFT_TYPES).map(t => t.id)) {
            const dayKey = `${dayIndex}-${type}`;
            const dayStaffIds = scheduleData[dayKey] || [];
            if (dayStaffIds.includes(staff.id)) return false;
        }
        
        return true;
    });
    
    if (eligibleStaff.length === 0) return null;
    
    // Score each eligible staff
    const scoredStaff = eligibleStaff.map(staff => {
        let score = 0;
        
        // Prefer staff with fewer hours
        const hours = calculateStaffHours(staff.id);
        score += (MAX_HOURS_PER_WEEK - hours) / 8;
        
        // Check staff preferences
        const preferences = staffPreferences[staff.id];
        if (preferences) {
            if (preferences.preferredDays && preferences.preferredDays.includes(dayIndex)) {
                score += 5; // Bonus for preferred day
            }
            if (preferences.preferredShifts && preferences.preferredShifts.includes(shiftType)) {
                score += 5; // Bonus for preferred shift
            }
            if (preferences.avoidDays && preferences.avoidDays.includes(dayIndex)) {
                score -= 10; // Penalty for avoided day
            }
            if (preferences.avoidShifts && preferences.avoidShifts.includes(shiftType)) {
                score -= 10; // Penalty for avoided shift
            }
        }
        
        return { staff, score };
    });
    
    // Sort by score and return the best match
    scoredStaff.sort((a, b) => b.score - a.score);
    return scoredStaff[0]?.staff;
}

/**
 * Get icon for suggestion type
 */
function getSuggestionIcon(type) {
    switch (type) {
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        case 'success': return 'check-circle';
        default: return 'lightbulb';
    }
}

/**
 * Get icon for suggestion action
 */
function getSuggestionActionIcon(action) {
    switch (action) {
        case 'assign': return 'user-plus';
        case 'fill_shift': return 'plus-circle';
        case 'swap': return 'exchange-alt';
        case 'reduce_hours': return 'user-minus';
        default: return 'magic';
    }
}

/**
 * Get text for suggestion action
 */
function getSuggestionActionText(action) {
    switch (action) {
        case 'assign': return 'Setja á vakt';
        case 'fill_shift': return 'Fylla vakt';
        case 'swap': return 'Skipta vakt';
        case 'reduce_hours': return 'Minnka vaktir';
        default: return 'Framkvæma';
    }
}

/**
 * Handle suggestion action
 */
function handleSuggestionAction(e) {
    const button = e.currentTarget;
    const action = button.getAttribute('data-action');
    const index = parseInt(button.getAttribute('data-index'));
    
    // Get suggestion data
    const suggestionsContent = document.getElementById('ai-suggestions-content');
    if (!suggestionsContent) return;
    
    const suggestions = generateScheduleSuggestions();
    if (index >= suggestions.length) return;
    
    const suggestion = suggestions[index];
    const data = suggestion.data;
    
    switch (action) {
        case 'assign':
            if (data.staffId && data.dayIndex !== undefined && data.shiftType) {
                addAssignment(data.staffId, data.dayIndex, data.shiftType);
            }
            break;
            
        case 'fill_shift':
            if (data.dayIndex !== undefined && data.shiftType) {
                showAddToShiftModal(data.dayIndex, data.shiftType);
            }
            break;
            
        case 'swap':
            if (data.staffId && data.dayIndex !== undefined && data.shiftType) {
                showSwapShiftModal(data.staffId, data.dayIndex, data.shiftType);
            }
            break;
            
        case 'reduce_hours':
            if (data.staffId) {
                showReduceHoursModal(data.staffId);
            }
            break;
    }
    
    // Regenerate suggestions after action
    setTimeout(generateAISuggestions, 500);
}

/**
 * Show modal to reduce staff hours
 */
function showReduceHoursModal(staffId) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    
    // Get all shifts assigned to this staff
    const assignments = [];
    
    for (const key in scheduleData) {
        const [dayIndex, shiftType] = key.split('-');
        const staffIds = scheduleData[key] || [];
        
        if (staffIds.includes(staffId)) {
            const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
            assignments.push({
                dayIndex: parseInt(dayIndex),
                shiftType,
                day: DAYS_OF_WEEK[dayIndex],
                shift: shiftTypeObj.label
            });
        }
    }
    
    if (assignments.length === 0) {
        showToast(`${staff.name} has no assignments to remove`, "warning");
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'reduce-hours-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-user-minus"></i>
                    Reduce Hours for ${staff.name}
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Select a shift to remove:</p>
                <div class="assignments-list">
                    ${assignments.map((assignment, index) => `
                        <div class="assignment-option">
                            <input type="radio" name="assignment" id="assignment-${index}" value="${index}" ${index === 0 ? 'checked' : ''}>
                            <label for="assignment-${index}">
                                ${assignment.day} ${assignment.shift}
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn cancel-btn" id="cancel-reduce">Cancel</button>
                <button class="btn danger-btn" id="confirm-reduce">
                    <i class="fas fa-trash"></i> Remove Shift
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .assignments-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin: 1rem 0;
        }
        
        .assignment-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border-radius: 4px;
            background-color: var(--bg-secondary);
        }
        
        .assignment-option input[type="radio"] {
            margin: 0;
        }
        
        .assignment-option label {
            margin: 0;
            cursor: pointer;
            flex: 1;
        }
    `;
    document.head.appendChild(style);
    
    // Show the modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    document.getElementById('cancel-reduce').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    document.getElementById('confirm-reduce').addEventListener('click', () => {
        // Get selected assignment
        const selectedRadio = document.querySelector('input[name="assignment"]:checked');
        if (!selectedRadio) {
            showToast("Please select a shift to remove", "warning");
            return;
        }
        
        const index = parseInt(selectedRadio.value);
        const assignment = assignments[index];
        
        // Remove assignment
        removeAssignment(staffId, assignment.dayIndex, assignment.shiftType);
        
        // Close modal
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
}

/**
 * Initialize Sortable.js for drag and drop
 */
function initSortable() {
    // Load Sortable.js if not already loaded
    if (typeof Sortable === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
        script.onload = setupSortable;
        document.head.appendChild(script);
    } else {
        setupSortable();
    }
}

/**
 * Set up Sortable instances
 */
function setupSortable() {
    // Clean up any existing instances
    sortableInstances.forEach(instance => {
        if (instance && typeof instance.destroy === 'function') {
            instance.destroy();
        }
    });
    
    sortableInstances = [];
    
    // Set up staff list as draggable
    const staffList = document.getElementById('staff-list');
    if (staffList) {
        const staffSortable = Sortable.create(staffList, {
            group: {
                name: 'staff',
                pull: 'clone',
                put: false
            },
            sort: false,
            animation: 150,
            ghostClass: 'staff-ghost',
            chosenClass: 'staff-chosen',
            dragClass: 'staff-dragging',
            onStart: () => {
                isDragging = true;
                document.body.style.cursor = 'grabbing';
            },
            onEnd: () => {
                isDragging = false;
                document.body.style.cursor = '';
            }
        });
        
        sortableInstances.push(staffSortable);
    }
    
    // Make each assignments container a drop target
    document.querySelectorAll('.assignments-container').forEach(container => {
        const cellSortable = Sortable.create(container, {
            group: {
                name: 'staff',
                pull: false,
                put: function(to, from) {
                    if (from.el.classList.contains('staff-list')) {
                        // Dragging from staff list
                        const scheduleCell = to.el.closest('.schedule-cell');
                        if (!scheduleCell) {
                            console.warn('Schedule cell not found for drop target');
                            showToast('Ekki hægt að setja starfsmann hér', 'error');
                            return false;
                        }
                        
                        // Validate day index
                        const dayAttr = scheduleCell.getAttribute('data-day');
                        if (!dayAttr) {
                            console.warn('Day attribute not found on schedule cell');
                            showToast('Villa í vaktarupplýsingum', 'error');
                            return false;
                        }
                        const dayIndex = parseInt(dayAttr);
                        if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= DAYS_OF_WEEK.length) {
                            console.warn('Invalid day index:', dayAttr);
                            showToast('Ógildur dagsetning', 'error');
                            return false;
                        }
                        
                        // Validate shift type
                        const shiftType = scheduleCell.getAttribute('data-shift');
                        if (!shiftType) {
                            console.warn('Shift type attribute not found on schedule cell');
                            showToast('Villa í vaktarupplýsingum', 'error');
                            return false;
                        }
                        if (!Object.values(SHIFT_TYPES).some(st => st.id === shiftType)) {
                            console.warn('Invalid shift type:', shiftType);
                            showToast('Ógild vakt', 'error');
                            return false;
                        }
                        
                        // Get staff element and validate
                        const staffElement = from.el.children[from.oldIndex];
                        if (!staffElement) {
                            console.warn('Staff element not found in source list');
                            showToast('Villa í starfsmannslistanum', 'error');
                            return false;
                        }
                        
                        const staffIdAttr = staffElement.getAttribute('data-id');
                        if (!staffIdAttr) {
                            console.warn('Staff ID attribute not found on element');
                            showToast('Villa í starfsmannslistanum', 'error');
                            return false;
                        }
                        
                        const staffId = staffIdAttr;
                        
                        // Check if assignment is valid
                        const isValid = isValidAssignment(staffId, dayIndex, shiftType);
                        if (!isValid) {
                            const errorMessage = getAssignmentErrorMessage(staffId, dayIndex, shiftType);
                            showToast(errorMessage, 'error');
                        }
                        
                        return isValid;
                    }
                    return false;
                }
            },
            sort: false,
            animation: 150,
            onAdd: function(evt) {
                handleSortableAdd(evt);
            },
            onStart: () => {
                isDragging = true;
                document.body.style.cursor = 'grabbing';
            },
            onEnd: () => {
                isDragging = false;
                document.body.style.cursor = '';
            }
        });
        
        sortableInstances.push(cellSortable);
    });
}

/**
 * Handle adding a staff member via Sortable
 */
function handleSortableAdd(evt) {
    // Remove the cloned element
    evt.item.remove();
    
    // Get data from the original staff element
    const staffId = evt.clone.getAttribute('data-id');
    const staff = staffList.find(s => s.id === staffId);
    
    if (!staff) return;
    
    // Get cell data
    const cell = evt.to.closest('.schedule-cell');
    const dayIndex = parseInt(cell.getAttribute('data-day'));
    const shiftType = cell.getAttribute('data-shift');
    
    // Add assignment
    addAssignment(staffId, dayIndex, shiftType);
}

// ===== DRAG AND DROP HANDLERS =====

/**
 * Handle drag start event
 */
function handleDragStart(e) {
    isDragging = true;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
    
    // Add dragging class
    e.target.classList.add('dragging');
    
    // Mark valid and invalid drop targets
    const staffId = e.target.getAttribute('data-id');
    
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        const dayIndex = parseInt(cell.getAttribute('data-day'));
        const shiftType = cell.getAttribute('data-shift');
        
        if (isValidAssignment(staffId, dayIndex, shiftType)) {
            cell.classList.add('valid-drop');
        } else {
            cell.classList.add('invalid-drop');
        }
    });
}

/**
 * Handle drag end event
 */
function handleDragEnd(e) {
    isDragging = false;
    // Remove dragging class
    e.target.classList.remove('dragging');
    
    // Reset drop targets
    document.querySelectorAll('.schedule-cell').forEach(cell => {
        cell.classList.remove('dragover', 'valid-drop', 'invalid-drop');
    });
}

/**
 * Handle drag over event
 */
function handleDragOver(e) {
    // Prevent default to allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

/**
 * Handle drag enter event
 */
function handleDragEnter(e) {
    const cell = e.currentTarget;
    
    // Only highlight if it's a valid drop target
    if (cell.classList.contains('valid-drop')) {
        cell.classList.add('dragover');
    }
}

/**
 * Handle drag leave event
 */
function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

/**
 * Handle drop event
 */
function handleDrop(e) {
    e.preventDefault();
    
    const cell = e.currentTarget;
    cell.classList.remove('dragover', 'valid-drop', 'invalid-drop');
    
    // Get staff ID
    const staffId = e.dataTransfer.getData('text/plain');
    
    // Get day and shift
    const dayIndex = parseInt(cell.getAttribute('data-day'));
    const shiftType = cell.getAttribute('data-shift');
    
    // Check if this assignment is valid
    if (!isValidAssignment(staffId, dayIndex, shiftType)) {
        const errorMessage = getAssignmentErrorMessage(staffId, dayIndex, shiftType);
        showToast(errorMessage, "error");
        return;
    }
    
    // Add assignment
    addAssignment(staffId, dayIndex, shiftType);
}

// ===== SCHEDULE OPERATIONS =====

/**
 * Check if an assignment is valid
 */
function isValidAssignment(staffId, dayIndex, shiftType) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return false;
    
    // Check if staff is available
    if (staff.status !== 'available') {
        return false;
    }
    
    // Check if staff can work this shift type
    if (!staff.shifts.includes(shiftType)) {
        return false;
    }
    
    // Check if staff already has this shift
    const key = `${dayIndex}-${shiftType}`;
    const currentStaff = scheduleData[key] || [];
    if (currentStaff.includes(staffId)) {
        return false;
    }
    
    // Check if staff already has max shifts for this day
    let shiftsOnDay = 0;
    for (const type of Object.values(SHIFT_TYPES).map(t => t.id)) {
        const dayKey = `${dayIndex}-${type}`;
        const dayStaff = scheduleData[dayKey] || [];
        if (dayStaff.includes(staffId)) {
            shiftsOnDay++;
        }
    }
    
    if (shiftsOnDay >= MAX_SHIFTS_PER_DAY) {
        return false;
    }
    
    // Check if staff would exceed maximum weekly hours
    const currentHours = calculateStaffHours(staffId);
    if (currentHours + HOURS_PER_SHIFT > MAX_HOURS_PER_WEEK) {
        return false;
    }
    
    // Check if shift already has maximum staff
    if (currentStaff.length >= MAX_STAFF_PER_SHIFT) {
        return false;
    }
    
    return true;
}

/**
 * Get error message for invalid assignment
 */
function getAssignmentErrorMessage(staffId, dayIndex, shiftType) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return "Invalid staff member";
    
    // Check if staff is available
    if (staff.status !== 'available') {
        return `${staff.name} er ekki laus`;
    }
    
    // Check if staff can work this shift type
    if (!staff.shifts.includes(shiftType)) {
        const shiftTypeLabel = SHIFT_TYPES[Object.keys(SHIFT_TYPES).find(key => 
            SHIFT_TYPES[key].id === shiftType
        )].label;
        return `${staff.name} getur ekki unnið ${shiftTypeLabel}`;
    }
    
    // Check if staff already has this shift
    const key = `${dayIndex}-${shiftType}`;
    const currentStaff = scheduleData[key] || [];
    if (currentStaff.includes(staffId)) {
        return `${staff.name} er þegar á þessari vakt`;
    }
    
    // Check if staff already has max shifts for this day
    let shiftsOnDay = 0;
    for (const type of Object.values(SHIFT_TYPES).map(t => t.id)) {
        const dayKey = `${dayIndex}-${type}`;
        const dayStaff = scheduleData[dayKey] || [];
        if (dayStaff.includes(staffId)) {
            shiftsOnDay++;
        }
    }
    
    if (shiftsOnDay >= MAX_SHIFTS_PER_DAY) {
        return `${staff.name} er þegar með hámarksvaktir á þessum degi (${MAX_SHIFTS_PER_DAY})`;
    }
    
    // Check if staff would exceed maximum weekly hours
    const currentHours = calculateStaffHours(staffId);
    if (currentHours + HOURS_PER_SHIFT > MAX_HOURS_PER_WEEK) {
        return `${staff.name} myndi fara yfir hámarksstundir (${MAX_HOURS_PER_WEEK})`;
    }
    
    // Check if shift already has maximum staff
    if (currentStaff.length >= MAX_STAFF_PER_SHIFT) {
        return `Þessi vakt er þegar fullmönnuð (hámark: ${MAX_STAFF_PER_SHIFT})`;
    }
    
    return "Villa við að bæta við starfsmanni";
}

/**
 * Add assignment
 */
function addAssignment(staffId, dayIndex, shiftType, showNotification = true) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    
    const key = `${dayIndex}-${shiftType}`;
    
    // Initialize array if it doesn't exist
    if (!scheduleData[key]) {
        scheduleData[key] = [];
    }
    
    // Add staff ID if not already present
    if (!scheduleData[key].includes(staffId)) {
        scheduleData[key].push(staffId);
        
        // Update UI
        const cell = document.querySelector(`.schedule-cell[data-day="${dayIndex}"][data-shift="${shiftType}"]`);
        if (cell) {
            const assignmentsContainer = cell.querySelector('.assignments-container');
            const placeholder = cell.querySelector('.cell-placeholder');
            
            if (assignmentsContainer) {
                addAssignmentToCell(assignmentsContainer, staff, dayIndex, shiftType);
                placeholder.style.display = 'none';
                cell.classList.add('has-assignments');
                
                // Update staff count badge
                const countBadge = cell.querySelector('.staff-count-badge');
                if (countBadge) {
                    countBadge.innerHTML = `<span>${scheduleData[key].length}</span>`;
                } else {
                    const newBadge = document.createElement('div');
                    newBadge.className = 'staff-count-badge';
                    newBadge.innerHTML = `<span>${scheduleData[key].length}</span>`;
                    cell.appendChild(newBadge);
                }
                
                // Add understaffed/overstaffed indicators
                const recommendedStaff = getRecommendedStaffCount(dayIndex, shiftType);
                cell.classList.remove('understaffed', 'overstaffed', 'well-staffed');
                
                if (scheduleData[key].length < recommendedStaff) {
                    cell.classList.add('understaffed');
                } else if (scheduleData[key].length > recommendedStaff) {
                    cell.classList.add('overstaffed');
                } else {
                    cell.classList.add('well-staffed');
                }
            }
        }
        
        // Update staff hours
        updateStaffHours();
        
        // Update schedule stats
        updateScheduleStats();
        
        // Refresh AI suggestions
        generateAISuggestions();
        
        // Show success toast
        if (showNotification) {
            const dayName = DAYS_OF_WEEK[dayIndex];
            const shiftName = SHIFT_TYPES[Object.keys(SHIFT_TYPES).find(key => 
                SHIFT_TYPES[key].id === shiftType
            )].label;
            
            showToast(`${staff.name} settur á ${dayName} ${shiftName}`, "success");
        }
    }
}

/**
 * Remove assignment
 */
function removeAssignment(staffId, dayIndex, shiftType, showNotification = true) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    
    const key = `${dayIndex}-${shiftType}`;
    
    // Check if staff is assigned to this shift
    if (!scheduleData[key] || !scheduleData[key].includes(staffId)) {
        return;
    }
    
    // Remove staff from shift
    scheduleData[key] = scheduleData[key].filter(id => id !== staffId);
    
    // If no staff left, delete the key
    if (scheduleData[key].length === 0) {
        delete scheduleData[key];
    }
    
    // Update UI
    const cell = document.querySelector(`.schedule-cell[data-day="${dayIndex}"][data-shift="${shiftType}"]`);
    if (cell) {
        const assignmentsContainer = cell.querySelector('.assignments-container');
        const placeholder = cell.querySelector('.cell-placeholder');
        
        if (assignmentsContainer) {
            const assignment = assignmentsContainer.querySelector(`.staff-assignment[data-staff-id="${staffId}"]`);
            if (assignment) {
                assignment.remove();
            }
            
            // Show placeholder if no assignments left
            if (assignmentsContainer.children.length === 0) {
                placeholder.style.display = 'flex';
                cell.classList.remove('has-assignments');
                
                // Remove staff count badge
                const countBadge = cell.querySelector('.staff-count-badge');
                if (countBadge) {
                    countBadge.remove();
                }
            } else {
                // Update staff count badge
                const countBadge = cell.querySelector('.staff-count-badge');
                if (countBadge) {
                    countBadge.innerHTML = `<span>${scheduleData[key] ? scheduleData[key].length : 0}</span>`;
                }
            }
            
            // Update understaffed/overstaffed indicators
            const recommendedStaff = getRecommendedStaffCount(dayIndex, shiftType);
            cell.classList.remove('understaffed', 'overstaffed', 'well-staffed');
            
            if (!scheduleData[key] || scheduleData[key].length === 0) {
                cell.classList.add('understaffed');
            } else if (scheduleData[key].length < recommendedStaff) {
                cell.classList.add('understaffed');
            } else if (scheduleData[key].length > recommendedStaff) {
                cell.classList.add('overstaffed');
            } else {
                cell.classList.add('well-staffed');
            }
        }
    }
    
    // Update staff hours
    updateStaffHours();
    
    // Update schedule stats
    updateScheduleStats();
    
    // Refresh AI suggestions
    generateAISuggestions();
    
    // Show success toast
    if (showNotification) {
        const dayName = DAYS_OF_WEEK[dayIndex];
        const shiftName = SHIFT_TYPES[Object.keys(SHIFT_TYPES).find(key => 
            SHIFT_TYPES[key].id === shiftType
        )].label;
        
        showToast(`${staff.name} fjarlægður af ${dayName} ${shiftName}`, "info");
    }
}

/**
 * Calculate total hours for a staff member
 */
function calculateStaffHours(staffId) {
    let hours = 0;
    
    // Count shifts assigned to this staff
    for (const key in scheduleData) {
        const staffIds = scheduleData[key] || [];
        if (staffIds.includes(staffId)) {
            hours += HOURS_PER_SHIFT;
        }
    }
    
    return hours;
}

/**
 * Update hours worked for all staff
 */
function updateStaffHours() {
    staffList.forEach(staff => {
        const hours = calculateStaffHours(staff.id);
        staff.hoursWorked = hours;
        
        // Update UI
        const staffEl = document.querySelector(`.staff-item[data-id="${staff.id}"] .staff-hours`);
        if (staffEl) {
            staffEl.textContent = `${hours}h`;
            
            // Add warning class if approaching max
            if (hours > MAX_HOURS_PER_WEEK * 0.8) {
                staffEl.classList.add('hours-warning');
            } else {
                staffEl.classList.remove('hours-warning');
            }
        }
    });
}

/**
 * Update schedule statistics
 */
function updateScheduleStats() {
    // Count total shifts filled
    let filledShifts = 0;
    const totalPossibleShifts = DAYS_OF_WEEK.length * Object.keys(SHIFT_TYPES).length;
    
    for (const key in scheduleData) {
        if (scheduleData[key] && scheduleData[key].length > 0) {
            filledShifts++;
        }
    }
    
    // Count total staff with assignments
    const staffWithAssignments = new Set();
    
    for (const key in scheduleData) {
        const staffIds = scheduleData[key] || [];
        staffIds.forEach(id => staffWithAssignments.add(id));
    }
    
    // Calculate coverage percentage
    const coveragePercentage = Math.round((filledShifts / totalPossibleShifts) * 100);
    
    // Update UI elements
    const totalShiftsEl = document.getElementById('total-shifts');
    if (totalShiftsEl) {
        totalShiftsEl.textContent = filledShifts;
    }
    
    const staffOnShiftEl = document.getElementById('staff-on-shift');
    if (staffOnShiftEl) {
        staffOnShiftEl.textContent = `${staffWithAssignments.size}/${staffList.length}`;
    }
    
    const staffingPercentageEl = document.getElementById('staffing-percentage');
    if (staffingPercentageEl) {
        staffingPercentageEl.textContent = `${coveragePercentage}%`;
        
        // Add color class based on percentage
        staffingPercentageEl.classList.remove('low', 'medium', 'high');
        
        if (coveragePercentage < 50) {
            staffingPercentageEl.classList.add('low');
        } else if (coveragePercentage < 80) {
            staffingPercentageEl.classList.add('medium');
        } else {
            staffingPercentageEl.classList.add('high');
        }
    }
}

/**
 * Clear the entire schedule
 */
function clearSchedule() {
    // Reset schedule data
    scheduleData = {};
    
    // Reset staff hours
    staffList.forEach(staff => {
        staff.hoursWorked = 0;
    });
    
    // Update UI
    refreshScheduleGrid();
    updateStaffHours();
    updateScheduleStats();
    
    // Refresh AI suggestions
    generateAISuggestions();
    
    // Show success message
    showToast("Vaktaáætlun hreinsuð", "info");
}

/**
 * Confirm before clearing schedule
 */
function confirmClearSchedule() {
    // Check if schedule is empty
    const hasAssignments = Object.keys(scheduleData).length > 0;
    
    if (!hasAssignments) {
        showToast("Vaktaáætlun er þegar tóm", "info");
        return;
    }
    
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'confirm-clear-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-trash"></i> Staðfesta hreinsun</h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Ertu viss um að þú viljir hreinsa alla vaktaáætlunina? Þetta er ekki hægt að afturkalla.</p>
            </div>
            <div class="modal-footer">
                <button class="btn cancel-btn" id="cancel-clear">Hætta við</button>
                <button class="btn danger-btn" id="confirm-clear">
                    <i class="fas fa-trash"></i> Hreinsa allt
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    document.getElementById('cancel-clear').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    document.getElementById('confirm-clear').addEventListener('click', () => {
        clearSchedule();
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
}

/**
 * Show edit staff modal
 */
function showEditStaffModal(staffId) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'edit-staff-modal';
    
    // Get staff preferences
    const preferences = staffPreferences[staffId] || {};
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-user-edit"></i>
                    Edit Staff: ${staff.name}
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="staff-detail-header">
                    <div class="staff-avatar large">
                        <img src="${staff.avatar}" alt="${staff.name}">
                        <span class="status-indicator ${staff.status}"></span>
                    </div>
                    <div class="staff-detail-info">
                        <h4>${staff.name}</h4>
                        <p>${staff.role}</p>
                        <p>${staff.department}</p>
                    </div>
                </div>
                
                <form id="edit-staff-form">
                    <div class="form-group">
                        <label for="staff-name">Name</label>
                        <input type="text" id="staff-name" class="form-control" value="${staff.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="staff-role">Role</label>
                        <select id="staff-role" class="form-control" required>
                            <option value="Registered Nurse" ${staff.role === 'Registered Nurse' ? 'selected' : ''}>Registered Nurse</option>
                            <option value="Licensed Practical Nurse" ${staff.role === 'Licensed Practical Nurse' ? 'selected' : ''}>Licensed Practical Nurse</option>
                            <option value="Certified Nursing Assistant" ${staff.role === 'Certified Nursing Assistant' ? 'selected' : ''}>Certified Nursing Assistant</option>
                            <option value="Department Head" ${staff.role === 'Department Head' ? 'selected' : ''}>Department Head</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="staff-department">Department</label>
                        <select id="staff-department" class="form-control" required>
                            <option value="Medical" ${staff.department === 'Medical' ? 'selected' : ''}>Medical</option>
                            <option value="Surgical" ${staff.department === 'Surgical' ? 'selected' : ''}>Surgical</option>
                            <option value="Rehabilitation" ${staff.department === 'Rehabilitation' ? 'selected' : ''}>Rehabilitation</option>
                            <option value="Administration" ${staff.department === 'Administration' ? 'selected' : ''}>Administration</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="staff-status">Status</label>
                        <select id="staff-status" class="form-control" required>
                            <option value="available" ${staff.status === 'available' ? 'selected' : ''}>Available</option>
                            <option value="busy" ${staff.status === 'busy' ? 'selected' : ''}>Busy</option>
                            <option value="unavailable" ${staff.status === 'unavailable' ? 'selected' : ''}>Unavailable</option>
                            <option value="sick" ${staff.status === 'sick' ? 'selected' : ''}>Sick</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Available Shifts</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="morning-shift" name="shifts" value="morning" ${staff.shifts.includes('morning') ? 'checked' : ''}>
                                <label for="morning-shift">Morgunvakt (07:00-15:00)</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="evening-shift" name="shifts" value="evening" ${staff.shifts.includes('evening') ? 'checked' : ''}>
                                <label for="evening-shift">Kvöldvakt (15:00-23:00)</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="night-shift" name="shifts" value="night" ${staff.shifts.includes('night') ? 'checked' : ''}>
                                <label for="night-shift">Næturvakt (23:00-07:00)</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Preferences</label>
                        <div class="preferences-container">
                            <h5>Days To Avoid</h5>
                            <div class="checkbox-group days-group">
                                ${DAYS_OF_WEEK.map((day, index) => `
                                    <div class="checkbox-item">
                                        <input type="checkbox" id="avoid-day-${index}" name="avoid-days" value="${index}" 
                                            ${preferences.avoidDays && preferences.avoidDays.includes(index) ? 'checked' : ''}>
                                        <label for="avoid-day-${index}">${day}</label>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <h5>Preferred Shifts</h5>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="prefer-morning" name="preferred-shifts" value="morning" 
                                        ${preferences.preferredShifts && preferences.preferredShifts.includes('morning') ? 'checked' : ''}>
                                    <label for="prefer-morning">Morgunvakt</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="prefer-evening" name="preferred-shifts" value="evening" 
                                        ${preferences.preferredShifts && preferences.preferredShifts.includes('evening') ? 'checked' : ''}>
                                    <label for="prefer-evening">Kvöldvakt</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="prefer-night" name="preferred-shifts" value="night" 
                                        ${preferences.preferredShifts && preferences.preferredShifts.includes('night') ? 'checked' : ''}>
                                    <label for="prefer-night">Næturvakt</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn danger-btn" id="delete-staff-btn">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <button class="btn cancel-btn" id="cancel-edit-staff">Cancel</button>
                <button class="btn primary-btn" id="save-staff-btn">
                    <i class="fas fa-save"></i> Save
                </button>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .staff-detail-header {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .staff-avatar.large img {
            width: 64px;
            height: 64px;
        }
        
        .staff-detail-info h4 {
            margin: 0 0 0.5rem 0;
        }
        
        .staff-detail-info p {
            margin: 0 0 0.25rem 0;
            color: var(--text-secondary);
        }
        
        .preferences-container {
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 1rem;
        }
        
        .preferences-container h5 {
            margin: 0 0 0.5rem 0;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .days-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    document.getElementById('cancel-edit-staff').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    document.getElementById('save-staff-btn').addEventListener('click', () => {
        // Get form values
        const name = document.getElementById('staff-name').value;
        const role = document.getElementById('staff-role').value;
        const department = document.getElementById('staff-department').value;
        const status = document.getElementById('staff-status').value;
        
        // Get shifts
        const shiftElements = document.querySelectorAll('input[name="shifts"]:checked');
        const shifts = Array.from(shiftElements).map(el => el.value);
        
        if (shifts.length === 0) {
            showToast("Staff must be available for at least one shift type", "error");
            return;
        }
        
        // Get preferences
        const avoidDayElements = document.querySelectorAll('input[name="avoid-days"]:checked');
        const avoidDays = Array.from(avoidDayElements).map(el => parseInt(el.value));
        
        const preferredShiftElements = document.querySelectorAll('input[name="preferred-shifts"]:checked');
        const preferredShifts = Array.from(preferredShiftElements).map(el => el.value);
        
        // Update staff
        staff.name = name;
        staff.role = role;
        staff.department = department;
        staff.status = status;
        staff.shifts = shifts;
        
        // Update preferences
        if (avoidDays.length > 0 || preferredShifts.length > 0) {
            staffPreferences[staffId] = {
                ...staffPreferences[staffId],
                avoidDays,
                preferredShifts
            };
        } else {
            delete staffPreferences[staffId];
        }
        
        // Refresh UI
        initStaffList();
        refreshScheduleGrid();
        
        // Close modal
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
        
        showToast(`${name} updated successfully`, "success");
    });
    
    document.getElementById('delete-staff-btn').addEventListener('click', () => {
        // Show confirmation
        if (confirm(`Are you sure you want to delete ${staff.name}?`)) {
            // Remove staff from staffList
            staffList = staffList.filter(s => s.id !== staffId);
            
            // Remove from preferences
            delete staffPreferences[staffId];
            
            // Remove from scheduleData
            for (const key in scheduleData) {
                scheduleData[key] = (scheduleData[key] || []).filter(id => id !== staffId);
                if (scheduleData[key].length === 0) {
                    delete scheduleData[key];
                }
            }
            
            // Refresh UI
            initStaffList();
            refreshScheduleGrid();
            updateScheduleStats();
            
            // Close modal
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                style.remove();
            }, 300);
            
            showToast(`${staff.name} removed`, "info");
        }
    });
}