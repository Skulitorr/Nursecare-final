// AI Widget for easy access to OpenAI integration
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Global error:', { msg, url, lineNo, columnNo, error });
  return false;
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("AI Widget initialized");
  
  // Toast notification system
  function showToast(title, message, type = 'info') {
    console.log(`Toast: ${title} - ${message} (${type})`);
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas fa-${icon}"></i>
      </div>
      <div class="toast-content">
        <h4 class="toast-title">${title}</h4>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close notification">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
      });
    }
    
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-hide'), 5000);
    setTimeout(() => toast.remove(), 5300);
  }

  // Elements - Main AI Widget elements (floating widget)
  const widgetToggle = document.getElementById("ai-widget-toggle");
  const widgetContainer = document.getElementById("ai-widget-container");
  const widgetInput = document.getElementById("ai-widget-input");
  const widgetSend = document.getElementById("ai-widget-send");
  const widgetMessages = document.getElementById("ai-widget-messages");
  const widgetClear = document.getElementById("ai-clear-btn");
  const widgetMinimize = document.getElementById("ai-minimize-btn");
  
  // Elements - Dashboard AI elements (embedded in page)
  const generateReportBtn = document.getElementById("generate-ai-report");
  const aiOutput = document.getElementById("ai-output");
  const aiInput = document.getElementById("ai-input");
  const askAiSimpleBtn = document.getElementById("ask-ai-btn");
  const askAiAssistantBtn = document.getElementById("ask-ai-assistant-btn");
  const openAiChatBtn = document.getElementById("open-ai-chat-btn");
  
  // Elements - Other dashboard buttons
  const clearAlertsBtn = document.getElementById("clear-alerts-btn");
  const refreshStatsBtn = document.getElementById("refresh-stats-btn");
  const logoutBtn = document.getElementById("logoutBtn");
  const updateInventoryBtn = document.getElementById("update-inventory-btn");
  const viewShiftBtn = document.getElementById("view-shift-btn");
  const handoverBtn = document.getElementById("handover-btn");
  const addStaffBtn = document.getElementById("add-staff-btn");
  const createScheduleBtn = document.getElementById("create-schedule-btn");
  const updateAllInventoryBtn = document.getElementById("update-all-inventory-btn");
  
  // Initialize dashboard AI output with welcome message if it exists
  if (aiOutput) {
    aiOutput.innerHTML = "<p>Velkomin(n) í NurseCare gervigreindaraðstoðarmann 👋 — hvernig get ég hjálpað þér í dag?</p>";
  }

  // DASHBOARD BUTTONS - Handle standard dashboard buttons
  if (clearAlertsBtn) {
    clearAlertsBtn.addEventListener("click", (e) => {
      console.log("Clear alerts button clicked");
      showToast("Viðvaranir hreinsaðar", "Allar viðvaranir hafa verið hreinsaðar", "success");
      
      // Find and clear alert items
      const alertList = document.querySelector('.alert-list');
      if (alertList) {
        alertList.innerHTML = '<p>Engar virkar viðvaranir á þessari stundu.</p>';
      }
    });
  }
  
  if (refreshStatsBtn) {
    refreshStatsBtn.addEventListener("click", (e) => {
      console.log("Refresh statistics button clicked");
      showToast("Uppfærir tölfræði", "Tölfræðigögn eru að uppfærast...", "info");
      
      // Show loading animation
      if (refreshStatsBtn.innerHTML.indexOf('loading') === -1) {
        refreshStatsBtn.innerHTML += ' <span class="loading"></span>';
      }
      
      // Remove loading after delay
      setTimeout(() => {
        refreshStatsBtn.innerHTML = refreshStatsBtn.innerHTML.replace(' <span class="loading"></span>', '');
        showToast("Tölfræði uppfærð", "Tölfræðigögn hafa verið uppfærð", "success");
      }, 1500);
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      console.log("Logout button clicked");
      showToast("Logging out", "You are being logged out...", "info");
      
      // Perform logout
      setTimeout(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
      }, 1000);
    });
  }
  
  if (updateInventoryBtn) {
    updateInventoryBtn.addEventListener("click", (e) => {
      console.log("Update inventory button clicked");
      showToast("Inventory update", "Inventory data is being refreshed", "info");
    });
  }
  
  if (viewShiftBtn) {
    viewShiftBtn.addEventListener("click", (e) => {
      console.log("View shift button clicked");
      showToast("Shift overview", "Viewing today's shift details", "info");
    });
  }
  
  if (handoverBtn) {
    handoverBtn.addEventListener("click", (e) => {
      console.log("Handover button clicked");
      showToast("Shift handover", "Preparing shift handover documentation", "info");
    });
  }
  
  if (addStaffBtn) {
    addStaffBtn.addEventListener("click", (e) => {
      console.log("Add staff button clicked");
      showToast("Staff management", "Opening add staff form", "info");
    });
  }
  
  if (createScheduleBtn) {
    createScheduleBtn.addEventListener("click", (e) => {
      console.log("Create schedule button clicked");
      showToast("Schedule creation", "Opening schedule creation wizard", "info");
    });
  }
  
  if (updateAllInventoryBtn) {
    updateAllInventoryBtn.addEventListener("click", (e) => {
      console.log("Update all inventory button clicked");
      showToast("Inventory update", "Starting full inventory audit", "info");
    });
  }
  
  // DASHBOARD AI INPUT - Handle simple AI input field enter key press
  if (aiInput) {
    aiInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSimpleAiQuery(aiInput.value);
      }
    });
  }

  // DASHBOARD AI BUTTON - Handle direct Ask AI button click
  if (askAiSimpleBtn && aiInput) {
    askAiSimpleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Ask AI button clicked");
      handleSimpleAiQuery(aiInput.value);
    });
  }

  // Process the simple AI query for dashboard AI
  async function handleSimpleAiQuery(query) {
    if (!query || !query.trim() || !aiOutput) return;
    
    const userMessage = query.trim();
    console.log("Processing AI query:", userMessage);
    
    // Save input and disable
    let originalValue = "";
    if (aiInput) {
      originalValue = aiInput.value;
      aiInput.value = "";
      aiInput.disabled = true;
    }
    
    if (askAiSimpleBtn) {
      askAiSimpleBtn.disabled = true;
    }
    
    // Display user message and thinking indicator
    aiOutput.innerHTML = `<p><strong>Þú:</strong> ${userMessage}</p><p><strong>AI:</strong> 🧠 Hugsa...</p>`;
    
    try {
      const response = await generateAIResponse(userMessage, "dashboard_ai_widget");
      aiOutput.innerHTML = `<p><strong>Þú:</strong> ${userMessage}</p><p><strong>AI:</strong> ${response}</p>`;
    } catch (error) {
      console.error("Error in AI query:", error);
      aiOutput.innerHTML = `<p><strong>Þú:</strong> ${userMessage}</p><p><strong>AI:</strong> ⚠️ Gervigreindin er tímabundið óaðgengileg. Vinsamlegast reyndu aftur síðar.</p>`;
    } finally {
      // Re-enable controls
      if (aiInput) {
        aiInput.disabled = false;
        aiInput.focus();
      }
      
      if (askAiSimpleBtn) {
        askAiSimpleBtn.disabled = false;
      }
    }
  }

  // WIDGET TOGGLE - Control visibility of the floating widget
  if (widgetToggle && widgetContainer) {
    widgetToggle.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default behavior
      console.log("Widget toggle clicked");
      
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
    console.warn("Widget toggle button or container not found");
  }

  // DASHBOARD AI WIDGET BUTTONS - AI Widget triggers from various buttons
  
  // Ask AI Assistant button in the AI widget section
  if (askAiAssistantBtn && widgetContainer) {
    askAiAssistantBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Ask AI Assistant button clicked");
      
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

  // Open AI chat button in dashboard cards
  if (openAiChatBtn && widgetContainer) {
    openAiChatBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Open AI chat button clicked");
      
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

  // WIDGET CONTROLS - Handle widget-specific controls
  
  // Minimize widget button
  if (widgetMinimize && widgetContainer) {
    widgetMinimize.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Widget minimize clicked");
      
      if (widgetContainer) {
        widgetContainer.classList.remove("open");
      }
    });
  }

  // Clear chat history button
  if (widgetClear && widgetMessages) {
    widgetClear.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Widget clear clicked");
      
      if (widgetMessages) {
        widgetMessages.innerHTML = "";
        addSystemMessage("Chat history has been cleared. How can I help you today?");
        showToast("Chat cleared", "Your conversation history has been cleared", "success");
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
    
    // Handle Enter key in widget input
    widgetInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (widgetSend && !widgetSend.disabled) {
          sendMessage();
        }
      }
    });
  }

  // Widget send button
  if (widgetSend) {
    widgetSend.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Widget send button clicked");
      sendMessage();
    });
  }

  // GENERATE REPORT - Handle AI report generation in dashboard
  if (generateReportBtn && aiOutput) {
    generateReportBtn.addEventListener("click", async () => {
      console.log("Generating AI report");
      generateReportBtn.disabled = true;
      aiOutput.innerHTML = "<p>🧠 Bið gervigreindina um að búa til skýrslu...</p>";
      
      try {
        const response = await generateAIResponse("Gerðu samantekt á vakt dagsins á hjúkrunarheimilinu og veittu lykilathuganir.", "ai_report");
        aiOutput.innerHTML = `<p>${response}</p>`;
        showToast("Skýrsla tilbúin", "AI samantekt á vaktinni er tilbúin", "success");
      } catch (err) {
        console.error("Error generating report:", err);
        aiOutput.innerHTML = "<p>⚠️ Ekki tókst að búa til AI skýrslu. Vinsamlegast reyndu aftur síðar.</p>";
        showToast("Skýrslugerð mistókst", "Ekki tókst að búa til AI skýrslu", "error");
      } finally {
        generateReportBtn.disabled = false;
      }
    });
  }

  // Add initial system welcome message to widget
  if (widgetMessages && widgetMessages.children.length === 0) {
    addSystemMessage(`👋 Halló! Ég er NurseCare gervigreindaraðstoðarmaður.
Ég get hjálpað með vaktir, lyfjagjafir, skjólstæðingaupplýsingar og annað.
Spurðu mig t.d.:
• "Hver er á næturvakt í dag?"
• "Hvenær fær Jón Baldur næstu lyfjagjöf?"
• "Búðu til vaktaskýrslu fyrir kvöldvakt"`);
  }

  // WIDGET MESSAGING FUNCTIONS
  
  // Send message from widget
  async function sendMessage() {
    if (!widgetInput || !widgetMessages) {
      console.error("Missing required elements for sending message");
      return;
    }
    
    const messageText = widgetInput.value.trim();
    if (!messageText) return;
    
    console.log("Sending message:", messageText);
    
    // Update UI
    addUserMessage(messageText);
    widgetInput.value = "";
    widgetInput.style.height = "auto";
    
    if (widgetSend) {
      widgetSend.disabled = true;
    }
    
    addTypingIndicator();
    
    try {
      const response = await generateAIResponse(messageText, "ai_widget");
      removeTypingIndicator();
      addAssistantMessage(response);
    } catch (error) {
      console.error("Error sending message:", error);
      removeTypingIndicator();
      addAssistantMessage("⚠️ I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.");
      showToast("Connection issue", "The AI service is temporarily unavailable", "warning");
    } finally {
      // Re-enable input after response
      if (widgetSend) {
        widgetSend.disabled = false;
      }
      if (widgetInput) {
        widgetInput.focus();
      }
    }
  }

  // Make API request to OpenAI
  async function generateAIResponse(prompt, contextType = "general") {
    console.log(`Generating AI response for: "${prompt}" (context: ${contextType})`);
    
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          context: contextType
        })
      });
      
      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }
      
      const data = await res.json();
      console.log("AI response received:", data);
      
      return data.result || data.summary || "No response received from AI.";
    } catch (err) {
      console.error("Error in AI request:", err);
      throw err;
    }
  }

  // Add a user message to the widget
  function addUserMessage(text) {
    if (!widgetMessages) return;
    const messageElement = createMessageElement("user", text);
    widgetMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  // Add an AI assistant message to the widget
  function addAssistantMessage(text) {
    if (!widgetMessages) return;
    const messageElement = createMessageElement("assistant", text);
    widgetMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  // Add a system message to the widget
  function addSystemMessage(text) {
    if (!widgetMessages) return;
    const messageElement = createMessageElement("system", text);
    widgetMessages.appendChild(messageElement);
    scrollToBottom();
  }
  
  // Create a message element for the chat
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
  
  // Add typing indicator to show AI is thinking
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
  
  // Remove typing indicator when AI response is ready
  function removeTypingIndicator() {
    const typing = document.getElementById("typing-indicator");
    if (typing) {
      typing.remove();
    }
  }
  
  // Scroll chat to bottom after new messages
  function scrollToBottom() {
    if (widgetMessages) {
      widgetMessages.scrollTop = widgetMessages.scrollHeight;
    }
  }
});