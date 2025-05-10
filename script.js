/**
 * NurseCare AI Dashboard JavaScript
 * Enhanced version with Icelandic language support
 */

// Debug logging function
function debug(message, data = null) {
    const enableDebug = true; // Set to false in production
    if (enableDebug) {
        if (data) {
            console.log(`[NurseCare AI] ${message}`, data);
        } else {
            console.log(`[NurseCare AI] ${message}`);
        }
    }
}

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    debug('Initializing NurseCare AI Dashboard');
    
    // Initialize all components
    initializeThemeToggle();
    initializeSidebar();
    initializeCharts();
    initializeAIChat();
    initializeLanguageSelector();
    initializeRefreshButtons();
    initializeActionButtons();
    initializeDropdowns();
    
    debug('Dashboard initialization complete');
});

// Initialize theme toggle
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        // Check for user preference in localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            updateThemeIcon(true);
        }
        
        themeToggle.addEventListener('click', function() {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            updateThemeIcon(isDarkMode);
            
            // Save preference
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Update charts if they exist
            updateChartsTheme();
            
            showToast('Þema', isDarkMode ? 'Dökkt þema virkt' : 'Bjart þema virkt', 'info');
        });
    }
}

// Update theme icon
function updateThemeIcon(isDarkMode) {
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) {
        if (isDarkMode) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
}

// Initialize sidebar toggle
function initializeSidebar() {
    const toggleButtons = document.querySelectorAll('#toggle-sidebar, #toggle-sidebar-mobile');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    toggleButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', function() {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
            });
        }
    });
}

// Initialize Charts
function initializeCharts() {
    // Add a small delay to ensure DOM is fully loaded
    setTimeout(() => {
        initializeAttendanceChart();
        initializeMedicationChart();
        initializeStaffChart();
    }, 100);
}

// Create attendance chart
function initializeAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    // Check if chart instance exists before trying to destroy it
    if (window.attendanceChart && typeof window.attendanceChart.destroy === 'function') {
        window.attendanceChart.destroy();
    }
    
    window.attendanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau', 'Sun'],
            datasets: [{
                label: 'Vikuleg mæting',
                data: [85, 72, 86, 81, 84, 86, 94],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2, // This controls the height relative to width
            animation: {
                duration: 750 // Reduce animation duration for better performance
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 50,
                    max: 100,
                    ticks: {
                        color: textColor,
                        maxTicksLimit: 5 // Limit number of ticks for better performance
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        maxTicksLimit: 7
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false, // Hide legend to save space
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// Create medication chart
function initializeMedicationChart() {
    const ctx = document.getElementById('medicationChart');
    if (!ctx) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    // Check if chart instance exists before trying to destroy it
    if (window.medicationChart && typeof window.medicationChart.destroy === 'function') {
        window.medicationChart.destroy();
    }
    
    window.medicationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Gefin', 'Eftir'],
            datasets: [{
                data: [75, 25],
                backgroundColor: [
                    '#10b981',
                    '#d1d5db'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5, // Control height relative to width
            animation: {
                duration: 750
            },
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        boxWidth: 12,
                        padding: 10
                    }
                }
            }
        }
    });
}

// Create staff chart
function initializeStaffChart() {
    const ctx = document.getElementById('staffChart');
    if (!ctx) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    
    // Check if chart instance exists before trying to destroy it
    if (window.staffChart && typeof window.staffChart.destroy === 'function') {
        window.staffChart.destroy();
    }
    
    window.staffChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Hjúkrunarfræðingar', 'Sjúkraliðar', 'Aðstoðarfólk', 'Læknar'],
            datasets: [{
                label: 'Starfsfólk á vakt',
                data: [5, 3, 4, 1],
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2, // Control height relative to width
            animation: {
                duration: 750
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        maxTicksLimit: 5,
                        stepSize: 1
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update charts for dark/light mode
function updateChartsTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    const updateOptions = (chart) => {
        if (!chart) return;
        
        if (chart.options.scales) {
            // For charts with scales (line, bar)
            if (chart.options.scales.y) {
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.y.grid.color = gridColor;
            }
            
            if (chart.options.scales.x) {
                chart.options.scales.x.ticks.color = textColor;
                chart.options.scales.x.grid.color = gridColor;
            }
        }
        
        if (chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = textColor;
        }
        
        chart.update();
    };
    
    // Update all charts
    if (window.attendanceChart) updateOptions(window.attendanceChart);
    if (window.medicationChart) updateOptions(window.medicationChart);
    if (window.staffChart) updateOptions(window.staffChart);
}

// Initialize refresh buttons
function initializeRefreshButtons() {
    const refreshButtons = document.querySelectorAll('.refresh-btn');
    
    refreshButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add rotation animation
            this.classList.add('rotating');
            
            // Get the parent card header
            const header = this.closest('.card-header');
            if (!header) return;
            
            // Determine which section to refresh based on the header text
            const headerTitle = header.querySelector('h3').textContent.trim();
            
            switch (headerTitle) {
                case 'Yfirlit':
                    refreshOverviewStats();
                    break;
                case 'Tilkynningar':
                    refreshCharts();
                    break;
                case 'Gervigreind innsýn':
                    refreshAIInsights();
                    break;
                default:
                    // Generic refresh
                    setTimeout(() => {
                        this.classList.remove('rotating');
                        showToast('Uppfært', 'Gögn uppfærð', 'success');
                    }, 1000);
            }
        });
    });
    
    // Special handler for insights refresh
    const insightsRefreshBtn = document.getElementById('refresh-insights');
    if (insightsRefreshBtn) {
        insightsRefreshBtn.addEventListener('click', refreshAIInsights);
    }
}

