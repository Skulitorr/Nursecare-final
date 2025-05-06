/**
 * NurseCare AI - Nursing Home Scheduling System
 * schedule.js - Handles all scheduling functionality
 */

// ===== CONSTANTS =====
export const SHIFT_TYPES = {
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
    
    // Initialize the WEEKLY schedule grid (staff-based layout)
    initWeeklyScheduleGrid();
    
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
 * Initialize the weekly schedule grid with staff in rows and days in columns
 */
function initWeeklyScheduleGrid() {
    const scheduleGrid = document.getElementById('schedule-grid');
    if (!scheduleGrid) {
        console.error('Schedule grid container not found');
        return;
    }
    
    // Clear existing content
    scheduleGrid.innerHTML = '';
    
    // Create a table for the schedule
    const table = document.createElement('table');
    table.className = 'weekly-schedule-table';
    
    // Create header row with days
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Add empty cell for staff names column
    const emptyHeader = document.createElement('th');
    emptyHeader.className = 'staff-name-header';
    emptyHeader.textContent = 'Starfsfólk';
    headerRow.appendChild(emptyHeader);
    
    // Add day headers
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6 for our format
    
    DAYS_SHORT.forEach((day, index) => {
        const dayHeader = document.createElement('th');
        dayHeader.className = 'day-header';
        if (index === todayIndex) {
            dayHeader.classList.add('today');
        }
        dayHeader.textContent = day;
        headerRow.appendChild(dayHeader);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body with staff rows
    const tbody = document.createElement('tbody');
    
    // Add a row for each staff member
    staffList.forEach(staff => {
        const staffRow = document.createElement('tr');
        
        // Add staff name cell
        const staffNameCell = document.createElement('td');
        staffNameCell.className = 'staff-name-cell';
        
        staffNameCell.innerHTML = `
            <div class="staff-info">
                <div class="staff-avatar">
                    <img src="${staff.avatar}" alt="${staff.name}">
                    <span class="status-indicator ${staff.status}"></span>
                </div>
                <div class="staff-details">
                    <div class="staff-name">${staff.name}</div>
                    <div class="staff-role">${staff.role}</div>
                </div>
            </div>
        `;
        
        staffRow.appendChild(staffNameCell);
        
        // Add cells for each day
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const dayCell = document.createElement('td');
            dayCell.className = 'schedule-day-cell';
            dayCell.setAttribute('data-staff-id', staff.id);
            dayCell.setAttribute('data-day-index', dayIndex);
            
            if (dayIndex === todayIndex) {
                dayCell.classList.add('today');
            }
            
            // Create shift container
            const shiftContainer = document.createElement('div');
            shiftContainer.className = 'shift-container';
            
            dayCell.appendChild(shiftContainer);
            staffRow.appendChild(dayCell);
        }
        
        tbody.appendChild(staffRow);
    });
    
    table.appendChild(tbody);
    scheduleGrid.appendChild(table);
    
    // After constructing the grid, refresh it with any existing schedule data
    refreshWeeklySchedule();
}

/**
 * Refresh the weekly schedule grid based on current data
 */
function refreshWeeklySchedule() {
    // Clear all shift containers first
    document.querySelectorAll('.shift-container').forEach(container => {
        container.innerHTML = '';
    });
    
    // For each schedule entry, add the appropriate shift display
    Object.entries(scheduleData).forEach(([key, staffIds]) => {
        const [dayIndex, shiftType] = key.split('-');
        
        staffIds.forEach(staffId => {
            const staff = staffList.find(s => s.id === staffId);
            if (!staff) return;
            
            // Find the appropriate cell
            const cell = document.querySelector(`.schedule-day-cell[data-staff-id="${staffId}"][data-day-index="${dayIndex}"]`);
            if (!cell) return;
            
            const shiftContainer = cell.querySelector('.shift-container');
            if (!shiftContainer) return;
            
            // Add shift display
            const shiftDisplay = createShiftDisplay(shiftType);
            shiftContainer.appendChild(shiftDisplay);
        });
    });
}

/**
 * Create a visual display for a shift
 */
function createShiftDisplay(shiftType) {
    const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
    if (!shiftTypeObj) return null;
    
    const shiftDisplay = document.createElement('div');
    shiftDisplay.className = 'shift-display';
    shiftDisplay.setAttribute('data-shift-type', shiftType);
    shiftDisplay.style.backgroundColor = shiftTypeObj.color;
    
    // Add shift time
    const timeDisplay = document.createElement('span');
    timeDisplay.className = 'shift-time';
    
    // Convert shift times to shorter format
    const timeText = shiftTypeObj.time.replace(':00', '');
    timeDisplay.textContent = timeText;
    
    shiftDisplay.appendChild(timeDisplay);
    
    // Make it clickable to show details
    shiftDisplay.addEventListener('click', () => {
        // Get staff and day information from parent elements
        const cell = shiftDisplay.closest('.schedule-day-cell');
        if (!cell) return;
        
        const staffId = cell.getAttribute('data-staff-id');
        const dayIndex = parseInt(cell.getAttribute('data-day-index'));
        
        const staff = staffList.find(s => s.id === staffId);
        if (!staff) return;
        
        showAssignmentDetails(staff, dayIndex, shiftType);
    });
    
    return shiftDisplay;
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
    refreshWeeklySchedule();
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
function showAddToShiftModal(dayIndex, staffId) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'add-to-shift-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-plus-circle"></i>
                    Bæta ${staff.name} við vakt
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="add-to-shift-form">
                    <div class="form-group">
                        <label for="shift-type">Veldu vakt fyrir ${DAYS_OF_WEEK[dayIndex]}</label>
                        <select id="shift-type" class="form-control" required>
                            <option value="">Veldu vakt</option>
                            ${staff.shifts.map(shiftId => {
                                const shift = Object.values(SHIFT_TYPES).find(t => t.id === shiftId);
                                return `<option value="${shiftId}">${shift.label} (${shift.time})</option>`;
                            }).join('')}
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn cancel-btn" id="cancel-add-to-shift">Hætta við</button>
                <button class="btn primary-btn" id="confirm-add-to-shift">
                    <i class="fas fa-plus"></i> Bæta við vakt
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
        const shiftType = document.getElementById('shift-type').value;
        if (!shiftType) {
            return;
        }
        
        // Add assignment
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
    console.log("Adding AI suggestions section...");
    
    const scheduleContainer = document.querySelector('.schedule-container');
    if (!scheduleContainer) return;
    
    // Create the suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'ai-suggestions-container';
    suggestionsContainer.innerHTML = `
        <div class="ai-suggestions-header">
            <div class="ai-suggestions-title">
                <i class="fas fa-lightbulb"></i>
                <h3>AI Suggestions</h3>
            </div>
            <div class="ai-suggestions-actions">
                <button class="btn btn-sm btn-outline refresh-suggestions">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <button class="btn btn-sm btn-outline collapse-suggestions">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
        </div>
        <div class="ai-suggestions-content">
            <div class="suggestions-loading">
                <i class="fas fa-circle-notch fa-spin"></i>
                <span>Generating suggestions...</span>
            </div>
            <div class="suggestions-list" style="display: none;"></div>
        </div>
    `;
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        .ai-suggestions-container {
            margin-top: 2rem;
            background-color: var(--bg-card, white);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--border-color, #e0e0e0);
            overflow: hidden;
            animation: fadeIn 0.4s ease-out;
        }
        
        .ai-suggestions-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            background-color: var(--bg-secondary, #f5f5f5);
        }
        
        .ai-suggestions-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .ai-suggestions-title i {
            color: #FFC107;
            font-size: 1.25rem;
        }
        
        .ai-suggestions-title h3 {
            margin: 0;
            font-size: 1.125rem;
        }
        
        .ai-suggestions-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .ai-suggestions-content {
            padding: 1.5rem;
        }
        
        .suggestions-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 2rem;
        }
        
        .suggestions-loading i {
            font-size: 2rem;
            color: var(--primary-color, #4CAF50);
        }
        
        .suggestions-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .suggestion-item {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background-color: var(--bg-secondary-light, #f8f9fa);
            border-radius: 8px;
            border-left: 4px solid;
        }
        
        .suggestion-icon {
            font-size: 1.25rem;
            width: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .suggestion-content {
            flex: 1;
        }
        
        .suggestion-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .suggestion-text {
            margin-bottom: 0.75rem;
        }
        
        .suggestion-actions {
            display: flex;
            gap: 0.75rem;
        }
        
        .suggestion-item.insight {
            border-left-color: #2196F3;
        }
        
        .suggestion-item.insight .suggestion-icon {
            color: #2196F3;
        }
        
        .suggestion-item.warning {
            border-left-color: #FFC107;
        }
        
        .suggestion-item.warning .suggestion-icon {
            color: #FFC107;
        }
        
        .suggestion-item.critical {
            border-left-color: #F44336;
        }
        
        .suggestion-item.critical .suggestion-icon {
            color: #F44336;
        }
        
        .suggestion-item.success {
            border-left-color: #4CAF50;
        }
        
        .suggestion-item.success .suggestion-icon {
            color: #4CAF50;
        }
        
        .collapsed .ai-suggestions-content {
            display: none;
        }
        
        .collapsed .collapse-suggestions i {
            transform: rotate(180deg);
        }
    `;
    document.head.appendChild(styles);
    
    // Insert the container after the stats section
    const statsSection = document.querySelector('.schedule-stats');
    if (statsSection) {
        statsSection.after(suggestionsContainer);
    } else {
        // If no stats section, insert at the beginning
        scheduleContainer.prepend(suggestionsContainer);
    }
    
    // Add event listeners
    suggestionsContainer.querySelector('.collapse-suggestions').addEventListener('click', () => {
        suggestionsContainer.classList.toggle('collapsed');
        const icon = suggestionsContainer.querySelector('.collapse-suggestions i');
        if (suggestionsContainer.classList.contains('collapsed')) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        } else {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    });
    
    suggestionsContainer.querySelector('.refresh-suggestions').addEventListener('click', () => {
        // Show loading state
        suggestionsContainer.querySelector('.suggestions-list').style.display = 'none';
        suggestionsContainer.querySelector('.suggestions-loading').style.display = 'flex';
        
        // Generate new suggestions
        setTimeout(() => {
            generateAISuggestions();
        }, 500);
    });
    
    // Generate initial suggestions
    setTimeout(() => {
        generateAISuggestions();
    }, 1500);
}

/**
 * Generate AI suggestions based on current schedule
 */
function generateAISuggestions() {
    console.log("Generating AI suggestions...");
    
    const suggestionsContainer = document.querySelector('.ai-suggestions-container');
    if (!suggestionsContainer) return;
    
    const suggestionsList = suggestionsContainer.querySelector('.suggestions-list');
    const loadingIndicator = suggestionsContainer.querySelector('.suggestions-loading');
    
    // In a real app, this would call an AI service
    // For now, we'll simulate suggestions based on the current schedule state
    
    // Sample suggestions
    const suggestions = [
        {
            type: 'critical',
            icon: 'exclamation-triangle',
            title: 'Double Booking Detected',
            text: 'Guðrún Einarsdóttir is scheduled for two shifts on Tuesday. This may lead to fatigue and could violate work regulations.',
            actions: [
                { label: 'Fix Automatically', action: 'fix-double-booking', data: { staffId: '3', dayIndex: 1 } },
                { label: 'View Details', action: 'view-conflict', data: { staffId: '3', dayIndex: 1 } }
            ]
        },
        {
            type: 'warning',
            icon: 'exclamation-circle',
            title: 'Understaffed Night Shifts',
            text: 'Thursday night shift is currently understaffed. Consider adding at least one more staff member to ensure proper coverage.',
            actions: [
                { label: 'Add Staff', action: 'add-staff', data: { dayIndex: 3, shiftType: 'night' } },
                { label: 'Suggest Suitable Staff', action: 'suggest-staff', data: { dayIndex: 3, shiftType: 'night' } }
            ]
        },
        {
            type: 'insight',
            icon: 'info-circle',
            title: 'Workload Imbalance',
            text: 'Anna Jónsdóttir has 40 hours while Sigríður Björnsdóttir has only 16 hours. Consider redistributing shifts for better balance.',
            actions: [
                { label: 'Balance Workload', action: 'balance', data: { staffIds: ['1', '5'] } }
            ]
        },
        {
            type: 'success',
            icon: 'check-circle',
            title: 'Weekend Coverage Optimized',
            text: 'Weekend shifts are well distributed among staff members, ensuring fair rotation.',
            actions: []
        }
    ];
    
    // Build the suggestions UI
    suggestionsList.innerHTML = '';
    suggestions.forEach(suggestion => {
        const suggestionEl = document.createElement('div');
        suggestionEl.className = `suggestion-item ${suggestion.type}`;
        
        suggestionEl.innerHTML = `
            <div class="suggestion-icon">
                <i class="fas fa-${suggestion.icon}"></i>
            </div>
            <div class="suggestion-content">
                <div class="suggestion-title">${suggestion.title}</div>
                <div class="suggestion-text">${suggestion.text}</div>
                <div class="suggestion-actions">
                    ${suggestion.actions.map(action => `
                        <button class="btn btn-sm btn-outline suggestion-action" 
                                data-action="${action.action}" 
                                data-payload='${JSON.stringify(action.data)}'>
                            ${action.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners to action buttons
        suggestionEl.querySelectorAll('.suggestion-action').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                const payload = JSON.parse(button.getAttribute('data-payload'));
                
                handleSuggestionAction(action, payload);
            });
        });
        
        suggestionsList.appendChild(suggestionEl);
    });
    
    // Show suggestions and hide loading indicator
    loadingIndicator.style.display = 'none';
    suggestionsList.style.display = 'flex';
}

/**
 * Handle suggestion action clicks
 * @param {string} action - The action to perform
 * @param {Object} payload - Data needed for the action
 */
function handleSuggestionAction(action, payload) {
    console.log(`Handling suggestion action: ${action}`, payload);
    
    switch (action) {
        case 'fix-double-booking':
            // Find and fix double booking
            if (payload.staffId && payload.dayIndex !== undefined) {
                const staffId = payload.staffId;
                const dayIndex = payload.dayIndex;
                
                // Find shifts this staff is assigned to on this day
                const conflictShifts = [];
                
                for (const shiftType of Object.values(SHIFT_TYPES).map(t => t.id)) {
                    const key = `${dayIndex}-${shiftType}`;
                    if (scheduleData[key] && scheduleData[key].includes(staffId)) {
                        conflictShifts.push(shiftType);
                    }
                }
                
                if (conflictShifts.length > 1) {
                    // Remove from all but the first shift
                    for (let i = 1; i < conflictShifts.length; i++) {
                        removeAssignment(staffId, dayIndex, conflictShifts[i]);
                    }
                    
                    showToast('Double booking resolved', 'success');
                    
                    // Update UI
                    refreshScheduleGrid();
                    updateStaffHours();
                    updateScheduleStats();
                    generateAISuggestions();
                }
            }
            break;
            
        case 'view-conflict':
            // Show conflict details
            if (payload.staffId && payload.dayIndex !== undefined) {
                const staff = staffList.find(s => s.id === payload.staffId);
                const conflicts = [];
                
                for (const shiftType of Object.values(SHIFT_TYPES).map(t => t.id)) {
                    const key = `${payload.dayIndex}-${shiftType}`;
                    if (scheduleData[key] && scheduleData[key].includes(payload.staffId)) {
                        conflicts.push(shiftType);
                    }
                }
                
                if (staff && conflicts.length > 0) {
                    const modal = document.createElement('div');
                    modal.className = 'modal';
                    modal.id = 'conflict-modal';
                    
                    modal.innerHTML = `
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>
                                    <i class="fas fa-exclamation-triangle"></i>
                                    Scheduling Conflict
                                </h3>
                                <button class="close-btn" aria-label="Close">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="conflict-details">
                                    <p><strong>${staff.name}</strong> is assigned to multiple shifts on <strong>${DAYS_OF_WEEK[payload.dayIndex]}</strong>:</p>
                                    <ul>
                                        ${conflicts.map(shiftType => {
                                            const shift = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
                                            return `<li>${shift.label} (${shift.time})</li>`;
                                        }).join('')}
                                    </ul>
                                    <p>Working multiple shifts in succession may lead to fatigue and could violate labor regulations.</p>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn cancel-btn" id="close-conflict">Close</button>
                                <button class="btn primary-btn" id="fix-conflict">
                                    <i class="fas fa-magic"></i> Fix Conflict
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
                    
                    document.getElementById('close-conflict').addEventListener('click', () => {
                        modal.classList.remove('active');
                        setTimeout(() => {
                            modal.remove();
                        }, 300);
                    });
                    
                    document.getElementById('fix-conflict').addEventListener('click', () => {
                        // Remove from all but the first shift
                        for (let i = 1; i < conflicts.length; i++) {
                            removeAssignment(payload.staffId, payload.dayIndex, conflicts[i]);
                        }
                        
                        showToast('Conflict resolved', 'success');
                        
                        // Update UI
                        refreshScheduleGrid();
                        updateStaffHours();
                        updateScheduleStats();
                        generateAISuggestions();
                        
                        // Close modal
                        modal.classList.remove('active');
                        setTimeout(() => {
                            modal.remove();
                        }, 300);
                    });
                }
            }
            break;
            
        case 'add-staff':
            // Show dialog to add staff to shift
            if (payload.dayIndex !== undefined && payload.shiftType) {
                showAddToShiftModal(payload.dayIndex, payload.shiftType);
            }
            break;
            
        case 'suggest-staff':
            // Suggest staff for a specific shift
            if (payload.dayIndex !== undefined && payload.shiftType) {
                const dayIndex = payload.dayIndex;
                const shiftType = payload.shiftType;
                
                // Find suitable staff
                const suitableStaff = staffList.filter(staff => {
                    return isValidAssignment(staff.id, dayIndex, shiftType);
                }).sort((a, b) => {
                    // Sort by preference and workload
                    const aHasPreference = staff.preferences && staff.preferences.some(p => 
                        p.day === dayIndex && p.shift === shiftType
                    );
                    
                    const bHasPreference = staff.preferences && staff.preferences.some(p => 
                        p.day === dayIndex && p.shift === shiftType
                    );
                    
                    if (aHasPreference && !bHasPreference) return -1;
                    if (!aHasPreference && bHasPreference) return 1;
                    
                    return a.hoursWorked - b.hoursWorked;
                });
                
                if (suitableStaff.length > 0) {
                    const modal = document.createElement('div');
                    modal.className = 'modal';
                    modal.id = 'staff-suggestions-modal';
                    
                    const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
                    
                    modal.innerHTML = `
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>
                                    <i class="fas fa-lightbulb"></i>
                                    Suggested Staff
                                </h3>
                                <button class="close-btn" aria-label="Close">&times;</button>
                            </div>
                            <div class="modal-body">
                                <p>AI recommended staff for <strong>${DAYS_OF_WEEK[dayIndex]}</strong> <strong>${shiftTypeObj.label}</strong>:</p>
                                
                                <div class="staff-suggestions">
                                    ${suitableStaff.slice(0, 5).map((staff, index) => `
                                        <div class="suggested-staff" data-staff-id="${staff.id}">
                                            <div class="suggested-rank">${index + 1}</div>
                                            <div class="suggested-avatar">
                                                <img src="${staff.avatar}" alt="${staff.name}">
                                            </div>
                                            <div class="suggested-info">
                                                <div class="suggested-name">${staff.name}</div>
                                                <div class="suggested-role">${staff.role}</div>
                                                <div class="suggested-hours">${staff.hoursWorked} hours scheduled</div>
                                            </div>
                                            <button class="btn btn-sm primary-btn assign-suggested-btn" data-staff-id="${staff.id}">
                                                <i class="fas fa-plus"></i> Assign
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn cancel-btn" id="close-suggestions">Close</button>
                                <button class="btn primary-btn" id="assign-all-suggested">
                                    <i class="fas fa-user-plus"></i> Assign Top 2
                                </button>
                            </div>
                        </div>
                    `;
                    
                    // Add styles
                    const styles = document.createElement('style');
                    styles.textContent = `
                        .staff-suggestions {
                            margin-top: 1rem;
                            display: flex;
                            flex-direction: column;
                            gap: 0.75rem;
                        }
                        
                        .suggested-staff {
                            display: flex;
                            align-items: center;
                            gap: 1rem;
                            padding: 0.75rem;
                            background-color: var(--bg-secondary-light, #f8f9fa);
                            border-radius: 8px;
                            border: 1px solid var(--border-color, #e0e0e0);
                        }
                        
                        .suggested-rank {
                            width: 24px;
                            height: 24px;
                            background-color: var(--primary-color, #4CAF50);
                            color: white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 600;
                        }
                        
                        .suggested-avatar img {
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            object-fit: cover;
                        }
                        
                        .suggested-info {
                            flex: 1;
                        }
                        
                        .suggested-name {
                            font-weight: 600;
                            margin-bottom: 2px;
                        }
                        
                        .suggested-role {
                            font-size: 0.875rem;
                            color: var(--text-secondary, #777);
                            margin-bottom: 2px;
                        }
                        
                        .suggested-hours {
                            font-size: 0.8125rem;
                            color: var(--text-secondary, #777);
                        }
                        
                        .assign-suggested-btn {
                            min-width: 80px;
                        }
                        
                        .suggested-staff.assigned {
                            background-color: rgba(76, 175, 80, 0.1);
                        }
                        
                        .suggested-staff.assigned .assign-suggested-btn {
                            background-color: #4CAF50;
                            color: white;
                        }
                    `;
                    document.head.appendChild(styles);
                    
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
                            styles.remove();
                        }, 300);
                    });
                    
                    document.getElementById('close-suggestions').addEventListener('click', () => {
                        modal.classList.remove('active');
                        setTimeout(() => {
                            modal.remove();
                            styles.remove();
                        }, 300);
                    });
                    
                    document.getElementById('assign-all-suggested').addEventListener('click', () => {
                        // Assign top 2 staff
                        for (let i = 0; i < Math.min(2, suitableStaff.length); i++) {
                            addAssignment(suitableStaff[i].id, dayIndex, shiftType);
                        }
                        
                        showToast(`${Math.min(2, suitableStaff.length)} staff members assigned`, 'success');
                        
                        // Close modal
                        modal.classList.remove('active');
                        setTimeout(() => {
                            modal.remove();
                            styles.remove();
                        }, 300);
                    });
                    
                    // Add event listeners to assign buttons
                    modal.querySelectorAll('.assign-suggested-btn').forEach(button => {
                        button.addEventListener('click', () => {
                            const staffId = button.getAttribute('data-staff-id');
                            const staffItem = button.closest('.suggested-staff');
                            
                            // Add assignment
                            addAssignment(staffId, dayIndex, shiftType);
                            
                            // Update button
                            button.innerHTML = '<i class="fas fa-check"></i> Assigned';
                            staffItem.classList.add('assigned');
                        });
                    });
                }
            }
            break;
            
        case 'balance':
            // Balance workload between staff
            balanceWorkload();
            break;
    }
}

/**
 * Find recommended staff for a shift
 * @param {number} dayIndex - Day index
 * @param {string} shiftType - Shift type ID
 * @returns {Object|null} - Staff object or null if none found
 */
function findRecommendedStaff(dayIndex, shiftType) {
    // Sort staff by hours worked (ascending)
    const sortedStaff = [...staffList]
        .filter(staff => isValidAssignment(staff.id, dayIndex, shiftType))
        .sort((a, b) => a.hoursWorked - b.hoursWorked);
    
    return sortedStaff.length > 0 ? sortedStaff[0] : null;
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
    // Reset all hours
    staffList.forEach(staff => {
        staff.hoursWorked = 0;
    });

    // Count all shifts for each staff member
    for (const key in scheduleData) {
        const staffIds = scheduleData[key];
        staffIds.forEach(staffId => {
            const staff = staffList.find(s => s.id === staffId);
            if (staff) {
                staff.hoursWorked += HOURS_PER_SHIFT;
            }
        });
    }

    // Update UI to reflect new hours
    document.querySelectorAll('.staff-item').forEach(item => {
        const staffId = item.getAttribute('data-id');
        const staff = staffList.find(s => s.id === staffId);
        if (staff) {
            const hoursElement = item.querySelector('.staff-hours');
            if (hoursElement) {
                hoursElement.textContent = `${staff.hoursWorked}h`;
                
                // Add warning if hours are close to or exceeding max
                if (staff.hoursWorked >= MAX_HOURS_PER_WEEK) {
                    hoursElement.classList.add('hours-warning');
                } else {
                    hoursElement.classList.remove('hours-warning');
                }
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
    let totalPossibleShifts = staffList.length * 7; // 7 days in a week
    
    for (const key in scheduleData) {
        filledShifts += scheduleData[key].length;
    }
    
    // Count total staff with assignments
    const staffWithAssignments = new Set();
    
    for (const key in scheduleData) {
        scheduleData[key].forEach(staffId => {
            staffWithAssignments.add(staffId);
        });
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
        
        // Color coding based on percentage
        staffingPercentageEl.className = 'stat-value';
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

// Schedule management module
import { showToast, formatDate, formatTime } from './utils.js';
import { getCurrentUser, hasActionAccess } from './auth.js';

// Schedule status types
export const SCHEDULE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CONFLICT: 'conflict'
};

/**
 * Initialize schedule management
 */
export function initializeSchedule() {
    setupCalendar();
    setupFilters();
    setupEventListeners();
    loadScheduleData();
}

/**
 * Setup calendar view
 */
function setupCalendar() {
    const calendar = document.getElementById('schedule-calendar');
    if (!calendar) return;

    // Clear existing content
    calendar.innerHTML = '';
    
    // Create calendar header
    const header = createCalendarHeader();
    calendar.appendChild(header);
    
    // Create calendar grid
    const grid = createCalendarGrid();
    calendar.appendChild(grid);
    
    // Initialize drag-and-drop if user has permission
    if (hasActionAccess(getCurrentUser()?.role, 'edit_schedule')) {
        initializeDragAndDrop();
    }
}

/**
 * Create calendar header with navigation
 * @returns {HTMLElement} Calendar header element
 */
function createCalendarHeader() {
    const header = document.createElement('div');
    header.className = 'calendar-header';
    
    const today = new Date();
    
    header.innerHTML = `
        <div class="calendar-nav">
            <button class="nav-btn prev-month">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h2 class="current-month">${formatDate(today, false)}</h2>
            <button class="nav-btn next-month">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="calendar-actions">
            <button class="action-btn" id="today-btn">
                <i class="fas fa-calendar-day"></i> Í dag
            </button>
            <button class="action-btn" id="add-shift-btn">
                <i class="fas fa-plus"></i> Bæta við vakt
            </button>
            <div class="view-toggle">
                <button class="toggle-btn active" data-view="month">
                    <i class="fas fa-calendar-alt"></i> Mánuður
                </button>
                <button class="toggle-btn" data-view="week">
                    <i class="fas fa-calendar-week"></i> Vika
                </button>
                <button class="toggle-btn" data-view="day">
                    <i class="fas fa-calendar-day"></i> Dagur
                </button>
            </div>
        </div>
    `;
    
    return header;
}

/**
 * Create calendar grid
 * @returns {HTMLElement} Calendar grid element
 */
function createCalendarGrid() {
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    
    // Add weekday headers
    const weekdays = ['Sun', 'Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-header-cell';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });
    
    // Add calendar cells for the month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Add padding cells for days before first of month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const paddingCell = document.createElement('div');
        paddingCell.className = 'calendar-cell padding';
        grid.appendChild(paddingCell);
    }
    
    // Add cells for each day of the month
    for (let date = 1; date <= lastDay.getDate(); date++) {
        const cell = createCalendarCell(date);
        grid.appendChild(cell);
    }
    
    return grid;
}

/**
 * Create a calendar cell for a specific date
 * @param {number} date - Date of the month
 * @returns {HTMLElement} Calendar cell element
 */
function createCalendarCell(date) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.setAttribute('data-date', date);
    
    const today = new Date();
    if (date === today.getDate()) {
        cell.classList.add('today');
    }
    
    cell.innerHTML = `
        <div class="cell-header">
            <span class="date-number">${date}</span>
            ${hasActionAccess(getCurrentUser()?.role, 'edit_schedule') ? `
                <button class="add-shift-btn" title="Bæta við vakt">
                    <i class="fas fa-plus"></i>
                </button>
            ` : ''}
        </div>
        <div class="cell-content">
            <div class="shift-container" data-date="${date}"></div>
        </div>
    `;
    
    return cell;
}

/**
 * Initialize drag and drop functionality
 */
function initializeDragAndDrop() {
    const shiftContainers = document.querySelectorAll('.shift-container');
    
    shiftContainers.forEach(container => {
        // Make container a drop target
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('dragover');
        });
        
        container.addEventListener('dragleave', () => {
            container.classList.remove('dragover');
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('dragover');
            
            const shiftId = e.dataTransfer.getData('text/plain');
            const targetDate = container.getAttribute('data-date');
            
            moveShift(shiftId, targetDate);
        });
    });
}

/**
 * Move a shift to a new date
 * @param {string} shiftId - ID of shift to move
 * @param {string} targetDate - Target date
 */
function moveShift(shiftId, targetDate) {
    // Implementation would go here
    console.log('Move shift', shiftId, 'to', targetDate);
    showToast('Vakt færð', 'success');
}

/**
 * Setup schedule filters
 */
function setupFilters() {
    const filterContainer = document.querySelector('.schedule-filters');
    if (!filterContainer) return;
    
    filterContainer.innerHTML = `
        <div class="filter-group">
            <label>Deild:</label>
            <select id="department-filter">
                <option value="all">Allar deildir</option>
                <option value="dept1">Deild 1</option>
                <option value="dept2">Deild 2</option>
                <option value="dept3">Deild 3</option>
            </select>
        </div>
        <div class="filter-group">
            <label>Starfsmaður:</label>
            <select id="staff-filter">
                <option value="all">Allir starfsmenn</option>
                <option value="nurse">Hjúkrunarfræðingar</option>
                <option value="assistant">Aðstoðarfólk</option>
                <option value="staff">Almennir starfsmenn</option>
            </select>
        </div>
        <div class="filter-group">
            <label>Vaktategund:</label>
            <select id="shift-type-filter">
                <option value="all">Allar vaktir</option>
                <option value="morning">Morgunvaktir</option>
                <option value="evening">Kvöldvaktir</option>
                <option value="night">Næturvaktir</option>
            </select>
        </div>
    `;
    
    // Add filter event listeners
    const filters = filterContainer.querySelectorAll('select');
    filters.forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation buttons
    const prevMonthBtn = document.querySelector('.prev-month');
    const nextMonthBtn = document.querySelector('.next-month');
    const todayBtn = document.getElementById('today-btn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => navigateMonth('prev'));
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => navigateMonth('next'));
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', goToToday);
    }
    
    // View toggle buttons
    const viewButtons = document.querySelectorAll('.view-toggle .toggle-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            changeView(view);
            
            // Update active button
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Add shift buttons
    const addShiftBtns = document.querySelectorAll('.add-shift-btn');
    addShiftBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cell = e.target.closest('.calendar-cell');
            const date = cell.getAttribute('data-date');
            showAddShiftModal(date);
        });
    });

    // Add recurring shift button event listener
    const recurringShiftBtn = document.getElementById('recurring-shift-btn');
    if (recurringShiftBtn) {
        recurringShiftBtn.addEventListener('click', () => {
            showRecurringShiftModal();
        });
    }
}

/**
 * Navigate to previous/next month
 * @param {'prev'|'next'} direction - Navigation direction
 */
function navigateMonth(direction) {
    const currentMonth = document.querySelector('.current-month');
    const date = new Date(currentMonth.textContent);
    
    if (direction === 'prev') {
        date.setMonth(date.getMonth() - 1);
    } else {
        date.setMonth(date.getMonth() + 1);
    }
    
    currentMonth.textContent = formatDate(date, false);
    refreshCalendar();
}

/**
 * Go to today's date
 */
function goToToday() {
    const currentMonth = document.querySelector('.current-month');
    currentMonth.textContent = formatDate(new Date(), false);
    refreshCalendar();
}

/**
 * Change calendar view
 * @param {'month'|'week'|'day'} view - View type
 */
function changeView(view) {
    const calendar = document.getElementById('schedule-calendar');
    if (!calendar) return;
    
    calendar.className = `calendar-container ${view}-view`;
    refreshCalendar();
}

/**
 * Apply schedule filters
 */
function applyFilters() {
    const departmentFilter = document.getElementById('department-filter');
    const staffFilter = document.getElementById('staff-filter');
    const shiftTypeFilter = document.getElementById('shift-type-filter');
    
    const department = departmentFilter?.value || 'all';
    const staffType = staffFilter?.value || 'all';
    const shiftType = shiftTypeFilter?.value || 'all';
    
    const shifts = document.querySelectorAll('.shift-item');
    shifts.forEach(shift => {
        const matchesDepartment = department === 'all' || shift.getAttribute('data-department') === department;
        const matchesStaff = staffType === 'all' || shift.getAttribute('data-staff-type') === staffType;
        const matchesShiftType = shiftType === 'all' || shift.getAttribute('data-shift-type') === shiftType;
        
        shift.style.display = matchesDepartment && matchesStaff && matchesShiftType ? 'flex' : 'none';
    });
}

/**
 * Refresh calendar display
 */
function refreshCalendar() {
    setupCalendar();
    loadScheduleData();
}

/**
 * Load schedule data
 */
function loadScheduleData() {
    // Implementation would load data from backend
    // For now, we'll use mock data
    const mockShifts = [
        {
            id: '1',
            date: '2025-04-23',
            type: SHIFT_TYPES.MORNING.id,
            staffName: 'Anna Jónsdóttir',
            staffType: 'nurse',
            department: 'dept1'
        },
        {
            id: '2',
            date: '2025-04-23',
            type: SHIFT_TYPES.EVENING.id,
            staffName: 'Jón Þórsson',
            staffType: 'assistant',
            department: 'dept1'
        },
        {
            id: '3',
            date: '2025-04-24',
            type: SHIFT_TYPES.NIGHT.id,
            staffName: 'Sara Björnsdóttir',
            staffType: 'nurse',
            department: 'dept2'
        }
    ];
    
    displayShifts(mockShifts);
}

/**
 * Display shifts on calendar
 * @param {Array} shifts - Array of shift objects
 */
function displayShifts(shifts) {
    shifts.forEach(shift => {
        const shiftDate = new Date(shift.date);
        const container = document.querySelector(
            `.shift-container[data-date="${shiftDate.getDate()}"]`
        );
        
        if (container) {
            const shiftEl = document.createElement('div');
            shiftEl.className = 'shift-item';
            shiftEl.setAttribute('data-id', shift.id);
            shiftEl.setAttribute('data-department', shift.department);
            shiftEl.setAttribute('data-staff-type', shift.staffType);
            shiftEl.setAttribute('data-shift-type', shift.type);
            
            const shiftType = SHIFT_TYPES[shift.type.toUpperCase()];
            
            shiftEl.innerHTML = `
                <div class="shift-header" style="background-color: ${shiftType.color}">
                    <span class="shift-time">${shiftType.startTime} - ${shiftType.endTime}</span>
                    ${hasActionAccess(getCurrentUser()?.role, 'edit_schedule') ? `
                        <button class="edit-shift-btn" title="Breyta vakt">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="shift-info">
                    <span class="staff-name">${shift.staffName}</span>
                </div>
            `;
            
            if (hasActionAccess(getCurrentUser()?.role, 'edit_schedule')) {
                shiftEl.draggable = true;
                shiftEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', shift.id);
                    shiftEl.classList.add('dragging');
                });
                
                shiftEl.addEventListener('dragend', () => {
                    shiftEl.classList.remove('dragging');
                });
            }
            
            container.appendChild(shiftEl);
        }
    });
}

/**
 * Show add shift modal
 * @param {string} date - Selected date
 */
function showAddShiftModal(date) {
    // Implementation would go here
    console.log('Show add shift modal for date:', date);
}

// Schedule management module
import { showToast } from './utils.js';
import { getCurrentUser, hasActionAccess } from './auth.js';

// Schedule constants
const DEPARTMENTS = {
    ALZHEIMERS: 'alzheimers',
    GENERAL: 'general',
    REHAB: 'rehab'
};

// Private schedule cache
let scheduleCache = new Map();
let requestsCache = new Map();

/**
 * Create a new schedule from template
 * @param {string} template - Optional template name to use
 * @returns {Promise<Object>} Created schedule
 */
export async function createSchedule(template = 'default') {
    try {
        // Create base schedule structure
        const schedule = {
            id: generateScheduleId(),
            createdAt: new Date(),
            createdBy: getCurrentUser()?.id,
            template,
            weeks: [],
            status: 'draft'
        };

        // Generate 4 weeks of shifts
        for (let week = 0; week < 4; week++) {
            const weekShifts = [];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + (week * 7));

            for (let day = 0; day < 7; day++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + day);

                // Create shifts for each time slot
                Object.values(SHIFT_TYPES).forEach(shift => {
                    weekShifts.push({
                        id: generateShiftId(),
                        date: formatDate(date),
                        shift: shift.id,
                        department: DEPARTMENTS.GENERAL,
                        assignedStaff: [],
                        requiredStaff: shift.requiredStaff,
                        notes: ''
                    });
                });
            }
            schedule.weeks.push(weekShifts);
        }

        // Cache the schedule
        scheduleCache.set(schedule.id, schedule);
        
        return schedule;
    } catch (error) {
        console.error('Error creating schedule:', error);
        throw new Error('Failed to create schedule');
    }
}

/**
 * Assign staff member to a shift
 * @param {string} staffId - Staff member ID
 * @param {string} date - Shift date (YYYY-MM-DD)
 * @param {string} shiftId - Shift ID
 * @returns {Promise<Object>} Updated shift
 */
export async function assignShift(staffId, date, shiftId) {
    try {
        // Validate user has permission
        if (!hasActionAccess(getCurrentUser()?.role, 'manage_schedule')) {
            throw new Error('Unauthorized to manage schedule');
        }

        // Find matching shift
        const shift = findShift(date, shiftId);
        if (!shift) {
            throw new Error('Shift not found');
        }

        // Check for conflicts
        if (await hasScheduleConflict(staffId, date, shiftId)) {
            throw new Error('Staff member already assigned to another shift at this time');
        }

        // Add staff to shift
        if (!shift.assignedStaff.includes(staffId)) {
            shift.assignedStaff.push(staffId);
        }

        // Update cache
        updateShiftInCache(shift);

        // Show success notification
        showToast('Vakt', 'Starfsmaður skráður á vakt', 'success');
        
        return shift;
    } catch (error) {
        console.error('Error assigning shift:', error);
        showToast('Villa', error.message, 'error');
        throw error;
    }
}

/**
 * Approve a shift change request
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Updated request
 */
export async function approveShiftChange(requestId) {
    try {
        // Validate user has permission
        if (!hasActionAccess(getCurrentUser()?.role, 'approve_schedule')) {
            throw new Error('Unauthorized to approve schedule changes');
        }

        // Get request details
        const request = requestsCache.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }

        // Update request status
        request.status = 'approved';
        request.approvedBy = getCurrentUser()?.id;
        request.approvedAt = new Date();

        // Apply the changes
        if (request.type === 'swap') {
            await swapShifts(
                request.fromStaffId,
                request.toStaffId,
                request.fromShiftId,
                request.toShiftId
            );
        } else {
            await assignShift(request.staffId, request.date, request.shiftId);
        }

        // Update cache
        requestsCache.set(requestId, request);

        // Show success notification
        showToast('Samþykkt', 'Vaktaskipti samþykkt', 'success');
        
        return request;
    } catch (error) {
        console.error('Error approving shift change:', error);
        showToast('Villa', error.message, 'error');
        throw error;
    }
}

/**
 * Get schedule for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User's scheduled shifts
 */
export async function getUserSchedule(userId) {
    try {
        const userShifts = [];

        // Search through cached schedules
        for (const schedule of scheduleCache.values()) {
            schedule.weeks.forEach(week => {
                week.forEach(shift => {
                    if (shift.assignedStaff.includes(userId)) {
                        userShifts.push(shift);
                    }
                });
            });
        }

        return userShifts;
    } catch (error) {
        console.error('Error getting user schedule:', error);
        throw new Error('Failed to get user schedule');
    }
}

/**
 * Get unassigned shift slots
 * @returns {Promise<Array>} Unassigned shifts
 */
export async function getUnassignedSlots() {
    try {
        const unassignedShifts = [];

        // Search through cached schedules
        for (const schedule of scheduleCache.values()) {
            if (schedule.status !== 'active') continue;

            schedule.weeks.forEach(week => {
                week.forEach(shift => {
                    if (shift.assignedStaff.length < shift.requiredStaff) {
                        unassignedShifts.push({
                            ...shift,
                            openSlots: shift.requiredStaff - shift.assignedStaff.length
                        });
                    }
                });
            });
        }

        return unassignedShifts;
    } catch (error) {
        console.error('Error getting unassigned slots:', error);
        throw new Error('Failed to get unassigned slots');
    }
}

// Helper functions
function generateScheduleId() {
    return 'sch_' + Date.now() + Math.random().toString(36).substr(2, 9);
}

function generateShiftId() {
    return 'sft_' + Date.now() + Math.random().toString(36).substr(2, 9);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function findShift(date, shiftId) {
    for (const schedule of scheduleCache.values()) {
        for (const week of schedule.weeks) {
            const shift = week.find(s => 
                s.date === date && 
                s.id === shiftId
            );
            if (shift) return shift;
        }
    }
    return null;
}

async function hasScheduleConflict(staffId, date, shiftId) {
    const shift = findShift(date, shiftId);
    if (!shift) return false;

    // Get all shifts for the staff member on this date
    const existingShifts = [];
    for (const schedule of scheduleCache.values()) {
        schedule.weeks.forEach(week => {
            week.forEach(s => {
                if (s.date === date && 
                    s.id !== shiftId && 
                    s.assignedStaff.includes(staffId)) {
                    existingShifts.push(s);
                }
            });
        });
    }

    // Check for time overlap
    const shiftInfo = SHIFTS[shift.shift];
    return existingShifts.some(existing => {
        const existingInfo = SHIFTS[existing.shift];
        return (
            (shiftInfo.startTime >= existingInfo.startTime && 
             shiftInfo.startTime < existingInfo.endTime) ||
            (shiftInfo.endTime > existingInfo.startTime && 
             shiftInfo.endTime <= existingInfo.endTime)
        );
    });
}

async function swapShifts(fromStaffId, toStaffId, fromShiftId, toShiftId) {
    const fromShift = findShiftById(fromShiftId);
    const toShift = findShiftById(toShiftId);

    if (!fromShift || !toShift) {
        throw new Error('One or both shifts not found');
    }

    // Remove staff from original shifts
    fromShift.assignedStaff = fromShift.assignedStaff.filter(id => id !== fromStaffId);
    toShift.assignedStaff = toShift.assignedStaff.filter(id => id !== toStaffId);

    // Assign to new shifts
    fromShift.assignedStaff.push(toStaffId);
    toShift.assignedStaff.push(fromStaffId);

    // Update cache
    updateShiftInCache(fromShift);
    updateShiftInCache(toShift);
}

function findShiftById(shiftId) {
    for (const schedule of scheduleCache.values()) {
        for (const week of schedule.weeks) {
            const shift = week.find(s => s.id === shiftId);
            if (shift) return shift;
        }
    }
    return null;
}

function updateShiftInCache(shift) {
    for (const schedule of scheduleCache.values()) {
        for (const week of schedule.weeks) {
            const index = week.findIndex(s => s.id === shift.id);
            if (index !== -1) {
                week[index] = shift;
                return;
            }
        }
    }
}

/**
 * Initialize schedule extensions with enhanced functionality
 */
function initializeScheduleExtensions() {
    console.log("Initializing schedule extensions...");
    
    // Setup the enhanced grid layout
    setupEnhancedGridLayout();
    
    // Setup editable shift functionality
    setupEditableShifts();
    
    // Setup AI integration
    setupAIIntegration();
    
    // Add the AI suggestions section
    addAISuggestionsSection();
    
    console.log("Schedule extensions initialized");
}

/**
 * Setup enhanced grid layout with responsive design
 */
function setupEnhancedGridLayout() {
    console.log("Setting up enhanced grid layout...");
    
    // Add column highlighting on hover
    const dayCells = document.querySelectorAll('.schedule-grid .schedule-cell');
    dayCells.forEach(cell => {
        // Get the column index
        const columnIndex = Array.from(cell.parentNode.children).indexOf(cell);
        
        cell.addEventListener('mouseenter', () => {
            // Highlight all cells in the same column
            document.querySelectorAll(`.schedule-cell:nth-child(${columnIndex})`).forEach(col => {
                col.classList.add('column-highlight');
            });
        });
        
        cell.addEventListener('mouseleave', () => {
            // Remove highlight from all cells
            document.querySelectorAll('.column-highlight').forEach(col => {
                col.classList.remove('column-highlight');
            });
        });
    });
    
    // Add staff count badges to cells
    document.querySelectorAll('.assignments-container').forEach(container => {
        updateStaffCountBadge(container);
    });
    
    // Enable compact/expanded view toggle
    const viewToggleBtn = document.getElementById('toggle-view-btn');
    if (viewToggleBtn) {
        viewToggleBtn.addEventListener('click', () => {
            document.querySelector('.schedule-grid').classList.toggle('compact-view');
            
            // Update button text
            const isCompact = document.querySelector('.schedule-grid').classList.contains('compact-view');
            viewToggleBtn.innerHTML = isCompact ? 
                '<i class="fas fa-expand-alt"></i> Expanded View' : 
                '<i class="fas fa-compress-alt"></i> Compact View';
            
            // Save preference
            localStorage.setItem('schedule-view-compact', isCompact);
        });
        
        // Apply saved preference
        const savedCompact = localStorage.getItem('schedule-view-compact');
        if (savedCompact === 'true') {
            document.querySelector('.schedule-grid').classList.add('compact-view');
            viewToggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i> Expanded View';
        }
    }
}

/**
 * Update the staff count badge for a cell
 * @param {HTMLElement} container - The assignments container
 */
function updateStaffCountBadge(container) {
    const cell = container.closest('.schedule-cell');
    if (!cell) return;
    
    // Get existing badge or create a new one
    let badge = cell.querySelector('.staff-count-badge');
    const count = container.children.length;
    
    if (count === 0) {
        // Remove badge if no staff
        if (badge) badge.remove();
        cell.classList.remove('has-assignments', 'understaffed', 'overstaffed', 'well-staffed');
        return;
    }
    
    // Add has-assignments class
    cell.classList.add('has-assignments');
    
    // Create badge if it doesn't exist
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'staff-count-badge';
        cell.appendChild(badge);
    }
    
    // Update badge count
    badge.textContent = count;
    
    // Apply staffing status classes
    const dayIndex = parseInt(cell.dataset.day);
    const shiftType = cell.dataset.shift;
    const recommendedCount = getRecommendedStaffCount(dayIndex, shiftType);
    
    cell.classList.remove('understaffed', 'overstaffed', 'well-staffed');
    
    if (count < recommendedCount) {
        cell.classList.add('understaffed');
    } else if (count > recommendedCount + 1) {
        cell.classList.add('overstaffed');
    } else {
        cell.classList.add('well-staffed');
    }
}

/**
 * Setup editable shift functionality
 */
function setupEditableShifts() {
    console.log("Setting up editable shifts functionality...");
    
    // Add double-click to edit for assignments
    document.querySelectorAll('.assignments-container').forEach(container => {
        container.addEventListener('dblclick', (e) => {
            // Check if we clicked on an assignment or empty space
            const assignmentEl = e.target.closest('.staff-assignment');
            
            if (assignmentEl) {
                // If clicked on an assignment, edit it
                const staffId = assignmentEl.getAttribute('data-staff-id');
                const cell = container.closest('.schedule-cell');
                const dayIndex = parseInt(cell.getAttribute('data-day'));
                const shiftType = cell.getAttribute('data-shift');
                
                showEditAssignmentModal(staffId, dayIndex, shiftType);
            } else {
                // If clicked on empty space, show add staff modal
                const cell = container.closest('.schedule-cell');
                const dayIndex = parseInt(cell.getAttribute('data-day'));
                const shiftType = cell.getAttribute('data-shift');
                
                showAddToShiftModal(dayIndex, shiftType.id);
            }
        });
    });
    
    // Add inline edit for assignments on right-click
    document.addEventListener('contextmenu', (e) => {
        const assignmentEl = e.target.closest('.staff-assignment');
        if (assignmentEl) {
            e.preventDefault(); // Prevent default context menu
            
            const staffId = assignmentEl.getAttribute('data-staff-id');
            const cell = assignmentEl.closest('.schedule-cell');
            const dayIndex = parseInt(cell.getAttribute('data-day'));
            const shiftType = cell.getAttribute('data-shift');
            
            showQuickActionMenu(e.pageX, e.pageY, staffId, dayIndex, shiftType);
        }
    });
    
    // Setup the shift editor component
    setupShiftEditor();
}

/**
 * Show a quick action menu for shift assignments
 */
function showQuickActionMenu(x, y, staffId, dayIndex, shiftType) {
    // Remove any existing menus
    const existingMenu = document.getElementById('quick-action-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    
    // Create menu element
    const menu = document.createElement('div');
    menu.id = 'quick-action-menu';
    menu.className = 'quick-action-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    // Add menu items
    menu.innerHTML = `
        <div class="menu-header">
            <span>${staff.name}</span>
        </div>
        <div class="menu-items">
            <button class="menu-item" data-action="edit">
                <i class="fas fa-edit"></i> Breyta vakt
            </button>
            <button class="menu-item" data-action="swap">
                <i class="fas fa-exchange-alt"></i> Skipta vakt
            </button>
            <button class="menu-item" data-action="notes">
                <i class="fas fa-sticky-note"></i> Bæta við athugasemd
            </button>
            <button class="menu-item danger" data-action="remove">
                <i class="fas fa-trash"></i> Fjarlægja af vakt
            </button>
        </div>
    `;
    
    // Add styles
    const styles = `
        .quick-action-menu {
            background-color: var(--bg-card, white);
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            min-width: 200px;
            animation: fadeIn 0.15s ease-out;
            border: 1px solid var(--border-color, #e0e0e0);
            overflow: hidden;
        }
        
        .menu-header {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            font-weight: 600;
            color: var(--text-primary, #333);
            background-color: var(--bg-secondary, #f5f5f5);
        }
        
        .menu-items {
            padding: 0.5rem;
        }
        
        .menu-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            width: 100%;
            text-align: left;
            background: none;
            border: none;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.15s ease;
            color: var(--text-primary, #333);
        }
        
        .menu-item:hover {
            background-color: var(--bg-secondary, #f5f5f5);
        }
        
        .menu-item.danger {
            color: var(--danger-color, #F44336);
        }
        
        .menu-item.danger:hover {
            background-color: rgba(244, 67, 54, 0.1);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    
    // Add style element
    const styleEl = document.createElement('style');
    styleEl.id = 'quick-menu-styles';
    styleEl.textContent = styles;
    
    // Add to document
    document.body.appendChild(styleEl);
    document.body.appendChild(menu);
    
    // Add event listeners to menu items
    menu.querySelector('[data-action="edit"]').addEventListener('click', () => {
        showEditAssignmentModal(staffId, dayIndex, shiftType);
        removeMenu();
    });
    
    menu.querySelector('[data-action="swap"]').addEventListener('click', () => {
        showSwapShiftModal(staffId, dayIndex, shiftType);
        removeMenu();
    });
    
    menu.querySelector('[data-action="notes"]').addEventListener('click', () => {
        showAddNotesModal(staffId, dayIndex, shiftType);
        removeMenu();
    });
    
    menu.querySelector('[data-action="remove"]').addEventListener('click', () => {
        removeAssignment(staffId, dayIndex, shiftType);
        removeMenu();
    });
    
    // Remove menu when clicking outside
    document.addEventListener('click', removeMenu);
    
    function removeMenu() {
        menu.remove();
        styleEl.remove();
        document.removeEventListener('click', removeMenu);
    }
}

/**
 * Show modal to add notes to assignment
 */
function showAddNotesModal(staffId, dayIndex, shiftType) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'add-notes-modal';
    
    const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
    
    // Get existing notes
    const key = `${dayIndex}-${shiftType}`;
    const assignmentNotes = localStorage.getItem(`notes-${staffId}-${key}`) || '';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-sticky-note"></i>
                    Add Notes for ${staff.name}
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Adding notes for ${DAYS_OF_WEEK[dayIndex]} ${shiftTypeObj.label}</p>
                
                <div class="form-group">
                    <label for="staff-notes">Notes:</label>
                    <textarea id="staff-notes" class="form-control" rows="4" placeholder="Add any important notes for this shift...">${assignmentNotes}</textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn cancel-btn" id="cancel-notes">Cancel</button>
                <button class="btn primary-btn" id="save-notes">
                    <i class="fas fa-save"></i> Save Notes
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
    
    document.getElementById('cancel-notes').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    document.getElementById('save-notes').addEventListener('click', () => {
        const notes = document.getElementById('staff-notes').value;
        
        // Save notes to localStorage (could be saved to backend in real app)
        localStorage.setItem(`notes-${staffId}-${key}`, notes);
        
        // Close modal
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
        
        // Show confirmation
        showToast(`Notes saved for ${staff.name}`, "success");
        
        // Update UI to show note indicator
        const cell = document.querySelector(`.schedule-cell[data-day="${dayIndex}"][data-shift="${shiftType}"]`);
        if (cell) {
            const assignment = cell.querySelector(`.staff-assignment[data-staff-id="${staffId}"]`);
            if (assignment) {
                // Add or update note indicator
                let noteIndicator = assignment.querySelector('.note-indicator');
                
                if (notes.trim()) {
                    if (!noteIndicator) {
                        noteIndicator = document.createElement('span');
                        noteIndicator.className = 'note-indicator';
                        noteIndicator.innerHTML = '<i class="fas fa-sticky-note" title="Has notes"></i>';
                        assignment.appendChild(noteIndicator);
                    }
                } else if (noteIndicator) {
                    noteIndicator.remove();
                }
            }
        }
    });
}

/**
 * Show the edit assignment modal
 */
function showEditAssignmentModal(staffId, dayIndex, shiftType) {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'edit-assignment-modal';
    
    const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-edit"></i>
                    Edit Assignment: ${staff.name}
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="assignment-edit-header">
                    <div class="staff-avatar large">
                        <img src="${staff.avatar}" alt="${staff.name}">
                        <span class="status-indicator ${staff.status}"></span>
                    </div>
                    <div class="assignment-edit-info">
                        <h4>${staff.name}</h4>
                        <p>${staff.role}</p>
                        <p><i class="fas fa-calendar-day"></i> ${DAYS_OF_WEEK[dayIndex]}</p>
                        <p><i class="fas fa-${shiftTypeObj.icon}"></i> ${shiftTypeObj.label} (${shiftTypeObj.time})</p>
                    </div>
                </div>
                
                <form id="edit-assignment-form">
                    <div class="form-group">
                        <label for="shift-role">Role for this shift:</label>
                        <select id="shift-role" class="form-control">
                            <option value="primary" selected>Primary Staff</option>
                            <option value="secondary">Secondary Staff</option>
                            <option value="support">Support Staff</option>
                            <option value="training">Training</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="shift-notes">Notes:</label>
                        <textarea id="shift-notes" class="form-control" rows="3" placeholder="Add any important notes for this shift..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Shift Options:</label>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="shift-lead" name="shift-options">
                                <label for="shift-lead">Shift Lead</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="shift-trainer" name="shift-options">
                                <label for="shift-trainer">Trainer</label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn danger-btn" id="remove-assignment-btn">
                    <i class="fas fa-trash"></i> Remove
                </button>
                <button class="btn cancel-btn" id="cancel-edit-assignment">Cancel</button>
                <button class="btn primary-btn" id="save-assignment">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .assignment-edit-header {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .staff-avatar.large img {
            width: 64px;
            height: 64px;
            border-radius: 50%;
        }
        
        .assignment-edit-info h4 {
            margin: 0 0 0.5rem 0;
        }
        
        .assignment-edit-info p {
            margin: 0 0 0.25rem 0;
            color: var(--text-secondary);
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
    
    document.getElementById('cancel-edit-assignment').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    document.getElementById('save-assignment').addEventListener('click', () => {
        // Get form values
        const role = document.getElementById('shift-role').value;
        const notes = document.getElementById('shift-notes').value;
        const isLead = document.getElementById('shift-lead').checked;
        const isTrainer = document.getElementById('shift-trainer').checked;
        
        // In a real application, save these values to the backend
        console.log('Saving assignment details:', { role, notes, isLead, isTrainer });
        
        // For demo, we'll just save notes to localStorage
        const key = `${dayIndex}-${shiftType}`;
        localStorage.setItem(`notes-${staffId}-${key}`, notes);
        localStorage.setItem(`role-${staffId}-${key}`, role);
        
        // Update UI as needed
        updateAssignmentUI(staffId, dayIndex, shiftType, { role, notes, isLead, isTrainer });
        
        // Close modal
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
        
        showToast(`${staff.name}'s assignment updated`, "success");
    });
    
    document.getElementById('remove-assignment-btn').addEventListener('click', () => {
        removeAssignment(staffId, dayIndex, shiftType);
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    // Load existing data if available
    const key = `${dayIndex}-${shiftType}`;
    const existingNotes = localStorage.getItem(`notes-${staffId}-${key}`);
    const existingRole = localStorage.getItem(`role-${staffId}-${key}`);
    
    if (existingNotes) {
        document.getElementById('shift-notes').value = existingNotes;
    }
    
    if (existingRole) {
        document.getElementById('shift-role').value = existingRole;
    }
}

/**
 * Update assignment UI with new details
 */
function updateAssignmentUI(staffId, dayIndex, shiftType, details) {
    const cell = document.querySelector(`.schedule-cell[data-day="${dayIndex}"][data-shift="${shiftType}"]`);
    if (!cell) return;
    
    const assignment = cell.querySelector(`.staff-assignment[data-staff-id="${staffId}"]`);
    if (!assignment) return;
    
    // Update role if provided
    if (details.role) {
        let roleEl = assignment.querySelector('.assignment-role');
        if (roleEl) {
            const staff = staffList.find(s => s.id === staffId);
            if (staff) {
                roleEl.textContent = `${staff.role} (${details.role})`;
            }
        }
    }
    
    // Update notes indicator
    if (details.notes !== undefined) {
        let noteIndicator = assignment.querySelector('.note-indicator');
        
        if (details.notes.trim()) {
            if (!noteIndicator) {
                noteIndicator = document.createElement('span');
                noteIndicator.className = 'note-indicator';
                noteIndicator.innerHTML = '<i class="fas fa-sticky-note" title="Has notes"></i>';
                assignment.appendChild(noteIndicator);
            }
        } else if (noteIndicator) {
            noteIndicator.remove();
        }
    }
    
    // Update shift lead indicator
    if (details.isLead !== undefined) {
        let leadIndicator = assignment.querySelector('.lead-indicator');
        
        if (details.isLead) {
            if (!leadIndicator) {
                leadIndicator = document.createElement('span');
                leadIndicator.className = 'lead-indicator';
                leadIndicator.innerHTML = '<i class="fas fa-star" title="Shift Lead"></i>';
                assignment.appendChild(leadIndicator);
            }
        } else if (leadIndicator) {
            leadIndicator.remove();
        }
    }
    
    // Update trainer indicator
    if (details.isTrainer !== undefined) {
        let trainerIndicator = assignment.querySelector('.trainer-indicator');
        
        if (details.isTrainer) {
            if (!trainerIndicator) {
                trainerIndicator = document.createElement('span');
                trainerIndicator.className = 'trainer-indicator';
                trainerIndicator.innerHTML = '<i class="fas fa-graduation-cap" title="Trainer"></i>';
                assignment.appendChild(trainerIndicator);
            }
        } else if (trainerIndicator) {
            trainerIndicator.remove();
        }
    }
}

/**
 * Setup the shift editor component
 */
function setupShiftEditor() {
    const scheduleContainer = document.querySelector('.schedule-container');
    if (!scheduleContainer) return;
    
    // Create editor element
    const editor = document.createElement('div');
    editor.className = 'shift-editor';
    editor.id = 'shift-editor';
    editor.innerHTML = `
        <div class="shift-editor-header">
            <h3>Shift Editor</h3>
            <button class="close-editor-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="shift-editor-content">
            <div id="editor-loading" class="editor-loading">
                <i class="fas fa-circle-notch fa-spin"></i>
                <span>Loading...</span>
            </div>
            <div id="editor-form" class="editor-form" style="display: none;">
                <div class="form-group">
                    <label>Day & Shift</label>
                    <div class="editor-shift-info">
                        <span id="editor-day-name">Monday</span>
                        <span id="editor-shift-name">Morning Shift</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="editor-staff-select">Assigned Staff</label>
                    <select id="editor-staff-select" multiple class="form-control">
                        <!-- Will be populated dynamically -->
                    </select>
                    <button id="add-staff-btn" class="btn btn-sm outline-btn">
                        <i class="fas fa-plus"></i> Add Staff
                    </button>
                </div>
                <div class="form-group">
                    <label for="editor-notes">Shift Notes</label>
                    <textarea id="editor-notes" class="form-control" rows="3"></textarea>
                </div>
            </div>
        </div>
        <div class="shift-editor-footer">
            <button id="editor-cancel-btn" class="btn cancel-btn">Cancel</button>
            <button id="editor-save-btn" class="btn primary-btn">Save Changes</button>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .shift-editor {
            position: fixed;
            right: 20px;
            top: 80px;
            width: 320px;
            background-color: var(--bg-card, white);
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            z-index: 100;
            display: none;
            flex-direction: column;
            border: 1px solid var(--border-color, #e0e0e0);
            max-height: calc(100vh - 100px);
            transition: all 0.3s ease;
            transform: translateX(400px);
            opacity: 0;
        }
        
        .shift-editor.active {
            display: flex;
            transform: translateX(0);
            opacity: 1;
        }
        
        .shift-editor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
        
        .shift-editor-header h3 {
            margin: 0;
            font-size: 1.1rem;
        }
        
        .close-editor-btn {
            background: none;
            border: none;
            font-size: 1.25rem;
            color: var(--text-secondary, #777);
            cursor: pointer;
        }
        
        .shift-editor-content {
            padding: 1rem;
            flex: 1;
            overflow-y: auto;
        }
        
        .editor-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 2rem;
        }
        
        .editor-loading i {
            font-size: 2rem;
            color: var(--primary-color, #4CAF50);
        }
        
        .editor-shift-info {
            display: flex;
            gap: 1rem;
            align-items: center;
            background-color: var(--bg-secondary, #f5f5f5);
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
        }
        
        .editor-shift-info #editor-shift-name {
            font-weight: 600;
            color: var(--primary-color, #4CAF50);
        }
        
        .shift-editor-footer {
            padding: 1rem;
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            border-top: 1px solid var(--border-color, #e0e0e0);
        }
    `;
    document.head.appendChild(style);
    
    // Add to document but initially hidden
    scheduleContainer.appendChild(editor);
    
    // Add event listeners
    editor.querySelector('.close-editor-btn').addEventListener('click', () => {
        hideEditor();
    });
    
    document.getElementById('editor-cancel-btn').addEventListener('click', () => {
        hideEditor();
    });
    
    document.getElementById('editor-save-btn').addEventListener('click', () => {
        saveEditorChanges();
    });
    
    document.getElementById('add-staff-btn').addEventListener('click', () => {
        // Get current cell being edited
        const dayIndex = parseInt(editor.getAttribute('data-day'));
        const shiftType = editor.getAttribute('data-shift');
        
        if (dayIndex !== undefined && shiftType) {
            showAddToShiftModal(dayIndex, shiftType);
        }
    });
    
    // Global function to show the editor
    window.showShiftEditor = function(dayIndex, shiftType) {
        const shiftTypeObj = Object.values(SHIFT_TYPES).find(t => t.id === shiftType);
        if (!shiftTypeObj) return;
        
        // Save cell info in data attributes
        editor.setAttribute('data-day', dayIndex);
        editor.setAttribute('data-shift', shiftType);
        
        // Show loading state
        document.getElementById('editor-loading').style.display = 'flex';
        document.getElementById('editor-form').style.display = 'none';
        
        // Show the editor
        editor.classList.add('active');
        
        // Load shift data
        setTimeout(() => {
            // Update editor header
            document.getElementById('editor-day-name').textContent = DAYS_OF_WEEK[dayIndex];
            document.getElementById('editor-shift-name').textContent = shiftTypeObj.label;
            
            // Load assigned staff
            populateEditorStaffList(dayIndex, shiftType);
            
            // Load shift notes
            const key = `shift-notes-${dayIndex}-${shiftType}`;
            const shiftNotes = localStorage.getItem(key) || '';
            document.getElementById('editor-notes').value = shiftNotes;
            
            // Hide loading, show form
            document.getElementById('editor-loading').style.display = 'none';
            document.getElementById('editor-form').style.display = 'block';
        }, 500); // Simulate loading
    };
    
    // Hide editor function
    function hideEditor() {
        editor.classList.remove('active');
    }
    
    // Save editor changes
    function saveEditorChanges() {
        const dayIndex = parseInt(editor.getAttribute('data-day'));
        const shiftType = editor.getAttribute('data-shift');
        
        if (dayIndex === undefined || !shiftType) return;
        
        // Save shift notes
        const notes = document.getElementById('editor-notes').value;
        const notesKey = `shift-notes-${dayIndex}-${shiftType}`;
        localStorage.setItem(notesKey, notes);
        
        // In a real app, would save other changes to backend
        
        // Show success message
        showToast("Changes saved", "success");
        
        // Hide editor
        hideEditor();
    }
    
    // Populate staff list in editor
    function populateEditorStaffList(dayIndex, shiftType) {
        const staffSelect = document.getElementById('editor-staff-select');
        if (!staffSelect) return;
        
        // Clear existing options
        staffSelect.innerHTML = '';
        
        // Get assigned staff
        const key = `${dayIndex}-${shiftType}`;
        const assignedStaff = scheduleData[key] || [];
        
        // Add each assigned staff member
        assignedStaff.forEach(staffId => {
            const staff = staffList.find(s => s.id === staffId);
            if (staff) {
                const option = document.createElement('option');
                option.value = staffId;
                option.textContent = `${staff.name} - ${staff.role}`;
                option.selected = true;
                staffSelect.appendChild(option);
            }
        });
    }
}

/**
 * Setup AI integration for scheduling assistance
 */
function setupAIIntegration() {
    console.log("Setting up AI integration...");
    
    // Add AI assistant button to the toolbar
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        const aiButton = document.createElement('button');
        aiButton.className = 'btn btn-primary';
        aiButton.id = 'ai-schedule-assistant';
        aiButton.innerHTML = '<i class="fas fa-brain"></i> AI Assistant';
        aiButton.title = 'Get AI suggestions for scheduling';
        
        aiButton.addEventListener('click', () => {
            showAIAssistantModal();
        });
        
        actionButtons.appendChild(aiButton);
    }
    
    // Add event listener for automatic scheduling
    const autoScheduleBtn = document.getElementById('auto-schedule-btn');
    if (autoScheduleBtn) {
        autoScheduleBtn.addEventListener('click', () => {
            generateAISchedule();
        });
    }
}

/**
 * Show AI assistant modal
 */
function showAIAssistantModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'ai-assistant-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-brain"></i>
                    AI Scheduling Assistant
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="ai-assistant-info">
                    <p>AI Scheduling Assistant can help you with various scheduling tasks:</p>
                    <ul>
                        <li>Generate optimized schedules based on staff preferences</li>
                        <li>Analyze current schedule for issues and conflicts</li>
                        <li>Balance workload across staff members</li>
                        <li>Fill open shifts with recommended staff</li>
                        <li>Provide insights on scheduling patterns</li>
                    </ul>
                </div>
                
                <div class="ai-assistant-form">
                    <div class="form-group">
                        <label for="ai-action">Select Action:</label>
                        <select id="ai-action" class="form-control">
                            <option value="analyze">Analyze Current Schedule</option>
                            <option value="optimize">Optimize Current Schedule</option>
                            <option value="generate">Generate New Schedule</option>
                            <option value="fill">Fill Open Shifts</option>
                            <option value="balance">Balance Workload</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="ai-parameters-container">
                        <!-- Dynamic parameters will be added here based on action -->
                        <div id="analyze-params" class="ai-params">
                            <label class="ai-param-label">Include:</label>
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="analyze-conflicts" name="analyze-params" checked>
                                    <label for="analyze-conflicts">Conflicts</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="analyze-workload" name="analyze-params" checked>
                                    <label for="analyze-workload">Workload Balance</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="analyze-preferences" name="analyze-params" checked>
                                    <label for="analyze-preferences">Staff Preferences</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="ai-instructions">Additional Instructions:</label>
                        <textarea id="ai-instructions" class="form-control" rows="3" 
                            placeholder="Add any specific requirements or constraints..."></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="ai-credits-info">
                    <i class="fas fa-info-circle"></i>
                    <span>AI usage: <strong>4</strong> credits remaining</span>
                </div>
                <div class="modal-actions">
                    <button class="btn cancel-btn" id="cancel-ai">Cancel</button>
                    <button class="btn primary-btn" id="run-ai-action">
                        <i class="fas fa-brain"></i> Run AI Assistant
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .ai-assistant-info {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background-color: rgba(33, 150, 243, 0.05);
            border-left: 3px solid var(--info-color, #2196F3);
            border-radius: 4px;
        }
        
        .ai-assistant-info p {
            margin-top: 0;
        }
        
        .ai-assistant-info ul {
            margin-bottom: 0;
            padding-left: 1.5rem;
        }
        
        .ai-assistant-info li {
            margin-bottom: 0.5rem;
        }
        
        .ai-params {
            margin-top: 1rem;
        }
        
        .ai-param-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        .modal-footer {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
        }
        
        .ai-credits-info {
            color: var(--text-secondary);
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .modal-actions {
            display: flex;
            gap: 0.75rem;
        }
        
        /* Specific parameters styling */
        .ai-params {
            display: none;
        }
        
        .ai-params.active {
            display: block;
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
    
    document.getElementById('cancel-ai').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            style.remove();
        }, 300);
    });
    
    // Show appropriate parameters based on selected action
    const aiAction = document.getElementById('ai-action');
    if (aiAction) {
        aiAction.addEventListener('change', () => {
            const action = aiAction.value;
            
            // Hide all parameter sections
            document.querySelectorAll('.ai-params').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected action's parameters
            const paramsSection = document.getElementById(`${action}-params`);
            if (paramsSection) {
                paramsSection.classList.add('active');
            }
        });
    }
    
    // Run AI action
    document.getElementById('run-ai-action').addEventListener('click', () => {
        const action = document.getElementById('ai-action').value;
        const instructions = document.getElementById('ai-instructions').value;
        
        // Display processing screen
        showAIProcessing();
        
        // Run selected AI action
        setTimeout(() => {
            switch (action) {
                case 'analyze':
                    analyzeCurrentSchedule(instructions);
                    break;
                case 'optimize':
                    optimizeCurrentSchedule(instructions);
                    break;
                case 'generate':
                    generateAISchedule(instructions);
                    break;
                case 'fill':
                    fillOpenShifts(instructions);
                    break;
                case 'balance':
                    balanceWorkload(instructions);
                    break;
            }
            
            // Close the modal
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                style.remove();
            }, 300);
        }, 1500);
    });
    
    // Show analyze parameters by default
    document.getElementById('analyze-params').classList.add('active');
}

