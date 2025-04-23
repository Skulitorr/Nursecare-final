// Notifications module for real-time alerts and updates
import { showToast } from './utils.js';
import { getCurrentUser } from './auth.js';

// Notification types and their properties
const NOTIFICATION_TYPES = {
    INFO: {
        icon: 'info-circle',
        color: '#3b82f6',
        sound: 'notification-info.mp3'
    },
    SUCCESS: {
        icon: 'check-circle',
        color: '#10b981',
        sound: 'notification-success.mp3'
    },
    WARNING: {
        icon: 'exclamation-triangle',
        color: '#f59e0b',
        sound: 'notification-warning.mp3'
    },
    ERROR: {
        icon: 'exclamation-circle',
        color: '#ef4444',
        sound: 'notification-error.mp3'
    },
    SCHEDULE: {
        icon: 'calendar-alt',
        color: '#8b5cf6',
        sound: 'notification-schedule.mp3'
    },
    CHAT: {
        icon: 'comment-alt',
        color: '#6366f1',
        sound: 'notification-chat.mp3'
    }
};

// Priority levels
const PRIORITY = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    URGENT: 3
};

// Store notifications in memory
let notifications = [];
let unreadCount = 0;
let notificationListeners = new Set();
let soundEnabled = true;

/**
 * Initialize notifications system
 */
