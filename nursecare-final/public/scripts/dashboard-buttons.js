/**
 * NurseCare AI Dashboard - Button Handlers
 * This script handles all button clicks and interactions across the dashboard
 */

import { initializeCharts, initializeMedicationChart, initializeInventoryChart } from './dashboard.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing dashboard buttons...');
    
    // Initialize all dashboard components
    initializeThemeToggle();
    initializeSidebar();
    initializeCharts();
    initializeHeader();
    initializeTooltips();
    initializeActionButtons();
    initializeNotifications();
    initializeScrollToTop();
    initializeCountdown();
    
    // Connect any elements added dynamically after load
    setTimeout(connectDynamicElements, 500);
});

/**
 * Initialize theme toggle functionality
 */
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon(true);
        }
        
        themeToggle.addEventListener('click', function() {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            updateThemeIcon(isDarkMode);
            
            // Save preference to localStorage
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Update charts for the theme
            updateChartsForTheme();
            
            showToast('Þema', isDarkMode ? 'Dökkt þema virkt' : 'Bjart þema virkt', 'info');
        });
    }
}

/**
 * Update theme toggle icon based on current theme
 */
function updateThemeIcon(isDarkMode) {
    const icon = document.querySelector('#theme-toggle i');
    const text = document.querySelector('#theme-toggle span');
    
    if (icon) {
        if (isDarkMode) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
    
    if (text) {
        if (isDarkMode) {
            text.textContent = 'Light Mode';
        } else {
            text.textContent = 'Dark Mode';
        }
    }
}

/**
 * Initialize sidebar toggle functionality
 */
function initializeSidebar() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('expanded');
            
            // Update icon
            const icon = this.querySelector('i');
            if (sidebar.classList.contains('expanded')) {
                icon.className = 'fas fa-chevron-left';
            } else {
                icon.className = 'fas fa-bars';
            }
        });
    }
}

/**
 * Initialize header functionality
 */
function initializeHeader() {
    // Update date and time
    updateDateTime();
    
    // Initialize dropdowns
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsMenu.classList.toggle('show');
            
            // Update ARIA attributes
            const isHidden = !notificationsMenu.classList.contains('show');
            notificationsMenu.setAttribute('aria-hidden', isHidden);
            
            // Close other dropdowns
            if (profileMenu) profileMenu.classList.remove('show');
        });
    }
    
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
            
            // Update ARIA attributes
            const isHidden = !profileMenu.classList.contains('show');
            profileMenu.setAttribute('aria-hidden', isHidden);
            
            // Close other dropdowns
            if (notificationsMenu) notificationsMenu.classList.remove('show');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        if (notificationsMenu) {
            notificationsMenu.classList.remove('show');
            notificationsMenu.setAttribute('aria-hidden', 'true');
        }
        if (profileMenu) {
            profileMenu.classList.remove('show');
            profileMenu.setAttribute('aria-hidden', 'true');
        }
    });
    
    // Clear all notifications button
    const clearAllBtn = document.querySelector('.clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Remove all notification items
            const notificationItems = document.querySelectorAll('.notification-item');
            notificationItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            // Update badge
            const badge = document.querySelector('.badge');
            if (badge) {
                badge.style.display = 'none';
            }
            
            showToast('Tilkynningar', 'Allar tilkynningar merktar sem lesnar', 'success');
        });
    }
}