/**
 * Show AI processing screen
 */
function showAIProcessing() {
    const processingEl = document.createElement('div');
    processingEl.className = 'ai-processing';
    processingEl.innerHTML = `
        <div class="ai-processing-content">
            <div class="ai-processing-icon">
                <i class="fas fa-brain"></i>
                <div class="ai-pulse"></div>
            </div>
            <h3>AI Assistant Processing</h3>
            <div class="ai-processing-status">Analyzing schedule data...</div>
            <div class="ai-processing-progress">
                <div class="ai-progress-bar"><div class="ai-progress"></div></div>
            </div>
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .ai-processing {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(3px);
        }
        
        .ai-processing-content {
            background-color: var(--bg-card);
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            max-width: 90%;
            width: 400px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            animation: ai-slide-up 0.3s ease-out forwards;
        }
        
        @keyframes ai-slide-up {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .ai-processing-icon {
            position: relative;
            margin: 0 auto 1.5rem;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .ai-processing-icon i {
            font-size: 3rem;
            color: var(--primary-color);
            z-index: 1;
        }
        
        .ai-pulse {
            position: absolute;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: rgba(76, 175, 80, 0.15);
            animation: ai-pulse 2s infinite;
        }
        
        @keyframes ai-pulse {
            0% { transform: scale(0.8); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 0.4; }
            100% { transform: scale(0.8); opacity: 0.8; }
        }
        
        .ai-processing h3 {
            margin: 0 0 1rem 0;
        }
        
        .ai-processing-status {
            margin-bottom: 1rem;
            color: var(--text-secondary);
        }
        
        .ai-progress-bar {
            height: 6px;
            background-color: var(--bg-secondary);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .ai-progress {
            height: 100%;
            background-color: var(--primary-color);
            border-radius: 3px;
            width: 0%;
            animation: ai-progress 2s ease-in-out forwards;
        }
        
        @keyframes ai-progress {
            0% { width: 0%; }
            20% { width: 20%; }
            50% { width: 60%; }
            80% { width: 85%; }
            100% { width: 100%; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(processingEl);
    
    // Update status messages
    const statusEl = processingEl.querySelector('.ai-processing-status');
    const messages = [
        'Analyzing schedule data...',
        'Checking staff preferences...',
        'Identifying patterns...',
        'Generating recommendations...',
        'Finalizing results...'
    ];
    
    messages.forEach((message, index) => {
        setTimeout(() => {
            if (statusEl) statusEl.textContent = message;
        }, index * 500);
    });
    
    // Remove after animation completes
    setTimeout(() => {
        processingEl.style.animation = 'fade-out 0.3s forwards';
        setTimeout(() => {
            processingEl.remove();
            style.remove();
        }, 300);
    }, 3000);
}

/**
 * Analyze current schedule with AI
 */
function analyzeCurrentSchedule(instructions = '') {
    console.log("Analyzing schedule with AI...", instructions);
    
    // In a real app, this would call an AI service
    // For now, we'll simulate the analysis
    
    const analysisResults = {
        conflicts: [
            {
                type: 'double-booking',
                staffId: '3',
                staffName: 'Guðrún Einarsdóttir',
                dayIndex: 1,
                shifts: ['evening', 'night'],
                recommendation: 'Remove from night shift and assign another qualified staff.'
            },
            {
                type: 'preference-violation',
                staffId: '2',
                staffName: 'Björn Sigurðsson',
                dayIndex: 6,
                shifts: ['morning'],
                recommendation: 'Björn prefers not to work on Sundays.'
            }
        ],
        workload: {
            imbalance: true,
            overworked: [
                { staffId: '1', staffName: 'Anna Jónsdóttir', hours: 40 }
            ],
            underworked: [
                { staffId: '5', staffName: 'Sigríður Björnsdóttir', hours: 16 }
            ],
            recommendation: 'Reduce Anna\'s hours and increase Sigríður\'s hours.'
        },
        coverage: {
            understaffed: [
                { dayIndex: 3, shiftType: 'night', current: 0, recommended: 2 }
            ],
            recommendation: 'Add staff to Thursday night shift.'
        }
    };
    
    // Display results in an AI insight panel
    showAIInsightsPanel('Schedule Analysis Results', analysisResults, 'analysis');
}

/**
 * Optimize current schedule with AI
 */
function optimizeCurrentSchedule(instructions = '') {
    console.log("Optimizing schedule with AI...", instructions);
    
    // In a real app, this would call an AI service
    // For now, we'll simulate the optimization
    
    const optimizationResults = {
        changes: [
            {
                type: 'move',
                staffId: '3',
                staffName: 'Guðrún Einarsdóttir',
                fromDay: 1,
                fromShift: 'night',
                toDay: 3,
                toShift: 'night',
                reason: 'Resolves double booking and fills understaffed shift'
            },
            {
                type: 'swap',
                staff1: { id: '1', name: 'Anna Jónsdóttir' },
                staff2: { id: '5', name: 'Sigríður Björnsdóttir' },
                day: 4,
                shift: 'evening',
                reason: 'Balances workload between staff'
            },
            {
                type: 'remove',
                staffId: '2',
                staffName: 'Björn Sigurðsson',
                day: 6,
                shift: 'morning',
                reason: 'Respects staff preference to avoid Sundays'
            }
        ],
        benefits: {
            workloadBalance: 'Improved by 35%',
            preferenceAlignment: 'Improved by 20%',
            coverage: 'Improved by 15%'
        }
    };
    
    // Display results in an AI insight panel
    showAIInsightsPanel('Schedule Optimization Results', optimizationResults, 'optimization');
}

/**
 * Generate a complete schedule using AI
 */
function generateAISchedule(instructions = '') {
    console.log("Generating AI schedule...", instructions);
    
    // In a real app, this would call an AI service
    // For now, we'll simulate a new schedule generation
    
    // Clear current schedule
    clearSchedule();
    
    // Generate new schedule data
    const aiGeneratedSchedule = {
        '0-morning': ['1', '5'],
        '0-evening': ['3', '4'],
        '0-night': ['2'],
        '1-morning': ['5', '4'],
        '1-evening': ['1', '3'],
        '1-night': ['2'],
        '2-morning': ['1', '5'],
        '2-evening': ['3', '4'],
        '2-night': ['2'],
        '3-morning': ['4', '5'],
        '3-evening': ['1'],
        '3-night': ['3'],
        '4-morning': ['1', '2'],
        '4-evening': ['5'],
        '4-night': ['3'],
        '5-morning': ['4', '5'],
        '5-evening': ['3', '1'],
        '5-night': ['2'],
        '6-evening': ['3', '4'],
        '6-night': ['1']
    };
    
    // Apply the generated schedule
    scheduleData = aiGeneratedSchedule;
    
    // Update UI
    refreshScheduleGrid();
    updateStaffHours();
    updateScheduleStats();
    generateAISuggestions();
    
    // Show success message
    showToast('AI schedule bættist við', 'success');
    
    // Show schedule generation report
    const generationReport = {
        coverage: '92% (23/25 shifts filled)',
        balancedWorkload: 'All staff assigned 32-40 hours',
        staffPreferences: '85% of preferences honored',
        keyFeatures: [
            'All night shifts covered',
            'No double bookings',
            'Weekends distributed fairly',
            'Required skill mix maintained on all shifts'
        ]
    };
    
    // Display results in an AI insight panel
    showAIInsightsPanel('AI Schedule Generation Report', generationReport, 'generation');
}

/**
 * Fill open shifts with AI recommendations
 */
function fillOpenShifts(instructions = '') {
    console.log("Filling open shifts with AI...", instructions);
    
    // Find all empty shifts
    const emptyShifts = [];
    
    for (let dayIndex = 0; dayIndex < DAYS_OF_WEEK.length; dayIndex++) {
        for (const shiftType of Object.values(SHIFT_TYPES).map(t => t.id)) {
            const key = `${dayIndex}-${shiftType}`;
            if (!scheduleData[key] || scheduleData[key].length === 0) {
                emptyShifts.push({ dayIndex, shiftType });
            }
        }
    }
    
    if (emptyShifts.length === 0) {
        showToast('No empty shifts found', 'info');
        return;
    }
    
    // Fill some of the empty shifts with recommended staff
    let filledCount = 0;
    
    emptyShifts.forEach(shift => {
        const { dayIndex, shiftType } = shift;
        
        // Find a suitable staff member
        const recommendedStaff = findRecommendedStaff(dayIndex, shiftType);
        
        if (recommendedStaff && isValidAssignment(recommendedStaff.id, dayIndex, shiftType)) {
            addAssignment(recommendedStaff.id, dayIndex, shiftType, false);
            filledCount++;
        }
    });
    
    // Update UI
    refreshScheduleGrid();
    updateStaffHours();
    updateScheduleStats();
    generateAISuggestions();
    
    // Show success message
    showToast(`${filledCount} tómar vaktir fylltar af AI`, 'success');
    
    // Show fill report
    const fillReport = {
        totalEmptyShifts: emptyShifts.length,
        shiftsFilled: filledCount,
        remainingEmpty: emptyShifts.length - filledCount,
        staffUtilization: 'Optimized based on preferences and hours'
    };
    
    // Display results in an AI insight panel
    showAIInsightsPanel('AI Shift Fill Report', fillReport, 'fill');
}

/**
 * Balance workload across staff with AI
 */
function balanceWorkload(instructions = '') {
    console.log("Balancing workload with AI...", instructions);
    
    // Calculate current hours
    updateStaffHours();
    
    // Find overworked and underworked staff
    const overworked = staffList.filter(staff => staff.hoursWorked > 40);
    const underworked = staffList.filter(staff => staff.hoursWorked < 32);
    
    if (overworked.length === 0 && underworked.length === 0) {
        showToast('Workload is already well balanced', 'info');
        return;
    }
    
    // Make changes to balance workload
    let changesCount = 0;
    
    // For each overworked staff, remove one shift and assign to underworked
    overworked.forEach(staff => {
        if (underworked.length === 0) return;
        
        // Find a shift to reassign
        for (const key in scheduleData) {
            const [dayIndex, shiftType] = key.split('-');
            
            if (scheduleData[key] && scheduleData[key].includes(staff.id)) {
                // Find an underworked staff who can take this shift
                const suitableStaff = underworked.find(s => 
                    s.shifts.includes(shiftType) && 
                    isValidAssignment(s.id, parseInt(dayIndex), shiftType)
                );
                
                if (suitableStaff) {
                    // Remove overworked staff from shift
                    removeAssignment(staff.id, parseInt(dayIndex), shiftType, false);
                    
                    // Add underworked staff to shift
                    addAssignment(suitableStaff.id, parseInt(dayIndex), shiftType, false);
                    
                    changesCount++;
                    
                    // Update hours to reflect changes
                    staff.hoursWorked -= HOURS_PER_SHIFT;
                    suitableStaff.hoursWorked += HOURS_PER_SHIFT;
                    
                    // Break after one change per overworked staff
                    break;
                }
            }
        }
    });
    
    // Update UI
    refreshScheduleGrid();
    updateStaffHours();
    updateScheduleStats();
    generateAISuggestions();
    
    // Show success message
    showToast(`${changesCount} vaktabreytingar til að jafna álag`, 'success');
    
    // Show balance report
    const balanceReport = {
        changesMade: changesCount,
        beforeBalance: {
            maxHours: Math.max(...staffList.map(s => s.hoursWorked + (overworked.includes(s) ? HOURS_PER_SHIFT : 0))),
            minHours: Math.min(...staffList.map(s => s.hoursWorked - (underworked.includes(s) ? HOURS_PER_SHIFT : 0))),
            averageHours: staffList.reduce((sum, s) => sum + s.hoursWorked, 0) / staffList.length
        },
        afterBalance: {
            maxHours: Math.max(...staffList.map(s => s.hoursWorked)),
            minHours: Math.min(...staffList.map(s => s.hoursWorked)),
            averageHours: staffList.reduce((sum, s) => sum + s.hoursWorked, 0) / staffList.length
        }
    };
    
    // Display results in an AI insight panel
    showAIInsightsPanel('Workload Balancing Report', balanceReport, 'balance');
}

/**
 * Show AI insights panel with results
 */
function showAIInsightsPanel(title, data, type) {
    // Remove any existing insight panels
    const existingPanel = document.getElementById('ai-insights-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Create insight panel element
    const panel = document.createElement('div');
    panel.className = 'ai-insights-panel';
    panel.id = 'ai-insights-panel';
    
    // Generate panel content based on type and data
    let content = '';
    
    switch (type) {
        case 'analysis':
            content = generateAnalysisContent(data);
            break;
        case 'optimization':
            content = generateOptimizationContent(data);
            break;
        case 'generation':
            content = generateGenerationContent(data);
            break;
        case 'fill':
            content = generateFillContent(data);
            break;
        case 'balance':
            content = generateBalanceContent(data);
            break;
        default:
            content = `<p>No insights available for this action.</p>`;
    }
    
    panel.innerHTML = `
        <div class="insights-header">
            <div class="insights-title">
                <i class="fas fa-lightbulb"></i>
                <h3>${title}</h3>
            </div>
            <div class="insights-actions">
                <button class="insights-action" data-action="save" title="Save insights">
                    <i class="fas fa-save"></i>
                </button>
                <button class="insights-action" data-action="print" title="Print insights">
                    <i class="fas fa-print"></i>
                </button>
                <button class="insights-action" data-action="close" title="Close panel">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="insights-body">
            <div class="ai-timestamp">
                <i class="fas fa-clock"></i> 
                Generated on ${new Date().toLocaleString('is-IS')}
            </div>
            ${content}
        </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .ai-insights-panel {
            position: fixed;
            right: 20px;
            top: 80px;
            width: 400px;
            max-width: 90vw;
            background-color: var(--bg-card);
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            z-index: 100;
            display: flex;
            flex-direction: column;
            border: 1px solid var(--border-color);
            max-height: calc(100vh - 100px);
            animation: slide-in-right 0.3s ease-out forwards;
            overflow: hidden;
        }
        
        @keyframes slide-in-right {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .insights-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            background-color: var(--bg-secondary);
        }
        
        .insights-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .insights-title i {
            font-size: 1.25rem;
            color: #FFC107;
        }
        
        .insights-title h3 {
            margin: 0;
            font-size: 1.1rem;
        }
        
        .insights-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .insights-action {
            background: none;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--text-secondary);
            transition: all 0.2s ease;
        }
        
        .insights-action:hover {
            background-color: var(--bg-primary);
            color: var(--primary-color);
        }
        
        .insights-body {
            padding: 1rem;
            overflow-y: auto;
        }
        
        .ai-timestamp {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .ai-insight-section {
            margin-bottom: 1.5rem;
        }
        
        .ai-insight-section h4 {
            margin: 0 0 0.75rem 0;
            font-size: 1rem;
            color: var(--primary-color);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .ai-insight-item {
            padding: 0.75rem;
            background-color: var(--bg-secondary);
            border-radius: 8px;
            margin-bottom: 0.75rem;
        }
        
        .ai-insight-item:last-child {
            margin-bottom: 0;
        }
        
        .ai-insight-label {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        
        .ai-stat-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
            margin-bottom: 1rem;
        }
        
        .ai-stat {
            padding: 0.75rem;
            background-color: var(--bg-secondary);
            border-radius: 8px;
            text-align: center;
        }
        
        .ai-stat-value {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        
        .ai-stat-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .ai-key-feature {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .ai-key-feature i {
            color: var(--success-color);
        }
        
        .conflict-item {
            border-left: 3px solid var(--danger-color);
        }
        
        .workload-item {
            border-left: 3px solid var(--warning-color);
        }
        
        .coverage-item {
            border-left: 3px solid var(--info-color);
        }
        
        .change-move {
            border-left: 3px solid var(--info-color);
        }
        
        .change-swap {
            border-left: 3px solid var(--warning-color);
        }
        
        .change-remove {
            border-left: 3px solid var(--danger-color);
        }
    `;
    document.head.appendChild(style);
    
    // Add to document
    document.body.appendChild(panel);
    
    // Add event listeners
    panel.querySelector('[data-action="close"]').addEventListener('click', () => {
        panel.style.animation = 'slide-out-right 0.3s ease-out forwards';
        
        setTimeout(() => {
            panel.remove();
            style.remove();
        }, 300);
    });
    
    panel.querySelector('[data-action="save"]').addEventListener('click', () => {
        showToast('Insights saved', 'success');
    });
    
    panel.querySelector('[data-action="print"]').addEventListener('click', () => {
        showToast('Preparing to print...', 'info');
    });
    
    // Add @keyframes for slide-out animation
    const slideOutKeyframes = document.createElement('style');
    slideOutKeyframes.textContent = `
        @keyframes slide-out-right {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(slideOutKeyframes);
}

/**
 * Generate content for analysis insights
 */
function generateAnalysisContent(data) {
    let content = '';
    
    if (data.conflicts && data.conflicts.length > 0) {
        content += `
            <div class="ai-insight-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Conflicts</h4>
                ${data.conflicts.map(conflict => `
                    <div class="ai-insight-item conflict-item">
                        <div class="ai-insight-label">${conflict.staffName} - ${DAYS_OF_WEEK[conflict.dayIndex]}</div>
                        <div class="ai-insight-text">
                            ${conflict.shifts.map(shift => {
                                const shiftType = Object.values(SHIFT_TYPES).find(t => t.id === shift);
                                return `${shiftType.label} (${shiftType.time})`;
                            }).join(', ')}
                        </div>
                        <div class="ai-insight-recommendation">
                            <strong>Recommendation:</strong> ${conflict.recommendation}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (data.workload) {
        content += `
            <div class="ai-insight-section">
                <h4><i class="fas fa-balance-scale"></i> Workload</h4>
                <div class="ai-insight-item workload-item">
                    <div class="ai-insight-label">Imbalance Detected</div>
                    <div class="ai-insight-text">
                        ${data.workload.overworked.map(staff => `${staff.staffName} (${staff.hours} hours)`).join(', ')} are overworked.
                        ${data.workload.underworked.map(staff => `${staff.staffName} (${staff.hours} hours)`).join(', ')} are underworked.
                    </div>
                    <div class="ai-insight-recommendation">
                        <strong>Recommendation:</strong> ${data.workload.recommendation}
                    </div>
                </div>
            </div>
        `;
    }
    
    if (data.coverage) {
        content += `
            <div class="ai-insight-section">
                <h4><i class="fas fa-users"></i> Coverage</h4>
                <div class="ai-insight-item coverage-item">
                    <div class="ai-insight-label">Understaffed Shifts</div>
                    <div class="ai-insight-text">
                        ${data.coverage.understaffed.map(shift => {
                            const shiftType = Object.values(SHIFT_TYPES).find(t => t.id === shift.shiftType);
                            return `${DAYS_OF_WEEK[shift.dayIndex]} ${shiftType.label} (Current: ${shift.current}, Recommended: ${shift.recommended})`;
                        }).join(', ')}
                    </div>
                    <div class="ai-insight-recommendation">
                        <strong>Recommendation:</strong> ${data.coverage.recommendation}
                    </div>
                </div>
            </div>
        `;
    }
    
    return content;
}

/**
 * Generate content for optimization insights
 */
function generateOptimizationContent(data) {
    let content = '';
    
    if (data.changes && data.changes.length > 0) {
        content += `
            <div class="ai-insight-section">
                <h4><i class="fas fa-sync-alt"></i> Changes</h4>
                ${data.changes.map(change => `
                    <div class="ai-insight-item change-${change.type}">
                        <div class="ai-insight-label">${change.staffName || `${change.staff1.name} & ${change.staff2.name}`}</div>
                        <div class="ai-insight-text">
                            ${change.type === 'move' ? `Move from ${DAYS_OF_WEEK[change.fromDay]} ${change.fromShift} to ${DAYS_OF_WEEK[change.toDay]} ${change.toShift}` : ''}
                            ${change.type === 'swap' ? `Swap ${DAYS_OF_WEEK[change.day]} ${change.shift}` : ''}
                            ${change.type === 'remove' ? `Remove from ${DAYS_OF_WEEK[change.day]} ${change.shift}` : ''}
                        </div>
                        <div class="ai-insight-recommendation">
                            <strong>Reason:</strong> ${change.reason}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    if (data.benefits) {
        content += `
            <div class="ai-insight-section">
                <h4><i class="fas fa-chart-line"></i> Benefits</h4>
                <div class="ai-stat-grid">
                    <div class="ai-stat">
                        <div class="ai-stat-value">${data.benefits.workloadBalance}</div>
                        <div class="ai-stat-label">Workload Balance</div>
                    </div>
                    <div class="ai-stat">
                        <div class="ai-stat-value">${data.benefits.preferenceAlignment}</div>
                        <div class="ai-stat-label">Preference Alignment</div>
                    </div>
                    <div class="ai-stat">
                        <div class="ai-stat-value">${data.benefits.coverage}</div>
                        <div class="ai-stat-label">Coverage</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    return content;
}

/**
 * Generate content for generation insights
 */
function generateGenerationContent(data) {
    let content = '';
    
    content += `
        <div class="ai-insight-section">
            <h4><i class="fas fa-calendar-alt"></i> Schedule Summary</h4>
            <div class="ai-stat-grid">
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.coverage}</div>
                    <div class="ai-stat-label">Coverage</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.balancedWorkload}</div>
                    <div class="ai-stat-label">Balanced Workload</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.staffPreferences}</div>
                    <div class="ai-stat-label">Staff Preferences</div>
                </div>
            </div>
        </div>
    `;
    
    if (data.keyFeatures && data.keyFeatures.length > 0) {
        content += `
            <div class="ai-insight-section">
                <h4><i class="fas fa-star"></i> Key Features</h4>
                ${data.keyFeatures.map(feature => `
                    <div class="ai-key-feature">
                        <i class="fas fa-check-circle"></i>
                        <span>${feature}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return content;
}

/**
 * Generate content for fill insights
 */
function generateFillContent(data) {
    let content = '';
    
    content += `
        <div class="ai-insight-section">
            <h4><i class="fas fa-user-plus"></i> Fill Report</h4>
            <div class="ai-stat-grid">
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.totalEmptyShifts}</div>
                    <div class="ai-stat-label">Total Empty Shifts</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.shiftsFilled}</div>
                    <div class="ai-stat-label">Shifts Filled</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.remainingEmpty}</div>
                    <div class="ai-stat-label">Remaining Empty</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.staffUtilization}</div>
                    <div class="ai-stat-label">Staff Utilization</div>
                </div>
            </div>
        </div>
    `;
    
    return content;
}

/**
 * Generate content for balance insights
 */
function generateBalanceContent(data) {
    let content = '';
    
    content += `
        <div class="ai-insight-section">
            <h4><i class="fas fa-balance-scale"></i> Balance Report</h4>
            <div class="ai-stat-grid">
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.changesMade}</div>
                    <div class="ai-stat-label">Changes Made</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.beforeBalance.maxHours}</div>
                    <div class="ai-stat-label">Max Hours (Before)</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.beforeBalance.minHours}</div>
                    <div class="ai-stat-label">Min Hours (Before)</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.beforeBalance.averageHours}</div>
                    <div class="ai-stat-label">Average Hours (Before)</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.afterBalance.maxHours}</div>
                    <div class="ai-stat-label">Max Hours (After)</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.afterBalance.minHours}</div>
                    <div class="ai-stat-label">Min Hours (After)</div>
                </div>
                <div class="ai-stat">
                    <div class="ai-stat-value">${data.afterBalance.averageHours}</div>
                    <div class="ai-stat-label">Average Hours (After)</div>
                </div>
            </div>
        </div>
    `;
    
    return content;
}

/**
 * Show modal to create a recurring shift pattern
 */
function showRecurringShiftModal() {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'recurring-shift-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>
                    <i class="fas fa-repeat"></i>
                    Create Recurring Shift Pattern
                </h3>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="recurring-shift-form">
                    <div class="form-group">
                        <label for="recurring-staff">Staff Member</label>
                        <select id="recurring-staff" class="form-control" required>
                            <option value="">Select staff member</option>
                            ${staffList.map(s => `
                                <option value="${s.id}">${s.name} (${s.role})</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="recurring-shift-type">Shift Type</label>
                        <select id="recurring-shift-type" class="form-control" required>
                            <option value="">Select shift type</option>
                            ${Object.values(SHIFT_TYPES).map(type => `
                                <option value="${type.id}">${type.label}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Days of Week</label>
                        <div class="day-checkboxes">
                            ${DAYS_OF_WEEK.map((day, index) => `
                                <div class="checkbox-wrap">
                                    <input type="checkbox" id="day-${index}" value="${index}">
                                    <label for="day-${index}">${day}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="start-date">Start Date</label>
                            <input type="date" id="start-date" class="form-control" required>
                        </div>
                        <div class="form-group half">
                            <label for="end-date">End Date</label>
                            <input type="date" id="end-date" class="form-control" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="recurring-notes">Notes</label>
                        <textarea id="recurring-notes" class="form-control" rows="3"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn cancel-btn" id="cancel-recurring">Cancel</button>
                <button class="btn primary-btn" id="create-recurring">
                    <i class="fas fa-save"></i> Create Recurring Shifts
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set default dates
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    document.getElementById('start-date').valueAsDate = today;
    document.getElementById('end-date').valueAsDate = nextMonth;
    
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
    
    document.getElementById('cancel-recurring').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    document.getElementById('create-recurring').addEventListener('click', () => {
        createRecurringShifts();
    });
}

/**
 * Create recurring shifts based on the selected pattern
 */
function createRecurringShifts() {
    // Get form inputs
    const staffId = document.getElementById('recurring-staff').value;
    const shiftType = document.getElementById('recurring-shift-type').value;
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    const notes = document.getElementById('recurring-notes').value;
    
    // Get selected days
    const selectedDays = [];
    DAYS_OF_WEEK.forEach((day, index) => {
        if (document.getElementById(`day-${index}`).checked) {
            selectedDays.push(index);
        }
    });
    
    // Validate inputs
    if (!staffId) {
        showToast("Please select a staff member", "warning");
        return;
    }
    
    if (!shiftType) {
        showToast("Please select a shift type", "warning");
        return;
    }
    
    if (selectedDays.length === 0) {
        showToast("Please select at least one day of the week", "warning");
        return;
    }
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        showToast("Please enter valid dates", "warning");
        return;
    }
    
    if (startDate > endDate) {
        showToast("Start date must be before end date", "warning");
        return;
    }
    
    // Find the staff member
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) {
        showToast("Staff member not found", "error");
        return;
    }
    
    // Show processing message
    showToast("Creating recurring shifts...", "info");
    
    // Create shifts
    let shiftsCreated = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const adjustedDayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Adjust to make Monday = 0
        
        if (selectedDays.includes(adjustedDayOfWeek)) {
            // Format date as YYYY-MM-DD
            const dateStr = currentDate.toISOString().substring(0, 10);
            
            // Add assignment
            const key = `${adjustedDayOfWeek}-${shiftType}`;
            
            // Check if this staff already has this shift
            const assignedStaff = scheduleData[key] || [];
            if (!assignedStaff.includes(staffId)) {
                // Add staff to shift
                addAssignment(staffId, adjustedDayOfWeek, shiftType);
                
                // Add notes if provided
                if (notes) {
                    const notesKey = `shift-notes-${adjustedDayOfWeek}-${shiftType}-${staffId}`;
                    localStorage.setItem(notesKey, notes);
                }
                
                shiftsCreated++;
            }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Close modal
    const modal = document.getElementById('recurring-shift-modal');
    modal.classList.remove('active');
    setTimeout(() => {
        modal.remove();
    }, 300);
    
    // Show success message
    showToast(`Created ${shiftsCreated} recurring shifts for ${staff.name}`, "success");
    
    // Refresh the calendar
    refreshCalendar();
}