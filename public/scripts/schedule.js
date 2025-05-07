/**
 * schedule.js - Icelandic nursing home shift scheduling functionality
 * NurseCare AI - Shift scheduling system for Icelandic nursing homes
 * 
 * This module handles:
 * - Rendering a 7-day week schedule table with Icelandic day names
 * - Random generation of mock shifts with appropriate color coding
 * - Responsive layout with sticky first column for staff names
 * 
 * EMERGENCY FIX: Added robust rendering with fallback styling and debug logging
 */

console.log("Schedule.js loaded - Starting initialization");

// Wait for DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOMContentLoaded event fired - Starting schedule initialization");
  initSchedulePage();
});

/**
 * Initialize the schedule page with guaranteed rendering
 */
function initSchedulePage() {
  console.log("Initializing schedule page with robust rendering");
  
  try {
    // Basic configuration data
    console.log("Preparing mock data for schedule");
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
    
    // Color mapping for shifts - used for both CSS classes and inline styles as fallback
    const shiftColors = {
      "08–16": "#4CAF50", // green
      "13–21": "#2196F3", // blue
      "21–08": "#9C27B0", // purple
      "HL": "#FFC107",    // yellow
      "Veikur": "#F44336" // red
    };
    
    console.log("Mock data prepared:", {staff, days, shifts, shiftColors});
    
    // Find schedule container - with error handling
    const scheduleContainer = document.getElementById('schedule-container');
    
    if (!scheduleContainer) {
      console.error("CRITICAL ERROR: #schedule-container not found in DOM. Creating a fallback container.");
      
      // Create emergency container if missing
      const mainContent = document.querySelector('main') || document.body;
      const emergencyContainer = document.createElement('div');
      emergencyContainer.id = 'schedule-container';
      emergencyContainer.style.margin = '20px auto';
      emergencyContainer.style.maxWidth = '1200px';
      emergencyContainer.style.overflowX = 'auto';
      mainContent.appendChild(emergencyContainer);
      
      console.log("Emergency container created and appended to:", mainContent);
      
      // Try to get the container again
      renderScheduleTable(staff, days, shifts, shiftColors, emergencyContainer);
    } else {
      console.log("Schedule container found, proceeding with rendering");
      renderScheduleTable(staff, days, shifts, shiftColors, scheduleContainer);
    }
    
    // Set up event listeners
    console.log("Setting up event listeners");
    setupEventListeners();
    
    // Set current date in the week display
    console.log("Updating current week display");
    updateCurrentWeekDisplay();
    
    console.log("Schedule initialization complete");
  } catch (error) {
    console.error("CRITICAL ERROR during schedule initialization:", error);
    displayEmergencyFallback();
  }
}

/**
 * Renders the schedule table with random shift assignments and guaranteed styling
 * 
 * @param {Array} staff - List of staff names
 * @param {Array} days - List of days of the week
 * @param {Array} shifts - List of possible shift types
 * @param {Object} shiftColors - Color mapping for each shift type
 * @param {HTMLElement} container - Container element to render into
 */