/**
 * Update date and time display
 */
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('is-IS', options);
    
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${dateStr}`;
    }
    
    // Update every minute
    setTimeout(updateDateTime, 60000);
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip');
            if (!tooltipText) return;
            
            // Create tooltip element
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            
            // Position tooltip
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
            
            // Show tooltip
            setTimeout(() => {
                tooltip.classList.add('show');
            }, 10);
            
            // Store tooltip reference
            this.tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this.tooltip) {
                this.tooltip.classList.remove('show');
                
                // Remove from DOM after animation
                setTimeout(() => {
                    if (this.tooltip.parentNode) {
                        this.tooltip.parentNode.removeChild(this.tooltip);
                    }
                    this.tooltip = null;
                }, 300);
            }
        });
    });
}

/**
 * Initialize dashboard action buttons
 */
function initializeActionButtons() {
    // Header buttons
    initializeHeaderButtons();
    
    // Dashboard greeting section buttons
    initializeGreetingButtons();
    
    // Card action buttons
    initializeCardActions();
    
    // Quick action buttons
    initializeQuickActions();
    
    // Chart refresh buttons
    initializeRefreshButtons();
}

/**
 * Initialize header section buttons
 */
function initializeHeaderButtons() {
    // None in the current template
}

/**
 * Initialize greeting section buttons
 */
function initializeGreetingButtons() {
    // "View Shift" button
    const viewShiftBtn = document.getElementById('view-shift-btn');
    if (viewShiftBtn) {
        viewShiftBtn.addEventListener('click', function() {
            showToast('Vaktayfirlit', 'Skoða yfirlit vaktar', 'info');
            
            // Scroll to shift section if available
            const shiftSection = document.querySelector('.card-header h3 i.fa-calendar-day');
            if (shiftSection) {
                const cardElement = shiftSection.closest('.card');
                if (cardElement) {
                    cardElement.scrollIntoView({ behavior: 'smooth' });
                    
                    // Highlight the card briefly
                    cardElement.classList.add('highlight-card');
                    setTimeout(() => {
                        cardElement.classList.remove('highlight-card');
                    }, 2000);
                }
            }
        });
    }
    
    // "Handover" button
    const handoverBtn = document.getElementById('handover-btn');
    if (handoverBtn) {
        handoverBtn.addEventListener('click', function() {
            showToast('Vaktaskipti', 'Vaktaskipti hafin', 'info');
            
            // Create modal if needed or scroll to appropriate section
            const createHandoverBtn = document.getElementById('create-handover-btn');
            if (createHandoverBtn) {
                createHandoverBtn.click();
            }
        });
    }
}

/**
 * Initialize card action buttons
 */
function initializeCardActions() {
    // Tasks card
    const refreshTasksBtn = document.getElementById('refresh-tasks-btn');
    if (refreshTasksBtn) {
        refreshTasksBtn.addEventListener('click', function() {
            updateCardContent('tasks');
        });
    }
    
    // View medications button
    const viewMedicationsBtn = document.getElementById('view-medications-btn');
    if (viewMedicationsBtn) {
        viewMedicationsBtn.addEventListener('click', function() {
            showToast('Lyfjaskráning', 'Skoða lyfjaskráningu', 'info');
            
            // Redirect to medications page if available
            setTimeout(() => {
                const medicationsLink = document.querySelector('.sidebar-menu a[href="medications.html"]');
                if (medicationsLink) {
                    window.location.href = medicationsLink.href;
                }
            }, 500);
        });
    }
    
    // Refresh alerts button
    const refreshAlertsBtn = document.getElementById('refresh-alerts-btn');
    if (refreshAlertsBtn) {
        refreshAlertsBtn.addEventListener('click', function() {
            updateCardContent('alerts');
        });
    }
    
    // Clear alerts button
    const clearAlertsBtn = document.getElementById('clear-alerts-btn');
    if (clearAlertsBtn) {
        clearAlertsBtn.addEventListener('click', function() {
            clearAlerts();
        });
    }
    
    // Update inventory button
    const updateInventoryBtn = document.getElementById('update-inventory-btn');
    if (updateInventoryBtn) {
        updateInventoryBtn.addEventListener('click', function() {
            updateCardContent('inventory');
        });
    }
    
    // Create handover button
    const createHandoverBtn = document.getElementById('create-handover-btn');
    if (createHandoverBtn) {
        createHandoverBtn.addEventListener('click', function() {
            showToast('Vaktaskýrsla', 'Búa til skýrslu fyrir afhendingu', 'info');
            
            // Show loading state
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Hleð...';
            this.disabled = true;
            
            // Generate report after delay
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-file-alt"></i> Búa til skýrslu fyrir afhendingu';
                this.disabled = false;
                
                showReportModal();
            }, 1500);
        });
    }
    
    // Open AI chat button
    const openAiChatBtn = document.getElementById('open-ai-chat-btn');
    if (openAiChatBtn) {
        openAiChatBtn.addEventListener('click', function() {
            // Toggle AI widget if available
            const aiWidgetToggle = document.getElementById('ai-widget-toggle');
            if (aiWidgetToggle) {
                aiWidgetToggle.click();
            }
        });
    }
    
    // Health chart options button
    const healthOptionsBtn = document.getElementById('health-options-btn');
    if (healthOptionsBtn) {
        healthOptionsBtn.addEventListener('click', function() {
            showToast('Heilsufarsmælingar', 'Stilla heilsufarsmælingar', 'info');
        });
    }
    
    // Refresh health chart button
    const refreshHealthChartBtn = document.getElementById('refresh-health-chart-btn');
    if (refreshHealthChartBtn) {
        refreshHealthChartBtn.addEventListener('click', function() {
            updateCardContent('health');
        });
    }
}

/**
 * Initialize quick action buttons
 */
function initializeQuickActions() {
    // Create schedule button
    const createScheduleBtn = document.getElementById('create-schedule-btn');
    if (createScheduleBtn) {
        createScheduleBtn.addEventListener('click', function() {
            showToast('Vaktaáætlun', 'Búa til vaktaáætlun', 'info');
            
            // Redirect to schedule page if available
            setTimeout(() => {
                const scheduleLink = document.querySelector('.sidebar-menu a[href="schedule.html"]');
                if (scheduleLink) {
                    window.location.href = scheduleLink.href;
                }
            }, 500);
        });
    }
    
    // Add staff button
    const addStaffBtn = document.getElementById('add-staff-btn');
    if (addStaffBtn) {
        addStaffBtn.addEventListener('click', function() {
            showToast('Starfsfólk', 'Bæta við starfsmanni', 'info');
            
            // Redirect to staff page if available
            setTimeout(() => {
                const staffLink = document.querySelector('.sidebar-menu a[href="staff.html"]');
                if (staffLink) {
                    window.location.href = staffLink.href;
                }
            }, 500);
        });
    }
    
    // Update inventory button (quick action)
    const updateAllInventoryBtn = document.getElementById('update-all-inventory-btn');
    if (updateAllInventoryBtn) {
        updateAllInventoryBtn.addEventListener('click', function() {
            showToast('Birgðir', 'Uppfæra birgðir', 'info');
            
            // Redirect to inventory page if available
            setTimeout(() => {
                const inventoryLink = document.querySelector('.sidebar-menu a[href="inventory.html"]');
                if (inventoryLink) {
                    window.location.href = inventoryLink.href;
                }
            }, 500);
        });
    }
    
    // Ask AI button (quick action)
    const askAiBtn = document.getElementById('ask-ai-btn');
    if (askAiBtn) {
        askAiBtn.addEventListener('click', function() {
            // Toggle AI widget if available
            const aiWidgetToggle = document.getElementById('ai-widget-toggle');
            if (aiWidgetToggle) {
                aiWidgetToggle.click();
            }
        });
    }
}

/**
 * Initialize chart refresh buttons
 */
function initializeRefreshButtons() {
    const refreshButtons = document.querySelectorAll('.card-action');
    
    refreshButtons.forEach(button => {
        button.addEventListener('click', function() {
            const header = this.closest('.card-header');
            if (!header) return;
            
            const headerText = header.querySelector('h3')?.textContent.trim() || '';
            
            // Add rotation animation
            this.classList.add('rotating');
            
            // Determine which section to refresh
            if (headerText.includes('Verkefni')) {
                updateCardContent('tasks');
            } else if (headerText.includes('Birgðir')) {
                updateCardContent('inventory');
            } else if (headerText.includes('Lyfja')) {
                updateCardContent('medications');
            } else if (headerText.includes('Viðvaran')) {
                updateCardContent('alerts');
            } else if (headerText.includes('Heilsufars')) {
                updateCardContent('health');
            } else if (headerText.includes('Assistant')) {
                updateCardContent('ai');
            } else if (headerText.includes('Vaktir')) {
                updateCardContent('shifts');
            } else {
                // Generic refresh
                setTimeout(() => {
                    this.classList.remove('rotating');
                    showToast('Uppfært', 'Gögn uppfærð', 'success');
                }, 1000);
            }
        });
    });
}

/**
 * Update card content based on type
 */
function updateCardContent(type) {
    // Find the corresponding refresh button and add rotation
    const refreshBtn = document.querySelector(`.${type}-card .card-action`) || 
                       document.querySelector(`#refresh-${type}-btn`) ||
                       document.querySelector(`#update-${type}-btn`);
    
    if (refreshBtn) {
        refreshBtn.classList.add('rotating');
    }
    
    // Simulate API call with delay
    setTimeout(() => {
        // Remove rotation animation
        if (refreshBtn) {
            refreshBtn.classList.remove('rotating');
        }
        
        // Update content based on type
        switch (type) {
            case 'tasks':
                updateTaskContent();
                break;
            case 'alerts':
                updateAlertsContent();
                break;
            case 'inventory':
                updateInventoryContent();
                break;
            case 'medications':
                updateMedicationsContent();
                break;
            case 'health':
                updateHealthContent();
                break;
            case 'shifts':
                updateShiftsContent();
                break;
            case 'ai':
                updateAIContent();
                break;
            default:
                // Generic update
                showToast('Uppfært', 'Gögn uppfærð', 'success');
        }
    }, 1200);
}

