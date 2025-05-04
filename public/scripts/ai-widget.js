// AI Widget for easy access to OpenAI integration
document.addEventListener("DOMContentLoaded", () => {
  console.log("AI Widget initialized");
  
  // Elements
  const button = document.getElementById("generate-ai-report");
  const output = document.getElementById("ai-output");
  const widgetToggle = document.getElementById("ai-widget-toggle");
  const widgetContainer = document.querySelector(".ai-widget-container");
  const widgetInput = document.getElementById("ai-widget-input");
  const widgetSend = document.getElementById("ai-widget-send");
  const widgetMessages = document.getElementById("ai-widget-messages");
  const widgetClear = document.getElementById("ai-clear-btn");
  const widgetMinimize = document.getElementById("ai-minimize-btn");
  
  // Widget visibility toggle
  if (widgetToggle) {
    widgetToggle.addEventListener("click", () => {
      console.debug("Widget toggle clicked");
      widgetContainer.classList.toggle("open");
      if (widgetContainer.classList.contains("open")) {
        widgetInput.focus();
        scrollToBottom();
      }
    });
  }
  
  // Minimize widget
  if (widgetMinimize) {
    widgetMinimize.addEventListener("click", () => {
      console.debug("Widget minimize clicked");
      widgetContainer.classList.remove("open");
    });
  }
  
  // Clear chat history
  if (widgetClear) {
    widgetClear.addEventListener("click", () => {
      console.debug("Widget clear clicked");
      widgetMessages.innerHTML = "";
      addSystemMessage("Chat history has been cleared. How can I help you today?");
    });
  }
  
  // Enable/disable send button based on input
  if (widgetInput) {
    widgetInput.addEventListener("input", () => {
      widgetSend.disabled = !widgetInput.value.trim();
      
      // Auto resize the textarea
      widgetInput.style.height = "auto";
      widgetInput.style.height = (widgetInput.scrollHeight) + "px";
    });
    
    // Handle Enter key
    widgetInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!widgetSend.disabled) {
          sendMessage();
        }
      }
    });
  }
  
  // Send message
  if (widgetSend) {
    widgetSend.addEventListener("click", sendMessage);
  }
  
  // Generate report button in dashboard
  if (button && output) {
    button.addEventListener("click", async () => {
      console.log("Generating AI report");
      output.textContent = "Asking AI...";
      
      try {
        const response = await generateAIResponse("Summarize today's nursing home shift and provide key observations.");
        output.textContent = response;
      } catch (err) {
        console.error("Error generating report:", err);
        output.textContent = "Failed to generate AI report. Please try again later.";
      }
    });
  }
  
  // Add initial system message
  if (widgetMessages && widgetMessages.children.length === 0) {
    addSystemMessage("Hello! I'm your NurseCare AI assistant. How can I help you today?");
  }
  
  // Functions
  async function sendMessage() {
    const messageText = widgetInput.value.trim();
    if (!messageText) return;
    
    // Add user message to chat
    addUserMessage(messageText);
    
    // Clear input
    widgetInput.value = "";
    widgetInput.style.height = "auto";
    widgetSend.disabled = true;
    
    // Show typing indicator
    addTypingIndicator();
    
    try {
      // Generate AI response
      const response = await generateAIResponse(messageText);
      
      // Remove typing indicator
      removeTypingIndicator();
      
      // Add AI response to chat
      addAssistantMessage(response);
    } catch (error) {
      console.error("Error sending message:", error);
      removeTypingIndicator();
      addAssistantMessage("I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.");
    }
  }
  
  async function generateAIResponse(prompt) {
    console.debug("Generating AI response for:", prompt);
    
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          context: { 
            date: new Date().toLocaleDateString('is-IS'),
            page: window.location.pathname
          }
        })
      });
      
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      
      const data = await res.json();
      console.debug("AI response received:", data);
      
      return data.summary || data.result || "No response from AI.";
    } catch (err) {
      console.error("Error in AI request:", err);
      throw err;
    }
  }
  
  function addUserMessage(text) {
    const messageElement = createMessageElement("user", text);
    widgetMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  function addAssistantMessage(text) {
    const messageElement = createMessageElement("assistant", text);
    widgetMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  function addSystemMessage(text) {
    const messageElement = createMessageElement("system", text);
    widgetMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  function createMessageElement(role, text) {
    const message = document.createElement("div");
    message.className = `message ${role}-message`;
    
    let avatarIcon = "fa-robot";
    if (role === "user") {
      avatarIcon = "fa-user";
    } else if (role === "system") {
      avatarIcon = "fa-info-circle";
    }
    
    const time = new Date().toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' });
    
    message.innerHTML = `
      <div class="message-avatar">
        <i class="fas ${avatarIcon}"></i>
      </div>
      <div class="message-content">
        <div class="message-text">${text}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
    
    return message;
  }
  
  function addTypingIndicator() {
    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.id = "typing-indicator";
    typing.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    widgetMessages.appendChild(typing);
    scrollToBottom();
  }
  
  function removeTypingIndicator() {
    const typing = document.getElementById("typing-indicator");
    if (typing) {
      typing.remove();
    }
  }
  
  function scrollToBottom() {
    if (widgetMessages) {
      widgetMessages.scrollTop = widgetMessages.scrollHeight;
    }
  }
});