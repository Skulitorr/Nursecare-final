import eventBus, { Events } from './event-bus.js';

console.log('Notifications Module Loaded');

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 50;
        this.container = null;
        this.badge = null;
        this.menu = null;
        this.setupEventListeners();
    }

    initialize() {
        console.log('Initializing notification manager...');
        this.container = document.getElementById('notifications-menu');
        this.badge = document.querySelector('.notifications-btn .badge');
        this.menu = document.getElementById('notifications-menu');
        
        if (!this.container || !this.badge) {
            console.warn('Notification elements not found');
            return false;
        }

        this.loadStoredNotifications();
        this.setupUIHandlers();
        return true;
    }

    setupEventListeners() {
        // Listen for various events that should trigger notifications
        eventBus.on(Events.PATIENT_UPDATED, this.handlePatientUpdate.bind(this));
        eventBus.on(Events.VITALS_UPDATED, this.handleVitalsUpdate.bind(this));
        eventBus.on(Events.STOCK_LOW, this.handleLowStock.bind(this));
        eventBus.on(Events.ERROR_OCCURRED, this.handleError.bind(this));
        eventBus.on(Events.AI_REPORT_GENERATED, this.handleAIReport.bind(this));
    }

    setupUIHandlers() {
        // Clear all button
        const clearAllBtn = this.container?.querySelector('.clear-all');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAll());
        }

        // Individual notification click handling
        this.container?.addEventListener('click', (e) => {
            const notificationItem = e.target.closest('.notification-item');
            if (notificationItem) {
                const id = notificationItem.dataset.id;
                this.markAsRead(id);
            }
        });
    }

    add(notification) {
        console.log('Adding notification:', notification);
        const id = Date.now().toString();
        const newNotification = {
            id,
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        
        // Trim if exceeding max
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        this.updateUI();
        this.saveNotifications();
        
        // Show toast for new notification
        eventBus.emit(Events.TOAST_SHOW, {
            message: notification.message,
            type: notification.type || 'info'
        });

        return id;
    }

    markAsRead(id) {
        console.log('Marking notification as read:', id);
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.updateUI();
            this.saveNotifications();
        }
    }

    clearAll() {
        console.log('Clearing all notifications');
        this.notifications = [];
        this.updateUI();
        this.saveNotifications();
    }

    updateUI() {
        if (!this.container || !this.badge) return;

        // Update badge
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.badge.textContent = unreadCount;
        this.badge.style.display = unreadCount > 0 ? 'flex' : 'none';

        // Update notification list
        const notificationsList = this.container.querySelector('.dropdown-body');
        if (notificationsList) {
            notificationsList.innerHTML = this.notifications.length > 0 
                ? this.notifications.map(n => this.renderNotification(n)).join('')
                : '<div class="no-notifications">No notifications</div>';
        }
    }

    renderNotification(notification) {
        const timeAgo = this.getTimeAgo(notification.timestamp);
        const unreadClass = notification.read ? '' : 'unread';
        
        return `
            <div class="notification-item ${unreadClass}" data-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas ${this.getIconForType(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <p>${notification.message}</p>
                    <span class="notification-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }

    getIconForType(type) {
        switch (type) {
            case 'patient': return 'fa-user-injured';
            case 'medication': return 'fa-pills';
            case 'vital': return 'fa-heartbeat';
            case 'alert': return 'fa-exclamation-circle';
            case 'success': return 'fa-check-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'error': return 'fa-times-circle';
            default: return 'fa-bell';
        }
    }

    getTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'rétt í þessu';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} mín síðan`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} klst síðan`;
        if (seconds < 172800) return 'Í gær';
        return date.toLocaleDateString('is-IS');
    }

    loadStoredNotifications() {
        try {
            const stored = localStorage.getItem('notifications');
            if (stored) {
                this.notifications = JSON.parse(stored);
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    saveNotifications() {
        try {
            localStorage.setItem('notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }

    // Event handlers
    handlePatientUpdate(data) {
        this.add({
            type: 'patient',
            message: `Upplýsingar uppfærðar fyrir ${data.name}`,
            data
        });
    }

    handleVitalsUpdate(data) {
        if (data.alert) {
            this.add({
                type: 'vital',
                message: `Viðvörun: ${data.patientName} - ${data.message}`,
                data,
                priority: 'high'
            });
        }
    }

    handleLowStock(data) {
        this.add({
            type: 'warning',
            message: `Lágt birgðastig: ${data.itemName}`,
            data
        });
    }

    handleError(error) {
        this.add({
            type: 'error',
            message: error.message || 'Villa kom upp',
            data: error
        });
    }

    handleAIReport(data) {
        this.add({
            type: 'success',
            message: 'Ný AI skýrsla tilbúin',
            data
        });
    }
}

// Create and export singleton instance
const notificationManager = new NotificationManager();
export default notificationManager;