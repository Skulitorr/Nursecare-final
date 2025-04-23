import { checkAuthorization } from './common.js';

function initializeSettings() {
    setupSettingsForms();
    setupRoleManagement();
    loadCurrentSettings();
}

function setupSettingsForms() {
    const forms = document.querySelectorAll('[data-settings-form]');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            saveSettings(form.id, Object.fromEntries(formData));
        });
    });
}

function setupRoleManagement() {
    const roleSection = document.querySelector('[data-role-management]');
    if (!roleSection) return;

    // Only show role management for admin
    roleSection.setAttribute('data-requires-permission', 'manage_roles');

    const addRoleBtn = document.querySelector('[data-action="add-role"]');
    if (addRoleBtn) {
        addRoleBtn.addEventListener('click', () => {
            // Add new role UI
        });
    }
}

function loadCurrentSettings() {
    // Load general settings
    const generalForm = document.getElementById('general-settings');
    if (generalForm) {
        const settings = {
            siteName: 'NurseCare',
            language: 'is',
            timeZone: 'Atlantic/Reykjavik',
            theme: 'light'
        };
        
        Object.entries(settings).forEach(([key, value]) => {
            const input = generalForm.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        });
    }

    // Load notification settings
    const notificationForm = document.getElementById('notification-settings');
    if (notificationForm) {
        const settings = {
            emailNotifications: true,
            pushNotifications: true,
            notificationSound: true
        };
        
        Object.entries(settings).forEach(([key, value]) => {
            const input = notificationForm.querySelector(`[name="${key}"]`);
            if (input) {
                input.checked = value;
            }
        });
    }
}

function saveSettings(formId, settings) {
    // Save settings based on form ID
    switch (formId) {
        case 'general-settings':
            saveGeneralSettings(settings);
            break;
        case 'notification-settings':
            saveNotificationSettings(settings);
            break;
        case 'role-settings':
            saveRoleSettings(settings);
            break;
    }
}

function saveGeneralSettings(settings) {
    // Save general settings
    localStorage.setItem('generalSettings', JSON.stringify(settings));
    showSaveSuccess();
}

function saveNotificationSettings(settings) {
    // Save notification settings
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    showSaveSuccess();
}

function saveRoleSettings(settings) {
    // Save role settings - requires manage_roles permission
    if (document.querySelector('[data-role-management]').classList.contains('permission-disabled')) {
        return;
    }
    localStorage.setItem('roleSettings', JSON.stringify(settings));
    showSaveSuccess();
}

function showSaveSuccess() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.textContent = 'Settings saved successfully';
    document.querySelector('.settings-container').appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Only initialize if authorized
if (checkAuthorization()) {
    document.addEventListener('DOMContentLoaded', initializeSettings);
}