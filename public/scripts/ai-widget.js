// AI Widget for easy access to OpenAI integration
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Global error:', { msg, url, lineNo, columnNo, error });
  return false;
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("AI Widget initialized");
  // Elements
  const button = document.getElementById("generate-ai-report");
  const output = document.getElementById("ai-output");
  const aiInput = document.getElementById("ai-input");
  const askAiSimpleBtn = document.getElementById("ask-ai-btn");
  const widgetToggle = document.getElementById("ai-widget-toggle");
  const widgetContainer = document.querySelector(".ai-widget-container");
  const widgetInput = document.getElementById("ai-widget-input");
  const widgetSend = document.getElementById("ai-widget-send");
  const widgetMessages = document.getElementById("ai-widget-messages");
  const widgetClear = document.getElementById("ai-clear-btn");
  const widgetMinimize = document.getElementById("ai-minimize-btn");
  const askAiAssistantBtn = document.getElementById("ask-ai-assistant-btn");
  const askAiBtn = document.getElementById("ask-ai-btn");
  const openAiChatBtn = document.getElementById("open-ai-chat-btn");

  // Initialize the simple AI output with welcome message
  if (output) {
    output.textContent = "Welcome! How can I assist you today?";
  }

  // Handle simple AI input field enter key press
  if (aiInput) {
    aiInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSimpleAiQuery(aiInput.value);
      }
    });
  }

  // Handle simple Ask AI button click
  if (askAiSimpleBtn && aiInput) {
    askAiSimpleBtn.addEventListener("click", () => {
      handleSimpleAiQuery(aiInput.value);
    });
  }

  // Process the simple AI query
  async function handleSimpleAiQuery(query) {
    if (!query.trim() || !output) return;
    
    const userMessage = query.trim();
    
    // Display user message
    output.innerHTML = `<strong>You:</strong> ${userMessage}\n\n<strong>AI:</strong> Thinking...`;
    
    try {
      const response = await generateAIResponse(userMessage);
      output.innerHTML = `<strong>You:</strong> ${userMessage}\n\n<strong>AI:</strong> ${response}`;
    } catch (error) {
      console.error("Error in AI query:", error);
      output.innerHTML = `<strong>You:</strong> ${userMessage}\n\n<strong>AI:</strong> AI is unavailable right now.`;
    }
    
    if (aiInput) {
      aiInput.value = "";
    }
  }

  // Widget visibility toggle
  if (widgetToggle && widgetContainer && widgetInput) {
    widgetToggle.addEventListener("click", () => {
      console.debug("Widget toggle clicked");
      widgetContainer.classList.toggle("open");
      if (widgetContainer.classList.contains("open")) {
        widgetInput.focus();
        scrollToBottom();
      }
    });
  }

  // Ask AI Assistant button in the AI widget section
  if (askAiAssistantBtn && widgetContainer && widgetInput) {
    askAiAssistantBtn.addEventListener("click", () => {
      console.debug("Ask AI Assistant button clicked");
      widgetContainer.classList.add("open");
      setTimeout(() => {
        widgetInput.focus();
        scrollToBottom();
      }, 300);
    });
  }

  // Quick action Ask AI button
  if (askAiBtn && widgetContainer && widgetInput) {
    askAiBtn.addEventListener("click", () => {
      console.debug("Ask AI button clicked from quick actions");
      widgetContainer.classList.add("open");
      setTimeout(() => {
        widgetInput.focus();
        scrollToBottom();
      }, 300);
    });
  }

  // Open AI chat button in the AI Assistant card
  if (openAiChatBtn && widgetContainer && widgetInput) {
    openAiChatBtn.addEventListener("click", () => {
      console.debug("Open AI chat button clicked");
      widgetContainer.classList.add("open");
      setTimeout(() => {
        widgetInput.focus();
        scrollToBottom();
      }, 300);
    });
  }

  // Minimize widget
  if (widgetMinimize && widgetContainer) {
    widgetMinimize.addEventListener("click", () => {
      console.debug("Widget minimize clicked");
      widgetContainer.classList.remove("open");
    });
  }

  // Clear chat history
  if (widgetClear && widgetMessages) {
    widgetClear.addEventListener("click", () => {
      console.debug("Widget clear clicked");
      widgetMessages.innerHTML = "";
      addSystemMessage("Chat history has been cleared. How can I help you today?");
    });
  }

  // Enable/disable send button based on input
  if (widgetInput && widgetSend) {
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
  if (widgetSend && widgetInput) {
    widgetSend.addEventListener("click", () => {
      console.debug("Widget send clicked");
      sendMessage();
    });
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
    if (!widgetInput || !widgetMessages) return;
    const messageText = widgetInput.value.trim();
    if (!messageText) return;
    addUserMessage(messageText);
    widgetInput.value = "";
    widgetInput.style.height = "auto";
    widgetSend.disabled = true;
    addTypingIndicator();
    try {
      const response = await generateAIResponse(messageText);
      removeTypingIndicator();
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