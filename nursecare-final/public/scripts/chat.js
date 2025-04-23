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