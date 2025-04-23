import eventBus, { EVENTS } from './event-bus.js';
import { api, endpoints } from './api-client.js';
import notificationManager, { NOTIFICATION_TYPES } from './notifications.js';
import { formatTime, formatDate } from './utils.js';

// Chat module for staff messaging and AI chatbot
import { notify } from './notifications.js';
import { getCurrentUser } from './auth.js';

// Message types
const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    FILE: 'file',
    SYSTEM: 'system',
    AI: 'ai'
};

// Chat states
const CHAT_STATES = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected'
};

// Store messages and chat state
let messages = new Map(); // Map of conversations by ID
let chatState = CHAT_STATES.DISCONNECTED;
let currentConversation = null;
let aiTypingTimeout = null;

document.addEventListener('DOMContentLoaded', function() {
    const chatWindow = document.getElementById('ai-chat');
    const floatingBtn = document.getElementById('floating-chat-btn');
    const minimizeBtn = document.getElementById('minimize-chat');
    const closeBtn = document.getElementById('close-chat');
    const clearBtn = document.getElementById('clear-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // Initialize chat state
    let isChatOpen = false;
    let isChatMinimized = false;

    // Open chat window
    floatingBtn.addEventListener('click', () => {
        chatWindow.classList.add('open');
        isChatOpen = true;
        chatInput.focus();
    });

    // Minimize chat window
    minimizeBtn.addEventListener('click', () => {
        if (isChatMinimized) {
            chatWindow.classList.remove('minimized');
            isChatMinimized = false;
        } else {
            chatWindow.classList.add('minimized');
            isChatMinimized = true;
        }
    });

    // Close chat window
    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        isChatOpen = false;
    });

    // Clear chat history
    clearBtn.addEventListener('click', () => {
        chatMessages.innerHTML = '';
    });

    // Handle chat form submission
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            addMessage('user', message);
            chatInput.value = '';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Simulate AI response after a short delay
            setTimeout(() => {
                hideTypingIndicator();
                const response = processMessage(message);
                addMessage('assistant', response);
            }, 1000);
        }
    });

    // Add a message to the chat
    function addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = `<i class="fas fa-${sender === 'user' ? 'user' : 'user-md'}"></i>`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const senderName = document.createElement('div');
        senderName.className = 'message-sender';
        senderName.textContent = sender === 'user' ? 'You' : 'AI Nurse Assistant';
        
        const messageText = document.createElement('p');
        messageText.textContent = content;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageContent.appendChild(senderName);
        messageContent.appendChild(messageText);
        messageContent.appendChild(timestamp);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message assistant typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<i class="fas fa-user-md"></i>';
        
        const dots = document.createElement('div');
        dots.className = 'typing-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        
        indicator.appendChild(avatar);
        indicator.appendChild(dots);
        
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const indicator = chatMessages.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Process message and generate response
    function processMessage(message) {
        // Import the chatbot instance
        import('./chatbot.js').then(module => {
            const chatbot = module.default;
            return chatbot.processMessage(message);
        }).catch(error => {
            console.error('Error processing message:', error);
            return "I'm sorry, I encountered an error processing your message. Please try again.";
        });
    }
});