function renderScheduleTable(staff, days, shifts, shiftColors, container) {
  console.log("Rendering schedule grid...");
  console.log("Target container:", container);

  try {
    // Create table element with inline styles as fallback
    const table = document.createElement('table');
    table.className = 'schedule-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontFamily = 'system-ui, Arial, sans-serif';
    table.style.marginBottom = '20px';
    table.style.border = '1px solid #e0e0e0';
    
    console.log("Created table element:", table);
    
    // Create table header
    const thead = document.createElement('thead');
    thead.style.backgroundColor = '#f4f4f4';
    const headerRow = document.createElement('tr');
    
    // Add staff column header
    const staffHeader = document.createElement('th');
    staffHeader.textContent = 'Starfsfólk';
    staffHeader.style.padding = '10px';
    staffHeader.style.textAlign = 'left';
    staffHeader.style.fontWeight = 'bold';
    staffHeader.style.borderBottom = '1px solid #e0e0e0';
    staffHeader.style.position = 'sticky';
    staffHeader.style.left = '0';
    staffHeader.style.backgroundColor = '#f4f4f4';
    staffHeader.style.zIndex = '2';
    headerRow.appendChild(staffHeader);
    
    // Add day headers
    days.forEach(day => {
      const th = document.createElement('th');
      th.textContent = day;
      th.style.padding = '10px';
      th.style.textAlign = 'center';
      th.style.fontWeight = 'bold';
      th.style.borderBottom = '1px solid #e0e0e0';
      th.style.borderLeft = '1px solid #e0e0e0';
      
      // Highlight current day
      if (day === "Mið") {
        th.style.backgroundColor = '#e8f5e9';
      }
      
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    console.log("Created table header with days:", days);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Generate and log shift data for debugging
    const mockScheduleData = [];
    
    // Add staff rows
    staff.forEach(staffMember => {
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #e0e0e0';
      
      // Prepare row data for logging
      const rowData = {
        staff: staffMember,
        shifts: []
      };
      
      // Add staff name cell
      const nameCell = document.createElement('td');
      nameCell.textContent = staffMember;
      nameCell.style.padding = '10px';
      nameCell.style.fontWeight = '500';
      nameCell.style.borderRight = '1px solid #e0e0e0';
      nameCell.style.position = 'sticky';
      nameCell.style.left = '0';
      nameCell.style.backgroundColor = 'white';
      nameCell.style.zIndex = '1';
      row.appendChild(nameCell);
      
      // Add shift cells for each day
      days.forEach(day => {
        const td = document.createElement('td');
        td.style.padding = '10px';
        td.style.textAlign = 'center';
        td.style.borderRight = '1px solid #e0e0e0';
        
        // Highlight today's cells (Wednesday)
        if (day === "Mið") {
          td.style.backgroundColor = 'rgba(232, 245, 233, 0.4)';
        }
        
        // Randomly determine if there's a shift (85% chance)
        if (Math.random() < 0.85) {
          // Randomly select a shift type
          const shiftIndex = Math.floor(Math.random() * shifts.length);
          const shiftType = shifts[shiftIndex];
          
          // Record shift for logging
          rowData.shifts.push({day, shift: shiftType});
          
          // Create shift display element with both CSS class and inline style as fallback
          const shiftCell = document.createElement('div');
          shiftCell.className = `shift-cell shift-${shiftType.replace('–', '-')}`;
          shiftCell.textContent = shiftType;
          
          // Apply guaranteed styling
          shiftCell.style.padding = '6px';
          shiftCell.style.borderRadius = '4px';
          shiftCell.style.fontWeight = '600';
          shiftCell.style.display = 'inline-block';
          shiftCell.style.minWidth = '65px';
          
          // Apply appropriate color based on shift type
          shiftCell.style.backgroundColor = shiftColors[shiftType] || '#888888';
          
          // Set text color based on background for better contrast
          if (shiftType === "HL") {
            shiftCell.style.color = '#333333'; // Dark text on yellow
          } else {
            shiftCell.style.color = '#ffffff'; // White text on other colors
          }
          
          td.appendChild(shiftCell);
        } else {
          rowData.shifts.push({day, shift: null});
        }
        
        row.appendChild(td);
      });
      
      mockScheduleData.push(rowData);
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Log generated schedule data for debugging
    console.log("Generated mock schedule data:", mockScheduleData);
    
    // Clear container and append table
    console.log("Clearing container and inserting table");
    container.innerHTML = '';
    container.appendChild(table);
    
    // Ensure scrollability if table is wide
    container.style.overflowX = 'auto';
    container.style.display = 'block';
    
    console.log("Schedule table successfully rendered");
  } catch (error) {
    console.error("CRITICAL ERROR during table rendering:", error);
    displayEmergencyFallback(container);
  }
}

/**
 * Setup event listeners for buttons and interactive elements
 */
function setupEventListeners() {
  try {
    // Previous week button
    const prevWeekBtn = document.getElementById('prev-week');
    if (prevWeekBtn) {
      prevWeekBtn.addEventListener('click', () => {
        console.log("Previous week button clicked");
        refreshSchedule();
      });
    } else {
      console.warn("Previous week button not found");
    }
    
    // Next week button
    const nextWeekBtn = document.getElementById('next-week');
    if (nextWeekBtn) {
      nextWeekBtn.addEventListener('click', () => {
        console.log("Next week button clicked");
        refreshSchedule();
      });
    } else {
      console.warn("Next week button not found");
    }
    
    // AI optimize button
    const aiOptimizeBtn = document.getElementById('ai-optimize-btn');
    if (aiOptimizeBtn) {
      aiOptimizeBtn.addEventListener('click', () => {
        console.log("AI optimize button clicked");
        alert('Gervigreind er að betrumbæta vaktaskipulagið...');
      });
    } else {
      console.warn("AI optimize button not found");
    }
    
    console.log("Event listeners setup complete");
  } catch (error) {
    console.error("Error setting up event listeners:", error);
  }
}

/**
 * Refresh the schedule with new random data
 */
function refreshSchedule() {
  console.log("Refreshing schedule with new random data");
  initSchedulePage();
}

/**
 * Update the current week display with proper Icelandic date format
 */
function updateCurrentWeekDisplay() {
  try {
    const currentWeekElement = document.getElementById('current-week');
    if (!currentWeekElement) {
      console.warn("Current week element not found");
      return;
    }
    
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
    console.log("Updated current week display:", currentWeekElement.textContent);
  } catch (error) {
    console.error("Error updating current week display:", error);
  }
}

/**
 * Display an emergency fallback table when everything else fails
 * This is the last resort to ensure at least something displays
 * 
 * @param {HTMLElement} container - Container to render into, defaults to document.body
 */
function displayEmergencyFallback(container) {
  console.log("EMERGENCY FALLBACK: Creating basic HTML table");
  
  const targetContainer = container || document.body;
  
  // Basic staff and shifts data
  const staff = ["Helga J.", "Jón G.", "Sigrún M.", "Eva B.", "María Þ."];
  const days = ["Mán", "Þri", "Mið", "Fim", "Fös", "Lau", "Sun"];
  
  // Create a basic HTML table with inline styles
  let emergencyHTML = `
    <div style="margin:20px; padding:15px; border:2px solid #ff6b6b; background-color:#fff5f5; border-radius:5px;">
      <h3 style="color:#d32f2f; margin-top:0;">⚠️ Neyðarútgáfa vaktaplans</h3>
      <p style="margin-bottom:15px;">Villa kom upp við að birta vaktaplan. Hér er einfalt yfirlit:</p>
    </div>
    <div style="overflow-x:auto; margin:15px 0;">
      <table style="width:100%; border-collapse:collapse; font-family:system-ui, Arial, sans-serif; border:1px solid #ccc;">
        <thead>
          <tr style="background-color:#f4f4f4;">
            <th style="padding:10px; text-align:left; border:1px solid #ccc;">Starfsfólk</th>
  `;
  
  // Add day headers
  days.forEach(day => {
    emergencyHTML += `<th style="padding:10px; text-align:center; border:1px solid #ccc;">${day}</th>`;
  });
  
  emergencyHTML += `</tr></thead><tbody>`;
  
  // Add staff rows with random shifts
  const shiftTypes = ["08–16", "13–21", "21–08", "HL", "Veikur"];
  const shiftColors = {
    "08–16": "#4CAF50",
    "13–21": "#2196F3",
    "21–08": "#9C27B0",
    "HL": "#FFC107",
    "Veikur": "#F44336"
  };
  
  staff.forEach(person => {
    emergencyHTML += `<tr style="border-bottom:1px solid #ccc;">
      <td style="padding:10px; font-weight:500; border-right:1px solid #ccc;">${person}</td>`;
    
    days.forEach(day => {
      const hasShift = Math.random() < 0.8;
      let cellContent = "&nbsp;";
      
      if (hasShift) {
        const shift = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
        const color = shiftColors[shift];
        const textColor = shift === "HL" ? "#333" : "#fff";
        
        cellContent = `<div style="background-color:${color}; color:${textColor}; padding:6px; border-radius:4px; display:inline-block; min-width:65px; font-weight:600;">${shift}</div>`;
      }
      
      emergencyHTML += `<td style="padding:8px; text-align:center; border-right:1px solid #ccc;">${cellContent}</td>`;
    });
    
    emergencyHTML += `</tr>`;
  });
  
  emergencyHTML += `</tbody></table></div>`;
  
  // Insert emergency table
  console.log("Inserting emergency fallback HTML table");
  targetContainer.innerHTML = emergencyHTML;
}