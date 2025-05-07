/**
 * schedule.js - Staff shift scheduling functionality
 * NurseCare AI - Excel-like shift scheduling system
 * 
 * This module handles:
 * - Rendering a 7-day week schedule table with Icelandic day names
 * - Random generation of mock staff and shifts
 * - Color-coded shift types
 * - Responsive layout with sticky first column
 */

// ===== Constants =====
const SHIFT_TYPES = {
  MORNING: { label: '08–16', class: 'morning', color: '#4CAF50' }, // Green 
  EVENING: { label: '13–21', class: 'evening', color: '#2196F3' }, // Blue
  NIGHT: { label: '21–08', class: 'night', color: '#9C27B0' },     // Purple
  HOLIDAY: { label: 'HL', class: 'holiday', color: '#FFC107' },    // Yellow
  SICK: { label: 'Veikur', class: 'sick', color: '#F44336' }       // Red
};

// Staff roles for random generation - Icelandic nursing roles
const STAFF_ROLES = ['Hjúkrunarfræðingur', 'Sjúkraliði', 'Aðstoðarmaður', 'Deildarstjóri', 'Næturvakt', 'Umönnun'];

// Day names for the schedule header - Icelandic
const DAYS_OF_WEEK = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];

// Short day names for mobile view - Icelandic abbreviated
const SHORT_DAYS = ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'];

// ===== Helper Functions =====

/**
 * Generates a random staff member with Icelandic names
 * @returns {Object} A staff member object with name, role, and avatar
 */
