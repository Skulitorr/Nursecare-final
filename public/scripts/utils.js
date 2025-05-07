console.log('Utilities Module Loaded');

// Date formatting utilities
export function formatDate(date, format = 'is-IS') {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleDateString(format);
}

export function formatTime(date, format = 'is-IS') {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleTimeString(format);
}

export function formatDateTime(date, format = 'is-IS') {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleString(format);
}

// String utilities
export function truncate(str, length = 50, ending = '...') {
    if (str.length > length) {
        return str.substring(0, length - ending.length) + ending;
    }
    return str;
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Toast and Loading UI utilities
export function showToast(type, message, duration = 3000) {
    const toast = createElement('div', `toast toast-${type}`);
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        fadeOut(toast).then(() => {
            removeElement(toast);
        });
    }, duration);
    
    return toast;
}

export function showLoading(message = 'Loading...') {
    const loadingId = 'loading-' + Math.random().toString(36).substring(2);
    const loadingOverlay = createElement('div', 'loading-overlay', { id: loadingId });
    
    const loadingContainer = createElement('div', 'loading-container');
    const spinner = createElement('div', 'loading-spinner');
    const loadingMessage = createElement('div', 'loading-message');
    loadingMessage.textContent = message;
    
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(loadingMessage);
    loadingOverlay.appendChild(loadingContainer);
    document.body.appendChild(loadingOverlay);
    
    return loadingId;
}

export function hideLoading(loadingId) {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
        fadeOut(loadingElement).then(() => {
            removeElement(loadingElement);
        });
    }
}

// DOM utilities
export function createElement(tag, className = '', attributes = {}) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

export function removeElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

export function fadeIn(element, duration = 300) {
    element.style.opacity = 0;
    element.style.display = 'block';

    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        element.style.opacity = Math.min(progress / duration, 1);
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}

export function fadeOut(element, duration = 300) {
    return new Promise(resolve => {
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            element.style.opacity = Math.max(1 - (progress / duration), 0);
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                resolve();
            }
        }
        requestAnimationFrame(animate);
    });
}

// Form utilities
export function serializeForm(form) {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        // Handle array inputs (multiple select, checkboxes)
        if (key.endsWith('[]')) {
            key = key.slice(0, -2);
            if (!data[key]) {
                data[key] = [];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }
    return data;
}

export function validateForm(form, rules) {
    const errors = {};
    const data = serializeForm(form);

    Object.entries(rules).forEach(([field, fieldRules]) => {
        fieldRules.forEach(rule => {
            const value = data[field];
            
            if (rule.required && !value) {
                errors[field] = 'This field is required';
            } else if (rule.minLength && value.length < rule.minLength) {
                errors[field] = `Minimum length is ${rule.minLength}`;
            } else if (rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `Maximum length is ${rule.maxLength}`;
            } else if (rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.message || 'Invalid format';
            } else if (rule.custom && !rule.custom(value)) {
                errors[field] = rule.message || 'Invalid value';
            }
        });
    });

    return { isValid: Object.keys(errors).length === 0, errors };
}

// Number formatting
export function formatNumber(number, locale = 'is-IS') {
    return new Intl.NumberFormat(locale).format(number);
}

export function formatCurrency(amount, currency = 'ISK', locale = 'is-IS') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Data utilities
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

export function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Local storage utilities
export function setLocalStorage(key, value, expiry = null) {
    const item = {
        value,
        timestamp: Date.now()
    };
    if (expiry) {
        item.expiry = Date.now() + expiry;
    }
    localStorage.setItem(key, JSON.stringify(item));
}

export function getLocalStorage(key) {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    
    return parsed.value;
}

// URL utilities
export function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

export function buildQueryString(params) {
    return Object.entries(params)
        .filter(([_, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

// Color utilities
export function isDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getContrastColor(hexcolor) {
    // Convert hex to RGB
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Device/browser detection utilities
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let version = "Unknown";

    // Detect browser and version
    if (ua.includes("Firefox/")) {
        browser = "Firefox";
        version = ua.split("Firefox/")[1];
    } else if (ua.includes("Chrome/")) {
        browser = "Chrome";
        version = ua.split("Chrome/")[1].split(" ")[0];
    } else if (ua.includes("Safari/")) {
        browser = "Safari";
        version = ua.split("Version/")[1].split(" ")[0];
    } else if (ua.includes("Edge/")) {
        browser = "Edge";
        version = ua.split("Edge/")[1];
    }

    return { browser, version };
}

// Error handling utilities
export function safeJSONParse(str, fallback = null) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error('JSON Parse error:', e);
        return fallback;
    }
}

// Export common regular expressions
export const Patterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^(\+354)?[0-9]{7}$/,
    kennitala: /^[0-9]{6}-?[0-9]{4}$/,
    url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    strongPassword: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
};