// Refresh overview stats
function refreshOverviewStats() {
    const refreshBtn = document.querySelector('.overview-panel .refresh-btn');
    
    // Simulate API call
    setTimeout(() => {
        // Update random stats
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(stat => {
            const currentValue = parseInt(stat.textContent);
            const newValue = currentValue + Math.floor(Math.random() * 5) - 2;
            stat.textContent = Math.max(0, newValue);
        });
        
        if (refreshBtn) refreshBtn.classList.remove('rotating');
        showToast('Yfirlit', 'Tölfræði uppfærð', 'success');
    }, 1000);
}

// Refresh charts
function refreshCharts() {
    const refreshBtn = document.querySelector('.charts-panel .refresh-btn');
    
    // Simulate API call
    setTimeout(() => {
        // Update attendance chart with new random data
        if (window.attendanceChart) {
            const newData = Array.from({length: 7}, () => Math.floor(Math.random() * 25) + 70);
            window.attendanceChart.data.datasets[0].data = newData;
            window.attendanceChart.update();
        }
        
        // Update medication chart
        if (window.medicationChart) {
            const given = Math.floor(Math.random() * 40) + 60;
            window.medicationChart.data.datasets[0].data = [given, 100 - given];
            window.medicationChart.update();
        }
        
        // Update staff chart
        if (window.staffChart) {
            const newData = [
                Math.floor(Math.random() * 5) + 10,
                Math.floor(Math.random() * 4) + 6,
                Math.floor(Math.random() * 3) + 4,
                Math.floor(Math.random() * 2) + 2
            ];
            window.staffChart.data.datasets[0].data = newData;
            window.staffChart.update();
        }
        
        if (refreshBtn) refreshBtn.classList.remove('rotating');
        showToast('Tölfræði', 'Gröf uppfærð', 'success');
    }, 1000);
}