class ChatManager {
    constructor() {
        this.conversations = new Map();
        this.activeConversation = null;
        this.isInitialized = false;
        this.isChatbotEnabled = true;
        this.messageHandlers = new Map();
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Load existing conversations
            await this.loadConversations();

            // Set up WebSocket connection
            this.setupWebSocket();

            // Set up event listeners
            this.setupEventListeners();

            // Register message handlers
            this.registerMessageHandlers();

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize chat:', error);
        }
    }

    setupWebSocket() {
        // Implementation of WebSocket connection for real-time chat
        // This is a placeholder for the actual WebSocket implementation
    }

    setupEventListeners() {
        // Listen for new staff members being added
        eventBus.subscribe(EVENTS.STAFF_ADDED, (staff) => {
            this.createStaffConversation(staff.id);
        });

        // Listen for staff status changes
        eventBus.subscribe(EVENTS.STAFF_STATUS_CHANGED, (data) => {
            this.updateConversationStatus(data.staffId, data.status);
        });
    }

    registerMessageHandlers() {
        // Register handlers for different message types
        this.messageHandlers.set('SHIFT_REQUEST', this.handleShiftRequest.bind(this));
        this.messageHandlers.set('SCHEDULE_QUERY', this.handleScheduleQuery.bind(this));
        this.messageHandlers.set('PATIENT_INFO', this.handlePatientInfo.bind(this));
        this.messageHandlers.set('INVENTORY_QUERY', this.handleInventoryQuery.bind(this));
    }

    async loadConversations() {
        try {
            const response = await api.get(endpoints.chat.conversations);
            
            response.conversations.forEach(conv => {
                this.conversations.set(conv.id, {
                    ...conv,
                    messages: new Map()
                });
            });

            // Load recent messages for each conversation
            await this.loadRecentMessages();
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    async loadRecentMessages() {
        for (const conversation of this.conversations.values()) {
            try {
                const response = await api.get(endpoints.chat.messages(conversation.id));
                response.messages.forEach(msg => {
                    conversation.messages.set(msg.id, {
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    });
                });
            } catch (error) {
                console.error(`Failed to load messages for conversation ${conversation.id}:`, error);
            }
        }
    }

    async sendMessage(conversationId, content, type = 'TEXT') {
        try {
            const message = {
                content,
                type,
                timestamp: new Date(),
                senderId: 'current_user_id', // Replace with actual user ID
                conversationId
            };

            const response = await api.post(endpoints.chat.messages(conversationId), message);

            // Add message to local conversation
            const conversation = this.conversations.get(conversationId);
            if (conversation) {
                conversation.messages.set(response.message.id, response.message);
            }

            // Create notification for recipient
            await this.createMessageNotification(response.message);

            // Handle special message types
            if (this.messageHandlers.has(type)) {
                await this.messageHandlers.get(type)(message);
            }

            return response.message;
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }

    async createMessageNotification(message) {
        const conversation = this.conversations.get(message.conversationId);
        if (!conversation) return;

        await notificationManager.createNotification({
            type: NOTIFICATION_TYPES.STAFF_MESSAGE,
            priority: 'medium',
            title: `New message from ${message.senderName}`,
            message: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
            data: {
                conversationId: message.conversationId,
                messageId: message.id
            },
            userId: conversation.participantId // ID of the other participant
        });
    }

    // Special message type handlers
    async handleShiftRequest(message) {
        // Handle shift request messages
        // Implementation depends on your shift management system
    }

    async handleScheduleQuery(message) {
        // Handle schedule-related queries
        // Implementation depends on your scheduling system
    }

    async handlePatientInfo(message) {
        // Handle patient information requests
        // Implementation depends on your patient management system
    }

    async handleInventoryQuery(message) {
        // Handle inventory-related queries
        // Implementation depends on your inventory management system
    }

    // Chatbot-specific functionality
    async processChatbotMessage(message) {
        if (!this.isChatbotEnabled) return null;

        try {
            const response = await api.post(endpoints.chatbot.process, {
                message: message.content,
                context: {
                    conversationId: message.conversationId,
                    previousMessages: this.getConversationContext(message.conversationId)
                }
            });

            return response.reply;
        } catch (error) {
            console.error('Failed to process chatbot message:', error);
            return 'I apologize, but I am unable to process your request at the moment.';
        }
    }

    getConversationContext(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return [];

        // Get last 10 messages for context
        return Array.from(conversation.messages.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10)
            .reverse();
    }

    // Utility methods
    async markConversationAsRead(conversationId) {
        try {
            await api.post(endpoints.chat.markRead(conversationId));
            
            const conversation = this.conversations.get(conversationId);
            if (conversation) {
                conversation.unreadCount = 0;
            }
        } catch (error) {
            console.error('Failed to mark conversation as read:', error);
        }
    }

    async createStaffConversation(staffId) {
        try {
            const response = await api.post(endpoints.chat.conversations, {
                participantId: staffId,
                type: 'STAFF'
            });

            this.conversations.set(response.conversation.id, {
                ...response.conversation,
                messages: new Map()
            });

            return response.conversation;
        } catch (error) {
            console.error('Failed to create staff conversation:', error);
        }
    }

    updateConversationStatus(staffId, status) {
        // Find conversation with this staff member
        for (const conversation of this.conversations.values()) {
            if (conversation.participantId === staffId) {
                conversation.participantStatus = status;
                break;
            }
        }
    }

    // Getters
    getUnreadConversations() {
        return Array.from(this.conversations.values())
            .filter(conv => conv.unreadCount > 0);
    }

    getActiveConversations() {
        return Array.from(this.conversations.values())
            .filter(conv => conv.status === 'ACTIVE');
    }

    getConversationMessages(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return [];

        return Array.from(conversation.messages.values())
            .sort((a, b) => a.timestamp - b.timestamp);
    }
}

// Create singleton instance
const chatManager = new ChatManager();

// Initialize when module loads
chatManager.init();

export default chatManager;

// Example usage:
/*
import chatManager from './chat.js';

// Send a message
await chatManager.sendMessage(conversationId, 'Hello!');

// Send a shift request
await chatManager.sendMessage(conversationId, {
    shiftDate: '2025-04-24',
    startTime: '09:00',
    endTime: '17:00'
}, 'SHIFT_REQUEST');

// Get unread conversations
const unreadConvs = chatManager.getUnreadConversations();

// Mark conversation as read
await chatManager.markConversationAsRead(conversationId);
*/

/**
 * Send a message between users
 * @param {string} fromUser - Sender user ID
 * @param {string} toUser - Recipient user ID
 * @param {string} message - Message content
 * @param {string} type - Message type (from MESSAGE_TYPES)
 * @returns {Promise<Object>} Sent message
 */
export async function sendMessage(fromUser, toUser, message, type = MESSAGE_TYPES.TEXT) {
    try {
        const msg = {
            id: generateMessageId(),
            fromUser,
            toUser,
            content: message,
            type,
            timestamp: new Date(),
            status: 'sent'
        };

        // Get or create conversation
        const conversationId = getConversationId(fromUser, toUser);
        if (!messages.has(conversationId)) {
            messages.set(conversationId, []);
        }

        // Add to messages
        messages.get(conversationId).push(msg);

        // Save to storage
        saveMessages();

        // Update UI if this is current conversation
        if (conversationId === currentConversation) {
            appendMessageToUI(msg);
        }

        // Notify recipient
        notify(toUser, `New message from ${fromUser}`, 'CHAT', {
            priority: 1,
            data: { messageId: msg.id }
        });

        return msg;
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error('Failed to send message');
    }
}

/**
 * Get chat history for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Chat history
 */
export async function getChatHistory(userId) {
    try {
        const userChats = [];

        // Find all conversations involving user
        for (const [conversationId, conversation] of messages) {
            if (conversationId.includes(userId)) {
                const otherUser = conversationId
                    .split('_')
                    .find(id => id !== userId);

                userChats.push({
                    conversationId,
                    otherUser,
                    messages: conversation,
                    lastMessage: conversation[conversation.length - 1],
                    unreadCount: conversation.filter(m => 
                        m.toUser === userId && 
                        m.status !== 'read'
                    ).length
                });
            }
        }

        // Sort by last message timestamp
        userChats.sort((a, b) => 
            b.lastMessage?.timestamp - a.lastMessage?.timestamp
        );

        return userChats;
    } catch (error) {
        console.error('Error getting chat history:', error);
        throw new Error('Failed to get chat history');
    }
}

/**
 * Start an AI chat session
 * @param {string} userId - User ID
 * @param {string} prompt - Initial prompt
 * @returns {Promise<Object>} AI response
 */
export async function startAIChat(userId, prompt) {
    try {
        const conversationId = `ai_${userId}`;
        
        // Create initial message
        const userMsg = {
            id: generateMessageId(),
            fromUser: userId,
            toUser: 'ai',
            content: prompt,
            type: MESSAGE_TYPES.TEXT,
            timestamp: new Date(),
            status: 'sent'
        };

        // Initialize conversation if needed
        if (!messages.has(conversationId)) {
            messages.set(conversationId, []);
        }

        // Add user message
        messages.get(conversationId).push(userMsg);

        // Show typing indicator
        showAITyping();

        // Simulate AI processing time (replace with actual API call)
        const response = await simulateAIResponse(prompt);

        // Create AI response message
        const aiMsg = {
            id: generateMessageId(),
            fromUser: 'ai',
            toUser: userId,
            content: response,
            type: MESSAGE_TYPES.AI,
            timestamp: new Date(),
            status: 'sent'
        };

        // Add AI message
        messages.get(conversationId).push(aiMsg);

        // Hide typing indicator
        hideAITyping();

        // Update UI if this is current conversation
        if (conversationId === currentConversation) {
            appendMessageToUI(aiMsg);
        }

        // Save to storage
        saveMessages();

        return aiMsg;
    } catch (error) {
        console.error('Error in AI chat:', error);
        hideAITyping();
        throw new Error('Failed to get AI response');
    }
}

/**
 * Handle chat commands
 * @param {string} command - Command to handle
 * @returns {Promise<string>} Command response
 */
export async function handleChatCommand(command) {
    const cmd = command.toLowerCase().trim();

    if (cmd.startsWith('/help')) {
        return `Available commands:
/clear - Clear chat history
/status - Show connection status
/search [term] - Search chat history
/export - Export chat history
/mute - Mute notifications
/unmute - Unmute notifications`;
    }

    if (cmd === '/clear') {
        if (currentConversation) {
            messages.set(currentConversation, []);
            saveMessages();
            clearChatUI();
        }
        return 'Chat cleared';
    }

    if (cmd === '/status') {
        return `Chat Status: ${chatState}`;
    }

    if (cmd.startsWith('/search ')) {
        const term = cmd.slice(8);
        const results = searchChatHistory(term);
        return `Found ${results.length} messages containing "${term}"`;
    }

    if (cmd === '/export') {
        exportChatHistory();
        return 'Chat history exported';
    }

    if (cmd === '/mute') {
        // Implement mute logic
        return 'Chat notifications muted';
    }

    if (cmd === '/unmute') {
        // Implement unmute logic
        return 'Chat notifications unmuted';
    }

    return 'Unknown command. Type /help for available commands.';
}

// Helper functions

/**
 * Generate unique message ID
 * @returns {string} Message ID
 */
function generateMessageId() {
    return 'msg_' + Date.now() + Math.random().toString(36).substr(2, 9);
}

/**
 * Get unique conversation ID for two users
 * @param {string} user1 - First user ID
 * @param {string} user2 - Second user ID
 * @returns {string} Conversation ID
 */
function getConversationId(user1, user2) {
    return [user1, user2].sort().join('_');
}

/**
 * Save messages to storage
 */
function saveMessages() {
    try {
        const data = {};
        for (const [id, conversation] of messages) {
            data[id] = conversation;
        }
        localStorage.setItem('chatMessages', JSON.stringify(data));
    } catch (error) {
        console.error('Error saving messages:', error);
    }
}

/**
 * Load messages from storage
 */
function loadMessages() {
    try {
        const saved = localStorage.getItem('chatMessages');
        if (saved) {
            const data = JSON.parse(saved);
            messages.clear();
            for (const [id, conversation] of Object.entries(data)) {
                messages.set(id, conversation.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                })));
            }
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        messages.clear();
    }
}

