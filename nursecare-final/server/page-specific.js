// Page-specific AI functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page-specific AI features
    initializePageAI();
    
    // Initialize chat functionality
    initializeChat();
});

function initializePageAI() {
    // Get the current page name from the URL
    const pageName = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Initialize AI features based on the current page
    switch(pageName) {
        case 'reports':
            initializeReportsAI();
            break;
        case 'incidents':
            initializeIncidentsAI();
            break;
        case 'staff':
            initializeStaffAI();
            break;
        case 'inventory':
            initializeInventoryAI();
            break;
        case 'queries':
            initializeQueriesAI();
            break;
        case 'statistics':
            initializeStatisticsAI();
            break;
        case 'notifications':
            initializeNotificationsAI();
            break;
        case 'schedule':
            initializeScheduleAI();
            break;
        case 'settings':
            initializeSettingsAI();
            break;
        default:
            // Default AI initialization for index page
            initializeDashboardAI();
    }
}

function initializeChat() {
    const chatContainer = document.getElementById('chat-container');
    const chatToggle = document.getElementById('chat-toggle');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendMessage = document.getElementById('send-message');
    const chatMessages = document.getElementById('chat-messages');
    
    // Toggle chat visibility
    if (chatToggle) {
        chatToggle.addEventListener('click', function() {
            chatContainer.classList.toggle('show');
        });
    }
    
    // Close chat
    if (closeChat) {
        closeChat.addEventListener('click', function() {
            chatContainer.classList.remove('show');
        });
    }
    
    // Send message
    if (sendMessage && chatInput) {
        sendMessage.addEventListener('click', function() {
            const message = chatInput.value.trim();
            if (message) {
                sendChatMessage(message);
                chatInput.value = '';
            }
        });
        
        // Handle Enter key
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = this.value.trim();
                if (message) {
                    sendChatMessage(message);
                    this.value = '';
                }
            }
        });
    }
}

async function sendChatMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    try {
        // Show typing indicator
        const typingIndicator = addTypingIndicator();
        
        // Call AI API
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: message,
                context: getPageContext()
            })
        });
        
        // Remove typing indicator
        typingIndicator.remove();
        
        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }
        
        const data = await response.json();
        
        // Add AI response to chat
        addMessageToChat('ai', data.result);
        
    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('error', 'Villa kom upp við að senda skilaboð. Vinsamlegast reyndu aftur.');
    }
}

function addMessageToChat(type, content) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    if (type === 'ai') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
    } else if (type === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${content}</p>
            </div>
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
        `;
    } else if (type === 'error') {
        messageDiv.innerHTML = `
            <div class="message-content error">
                <p>${content}</p>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv;
}

function getPageContext() {
    // Get the current page name
    const pageName = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Return context based on the page
    const contexts = {
        'reports': 'Vaktarskýrslur og skjöl',
        'incidents': 'Atvik og viðburðir',
        'staff': 'Starfsfólk og vaktaskipulag',
        'inventory': 'Birgðir og vörur',
        'queries': 'Fyrirspurnir og leit',
        'statistics': 'Tölfræði og greiningar',
        'notifications': 'Tilkynningar og viðvaranir',
        'schedule': 'Vaktaskipulag og tímaskráning',
        'settings': 'Stillingar og kerfiskonfigurering',
        'index': 'Yfirlit og stjórnun'
    };
    
    return contexts[pageName] || 'Almennt';
}

// Page-specific AI initializations
function initializeReportsAI() {
    // Add AI functionality for reports page
    console.log('Initializing Reports AI...');
}

function initializeIncidentsAI() {
    // Add AI functionality for incidents page
    console.log('Initializing Incidents AI...');
}

function initializeStaffAI() {
    // Add AI functionality for staff page
    console.log('Initializing Staff AI...');
}

function initializeInventoryAI() {
    // Add AI functionality for inventory page
    console.log('Initializing Inventory AI...');
}

function initializeQueriesAI() {
    // Add AI functionality for queries page
    console.log('Initializing Queries AI...');
}

function initializeStatisticsAI() {
    // Add AI functionality for statistics page
    console.log('Initializing Statistics AI...');
}

function initializeNotificationsAI() {
    // Add AI functionality for notifications page
    console.log('Initializing Notifications AI...');
}

function initializeScheduleAI() {
    // Add AI functionality for schedule page
    console.log('Initializing Schedule AI...');
}

function initializeSettingsAI() {
    // Add AI functionality for settings page
    console.log('Initializing Settings AI...');
}

function initializeDashboardAI() {
    // Add AI functionality for dashboard page
    console.log('Initializing Dashboard AI...');
} 