/**
 * Update tasks content
 */
function updateTaskContent() {
    // Get random completion percentage
    const completed = Math.floor(Math.random() * 3) + 14; // 14-16
    const total = 16;
    const percentage = Math.round((completed / total) * 100);
    
    // Update progress bar
    const progressBar = document.querySelector('.tasks-progress .progress-bar');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    // Update tasks completed text
    const tasksCompleted = document.querySelector('.tasks-completed');
    if (tasksCompleted) {
        tasksCompleted.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${completed}/${total} verkefni kláruð
        `;
    }
    
    // Update AI summary
    const aiSummary = document.querySelector('.ai-summary');
    if (aiSummary) {
        const summaries = [
            '"Flestir sjúklingar fengu lyf sín á réttum tíma. Engin alvarleg atvik í dag."',
            '"Þrír sjúklingar þurfa endurmat á umönnunaráætlun. Lyfjastjórnun gekk vel."',
            '"Góður framgangur hjá sjúklingum í dag. Tveir sjúklingar sýna bata."'
        ];
        
        aiSummary.innerHTML = summaries[Math.floor(Math.random() * summaries.length)];
    }
    
    showToast('Verkefni', 'Verkefnalisti uppfærður', 'success');
}

/**
 * Update alerts content
 */
function updateAlertsContent() {
    // Get alert items
    const alertItems = document.querySelectorAll('.alert-item');
    
    if (alertItems.length > 0) {
        // Update random alert
        const randomIndex = Math.floor(Math.random() * alertItems.length);
        const randomAlert = alertItems[randomIndex];
        
        // Update timestamp
        const timeElement = randomAlert.querySelector('.alert-item span:last-child');
        if (timeElement) {
            timeElement.textContent = 'Fyrir 1 mínútu';
        }
        
        // Add highlight animation
        randomAlert.classList.add('alert-highlight');
        setTimeout(() => {
            randomAlert.classList.remove('alert-highlight');
        }, 2000);
    }
    
    showToast('Viðvaranir', 'Viðvaranir uppfærðar', 'success');
}

/**
 * Clear all alerts
 */
function clearAlerts() {
    // Hide all alert items with animation
    const alertItems = document.querySelectorAll('.alert-item');
    
    alertItems.forEach((alert, index) => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.height = '0';
            alert.style.margin = '0';
            alert.style.padding = '0';
            alert.style.overflow = 'hidden';
            
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
                
                // Show message when all alerts are cleared
                if (index === alertItems.length - 1) {
                    const alertList = document.querySelector('.alert-list');
                    if (alertList) {
                        alertList.innerHTML = '<div class="no-alerts">Engar virkar viðvaranir</div>';
                    }
                }
            }, 300);
        }, index * 100);
    });
    
    showToast('Viðvaranir', 'Allar viðvaranir hreinsaðar', 'success');
}

/**
 * Update inventory content
 */
function updateInventoryContent() {
    // Update inventory chart if available
    if (window.inventoryChart && typeof window.inventoryChart.update === 'function') {
        // Generate new random data
        const newData = [
            Math.floor(Math.random() * 30) + 10,  // 10-40
            Math.floor(Math.random() * 20) + 45,  // 45-65
            Math.floor(Math.random() * 40) + 80,  // 80-120
            Math.floor(Math.random() * 30) + 30,  // 30-60
            Math.floor(Math.random() * 20) + 70   // 70-90
        ];
        
        // Update chart data
        window.inventoryChart.data.datasets[0].data = newData;
        window.inventoryChart.update();
    }
    
    showToast('Birgðir', 'Birgðastaða uppfærð', 'success');
}

/**
 * Update medications content
 */
function updateMedicationsContent() {
    // Update medication chart if available
    if (window.medicationChart && typeof window.medicationChart.update === 'function') {
        // Generate new percentage
        const newPercentage = Math.floor(Math.random() * 15) + 75; // 75-90
        
        // Update chart data
        window.medicationChart.data.datasets[0].data = [newPercentage, 100 - newPercentage];
        window.medicationChart.update();
        
        // Update text if available
        const medicationText = document.querySelector('.medication-chart p strong');
        if (medicationText) {
            medicationText.textContent = `${newPercentage}% lyf`;
        }
    }
    
    showToast('Lyfjaskráning', 'Lyfjaskráning uppfærð', 'success');
}

/**
 * Update health content
 */
function updateHealthContent() {
    // Update health chart if available
    if (window.healthChart && typeof window.healthChart.update === 'function') {
        // Generate new random data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const newData = months.map(() => Math.floor(Math.random() * 35) + 40); // 40-75
        
        // Update chart data
        window.healthChart.data.datasets[0].data = newData;
        window.healthChart.update();
    }
    
    showToast('Heilsufarsmælingar', 'Heilsufarsgögn uppfærð', 'success');
}

/**
 * Update shifts content
 */
function updateShiftsContent() {
    // Current date for new timestamps
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Update shift list if available
    const shiftItems = document.querySelectorAll('.shift-item');
    if (shiftItems.length > 0) {
        // Update staff counts randomly
        shiftItems.forEach(item => {
            const staffCount = item.querySelector('.staff-count');
            if (staffCount) {
                const newCount = Math.floor(Math.random() * 3) + 4; // 4-6
                staffCount.textContent = `${newCount} starfsmenn`;
            }
        });
    }
    
    // Update countdown
    restartCountdown();
    
    showToast('Vaktir', 'Vaktaupplýsingar uppfærðar', 'success');
}

/**
 * Update AI content
 */
function updateAIContent() {
    // Update AI summary if available
    const aiSummary = document.querySelector('.card:has(.fa-robot) .ai-summary');
    
    if (aiSummary) {
        const summaries = [
            `"Góðan daginn, Anna. Þú ert með fund kl. 14:00. Mælt með að athuga blóðþrýsting hjá Jóni í herbergi 103."`,
            `"Góðan daginn, Anna. Lyfjagjöf hjá Guðrúnu í herbergi 205 er yfirstandandi. Get ég aðstoðað þig með eitthvað fleira?"`,
            `"Góðan daginn, Anna. Þrír sjúklingar þurfa endurmat í dag. Birgðir af sprittþurrkum eru að verða búnar."`,
        ];
        
        // Set random summary
        aiSummary.innerHTML = summaries[Math.floor(Math.random() * summaries.length)] + 
            `<div style="font-size: 0.75rem; text-align: right; margin-top: 0.5rem; opacity: 0.7;">
                Fyrir ${Math.floor(Math.random() * 10) + 1} mínútum síðan
            </div>`;
    }
    
    showToast('AI Aðstoðarmaður', 'AI uppfært', 'success');
}

/**
 * Initialize notification buttons
 */
function initializeNotifications() {
    // Make notification items interactive
    const notificationItems = document.querySelectorAll('.notification-item');
    
    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.remove('unread');
            
            // Update badge count
            updateNotificationBadge();
        });
    });
}

/**
 * Update notification badge
 */
function updateNotificationBadge() {
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    const badge = document.querySelector('.badge');
    
    if (badge) {
        badge.textContent = unreadItems.length.toString();
        
        // Hide badge if no unread notifications
        if (unreadItems.length === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = '';
        }
    }
}

/**
 * Initialize scroll to top button
 */
function initializeScrollToTop() {
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    
    if (scrollTopBtn) {
        // Show button when scrolling down
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        });
        
        // Scroll to top when button clicked
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Initialize countdown timer
 */
function initializeCountdown() {
    const countdownElement = document.getElementById('countdown-timer');
    
    if (countdownElement) {
        startCountdown(countdownElement.textContent || '01:23:45');
    }
}

/**
 * Start countdown timer
 */
function startCountdown(timeString) {
    const countdownElement = document.getElementById('countdown-timer');
    if (!countdownElement) return;
    
    // Parse time string
    let [hours, minutes, seconds] = timeString.split(':').map(Number);
    
    // Calculate total seconds
    let totalSeconds = hours * 3600 + minutes * 60 + seconds;
    
    // Clear any existing countdown
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
    }
    
    // Update countdown every second
    window.countdownInterval = setInterval(function() {
        if (totalSeconds <= 0) {
            // End countdown
            clearInterval(window.countdownInterval);
            countdownElement.textContent = "Vakt hafin!";
            
            // Show notification
            showToast('Vaktir', 'Ný vakt hafin!', 'success');
            return;
        }
        
        // Decrement total seconds
        totalSeconds--;
        
        // Calculate hours, minutes, seconds
        hours = Math.floor(totalSeconds / 3600);
        minutes = Math.floor((totalSeconds % 3600) / 60);
        seconds = totalSeconds % 60;
        
        // Format time
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update display
        countdownElement.textContent = formattedTime;
    }, 1000);
}

/**
 * Restart countdown timer with a new random time
 */
function restartCountdown() {
    // Generate random time (15-90 minutes)
    const randomMinutes = Math.floor(Math.random() * 76) + 15;
    const hours = Math.floor(randomMinutes / 60);
    const minutes = randomMinutes % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    // Start countdown with new time
    startCountdown(timeString);
}

/**
 * Update charts for dark/light mode
 */
function updateChartsForTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Function to update chart options
    const updateChartOptions = (chart) => {
        if (!chart) return;
        
        // Update scales if they exist
        if (chart.options.scales) {
            if (chart.options.scales.y) {
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.y.grid.color = gridColor;
            }
            
            if (chart.options.scales.x) {
                chart.options.scales.x.ticks.color = textColor;
                chart.options.scales.x.grid.color = gridColor;
            }
        }
        
        // Update legend if it exists
        if (chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        
        // Apply changes
        chart.update();
    };
    
    // Update all charts
    if (window.medicationChart) updateChartOptions(window.medicationChart);
    if (window.inventoryChart) updateChartOptions(window.inventoryChart);
    if (window.healthChart) updateChartOptions(window.healthChart);
}

/**
 * Show modal with report
 */
function showReportModal() {
    // Check if modal exists
    let modal = document.querySelector('.modal.handover-report');
    
    if (!modal) {
        // Create modal
        modal = document.createElement('div');
        modal.className = 'modal handover-report';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Vaktaskýrsla fyrir afhendingu</h3>
                    <button class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="report-section">
                        <h4>Yfirlit</h4>
                        <p>Morgunvakt ${new Date().toLocaleDateString('is-IS')} - Anna Sigurðardóttir</p>
                        <p>Heildarmæting: 8/8 starfsmenn</p>
                    </div>
                    <div class="report-section">
                        <h4>Sjúklingar</h4>
                        <p>Heildarfjöldi: 18 sjúklingar</p>
                        <ul>
                            <li>Jón Jónsson (103) - Blóðþrýstingur hækkaður, þarf eftirfylgni</li>
                            <li>Guðrún Karlsdóttir (105) - Svefnvandamál, fékk aukaskammt af svefnlyfi</li>
                            <li>Sigríður Ólafsdóttir (110) - Bætt hreyfigeta, jákvæð þróun</li>
                        </ul>
                    </div>
                    <div class="report-section">
                        <h4>Lyfjagjöf</h4>
                        <p>82% lyfjagjafa lokið. Sjá ítarlega skýrslu í lyfjaskráningarkerfi.</p>
                    </div>
                    <div class="report-section">
                        <h4>Athugasemdir</h4>
                        <p>Aðstandendur Jóns Jónssonar komu í heimsókn kl 10:30.</p>
                        <p>Birgðir af hönskum eru að verða búnar, beiðni send til birgðastjóra.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline">Hætta við</button>
                    <button class="btn btn-primary">Senda skýrslu</button>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(modal);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.btn-outline');
        const sendBtn = modal.querySelector('.btn-primary');
        
        // Close modal when clicking close button
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        }
        
        // Close modal when clicking cancel button
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        }
        
        // Send report
        if (sendBtn) {
            sendBtn.addEventListener('click', function() {
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sendi...';
                this.disabled = true;
                
                // Simulate sending
                setTimeout(() => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                        
                        // Show success toast
                        showToast('Vaktaskýrsla', 'Skýrsla send!', 'success');
                    }, 300);
                }, 1000);
            });
        }
    }
    
    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Connect any dynamically added elements
 */
function connectDynamicElements() {
    // This function can be expanded to look for new elements
    // that might be added dynamically and attach event handlers
    
    // For example:
    const dynamicButtons = document.querySelectorAll('button:not([data-initialized])');
    
    dynamicButtons.forEach(button => {
        // Mark as initialized
        button.setAttribute('data-initialized', 'true');
        
        // Check if this is a specific button that needs special handling
        if (button.id === 'special-button') {
            button.addEventListener('click', function() {
                // Special button handler
            });
        }
    });
}

/**
 * Show toast notification
 */
function showToast(title, message, type = 'info') {
    // Get or create toast container
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Get icon based on type
    let iconClass;
    switch (type) {
        case 'success':
            iconClass = 'fa-check-circle';
            break;
        case 'error':
            iconClass = 'fa-times-circle';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle';
            break;
        default:
            iconClass = 'fa-info-circle';
    }
    
    // Set content
    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add close button handler
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        });
    }
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Make certain functions available globally
window.NurseCareAI = window.NurseCareAI || {};
window.NurseCareAI.showToast = showToast;
window.NurseCareAI.updateCharts = updateChartsForTheme;