// Refresh AI Insights
function refreshAIInsights() {
    const refreshBtn = document.querySelector('.ai-insights-panel .refresh-btn');
    const insightsContainer = document.getElementById('ai-insights');
    
    if (!insightsContainer) return;
    
    // Show loading state
    insightsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Sæki nýja innsýn...</p>
        </div>
    `;
    
    // Simulate API call delay
    setTimeout(() => {
        const insights = getRandomInsights();
        let html = '';
        
        insights.forEach(insight => {
            html += `
                <div class="insight-item">
                    <div class="insight-icon">
                        <i class="fas ${insight.icon}"></i>
                    </div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.content}</p>
                    </div>
                </div>
            `;
        });
        
        insightsContainer.innerHTML = html;
        
        if (refreshBtn) refreshBtn.classList.remove('rotating');
        showToast('Gervigreind', 'Innsýn uppfærð', 'success');
    }, 1500);
}

// Get random AI insights
function getRandomInsights() {
    const insights = [
        {
            icon: 'fa-chart-line',
            title: 'Mæting aukist',
            content: 'Mæting hjá sjúklingum hefur aukist um 15% síðasta viku.'
        },
        {
            icon: 'fa-pills',
            title: 'Lyfjaðferð',
            content: 'Ný lyfjaðferð mælt með fyrir 3 sjúklinga.'
        },
        {
            icon: 'fa-user-nurse',
            title: 'Starfsfólk',
            content: 'Mælt með að bæta við 2 starfsfólki á næstu viku.'
        },
        {
            icon: 'fa-procedures',
            title: 'Sjúklingaástand',
            content: 'Tveir sjúklingar hafa sýnt miklar framfarir síðustu daga.'
        },
        {
            icon: 'fa-first-aid',
            title: 'Neyðarviðbragð',
            content: 'Neyðaræfing mælt með fyrir alla deild næstu viku.'
        },
        {
            icon: 'fa-calendar-check',
            title: 'Skipulag',
            content: 'Vaktaskipulag fyrir næsta mánuð tilbúið til samþykktar.'
        },
        {
            icon: 'fa-hands-helping',
            title: 'Umönnun',
            content: 'Íhuga að auka heimsóknartíma fyrir sjúklinga á deild 2.'
        },
        {
            icon: 'fa-heartbeat',
            title: 'Heilsufar',
            content: 'Þrír sjúklingar þurfa aukið eftirlit vegna hjartsláttartruflana.'
        }
    ];
    
    // Shuffle and take first 3
    return shuffleArray(insights).slice(0, 3);
}

// Shuffle array helper function
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Initialize language selector
function initializeLanguageSelector() {
    const languageButtons = document.querySelectorAll('.language-btn');
    
    languageButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            languageButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get selected language
            const lang = this.getAttribute('data-lang');
            
            // Show notification
            const langName = lang === 'is' ? 'Íslenska' : 'English';
            showToast('Tungumál', `Tungumál valið: ${langName}`, 'info');
            
            // In a real app, you would update UI text here
        });
    });
}

// Initialize AI Chat
function initializeAIChat() {
    const chatToggle = document.querySelector('.chat-toggle-btn');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    // Clear any existing messages
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // Show/hide chat
    if (chatToggle && chatContainer) {
        chatToggle.addEventListener('click', function() {
            chatContainer.classList.toggle('open');
            
            // Focus input when opening
            if (chatContainer.classList.contains('open')) {
                setTimeout(() => {
                    if (chatInput) chatInput.focus();
                }, 300);
            }
        });
    }
    
    // Close chat
    if (closeChat && chatContainer) {
        closeChat.addEventListener('click', function() {
            chatContainer.classList.remove('open');
        });
    }
    
    // Handle form submission
    if (chatForm && chatInput && chatMessages) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const message = chatInput.value.trim();
            if (!message) return;
            
            // Process user message
            processUserMessage(message);
        });
    }
}

/**
 * Process user message and generate AI response
 */
function processUserMessage(message) {
    // Show typing indicator
    showTypingIndicator(true);
    
    // Send message to server API
    fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Hide typing indicator
        showTypingIndicator(false);
        
        // Add AI response to chat with typing animation
        addMessageToChatWithTypingAnimation('assistant', data.response);
    })
    .catch(error => {
        console.error('Error getting AI response:', error);
        
        // Hide typing indicator
        showTypingIndicator(false);
        
        // Add fallback message
        const fallbackResponse = "Því miður get ég ekki svarað spurningunni þinni núna. Vinsamlegast reyndu aftur síðar.";
        addMessageToChat('assistant', fallbackResponse);
        
        // Scroll to bottom
        scrollToBottom();
    });
}

/**
 * Add a message to the chat with a typing animation
 */
function addMessageToChatWithTypingAnimation(sender, message) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    // Create timestamp
    const timestamp = new Date();
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    // Add sender icon (user or AI)
    const iconClass = sender === 'user' ? 'fa-user' : 'fa-robot';
    
    // Generate HTML for message
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="message-content">
            <div class="message-text typing-animation"></div>
            <div class="message-time">${formatTime(timestamp)}</div>
        </div>
    `;
    
    // Add to chat container
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
    
    // Get the message text element
    const messageTextElement = messageElement.querySelector('.message-text');
    
    // Simulate typing animation
    let index = 0;
    const typingSpeed = 30; // milliseconds per character
    
    function typeNextCharacter() {
        if (index < message.length) {
            // Add the next character
            messageTextElement.innerHTML += message.charAt(index);
            index++;
            
            // Scroll to bottom
            scrollToBottom();
            
            // Schedule the next character
            setTimeout(typeNextCharacter, typingSpeed);
        } else {
            // Typing complete, save to chat history
            saveChatMessage(sender, message, timestamp);
        }
    }
    
    // Start typing animation
    typeNextCharacter();
}

