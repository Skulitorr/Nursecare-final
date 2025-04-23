import { checkAuthorization } from './common.js';

function initializeStaff() {
    setupStaffList();
    setupStaffFilters();
    setupStaffActions();
}

function setupStaffList() {
    const staffList = document.querySelector('[data-staff-list]');
    if (!staffList) return;

    // Demo staff data - in real app, fetch from backend
    const staffMembers = [
        { id: 1, name: 'Anna Sigurðardóttir', role: 'nurse', shift: 'morning' },
        { id: 2, name: 'Jón Jónsson', role: 'staff', shift: 'evening' },
        { id: 3, name: 'Sara Björnsdóttir', role: 'inventory', shift: 'morning' }
    ];

    staffMembers.forEach(staff => {
        const element = createStaffElement(staff);
        staffList.appendChild(element);
    });
}

function createStaffElement(staff) {
    const element = document.createElement('div');
    element.className = 'staff-item';
    element.setAttribute('data-staff-id', staff.id);
    
    element.innerHTML = `
        <div class="staff-info">
            <h3>${staff.name}</h3>
            <span class="staff-role">${staff.role}</span>
            <span class="staff-shift">Shift: ${staff.shift}</span>
        </div>
        <div class="staff-actions">
            <button data-action="view">View</button>
            <button data-action="edit" data-requires-permission="edit_user">Edit</button>
            <button data-action="delete" data-requires-permission="delete_user">Delete</button>
        </div>
    `;

    return element;
}

function setupStaffFilters() {
    const filterForm = document.querySelector('[data-staff-filters]');
    if (!filterForm) return;

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Handle filter submission
        const filters = new FormData(filterForm);
        filterStaffList(Object.fromEntries(filters));
    });
}

function setupStaffActions() {
    document.addEventListener('click', (e) => {
        const actionButton = e.target.closest('[data-action]');
        if (!actionButton) return;

        const action = actionButton.getAttribute('data-action');
        const staffId = actionButton.closest('[data-staff-id]')?.getAttribute('data-staff-id');
        
        if (staffId) {
            handleStaffAction(action, staffId);
        }
    });
}

function handleStaffAction(action, staffId) {
    switch (action) {
        case 'view':
            viewStaffMember(staffId);
            break;
        case 'edit':
            editStaffMember(staffId);
            break;
        case 'delete':
            deleteStaffMember(staffId);
            break;
    }
}

function filterStaffList(filters) {
    // Apply filters to staff list
}

function viewStaffMember(id) {
    // View staff member details
}

function editStaffMember(id) {
    // Edit staff member details
}

function deleteStaffMember(id) {
    // Delete staff member
    if (confirm('Are you sure you want to delete this staff member?')) {
        // Perform deletion
    }
}

// Only initialize if authorized
if (checkAuthorization()) {
    document.addEventListener('DOMContentLoaded', initializeStaff);
}