const generateStaffMember = (index) => {
  // Common Icelandic names
  const firstNames = ['Guðrún', 'Anna', 'Kristín', 'Margrét', 'Helga', 'Sigrún', 'Jóhanna', 'Katrín', 'Eva', 'María',
                     'Jón', 'Sigurður', 'Gunnar', 'Ólafur', 'Kristján', 'Magnús', 'Stefán', 'Árni', 'Björn', 'Einar'];
  const lastNames = ['Jónsdóttir', 'Sigurðardóttir', 'Guðmundsdóttir', 'Ólafsdóttir', 'Björnsdóttir', 
                    'Jónsson', 'Sigurðsson', 'Guðmundsson', 'Ólafsson', 'Björnsson'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const role = STAFF_ROLES[Math.floor(Math.random() * STAFF_ROLES.length)];
  
  // Generate avatar using placeholder service or default to avatar.svg
  const avatarId = Math.floor(Math.random() * 70) + 1;
  const avatarUrl = `https://i.pravatar.cc/150?img=${avatarId}`;
  
  return {
    id: `staff-${index + 1}`,
    name: `${firstName} ${lastName}`,
    role: role,
    avatar: avatarUrl
  };
};

/**
 * Generate a random shift for a day
 * @returns {Object|null} A shift object or null (no shift)
 */
const generateRandomShift = () => {
  // 80% chance of having a shift, 20% chance of no shift
  if (Math.random() > 0.8) {
    return null;
  }
  
  const shiftKeys = Object.keys(SHIFT_TYPES);
  const randomShiftType = shiftKeys[Math.floor(Math.random() * shiftKeys.length)];
  
  // Sick and holiday shifts are less common
  if ((randomShiftType === 'SICK' || randomShiftType === 'HOLIDAY') && Math.random() > 0.3) {
    // Try again with only regular shifts
    const regularShifts = shiftKeys.filter(key => key !== 'SICK' && key !== 'HOLIDAY');
    const regularShiftType = regularShifts[Math.floor(Math.random() * regularShifts.length)];
    return SHIFT_TYPES[regularShiftType];
  }
  
  return SHIFT_TYPES[randomShiftType];
};

/**
 * Generates shifts for a staff member for the entire week
 * @returns {Array} Array of shift objects or null values for each day
 */
const generateWeeklyShifts = () => {
  const shifts = [];
  
  // Generate a shift pattern that makes sense (not working every day)
  for (let i = 0; i < 7; i++) {
    shifts.push(generateRandomShift());
  }
  
  return shifts;
};

/**
 * Generates a list of staff with their weekly shifts
 * @param {number} count Number of staff members to generate
 * @returns {Array} Array of staff objects with weekly shifts
 */
const generateStaffSchedule = (count = 10) => {
  const staffList = [];
  
  for (let i = 0; i < count; i++) {
    const staff = generateStaffMember(i);
    staff.shifts = generateWeeklyShifts();
    staffList.push(staff);
  }
  
  return staffList;
};

/**
 * Format a date as a string in Icelandic format
 * @param {Date} date The date to format
 * @returns {string} Formatted date string (e.g., "7. maí, 2025")
 */
const formatDate = (date) => {
  // Icelandic month names
  const monthNames = [
    'janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 
    'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'
  ];
  
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}. ${month}, ${year}`;
};

/**
 * Gets the date for a specific day of the current week
 * @param {number} dayOffset Days to offset from start of week (0 = Monday)
 * @param {Date} weekStartDate Optional specific week start date
 * @returns {Date} The date for that day
 */
const getDateForDay = (dayOffset, weekStartDate = null) => {
  // Default to current date if no week start date provided
  let baseDate = weekStartDate || new Date();
  
  // Get Monday of the current week
  const day = baseDate.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
  baseDate = new Date(baseDate.setDate(diff));
  
  // Add the offset to get the correct day
  return new Date(baseDate.setDate(baseDate.getDate() + dayOffset));
};

/**
 * Checks if a date is today
 * @param {Date} date The date to check
 * @returns {boolean} True if the date is today
 */
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

/**
 * Updates the current week display in Icelandic format
 * @param {Date} weekStart The starting date of the week
 */
const updateCurrentWeekDisplay = (weekStart) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  // Icelandic month names
  const monthNames = [
    'janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 
    'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'
  ];
  
  const startDay = weekStart.getDate();
  const startMonth = monthNames[weekStart.getMonth()];
  
  const endDay = weekEnd.getDate();
  const endMonth = monthNames[weekEnd.getMonth()];
  const endYear = weekEnd.getFullYear();
  
  document.getElementById('current-week').textContent = `${startDay}. ${startMonth} - ${endDay}. ${endMonth}, ${endYear}`;
  document.getElementById('current-date').textContent = formatDate(new Date());
};

// ===== Main Schedule Rendering =====

/**
 * Render the schedule table for the given staff and date range
 * @param {Array} staffList Array of staff objects with shifts
 * @param {Date} weekStartDate The starting date of the week to display
 */
const renderScheduleTable = (staffList, weekStartDate) => {
  const scheduleContainer = document.getElementById('schedule-container');
  scheduleContainer.innerHTML = '';
  
  // Create table structure
  const table = document.createElement('table');
  table.className = 'schedule-table';
  
  // Create header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  // Add staff name header cell
  const staffHeader = document.createElement('th');
  staffHeader.className = 'staff-header';
  staffHeader.textContent = 'Starfsfólk';
  headerRow.appendChild(staffHeader);
  
  // Add day headers
  for (let i = 0; i < 7; i++) {
    const date = getDateForDay(i, weekStartDate);
    const dayHeader = document.createElement('th');
    
    const dayOfWeek = DAYS_OF_WEEK[i];
    const dateNum = date.getDate();
    
    // Mark today's column
    if (isToday(date)) {
      dayHeader.classList.add('today');
    }
    
    dayHeader.innerHTML = `
      <span class="day-name">${dayOfWeek}</span>
      <span class="day-date">${dateNum}</span>
    `;
    
    headerRow.appendChild(dayHeader);
  }
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create table body
  const tbody = document.createElement('tbody');
  
  // Add staff rows
  staffList.forEach(staff => {
    const staffRow = document.createElement('tr');
    
    // Staff name cell (first column)
    const staffCell = document.createElement('td');
    staffCell.className = 'staff-cell';
    staffCell.innerHTML = `
      <div class="staff-info">
        <div class="staff-avatar">
          <img src="${staff.avatar}" alt="${staff.name}" />
        </div>
        <div class="staff-details">
          <div class="staff-name">${staff.name}</div>
          <div class="staff-role">${staff.role}</div>
        </div>
      </div>
    `;
    staffRow.appendChild(staffCell);
    
    // Add shift cells for each day
    for (let i = 0; i < 7; i++) {
      const shiftCell = document.createElement('td');
      const date = getDateForDay(i, weekStartDate);
      
      // Mark today's cells
      if (isToday(date)) {
        shiftCell.classList.add('today');
      }
      
      const shift = staff.shifts[i];
      
      if (shift) {
        shiftCell.innerHTML = `
          <div class="shift-display ${shift.class}" data-shift-type="${shift.class}">
            ${shift.label}
          </div>
        `;
      }
      
      staffRow.appendChild(shiftCell);
    }
    
    tbody.appendChild(staffRow);
  });
  
  table.appendChild(tbody);
  scheduleContainer.appendChild(table);
};

/**
 * Initialize the schedule page
 */
const initSchedulePage = () => {
  // Set up the current date
  const today = new Date();
  let currentWeekStart = getDateForDay(0); // Monday of current week
  
  // Generate random staff schedule (5-10 staff members)
  const staffCount = Math.floor(Math.random() * 6) + 5; // 5-10 staff
  const staffSchedule = generateStaffSchedule(staffCount);
  
  // Render the initial schedule
  renderScheduleTable(staffSchedule, currentWeekStart);
  updateCurrentWeekDisplay(currentWeekStart);
  
  // Set up week navigation
  document.getElementById('prev-week').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderScheduleTable(staffSchedule, currentWeekStart);
    updateCurrentWeekDisplay(currentWeekStart);
  });
  
  document.getElementById('next-week').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderScheduleTable(staffSchedule, currentWeekStart);
    updateCurrentWeekDisplay(currentWeekStart);
  });
  
  // Set up refresh functionality
  document.getElementById('refresh-schedule').addEventListener('click', () => {
    const newStaffSchedule = generateStaffSchedule(staffCount);
    renderScheduleTable(newStaffSchedule, currentWeekStart);
    
    // Update last updated time
    document.getElementById('last-updated-time').textContent = 'Rétt í þessu';
  });
  
  // Set up optimize button (placeholder functionality)
  document.getElementById('optimize-schedule').addEventListener('click', () => {
    // For now, just show a simple alert - in a real app, this would integrate with AI
    alert('Gervigreind myndi betrumbæta vaktaskráningu hér í raunverulegri útgáfu.');
  });
  
  // Set up print button
  document.getElementById('print-schedule').addEventListener('click', () => {
    window.print();
  });
  
  // Set up export button (placeholder)
  document.getElementById('export-schedule').addEventListener('click', () => {
    alert('Útflutningsaðgerð yrði útfærð hér í raunverulegum notkunarfalli.');
  });
};

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initSchedulePage);

// Export functions for potential use by other modules
export {
  renderScheduleTable,
  generateStaffSchedule,
  updateCurrentWeekDisplay
};