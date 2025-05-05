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
  // Fix: Use getElementById instead of querySelector for more reliable selection
  const widgetContainer = document.getElementById("ai-widget-container");
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

  // Widget visibility toggle - Fix: Added proper checks and error handling
  if (widgetToggle && widgetContainer) {
    widgetToggle.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      console.debug("Widget toggle clicked");
      if (widgetContainer) {
        widgetContainer.classList.toggle("open");
        if (widgetContainer.classList.contains("open") && widgetInput) {
          setTimeout(() => {
            widgetInput.focus();
            scrollToBottom();
          }, 100);
        }
      } else {
        console.error("Widget container not found");
      }
    });
  } else {
    console.warn("Widget toggle button or container not found", {
      toggle: widgetToggle,
      container: widgetContainer
    });
  }

  // Ask AI Assistant button in the AI widget section
  if (askAiAssistantBtn && widgetContainer) {
    askAiAssistantBtn.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      console.debug("Ask AI Assistant button clicked");
      if (widgetContainer) {
        widgetContainer.classList.add("open");
        if (widgetInput) {
          setTimeout(() => {
            widgetInput.focus();
            scrollToBottom();
          }, 300);
        }
      }
    });
  }

  // Quick action Ask AI button
  if (askAiBtn && widgetContainer) {
    askAiBtn.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      console.debug("Ask AI button clicked from quick actions");
      if (widgetContainer) {
        widgetContainer.classList.add("open");
        if (widgetInput) {
          setTimeout(() => {
            widgetInput.focus();
            scrollToBottom();
          }, 300);
        }
      }
    });
  }

  // Open AI chat button in the AI Assistant card
  if (openAiChatBtn && widgetContainer) {
    openAiChatBtn.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      console.debug("Open AI chat button clicked");
      if (widgetContainer) {
        widgetContainer.classList.add("open");
        if (widgetInput) {
          setTimeout(() => {
            widgetInput.focus();
            scrollToBottom();
          }, 300);
        }
      }
    });
  }

  // Minimize widget - Fix: Added proper error handling and improved functionality
  if (widgetMinimize && widgetContainer) {
    widgetMinimize.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      e.stopPropagation(); // Stop event propagation
      console.debug("Widget minimize clicked");
      if (widgetContainer) {
        widgetContainer.classList.remove("open");
      }
    });
  } else {
    console.warn("Minimize button or container not found", {
      minimize: widgetMinimize,
      container: widgetContainer
    });
  }

  // Clear chat history
  if (widgetClear && widgetMessages) {
    widgetClear.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      console.debug("Widget clear clicked");
      if (widgetMessages) {
        widgetMessages.innerHTML = "";
        addSystemMessage("Chat history has been cleared. How can I help you today?");
      }
    });
  }

  // Enable/disable send button based on input
  if (widgetInput && widgetSend) {
    widgetInput.addEventListener("input", () => {
      if (widgetSend) {
        widgetSend.disabled = !widgetInput.value.trim();
        // Auto resize the textarea
        widgetInput.style.height = "auto";
        widgetInput.style.height = (widgetInput.scrollHeight) + "px";
      }
    });
    // Handle Enter key
    widgetInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (widgetSend && !widgetSend.disabled) {
          sendMessage();
        }
      }
    });
  }

  // Send message - Fix: Added proper checks and error handling
  if (widgetSend && widgetInput) {
    widgetSend.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      console.debug("Widget send clicked");
      sendMessage();
    });
  } else {
    console.warn("Send button or input not found", {
      send: widgetSend,
      input: widgetInput
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
    if (!widgetInput || !widgetMessages) {
      console.error("Missing required elements for sending message");
      return;
    }
    
    const messageText = widgetInput.value.trim();
    if (!messageText) return;
    
    addUserMessage(messageText);
    widgetInput.value = "";
    widgetInput.style.height = "auto";
    
    if (widgetSend) {
      widgetSend.disabled = true;
    }
    
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
    if (!widgetMessages) return;
    const messageElement = createMessageElement("user", text);
    widgetMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  function addAssistantMessage(text) {
    if (!widgetMessages) return;
    const messageElement = createMessageElement("assistant", text);
    widgetMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  function addSystemMessage(text) {
    if (!widgetMessages) return;
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
    if (!widgetMessages) return;
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