export function initializeNotifications() {
    setupNotificationCenter();
    loadSavedNotifications();
    setupEventListeners();
    
    // Request notification permission if needed
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

/**
 * Send a notification to a specific user
 * @param {string} userId - Target user ID
 * @param {string} message - Notification message
 * @param {string} type - Notification type (from NOTIFICATION_TYPES)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Created notification
 */
export async function notify(userId, message, type = 'INFO', options = {}) {
    try {
        const notification = {
            id: generateNotificationId(),
            userId,
            message,
            type: type.toUpperCase(),
            priority: options.priority || PRIORITY.NORMAL,
            data: options.data || {},
            timestamp: new Date(),
            read: false
        };

        // Add to notifications array
        notifications.push(notification);
        updateUnreadCount();

        // Show browser notification if enabled
        if (Notification.permission === 'granted' && notification.priority >= PRIORITY.HIGH) {
            const notifType = NOTIFICATION_TYPES[notification.type];
            new Notification('NurseCare AI', {
                body: notification.message,
                icon: `/assets/icons/${notifType.icon}.svg`,
                tag: notification.id
            });
        }

        // Play sound if enabled and not muted
        if (soundEnabled && options.sound !== false) {
            playNotificationSound(notification.type);
        }

        // Show toast for high priority notifications
        if (notification.priority >= PRIORITY.HIGH) {
            showToast(notification.message, notification.type.toLowerCase());
        }

        // Push to UI if it's for current user
        if (userId === getCurrentUser()?.id) {
            pushToUI(notification);
        }

        // Notify listeners
        notifyListeners(notification);

        // Save to storage
        saveNotifications();

        return notification;
    } catch (error) {
        console.error('Error sending notification:', error);
        throw new Error('Failed to send notification');
    }
}

/**
 * Push a notification to the UI
 * @param {Object} notification - Notification object
 */
export function pushToUI(notification) {
    const container = document.querySelector('.notifications-list');
    if (!container) return;

    const notifType = NOTIFICATION_TYPES[notification.type];
    const element = document.createElement('div');
    element.className = 'notification-item';
    element.setAttribute('data-id', notification.id);
    if (!notification.read) element.classList.add('unread');

    element.innerHTML = `
        <div class="notification-icon" style="background-color: ${notifType.color}">
            <i class="fas fa-${notifType.icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-message">${notification.message}</div>
            <div class="notification-meta">
                <span class="notification-time">${formatTimestamp(notification.timestamp)}</span>
                ${notification.priority >= PRIORITY.HIGH ? `
                    <span class="notification-priority">
                        <i class="fas fa-exclamation-circle"></i>
                    </span>
                ` : ''}
            </div>
        </div>
        <div class="notification-actions">
            <button class="mark-read" title="Merkja sem lesið">
                <i class="fas fa-check"></i>
            </button>
            <button class="delete-notification" title="Eyða">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Add click handlers
    element.querySelector('.mark-read').addEventListener('click', (e) => {
        e.stopPropagation();
        markAsRead(notification.id);
    });

    element.querySelector('.delete-notification').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNotification(notification.id);
    });

    // Insert at top
    container.insertBefore(element, container.firstChild);
}

/**
 * Get unread notifications for a user
 * @param {string} userId - User ID
 * @returns {Array} Unread notifications
 */
export function getUnread(userId) {
    return notifications.filter(n => 
        n.userId === userId && 
        !n.read
    );
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 */
export function markAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    notification.read = true;
    updateUnreadCount();

    // Update UI
    const element = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
    if (element) {
        element.classList.remove('unread');
    }

    // Save changes
    saveNotifications();
}

/**
 * Setup the notification center UI
 */
function setupNotificationCenter() {
    const container = document.createElement('div');
    container.className = 'notification-center';
    
    container.innerHTML = `
        <div class="notification-header">
            <h3>
                <i class="fas fa-bell"></i>
                Tilkynningar
                <span class="unread-count">0</span>
            </h3>
            <div class="notification-controls">
                <button class="toggle-sound" title="Hljóð">
                    <i class="fas fa-volume-up"></i>
                </button>
                <button class="mark-all-read" title="Merkja allt sem lesið">
                    <i class="fas fa-check-double"></i>
                </button>
                <button class="clear-all" title="Hreinsa allt">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="notifications-list"></div>
    `;

    document.body.appendChild(container);
}

/**
 * Set up notification event listeners
 */
function setupEventListeners() {
    // Sound toggle
    const soundToggle = document.querySelector('.toggle-sound');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            const icon = soundToggle.querySelector('i');
            icon.className = `fas fa-volume-${soundEnabled ? 'up' : 'mute'}`;
            showToast(
                `Tilkynningarhljóð ${soundEnabled ? 'virkt' : 'óvirkt'}`,
                'info'
            );
        });
    }

    // Mark all as read
    const markAllBtn = document.querySelector('.mark-all-read');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
            const userId = getCurrentUser()?.id;
            if (!userId) return;

            notifications
                .filter(n => n.userId === userId && !n.read)
                .forEach(n => markAsRead(n.id));

            showToast('Allt merkt sem lesið', 'success');
        });
    }

    // Clear all
    const clearAllBtn = document.querySelector('.clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            const userId = getCurrentUser()?.id;
            if (!userId) return;

            notifications = notifications.filter(n => n.userId !== userId);
            updateUnreadCount();
            saveNotifications();

            const list = document.querySelector('.notifications-list');
            if (list) list.innerHTML = '';

            showToast('Tilkynningum eytt', 'info');
        });
    }
}

/**
 * Load saved notifications from storage
 */
function loadSavedNotifications() {
    try {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            notifications = JSON.parse(saved).map(n => ({
                ...n,
                timestamp: new Date(n.timestamp)
            }));
            updateUnreadCount();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        notifications = [];
    }
}

/**
 * Save notifications to storage
 */
function saveNotifications() {
    try {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
        console.error('Error saving notifications:', error);
    }
}

/**
 * Update unread notifications count
 */
function updateUnreadCount() {
    const userId = getCurrentUser()?.id;
    if (!userId) return;

    unreadCount = notifications.filter(n => 
        n.userId === userId && !n.read
    ).length;

    // Update UI
    const countElement = document.querySelector('.unread-count');
    if (countElement) {
        countElement.textContent = unreadCount;
        countElement.style.display = unreadCount > 0 ? 'inline' : 'none';
    }

    // Update favicon badge if supported
    updateFaviconBadge(unreadCount);
}

/**
 * Play notification sound
 * @param {string} type - Notification type
 */
function playNotificationSound(type) {
    const notifType = NOTIFICATION_TYPES[type];
    if (!notifType?.sound) return;

    const audio = new Audio(`/assets/sounds/${notifType.sound}`);
    audio.volume = 0.5;
    audio.play().catch(error => {
        console.warn('Error playing notification sound:', error);
    });
}

/**
 * Update favicon badge with unread count
 * @param {number} count - Unread count
 */
function updateFaviconBadge(count) {
    const favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) return;

    if (count > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        // Draw original favicon
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, 32, 32);

            // Draw badge
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(24, 8, 8, 0, 2 * Math.PI);
            ctx.fill();

            // Draw count
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(count > 99 ? '99+' : count.toString(), 24, 8);

            // Update favicon
            favicon.href = canvas.toDataURL('image/png');
        };
        img.src = favicon.href;
    } else {
        // Reset to original favicon
        favicon.href = '/assets/icons/logo.svg';
    }
}

/**
 * Add notification listener
 * @param {Function} callback - Callback function
 */
export function addNotificationListener(callback) {
    notificationListeners.add(callback);
}

/**
 * Remove notification listener
 * @param {Function} callback - Callback function
 */
export function removeNotificationListener(callback) {
    notificationListeners.delete(callback);
}

/**
 * Notify all listeners of a new notification
 * @param {Object} notification - Notification object
 */
function notifyListeners(notification) {
    notificationListeners.forEach(callback => {
        try {
            callback(notification);
        } catch (error) {
            console.error('Error in notification listener:', error);
        }
    });
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 */
function deleteNotification(notificationId) {
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index === -1) return;

    notifications.splice(index, 1);
    updateUnreadCount();
    saveNotifications();

    // Update UI
    const element = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
    if (element) {
        element.classList.add('removing');
        setTimeout(() => element.remove(), 300);
    }
}

/**
 * Format timestamp for display
 * @param {Date} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
        return 'Rétt í þessu';
    } else if (diff < hour) {
        const minutes = Math.floor(diff / minute);
        return `Fyrir ${minutes} mín`;
    } else if (diff < day) {
        const hours = Math.floor(diff / hour);
        return `Fyrir ${hours} klst`;
    } else {
        return timestamp.toLocaleDateString('is-IS', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

/**
 * Generate unique notification ID
 * @returns {string} Notification ID
 */
function generateNotificationId() {
    return 'notif_' + Date.now() + Math.random().toString(36).substr(2, 9);
}