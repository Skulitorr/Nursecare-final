import eventBus, { Events } from './event-bus.js';
import { fadeIn, fadeOut } from './utils.js';

console.log('Error Handler Module Loaded');

class ErrorHandler {
    constructor() {
        this.container = null;
        this.timeout = 5000; // Default timeout for error messages
        this.setupErrorHandling();
    }

    initialize() {
        this.createErrorContainer();
        return true;
    }

    setupErrorHandling() {
        // Handle uncaught errors
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            this.handleError(error || msg);
            return false;
        };

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', event => {
            this.handleError(event.reason);
        });

        // Listen for error events
        eventBus.on(Events.ERROR_OCCURRED, this.handleError.bind(this));
    }

    createErrorContainer() {
        if (document.getElementById('error-container')) return;

        const container = document.createElement('div');
        container.id = 'error-container';
        container.innerHTML = `
            <style>
                #error-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: none;
                }
                .error-toast {
                    background-color: #ef4444;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    margin-bottom: 10px;
                    font-family: Inter, system-ui, sans-serif;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    max-width: 400px;
                }
                .error-toast.warning {
                    background-color: #f59e0b;
                }
                .error-toast.info {
                    background-color: #3b82f6;
                }
                .error-icon {
                    margin-right: 10px;
                }
                .error-message {
                    flex-grow: 1;
                }
                .error-close {
                    cursor: pointer;
                    opacity: 0.7;
                    margin-left: 10px;
                }
                .error-close:hover {
                    opacity: 1;
                }
            </style>
        `;

        document.body.appendChild(container);
        this.container = container;
    }

    showError(message, type = 'error', options = {}) {
        if (!this.container) {
            this.initialize();
        }

        const toast = document.createElement('div');
        toast.className = `error-toast ${type}`;
        toast.innerHTML = `
            <span class="error-icon">
                ${this.getIconForType(type)}
            </span>
            <span class="error-message">${this.formatMessage(message)}</span>
            <span class="error-close">×</span>
        `;

        this.container.appendChild(toast);
        fadeIn(this.container);

        // Setup close button
        const closeBtn = toast.querySelector('.error-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        // Auto-remove after timeout unless specified otherwise
        if (!options.persist) {
            setTimeout(() => this.removeToast(toast), options.timeout || this.timeout);
        }

        // Emit error event
        eventBus.emit(Events.ERROR_OCCURRED, {
            message,
            type,
            timestamp: new Date().toISOString()
        });

        return toast;
    }

    showWarning(message, options = {}) {
        return this.showError(message, 'warning', options);
    }

    showInfo(message, options = {}) {
        return this.showError(message, 'info', options);
    }

    async removeToast(toast) {
        await fadeOut(toast);
        toast.remove();

        // Hide container if no more toasts
        if (!this.container.querySelector('.error-toast')) {
            fadeOut(this.container);
        }
    }

    clearAll() {
        if (!this.container) return;

        const toasts = this.container.querySelectorAll('.error-toast');
        toasts.forEach(toast => this.removeToast(toast));
    }

    handleError(error) {
        console.error('Error caught by handler:', error);

        // Extract message from different error types
        const message = this.getErrorMessage(error);

        // Show error toast
        this.showError(message, 'error', {
            persist: this.shouldPersistError(error)
        });

        // Special handling for authentication errors
        if (this.isAuthError(error)) {
            eventBus.emit(Events.AUTH_ERROR, error);
        }
    }

    getErrorMessage(error) {
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        if (error.message) return error.message;
        return 'An unexpected error occurred';
    }

    formatMessage(message) {
        // Sanitize message to prevent XSS
        return message
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    getIconForType(type) {
        switch (type) {
            case 'error':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
            case 'warning':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
            case 'info':
                return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
            default:
                return '';
        }
    }

    shouldPersistError(error) {
        // Keep authentication errors visible until user action
        if (this.isAuthError(error)) return true;

        // Keep network errors visible as they might need user attention
        if (error instanceof TypeError && error.message.includes('network')) return true;

        return false;
    }

    isAuthError(error) {
        if (error.status === 401) return true;
        if (error.name === 'AuthError') return true;
        if (error.message?.toLowerCase().includes('unauthorized')) return true;
        return false;
    }
}

// Create and export singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;