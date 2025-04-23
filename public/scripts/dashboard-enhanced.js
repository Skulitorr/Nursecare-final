/**
 * NurseCare AI Dashboard - Enhanced CSS
 * Additional styles for new components and features
 */

/* ====== NEW COMPONENTS ====== */

/* Task Checklist */
.task-checklist-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.task-header h4 {
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--text-dark);
}

.task-header h4 i {
    color: var(--primary-color);
}

.task-progress {
    margin-bottom: 15px;
}

.progress-container {
    width: 100%;
    height: 8px;
    background-color: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 5px;
}

.progress-bar {
    height: 100%;
    background-color: var(--primary-color);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 12px;
    color: var(--text-muted);
    text-align: right;
}

.task-checklist {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 5px;
}

.task-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 15px;
    background-color: var(--bg-secondary);
    border-radius: var(--radius);
    transition: all 0.2s ease;
}

.task-item:hover {
    background-color: var(--bg-tertiary);
}

.task-checkbox {
    position: relative;
}

.task-checkbox input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
}

.task-checkbox label {
    display: inline-block;
    width: 22px;
    height: 22px;
    background-color: var(--bg-card);
    border: 2px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.task-checkbox input[type="checkbox"]:checked + label {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.task-checkbox input[type="checkbox"]:checked + label::after {
    content: '✓';
    position: absolute;
    top: 0;
    left: 5px;
    color: white;
    font-size: 14px;
}

.task-content {
    flex: 1;
}

.task-text {
    display: block;
    margin-bottom: 4px;
    color: var(--text-dark);
    transition: all 0.2s ease;
}

.task-text.completed {
    text-decoration: line-through;
    color: var(--text-muted);
}

.task-time {
    font-size: 12px;
    color: var(--text-muted);
}

.task-actions {
    opacity: 0;
    transition: opacity 0.2s ease;
}

.task-item:hover .task-actions {
    opacity: 1;
}

.task-delete {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.task-delete:hover {
    background-color: var(--alert-red-light);
    color: var(--alert-red);
}

/* Shift Performance */
.shift-performance-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.shift-performance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.shift-performance-header h4 {
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--text-dark);
}

.shift-performance-header h4 i {
    color: var(--primary-color);
}

.shift-performance-chart {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.shift-performance-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
}

.shift-performance-stat {
    text-align: center;
}

.stat-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 5px;
}

.stat-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--primary-color);
}

/* AI Shift Summary */
.shift-summary-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.shift-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.shift-summary-header h4 {
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--text-dark);
}

.shift-summary-header h4 i {
    color: var(--primary-color);
}

.summary-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px;
    gap: 15px;
}

.spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

.dark-mode .spinner {
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--primary-color);
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}

.summary-content {
    background-color: var(--bg-secondary);
    padding: 15px;
    border-radius: var(--radius);
    color: var(--text-dark);
    line-height: 1.6;
}

.summary-stats {
    display: flex;
    justify-content: space-between;
    margin: 15px 0;
}

.summary-stat {
    text-align: center;
}

.summary-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px;
    gap: 15px;
    color: var(--alert-red);
    text-align: center;
}

.summary-error i {
    font-size: 30px;
}

/* Smart Inventory */
.smart-inventory-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.inventory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.inventory-header h4 {
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--text-dark);
}

.inventory-header h4 i {
    color: var(--primary-color);
}

.inventory-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background-color: var(--bg-secondary);
    border-radius: var(--radius);
    margin-bottom: 10px;
    transition: all 0.2s ease;
}

.inventory-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.inventory-info {
    flex: 1;
}

.inventory-name {
    font-weight: 600;
    margin-bottom: 5px;
    color: var(--text-dark);
}

