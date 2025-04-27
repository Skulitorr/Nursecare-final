import { initializeUI } from './init.js';
import debug from './debug.js';
import { validatePageAccess } from './roles.js';
import errorHandler from './error-handler.js';

console.log('Page Initialization Module Loaded');

// Page-specific initialization handlers
const pageHandlers = {
    dashboard: async () => {
        const { default: initDashboard } = await import('./dashboard.js');
        return initDashboard();
    },
    patients: async () => {
        const { default: initPatients } = await import('./patients.js');
        return initPatients();
    },
    staff: async () => {
        const { default: initStaff } = await import('./staff.js');
        return initStaff();
    },
    inventory: async () => {
        const { default: initInventory } = await import('./inventory.js');
        return initInventory();
    },
    schedule: async () => {
        const { default: initSchedule } = await import('./schedule.js');
        return initSchedule();
    },
    reports: async () => {
        const { default: initReports } = await import('./reports.js');
        return initReports();
    },
    settings: async () => {
        const { default: initSettings } = await import('./settings.js');
        return initSettings();
    },
    chatbot: async () => {
        const { default: initChatbot } = await import('./chatbot.js');
        return initChatbot();
    }
};

export async function initializePage() {
    console.log('Initializing page...');
    try {
        const metrics = debug.getPageLoadMetrics();
        console.log('Page load metrics:', metrics);

        // Get current page
        const currentPath = window.location.pathname;
        const page = currentPath.replace(/^\/|\/$/g, '').replace('.html', '') || 'dashboard';
        console.log('Current page:', page);

        // Skip auth check for public pages
        if (!['login', 'unauthorized', '404'].includes(page)) {
            // Initialize common UI components
            if (!await initializeUI()) {
                console.log('UI initialization failed');
                return false;
            }

            // Validate page access
            if (!validatePageAccess(page)) {
                console.log('Access denied to page:', page);
                window.location.href = '/unauthorized';
                return false;
            }
        }

        // Initialize page-specific functionality
        if (pageHandlers[page]) {
            console.log(`Initializing ${page} page...`);
            await pageHandlers[page]();
        } else {
            console.log('No specific handler for page:', page);
        }

        // Setup error boundaries
        setupErrorBoundaries();

        return true;
    } catch (error) {
        console.error('Error during page initialization:', error);
        errorHandler.showError('Error initializing page');
        return false;
    }
}

function setupErrorBoundaries() {
    // Setup global error handler for uncaught errors
    window.onerror = (msg, url, lineNo, columnNo, error) => {
        console.error('Global error:', { msg, url, lineNo, columnNo, error });
        errorHandler.showError('An unexpected error occurred');
        return false;
    };

    // Setup handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
        console.error('Unhandled promise rejection:', event.reason);
        errorHandler.showError('An unexpected error occurred');
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);