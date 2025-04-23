// Utilities module

/**
 * Show a toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(title, message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');

    // Get icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }

    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <div class="toast-text">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="toast-progress"></div>
    `;

    // Get or create toast container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    // Add toast to container
    container.appendChild(toast);

    // Setup progress animation
    const progress = toast.querySelector('.toast-progress');
    progress.style.animation = `toast-progress ${duration}ms linear`;

    // Setup close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });

    // Auto remove after duration
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

/**
 * Remove a toast element with animation
 * @param {HTMLElement} toast - Toast element to remove
 */
function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
        
        // Remove container if empty
        const container = document.getElementById('toast-container');
        if (container && !container.hasChildNodes()) {
            container.remove();
        }
    }, 300);
}

/**
 * Show loading overlay
 * @param {string} message - Loading message
 * @returns {HTMLElement} Loading overlay element
 */
export function showLoading(message = 'Hleð...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p class="loading-message">${message}</p>
        </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
}

/**
 * Hide loading overlay
 * @param {HTMLElement} overlay - Loading overlay to hide
 */
export function hideLoading(overlay) {
    if (overlay && overlay.classList.contains('loading-overlay')) {
        overlay.classList.add('hiding');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

/**
 * Format a date
 * @param {Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export function formatDate(date, includeTime = false) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...(includeTime && {
            hour: '2-digit',
            minute: '2-digit'
        })
    };

    return new Intl.DateTimeFormat('is-IS', options).format(date);
}

/**
 * Format time
 * @param {string|Date} time - Time to format
 * @returns {string} Formatted time string
 */
export function formatTime(time) {
    if (typeof time === 'string') {
        // Handle string input (HH:mm)
        return time;
    } else if (time instanceof Date) {
        // Handle Date object
        return time.toLocaleTimeString('is-IS', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return '';
}

/**
 * Format a number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('is-IS').format(num);
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: ISK)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'ISK') {
    return new Intl.NumberFormat('is-IS', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export function getInitials(name) {
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase();
}

/**
 * Check if a date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean} Whether date is in the past
 */
export function isPastDate(date) {
    return new Date(date) < new Date();
}

/**
 * Check if a date is today
 * @param {Date} date - Date to check
 * @returns {boolean} Whether date is today
 */
export function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

/**
 * Add days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Get week number
 * @param {Date} date - Date to get week number for
 * @returns {number} Week number
 */
export function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Calculate age from date of birth
 * @param {Date} dob - Date of birth
 * @returns {number} Age in years
 */
export function calculateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * Check if device is mobile
 * @returns {boolean} Whether device is mobile
 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get browser language
 * @returns {string} Browser language code
 */
export function getBrowserLanguage() {
    return navigator.language || navigator.userLanguage;
}

/**
 * Get operating system
 * @returns {string} Operating system name
 */
export function getOS() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

    if (macosPlatforms.indexOf(platform) !== -1) {
        return 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        return 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        return 'Windows';
    } else if (/Android/.test(userAgent)) {
        return 'Android';
    } else if (/Linux/.test(platform)) {
        return 'Linux';
    }

    return 'Unknown';
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Afritað', 'Texti afritaður á klemmuspjald', 'success');
    } catch (err) {
        console.error('Failed to copy:', err);
        showToast('Villa', 'Ekki tókst að afrita texta', 'error');
    }
}

/**
 * Download data as file
 * @param {string} filename - Name of file
 * @param {string} content - File content
 * @param {string} type - MIME type
 */
export function downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.click();
    
    window.URL.revokeObjectURL(url);
}

/**
 * Parse query string
 * @param {string} queryString - Query string to parse
 * @returns {Object} Parsed query parameters
 */
export function parseQueryString(queryString = window.location.search) {
    const params = new URLSearchParams(queryString);
    const result = {};
    
    for (const [key, value] of params) {
        result[key] = value;
    }
    
    return result;
}

/**
 * Set theme
 * @param {'light'|'dark'} theme - Theme to set
 */
export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Dispatch event for components that need to update
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

/**
 * Get current theme
 * @returns {'light'|'dark'} Current theme
 */
export function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Toggle theme
 */
export function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

/**
 * Initialize theme
 */
export function initTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Check for system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Initialize theme when module loads
initTheme();