/**
 * Show or hide the typing indicator
 */
function showTypingIndicator(show) {
    // Remove existing typing indicators
    document.querySelectorAll('.typing-indicator').forEach(el => {
        el.remove();
    });
    
    if (show) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;
        
        // Create typing indicator element
        const typingElement = document.createElement('div');
        typingElement.className = 'message assistant typing-indicator';
        typingElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <div class="dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        
        // Add to the chat container
        chatContainer.appendChild(typingElement);
        
        // Scroll to bottom
        scrollToBottom();
    }
}

// Add chat message
function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom to show new message
    scrollToBottom();
}

// Add typing indicator
function addTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Create typing indicator if it doesn't exist
    if (!document.querySelector('.typing-indicator')) {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot typing-indicator';
        
        typingIndicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Check for quick Icelandic responses
function getQuickResponse(message) {
    // No pre-loaded responses, all messages will be sent to AI
    return null;
}

// Send message to AI
async function sendToAI(message) {
    try {
        debug('Sending to AI:', message);
        
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: message })
        });
        
        if (!response.ok) {
            throw new Error('Villa við að tengja við gervigreind');
        }
        
        const data = await response.json();
        debug('AI response:', data);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add AI response to chat
        addChatMessage('bot', data.result);
        
    } catch (error) {
        debug('AI error:', error);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add error message
        addChatMessage('bot', 'Því miður kom upp villa við að tengjast gervigreind. Vinsamlegast reyndu aftur síðar.');
        
        // Show error notification
        showToast('Villa', 'Ekki tókst að tengjast gervigreind', 'error');
    }
}

// Format AI response for better Icelandic display
function formatAIResponse(response) {
    // Fix potential Icelandic character issues if needed
    return response
        .replace(/th/g, 'þ')
        .replace(/ae/g, 'æ')
        .replace(/oe/g, 'ö');
}

/**
 * Scroll the chat container to the bottom
 */
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Format timestamp for display in chat messages
 * @param {Date} timestamp - The timestamp to format
 * @returns {string} The formatted time string
 */
