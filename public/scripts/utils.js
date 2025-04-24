// Utility functions for NurseCare dashboard

// Format date to Icelandic locale
export function formatDate(date) {
    return date.toLocaleDateString('is-IS', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time to Icelandic locale
export function formatTime(date) {
    return date.toLocaleTimeString('is-IS', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show toast notification
export function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Add fade in animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    });
}

// Get toast icon based on type
function getToastIcon(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-times-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        default:
            return 'fa-info-circle';
    }
}

// Format number with Icelandic locale
export function formatNumber(number, minimumFractionDigits = 0) {
    return number.toLocaleString('is-IS', {
        minimumFractionDigits,
        maximumFractionDigits: minimumFractionDigits
    });
}

// Debounce function
export function debounce(func, wait) {
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

// Throttle function
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Get greeting based on time of day
export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Góðan morgun';
    if (hour < 18) return 'Góðan dag';
    return 'Gott kvöld';
}

// Format timestamp as relative time
export function getRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Rétt í þessu';
    if (minutes < 60) return `Fyrir ${minutes} mínútum síðan`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Fyrir ${hours} klst síðan`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Í gær';
    if (days < 7) return `Fyrir ${days} dögum`;
    
    return formatDate(date);
}

// Safe JSON parse
export function safeJSONParse(str, fallback = null) {
    try {
        return JSON.parse(str);
    } catch {
        return fallback;
    }
}

// Get chart colors based on theme
export function getChartColors(isDark = false) {
    return {
        primary: '#3a86ff',
        secondary: '#4361ee',
        success: '#2ec4b6',
        warning: '#ff9f1c',
        danger: '#e71d36',
        info: '#4cc9f0',
        text: isDark ? '#e2e8f0' : '#333333',
        grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    };
}

// Initialize theme based on user preference
export function initializeTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        return true;
    }
    return false;
}

// Animate number change
export function animateNumber(element, start, end, duration = 1000) {
    if (!element) return;
    
    const startTime = performance.now();
    const change = end - start;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const value = Math.floor(start + (change * progress));
        element.textContent = formatNumber(value);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get contrast color (for accessibility)
export function getContrastColor(hexcolor) {
    const r = parseInt(hexcolor.substring(1,3),16);
    const g = parseInt(hexcolor.substring(3,5),16);
    const b = parseInt(hexcolor.substring(5,7),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}