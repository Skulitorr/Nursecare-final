import { checkAuthorization } from './common.js';

function initializePatients() {
    setupPatientList();
    setupPatientFilters();
    setupPatientActions();
}

function setupPatientList() {
    const patientList = document.querySelector('[data-patient-list]');
    if (!patientList) return;

    // Demo patient data - in real app, fetch from backend
    const patients = [
        { id: 1, name: 'John Doe', status: 'active', room: '101' },
        { id: 2, name: 'Jane Smith', status: 'discharged', room: '205' },
        // Add more demo patients
    ];

    patients.forEach(patient => {
        const element = createPatientElement(patient);
        patientList.appendChild(element);
    });
}

function createPatientElement(patient) {
    const element = document.createElement('div');
    element.className = 'patient-item';
    element.setAttribute('data-patient-id', patient.id);
    
    element.innerHTML = `
        <div class="patient-info">
            <h3>${patient.name}</h3>
            <span class="patient-status ${patient.status}">${patient.status}</span>
            <span class="patient-room">Room: ${patient.room}</span>
        </div>
        <div class="patient-actions">
            <button data-action="view" data-requires-permission="view_patients">View</button>
            <button data-action="edit" data-requires-permission="manage_patients">Edit</button>
        </div>
    `;

    return element;
}

function setupPatientFilters() {
    const filterForm = document.querySelector('[data-patient-filters]');
    if (!filterForm) return;

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Handle filter submission
    });
}

function setupPatientActions() {
    document.addEventListener('click', (e) => {
        const actionButton = e.target.closest('[data-action]');
        if (!actionButton) return;

        const action = actionButton.getAttribute('data-action');
        const patientId = actionButton.closest('[data-patient-id]')?.getAttribute('data-patient-id');
        
        if (patientId) {
            handlePatientAction(action, patientId);
        }
    });
}

function handlePatientAction(action, patientId) {
    switch (action) {
        case 'view':
            viewPatient(patientId);
            break;
        case 'edit':
            editPatient(patientId);
            break;
    }
}

function viewPatient(id) {
    // View patient details
}

function editPatient(id) {
    // Edit patient details
}

// Only initialize if authorized
if (checkAuthorization()) {
    document.addEventListener('DOMContentLoaded', initializePatients);
}