/**
 * schedule.js - Icelandic nursing home shift scheduling functionality
 * NurseCare AI - Shift scheduling system for Icelandic nursing homes
 * 
 * This module handles:
 * - Rendering a 7-day week schedule table with Icelandic day names
 * - Random generation of mock shifts with appropriate color coding
 * - Responsive layout with sticky first column for staff names
 */

// Wait for DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', initSchedulePage);

/**
 * Initialize the schedule page
 */
function initSchedulePage() {
  // Basic configuration data
  const staff = [
    "Helga Jónsdóttir", 
    "Jón Gunnarsson", 
    "Sigrún Magnúsdóttir", 
    "Eva Björnsdóttir", 
    "María Þórðardóttir",
    "Guðrún Pálsdóttir",
    "Ólafur Jóhannesson"
  ];
  
  const days = ["Mán", "Þri", "Mið", "Fim", "Fös", "Lau", "Sun"];
  const shifts = ["08–16", "13–21", "21–08", "HL", "Veikur"];
  
  // Render the schedule table
  renderScheduleTable(staff, days, shifts);
  
  // Set up event listeners
  setupEventListeners();
  
  // Set current date in the week display
  updateCurrentWeekDisplay();
}

/**
 * Renders the schedule table with random shift assignments
 * 
 * @param {Array} staff - List of staff names
 * @param {Array} days - List of days of the week
 * @param {Array} shifts - List of possible shift types
 */
function renderScheduleTable(staff, days, shifts) {
  const scheduleContainer = document.getElementById('schedule-container');
  
  // Create table element
  const table = document.createElement('table');
  table.className = 'schedule-table';
  
  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  // Add staff column header
  const staffHeader = document.createElement('th');
  staffHeader.textContent = 'Starfsfólk';
  headerRow.appendChild(staffHeader);
  
  // Add day headers
  days.forEach(day => {
    const th = document.createElement('th');
    th.textContent = day;
    headerRow.appendChild(th);
    
    // Highlight current day (today is assumed to be Wednesday, "Mið", for demo)
    if (day === "Mið") {
      th.classList.add('today');
    }
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create table body
  const tbody = document.createElement('tbody');
  
  // Add staff rows
  staff.forEach(staffMember => {
    const row = document.createElement('tr');
    
    // Add staff name cell
    const nameCell = document.createElement('td');
    nameCell.textContent = staffMember;
    row.appendChild(nameCell);
    
    // Add shift cells for each day
    days.forEach(day => {
      const td = document.createElement('td');
      
      // Highlight today's cells (Wednesday, "Mið", for demo)
      if (day === "Mið") {
        td.classList.add('today');
      }
      
      // Randomly determine if there's a shift (80% chance)
      if (Math.random() < 0.8) {
        // Randomly select a shift type
        const shiftIndex = Math.floor(Math.random() * shifts.length);
        const shiftType = shifts[shiftIndex];
        
        // Create shift display element
        const shiftCell = document.createElement('div');
        shiftCell.className = `shift-cell shift-${shiftType}`;
        shiftCell.textContent = shiftType;
        
        td.appendChild(shiftCell);
      }
      
      row.appendChild(td);
    });
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  scheduleContainer.appendChild(table);
}

/**
 * Setup event listeners for buttons and interactive elements
 */
function setupEventListeners() {
  // Previous week button
  const prevWeekBtn = document.getElementById('prev-week');
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      // For demo purposes, just simulate a week change by reloading with new random data
      refreshSchedule();
      alert('Hlaðið fyrri viku...');
    });
  }
  
  // Next week button
  const nextWeekBtn = document.getElementById('next-week');
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      // For demo purposes, just simulate a week change by reloading with new random data
      refreshSchedule();
      alert('Hlaðið næstu viku...');
    });
  }
  
  // AI optimize button
  const aiOptimizeBtn = document.getElementById('ai-optimize-btn');
  if (aiOptimizeBtn) {
    aiOptimizeBtn.addEventListener('click', () => {
      alert('Gervigreind er að betrumbæta vaktaskipulagið...\n\nÞessi virkni væri tengd við stærri vélrænt gervigreindarlíkan í fullri útgáfu.');
    });
  }
}

/**
 * Refresh the schedule with new random data
 */
function refreshSchedule() {
  const scheduleContainer = document.getElementById('schedule-container');
  scheduleContainer.innerHTML = '';
  
  initSchedulePage();
}

/**
 * Update the current week display with proper Icelandic date format
 */
function updateCurrentWeekDisplay() {
  const currentWeekElement = document.getElementById('current-week');
  if (!currentWeekElement) return;
  
  // Get current date (May 7, 2025 for demo purposes)
  const currentDate = new Date(2025, 4, 7); // Month is 0-indexed (4 = May)
  
  // Get Monday of the current week
  const day = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
  const monday = new Date(currentDate);
  monday.setDate(diff);
  
  // Get Sunday of the current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  // Icelandic month names
  const monthNames = [
    'janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 
    'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'
  ];
  
  // Format dates in Icelandic style
  const mondayStr = `${monday.getDate()}. ${monthNames[monday.getMonth()]}`;
  const sundayStr = `${sunday.getDate()}. ${monthNames[sunday.getMonth()]} ${sunday.getFullYear()}`;
  
  currentWeekElement.textContent = `${mondayStr} - ${sundayStr}`;
}