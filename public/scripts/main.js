// Main application entry point 
import { initializeUI } from './init.js';
import { initializeCharts, updateChartsForTheme } from './charts.js';
import { validateSession } from './auth.js';
import { initializeNavigation } from './navigation.js';
import { showToast, showLoading, hideLoading } from './utils.js';

// Initialize all dashboard components
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // First validate auth
        if (!validateSession()) {
            return;
        }

        // Initialize core UI components and navigation
        await initializeUI();
        initializeNavigation();
        
        // Initialize page-specific components
        const currentPage = window.location.pathname.split('/').pop()?.replace('.html', '');
        
        // Load charts for dashboard
        if (currentPage === 'dashboard') {
            const chartLoading = showLoading('Loading charts...');
            try {
                await initializeCharts();
                updateChartsForTheme(document.body.classList.contains('dark-mode'));
            } catch (error) {
                console.error('Error initializing charts:', error);
                showToast('error', 'Failed to load charts');
            } finally {
                hideLoading(chartLoading);
            }
        }

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showToast('error', 'Failed to initialize application');
    }
});