.inventory-status {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.inventory-progress-bar {
    width: 100%;
    height: 6px;
    background-color: var(--bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
}

.inventory-progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
}

.inventory-status.ok .inventory-progress-fill {
    background-color: var(--alert-green);
}

.inventory-status.warning .inventory-progress-fill {
    background-color: var(--alert-yellow);
}

.inventory-status.critical .inventory-progress-fill {
    background-color: var(--alert-red);
}

.inventory-status-text {
    font-size: 12px;
    color: var(--text-muted);
}

.inventory-actions {
    margin-left: 15px;
}

/* Mini Calendar */
.mini-calendar-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.calendar-header {
    text-align: center;
    margin-bottom: 10px;
}

.calendar-month {
    font-weight: 600;
    font-size: 16px;
    color: var(--text-dark);
}

.calendar-body {
    margin-bottom: 15px;
}

.calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
}

.calendar-day-name {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    padding: 5px;
}

.calendar-day {
    height: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    position: relative;
    cursor: pointer;
}

.calendar-day:hover {
    background-color: var(--bg-secondary);
}

.calendar-day.empty {
    cursor: default;
}

.calendar-day.today {
    background-color: var(--primary-lighter);
    font-weight: 600;
    color: var(--primary-color);
}

.calendar-day.has-event::after {
    content: '';
    position: absolute;
    bottom: 3px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--primary-color);
}

.calendar-date {
    font-size: 12px;
}

.calendar-events {
    border-top: 1px solid var(--border-color);
    padding-top: 15px;
}

.calendar-events-header {
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--text-dark);
}

.calendar-event {
    display: flex;
    padding: 8px 10px;
    background-color: var(--bg-secondary);
    border-radius: var(--radius);
    margin-bottom: 8px;
    border-left: 3px solid var(--primary-color);
}

.event-time {
    font-weight: 600;
    margin-right: 10px;
    color: var(--primary-color);
    font-size: 12px;
    min-width: 40px;
}

.event-title {
    font-size: 12px;
    color: var(--text-dark);
}

.calendar-no-events {
    color: var(--text-muted);
    text-align: center;
    padding: 15px;
    font-size: 12px;
}

/* Enhanced Chat Styles */
.ai-chat {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 350px;
    height: 500px;
    background-color: var(--bg-card);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: translateY(110%);
    transition: transform 0.3s ease;
}

.ai-chat.open {
    transform: translateY(0);
}

.ai-chat.minimized {
    height: 60px;
    transform: translateY(0);
}

.chat-header {
    padding: 15px;
    background-color: var(--primary-color);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
}

.chat-actions {
    display: flex;
    gap: 8px;
}

.minimize-chat, .close-chat, .clear-chat {
    background: none;
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.minimize-chat:hover, .close-chat:hover, .clear-chat:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.chat-messages {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
    scroll-behavior: smooth;
}

.message {
    display: flex;
    gap: 10px;
    max-width: 85%;
}

.message.system, .message.assistant {
    align-self: flex-start;
}

.message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
}

.message-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 14px;
}

.message.user .message-avatar {
    background-color: var(--secondary-color);
}

.message-content {
    background-color: var(--bg-secondary);
    padding: 10px 15px;
    border-radius: 16px;
    border-top-left-radius: 2px;
}

.message.user .message-content {
    background-color: var(--primary-lighter);
    border-radius: 16px;
    border-top-right-radius: 2px;
    text-align: right;
}

.message-sender {
    font-weight: 600;
    font-size: 0.8rem;
    margin-bottom: 3px;
    color: var(--primary-color);
}

.message.user .message-sender {
    color: var(--primary-color);
}

.message-timestamp {
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-top: 5px;
}

.chat-input-container {
    padding: 10px 15px;
    border-top: 1px solid var(--border-color);
    background-color: var(--bg-card);
}

#chat-form {
    display: flex;
    gap: 10px;
}

.chat-input {
    flex: 1;
    padding: 10px 15px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    background-color: var(--bg-secondary);
    color: var(--text-dark);
    font-size: 0.9rem;
}