/**
 * Append message to chat UI
 * @param {Object} message - Message to append
 */
function appendMessageToUI(message) {
    const container = document.querySelector('.chat-messages');
    if (!container) return;

    const element = document.createElement('div');
    element.className = `chat-message ${message.fromUser === getCurrentUser()?.id ? 'sent' : 'received'}`;
    element.setAttribute('data-id', message.id);

    // Special styling for AI messages
    if (message.type === MESSAGE_TYPES.AI) {
        element.classList.add('ai-message');
    }

    element.innerHTML = `
        <div class="message-content">
            ${message.type === MESSAGE_TYPES.AI ? '<i class="fas fa-robot"></i>' : ''}
            <p>${message.content}</p>
            <span class="message-time">${formatTimestamp(message.timestamp)}</span>
        </div>
    `;

    container.appendChild(element);
    container.scrollTop = container.scrollHeight;
}

/**
 * Clear chat UI
 */
function clearChatUI() {
    const container = document.querySelector('.chat-messages');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Search chat history
 * @param {string} term - Search term
 * @returns {Array} Matching messages
 */
function searchChatHistory(term) {
    const results = [];
    const userId = getCurrentUser()?.id;
    if (!userId) return results;

    for (const conversation of messages.values()) {
        conversation.forEach(msg => {
            if ((msg.fromUser === userId || msg.toUser === userId) &&
                msg.content.toLowerCase().includes(term.toLowerCase())) {
                results.push(msg);
            }
        });
    }

    return results;
}

/**
 * Export chat history
 */
function exportChatHistory() {
    const userId = getCurrentUser()?.id;
    if (!userId) return;

    let csv = 'Date,From,To,Message\n';

    for (const conversation of messages.values()) {
        conversation.forEach(msg => {
            if (msg.fromUser === userId || msg.toUser === userId) {
                csv += `${msg.timestamp.toISOString()},${msg.fromUser},${msg.toUser},"${msg.content.replace(/"/g, '""')}"\n`;
            }
        });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_history_${formatDate(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Show AI typing indicator
 */
function showAITyping() {
    clearTimeout(aiTypingTimeout);
    
    const container = document.querySelector('.chat-messages');
    if (!container) return;

    const element = document.createElement('div');
    element.className = 'chat-message received ai-typing';
    element.innerHTML = `
        <div class="message-content">
            <i class="fas fa-robot"></i>
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    container.appendChild(element);
    container.scrollTop = container.scrollHeight;
}

/**
 * Hide AI typing indicator
 */
function hideAITyping() {
    const indicator = document.querySelector('.ai-typing');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Simulate AI response (temporary)
 * @param {string} prompt - User prompt
 * @returns {Promise<string>} AI response
 */
async function simulateAIResponse(prompt) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple response templates (replace with actual AI integration)
    const responses = [
        "I understand you're asking about {topic}. Let me help with that.",
        "Based on your question about {topic}, here's what I can tell you.",
        "Regarding {topic}, here are some key points to consider.",
        "Let me assist you with your inquiry about {topic}."
    ];

    // Extract topic from prompt
    const topic = prompt.split(' ').slice(0, 3).join(' ');

    // Select random response template
    const template = responses[Math.floor(Math.random() * responses.length)];

    return template.replace('{topic}', topic);
}

/**
 * Format timestamp for display
 * @param {Date} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(timestamp, today)) {
        return timestamp.toLocaleTimeString('is-IS', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (isSameDay(timestamp, yesterday)) {
        return 'Yesterday ' + timestamp.toLocaleTimeString('is-IS', {
            hour: '2-digit',
            minute: '2-digit'
        });
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
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}