function formatTime(timestamp) {
    if (!(timestamp instanceof Date)) {
        timestamp = new Date(timestamp);
    }
    
    return timestamp.toLocaleTimeString('is-IS', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

/**
 * Save chat message to history
 * @param {string} sender - The sender of the message
 * @param {string} message - The message content
 * @param {Date} timestamp - The message timestamp
 */
function saveChatMessage(sender, message, timestamp) {
    // Get existing chat history from localStorage or initialize empty array
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    
    // Add new message
    chatHistory.push({
        sender,
        message,
        timestamp: timestamp.toISOString()
    });
    
    // Keep only the most recent 50 messages
    while (chatHistory.length > 50) {
        chatHistory.shift();
    }
    
    // Save back to localStorage
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Get icon based on type
    let icon;
    switch (type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-times-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
        default:
            icon = 'fa-info-circle';
    }
    
    // Set content
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
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add close event
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Add CSS for the toast and typing indicator if not present
function addRequiredStyles() {
    // Check if styles already exist
    if (document.getElementById('nursecare-dynamic-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'nursecare-dynamic-styles';
    style.textContent = `
        /* Toast styles */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .toast {
            display: flex;
            align-items: center;
            background-color: white;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 12px 16px;
            min-width: 300px;
            animation: slide-in 0.3s ease;
        }
        
        @keyframes slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .toast-icon {
            margin-right: 12px;
            font-size: 20px;
        }
        
        .toast.success .toast-icon { color: #10b981; }
        .toast.error .toast-icon { color: #ef4444; }
        .toast.warning .toast-icon { color: #f59e0b; }
        .toast.info .toast-icon { color: #3b82f6; }
        
        .toast-content {
            flex: 1;
        }
        
        .toast-title {
            font-weight: 600;
            margin-bottom: 2px;
        }
        
        .toast-close {
            background: none;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 4px;
        }
        
        /* Typing indicator */
        .typing-dots {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            height: 20px;
        }
        
        .typing-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #d1d5db;
            display: inline-block;
            animation: typing-animation 1.4s infinite ease-in-out both;
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
                opacity: 0.6;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        /* Refresh button animation */
        .refresh-btn.rotating i {
            animation: rotate 0.8s linear infinite;
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        /* Loading spinner */
        .loading-spinner {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px;
            gap: 15px;
        }
        
        .loading-spinner i {
            font-size: 24px;
            color: #3b82f6;
        }
    `;
    
    document.head.appendChild(style);
}

// Call the function to add styles
addRequiredStyles();

// Added function to initialize all action buttons across the site
function initializeActionButtons() {
    // Select all buttons with action attributes
    const actionButtons = document.querySelectorAll('[data-action]');
    
    actionButtons.forEach(button => {
        if (!button.hasAttribute('data-initialized')) {
            button.setAttribute('data-initialized', 'true');
            
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const action = this.getAttribute('data-action');
                const target = this.getAttribute('data-target');
                const toggle = this.getAttribute('data-toggle');
                const url = this.getAttribute('href') || this.getAttribute('data-url');
                
                // Handle different action types
                if (action === 'modal' && target) {
                    const modal = document.querySelector(target);
                    if (modal) {
                        modal.classList.add('show');
                        document.body.classList.add('modal-open');
                    }
                } else if (action === 'navigate' && url) {
                    window.location.href = url;
                } else if (toggle) {
                    const targetElem = document.querySelector(toggle);
                    if (targetElem) {
                        targetElem.classList.toggle('show');
                    }
                } else if (action === 'delete' && target) {
                    // Show confirmation before delete
                    if (confirm('Ertu viss um að þú viljir eyða þessu?')) {
                        // Handle deletion - in a real app this would call an API
                        const targetElem = document.querySelector(target);
                        if (targetElem) {
                            targetElem.remove();
                            showToast('Staðfesting', 'Eytt með góðum árangri', 'success');
                        }
                    }
                }
                
                debug(`Button action triggered: ${action}`, { target, toggle, url });
            });
        }
    });
    
    // Fix close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal, [data-dismiss="modal"]');
    closeButtons.forEach(button => {
        if (!button.hasAttribute('data-initialized')) {
            button.setAttribute('data-initialized', 'true');
            
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                }
            });
        }
    });
    
    // Fix form submission buttons
    const formButtons = document.querySelectorAll('button[type="submit"]');
    formButtons.forEach(button => {
        if (!button.hasAttribute('data-initialized')) {
            button.setAttribute('data-initialized', 'true');
            
            button.addEventListener('click', function(e) {
                const form = this.closest('form');
                if (form) {
                    // If form has data-ajax attribute, handle it with AJAX
                    if (form.hasAttribute('data-ajax')) {
                        e.preventDefault();
                        // In a real app, this would submit the form with AJAX
                        showToast('Staðfesting', 'Form sent með góðum árangri', 'success');
                    }
                }
            });
        }
    });
}

// Initialize dropdowns
function initializeDropdowns() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        if (!toggle.hasAttribute('data-initialized')) {
            toggle.setAttribute('data-initialized', 'true');
            
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const dropdown = this.nextElementSibling;
                if (dropdown && dropdown.classList.contains('dropdown-menu')) {
                    dropdown.classList.toggle('show');
                }
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.dropdown-menu.show');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    });
}