.chat-input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.chat-send {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.chat-send:hover {
    transform: scale(1.05);
    background-color: var(--primary-light);
}

/* Typing indicator */
.typing-indicator {
    display: flex;
    align-items: center;
    margin-left: 10px;
}

.typing-dots {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background-color: var(--bg-tertiary);
    border-radius: 12px;
}

.typing-dots span {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--primary-color);
    opacity: 0.6;
    animation: typing-animation 1.2s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
    animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing-animation {
    0%, 80%, 100% {
        transform: scale(0.6);
    }
    40% {
        transform: scale(1);
    }
}

/* Dark mode adjustments */
body.dark-mode .message-content {
    background-color: var(--bg-tertiary);
}

body.dark-mode .message.user .message-content {
    background-color: var(--primary-darker, #003A59);
}

body.dark-mode .typing-dots {
    background-color: var(--bg-tertiary);
}

body.dark-mode .typing-dots span {
    background-color: var(--primary-light);
}

/* Floating chat button */
.floating-chat-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--shadow-lg);
    transition: all 0.3s ease;
    z-index: 999;
}

.floating-chat-btn:hover {
    transform: scale(1.1);
    background-color: var(--primary-light);
}

.floating-chat-btn i {
    font-size: 24px;
}

/* Hide floating button when chat is open */
.ai-chat.open + .floating-chat-btn {
    display: none;
}

/* Toast Notifications */
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1100;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
}

.toast {
    background-color: var(--bg-card);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    min-width: 300px;
    max-width: 400px;
    pointer-events: auto;
    animation: slideIn 0.3s ease;
    border-left: 4px solid var(--primary-color);
}

.toast.toast-hiding {
    animation: slideOut 0.3s ease forwards;
}

.toast-success {
    border-left-color: var(--alert-green);
}

.toast-error {
    border-left-color: var(--alert-red);
}

.toast-warning {
    border-left-color: var(--alert-yellow);
}

.toast-info {
    border-left-color: var(--alert-blue);
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.toast-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.toast-success .toast-icon {
    color: var(--alert-green);
}

.toast-error .toast-icon {
    color: var(--alert-red);
}

.toast-warning .toast-icon {
    color: var(--alert-yellow);
}

.toast-info .toast-icon {
    color: var(--alert-blue);
}

.toast-content {
    flex: 1;
}

.toast-title {
    font-weight: 600;
    margin-bottom: 5px;
    color: var(--text-dark);
}

.toast-message {
    font-size: 0.9rem;
    color: var(--text-muted);
}

.toast-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 16px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.toast-close:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-dark);
}

/* Modal */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background-color: var(--bg-card);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    padding: 15px 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-dark);
}

.modal-header h3 i {
    color: var(--primary-color);
}

.close-btn {
    background: none;
    border: none;
    font-size: 20px;
    color: var(--text-muted);
    cursor: pointer;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-dark);
}

.modal-body {
    padding: 20px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: var(--text-dark);
}

.form-control {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    background-color: var(--bg-card);
    color: var(--text-dark);
    font-size: 14px;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-lighter);
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

/* Responsive Adjustments */
@media (max-width: 992px) {
    .dashboard-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
}

@media (max-width: 768px) {
    .sidebar {
        width: 70px;
    }
    
    .sidebar .sidebar-header h1,
    .sidebar .sidebar-menu a span,
    .sidebar .sidebar-footer p {
        display: none;
    }
    
    .main-content {
        margin-left: 70px;
    }
    
    .dashboard-grid {
        grid-template-columns: 1fr;
    }
    
    .nav-right {
        gap: var(--spacing-sm);
    }
    
    .user-menu span {
        display: none;
    }
}

@media (max-width: 576px) {
    .main-content {
        padding: var(--spacing-md);
    }
    
    .top-nav {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
    }
    
    .nav-right {
        width: 100%;
        justify-content: space-between;
    }
    
    .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
    }
} 