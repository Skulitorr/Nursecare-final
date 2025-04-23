// ===== GLOBAL VARIABLES =====
let calendar; // FullCalendar instance
let staffList = []; // Staff members list
let chatHistory = []; // Chat history for chatbot
let currentUser = { name: 'Stjórnandi', role: 'admin', lastShift: { date: new Date(Date.now() - 86400000), wing: 'B', updates: 3, medLogs: 2 } }; // Current user info
const MAX_HISTORY_LENGTH = 20; // Maximum number of messages in chat history
const MAX_AI_RESPONSE_LENGTH = 200; // Maximum length for AI responses to keep them concise

// Initialize flags for API connection status
window.aiErrorCount = 0;
window.aiErrorShown = false;
window.forceApiFallback = true; // Start with fallback mode enabled by default
window.apiBaseUrl = ''; // Will store working API endpoint

// Status color mapping
const STATUS_COLORS = {
    available: '#4CAF50', // Green
    unavailable: '#F44336', // Red
    busy: '#FFC107', // Yellow
    sick: '#FF5722', // Orange
    pending: '#2196F3' // Blue
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("NurseCare AI initialized");
    
    // Load environment variables
    loadEnvironmentVariables().then(() => {
        // Initialize global UI elements
        initUI();
        
        // Initialize OpenAI API integration in a try/catch block
        try {
            initOpenAI();
        } catch (error) {
            console.error("Error initializing OpenAI:", error);
            window.forceApiFallback = true;
        }
        
        // Initialize page-specific functionality based on current page
        const currentPage = getCurrentPage();
        console.log("Current page:", currentPage);
        
        switch(currentPage) {
            case 'dashboard':
                initDashboard();
                break;
            case 'schedule':
                initSchedule();
                break;
            case 'chatbot':
                initChatbot();
                break;
            case 'inventory':
                initInventory();
                break;
            case 'medication':
                initMedication();
                break;
            case 'patients':
                initPatients();
                break;
            case 'staff':
                initStaff();
                break;
        }
        
        // Display welcome toast
        displayWelcomeToast(currentPage);
    });
});

/**
 * Load environment variables from bolt.new or other environment
 * @returns {Promise} - Resolves when environment variables are loaded
 */
async function loadEnvironmentVariables() {
    // Create a global environment object if it doesn't exist
    window.__ENV = window.__ENV || {};
    
    try {
        // Try to fetch environment variables from a .env.js file that bolt.new might create
        const response = await fetch('/.env.js');
        
        if (response.ok) {
            // If successful, evaluate the JS file which should set window.__ENV
            const envScript = await response.text();
            
            // Only evaluate if it seems to be setting __ENV
            if (envScript.includes('__ENV')) {
                console.log("Loading environment variables from .env.js");
                
                // Create a script element to execute the env script
                const script = document.createElement('script');
                script.textContent = envScript;
                document.head.appendChild(script);
                
                // Remove the script after execution
                setTimeout(() => {
                    document.head.removeChild(script);
                }, 0);
            }
        } else {
            console.log("No .env.js file found, using defaults");
        }
    } catch (error) {
        console.warn("Failed to load environment variables:", error);
    }
    
    // Always resolve - we'll fall back to defaults if needed
    return Promise.resolve();
}

/**
 * Generate a personalized greeting based on time of day
 */
function generatePersonalizedGreeting() {
    const hour = new Date().getHours();
    
    if (hour < 5) {
        return "Góða nótt";
    } else if (hour < 12) {
        return "Góðan daginn";
    } else if (hour < 18) {
        return "Góðan dag"; 
    } else {
        return "Gott kvöld";
    }
}

/**
 * Display welcome toast with personalized greeting
 * @param {string} currentPage - The current page name
 */
function displayWelcomeToast(currentPage) {
    setTimeout(() => {
        const pageNames = {
            'dashboard': 'Mælaborð',
            'schedule': 'Vaktaáætlun',
            'chatbot': 'Spjallforrit',
            'inventory': 'Birgðir',
            'medication': 'Lyf',
            'patients': 'Sjúklingar',
            'staff': 'Starfsfólk'
        };
        const translatedPage = pageNames[currentPage] || capitalizeFirstLetter(currentPage);
        const greeting = generatePersonalizedGreeting();
        
        showToast(`${greeting} - ${translatedPage}`, "info", 4000);
    }, 1000);
}

/**
 * Find upcoming shift for current user (simulated for now)
 */
function findUpcomingShift() {
    // This would typically come from your shift database
    // For now, we'll simulate based on current time
    const now = new Date();
    const hour = now.getHours();
    
    // Simulate upcoming shift times
    if (hour < 5) {
        return { hoursUntil: 7 - hour, wing: 'A' };
    } else if (hour >= 5 && hour < 10) {
        return { hoursUntil: 15 - hour, wing: 'B' };
    } else if (hour >= 10 && hour < 22) {
        return { hoursUntil: 23 - hour, wing: 'C' };
    } 
    
    // No upcoming shift in next 24 hours
    return null;
}

// ===== OPENAI INTEGRATION =====

/**
 * Initialize OpenAI API integration
 */
function initOpenAI() {
    // Check if OpenAI is already initialized
    if (window.openaiInitialized) {
        return;
    }
    
    // Get API keys from environment if available
    // For bolt.new, we need to use a different approach to access environment variables
    let openaiApiKey = '';
    let geminiApiKey = '';
    
    // Try to get API keys from window.__ENV if it exists (commonly set up by bolt.new)
    if (window.__ENV && window.__ENV.OPENAI_API_KEY) {
        openaiApiKey = window.__ENV.OPENAI_API_KEY;
    }
    
    if (window.__ENV && window.__ENV.GEMINI_API_KEY) {
        geminiApiKey = window.__ENV.GEMINI_API_KEY;
    }
    
    // Store API keys in window object
    window.openaiApiKey = openaiApiKey;
    window.geminiApiKey = geminiApiKey;
    
    // Set which API to use (OpenAI is default, Gemini is fallback)
    window.useGemini = false;
    
    // Flag to indicate initialization
    window.openaiInitialized = true;
    
    console.log("AI services initialized");
    
    // Test connection
    if (openaiApiKey) {
        console.log("Using OpenAI API directly");
    } else if (geminiApiKey) {
        console.log("Using Gemini API directly");
        window.useGemini = true;
    } else {
        console.warn("No API keys found, using fallback responses");
        window.forceApiFallback = true;
    }
}

/**
 * Call AI API with provided prompts
 * @param {string} systemPrompt - The system prompt for context
 * @param {string} userPrompt - The user message
 * @returns {Promise<string>} - The AI response
 */
async function callOpenAI(systemPrompt, userPrompt) {
    // Use fallback if API is not available
    if (window.forceApiFallback) {
        return generateFallbackResponse(userPrompt);
    }
    
    try {
        if (window.useGemini && window.geminiApiKey) {
            return await callGeminiAPI(systemPrompt, userPrompt);
        } else if (window.openaiApiKey) {
            return await callOpenAIAPI(systemPrompt, userPrompt);
        } else {
            throw new Error("No API keys available");
        }
    } catch (error) {
        console.error("Error calling AI API:", error);
        
        // Use fallback for future calls if API fails
        window.forceApiFallback = true;
        
        return generateFallbackResponse(userPrompt);
    }
}

/**
 * Call OpenAI API directly
 * @param {string} systemPrompt - The system prompt for context
 * @param {string} userPrompt - The user message
 * @returns {Promise<string>} - The AI response
 */
async function callOpenAIAPI(systemPrompt, userPrompt) {
    const apiKey = window.openaiApiKey;
    
    if (!apiKey) {
        throw new Error("OpenAI API key not found");
    }
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Call Gemini API directly
 * @param {string} systemPrompt - The system prompt for context
 * @param {string} userPrompt - The user message
 * @returns {Promise<string>} - The AI response
 */
async function callGeminiAPI(systemPrompt, userPrompt) {
    const apiKey = window.geminiApiKey;
    
    if (!apiKey) {
        throw new Error("Gemini API key not found");
    }
    
    // Combine system prompt and user prompt for Gemini
    const combinedPrompt = `${systemPrompt}\n\nUser: ${userPrompt}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: combinedPrompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
                topP: 0.95,
                topK: 40
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

/**
 * Generate a fallback response when AI API is unavailable
 * @param {string} message - The user message
 * @returns {string} - A fallback response
 */
function generateFallbackResponse(message) {
    console.log("Generating fallback response for:", message.substring(0, 50) + "...");
    
    // Normalize message for easy matching
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check for specific keywords about staff availability
    if (normalizedMessage.includes('available') || 
        normalizedMessage.includes('shift') || 
        normalizedMessage.includes('schedule') || 
        normalizedMessage.includes('who is working')) {
        
        return "Samkvæmt vaktaskránni eru 3 hjúkrunarfræðingar og 2 sjúkraliðar á vakt í dag. Jóhanna, Anna og Guðrún eru hjúkrunarfræðingar á dagvakt, og Magnús og Helga eru sjúkraliðar. Deildarstjórinn Svanhildur er einnig á staðnum til kl. 16:00.";
    }
    
    // Check for specific keywords about inventory
    if (normalizedMessage.includes('inventory') || 
        normalizedMessage.includes('stock') || 
        normalizedMessage.includes('supplies') ||
        normalizedMessage.includes('birgðir') ||
        normalizedMessage.includes('lager')) {
        
        return "Birgðir af algengustu vörum: Hanskar (stærð M): 850 stk, Sprautur (5ml): 230 stk, Nálar (21G): 175 stk, Sáraumbúðir (10x10cm): 90 stk, Skurðgríma: 120 stk. Athugið að skurðgrímu birgðir eru að verða litlar, ráðlagt að panta meira.";
    }
    
    // Check for specific keywords about patient info
    if (normalizedMessage.includes('patient') || 
        normalizedMessage.includes('room') || 
        normalizedMessage.includes('bed') ||
        normalizedMessage.includes('sjúkling') ||
        normalizedMessage.includes('herbergi')) {
        
        return "Til að sjá nákvæmar upplýsingar um sjúklinga, vinsamlegast notaðu sjúklingaskráningarkerfið. Athugið að persónuupplýsingar sjúklinga eru trúnaðarmál og ætti aðeins að skoða í gegnum örugg kerfi og með viðeigandi aðgangsheimildir.";
    }
    
    // Check for specific keywords about medications
    if (normalizedMessage.includes('medication') || 
        normalizedMessage.includes('drug') || 
        normalizedMessage.includes('dose') ||
        normalizedMessage.includes('lyf') ||
        normalizedMessage.includes('skammtur')) {
        
        return "Upplýsingar um lyf og skammta ættu að vera aðgengilegar í lyfjakerfinu. Vinsamlegast athugaðu lyfjalistann fyrir hvern sjúkling í sjúkraskrá. Mikilvægt er að fylgja fimm réttum reglum við lyfjagjöf: réttur sjúklingur, rétt lyf, réttur skammtur, rétt íkomuleið og réttur tími.";
    }
    
    // Check for specific keywords about procedures or care
    if (normalizedMessage.includes('procedure') || 
        normalizedMessage.includes('protocol') || 
        normalizedMessage.includes('care') ||
        normalizedMessage.includes('treatment') ||
        normalizedMessage.includes('meðferð') ||
        normalizedMessage.includes('umönnun')) {
        
        return "Upplýsingar um verkferla og umönnun má finna í gæðahandbók stofnunarinnar. Fyrir sértækar leiðbeiningar um umönnun sjúklinga með sérþarfir, vinsamlegast hafðu samband við deildarstjóra eða yfirhjúkrunarfræðing.";
    }
    
    // Check for specific keywords about emergencies
    if (normalizedMessage.includes('emergency') || 
        normalizedMessage.includes('urgent') || 
        normalizedMessage.includes('critical') ||
        normalizedMessage.includes('neyð') ||
        normalizedMessage.includes('bráð')) {
        
        return "Í neyðartilfellum skal fylgja neyðaráætlun stofnunarinnar. Hringdu í bráðanúmer 112 fyrir utanaðkomandi aðstoð. Fyrir innri neyðartilvik, notaðu neyðarhnapp eða hringdu í innanhússnúmerið 1234 til að ná í neyðarteymi sjúkrahússins.";
    }
    
    // Check for greetings
    if (normalizedMessage.includes('hello') || 
        normalizedMessage.includes('hi') || 
        normalizedMessage.includes('hey') ||
        normalizedMessage.includes('halló') || 
        normalizedMessage.includes('hæ') || 
        normalizedMessage === "hæ" ||
        normalizedMessage === "hæhæ") {
        
        return "Halló! Ég er aðstoðarkerfi fyrir hjúkrunarfræðinga. Ég get veitt almennar upplýsingar um vaktaskipulag, birgðir og verkferla. Hvernig get ég aðstoðað þig í dag?";
    }
    
    // Default response for other queries
    return "Ég er með takmarkaða möguleika á að svara þessari spurningu núna. Ég get veitt upplýsingar um vaktaskipulag, birgðastöðu, almennar leiðbeiningar um umönnun og verkferla. Endilega spurðu um eitthvað af því eða hafðu samband við deildarstjóra fyrir sértækari aðstoð.";
}

// ===== UTILITY FUNCTIONS =====

/**
 * Determine the current page based on URL
 */
function getCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('index') || path === '/' || path === '' || path.endsWith('.html') === false) {
        return 'dashboard';
    } else if (path.includes('schedule')) {
        return 'schedule';
    } else if (path.includes('inventory')) {
        return 'inventory';
    } else if (path.includes('chatbot')) {
        return 'chatbot';
    } else if (path.includes('medication')) {
        return 'medication';
    } else if (path.includes('patients')) {
        return 'patients';
    } else if (path.includes('staff')) {
        return 'staff';
    }
    
    return 'unknown';
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Format date for display
 * @param {Date} date - The date to format
 * @param {boolean} withTime - Whether to include time
 * @returns {string} Formatted date
 */
function formatDate(date, withTime = false) {
    if (!date) return '';
    
    // Check if date is a string and convert to Date object
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // Format date as dd.mm.yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let formattedDate = `${day}.${month}.${year}`;
    
    // Add time if requested
    if (withTime) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        formattedDate += ` ${hours}:${minutes}`;
    }
    
    return formattedDate;
}

/**
 * Format time (HH:MM)
 */
function formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${formattedMinutes}`;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    let icon;
    switch (type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'error':
            icon = 'exclamation-circle';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            break;
        case 'info':
        default:
            icon = 'info-circle';
            break;
    }
    
    // Set toast content
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add event listener to close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-remove toast after duration
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }
    
    return toast;
}

/**
 * Remove a toast notification
 * @param {HTMLElement} toast - The toast element to remove
 */
function removeToast(toast) {
    // Remove 'show' class
    toast.classList.remove('show');
    
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
        toast.remove();
        
        // Remove container if there are no more toasts
        const toastContainer = document.querySelector('.toast-container');
        if (toastContainer && toastContainer.children.length === 0) {
            toastContainer.remove();
        }
    }, 300);
}

/**
 * Show a modal dialog
 * @param {string} id - The modal ID
 */
function showModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    
    // Add active class to display the modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Add event listener to close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal(id);
        }
    });
    
    // Add event listener for Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideModal(id);
        }
    });
}

/**
 * Hide a modal dialog
 * @param {string} id - The modal ID
 */
function hideModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    
    // Remove active class to hide the modal
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Debounce function to limit how often a function is called
 */
function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Create a basic modal for dynamic content
 */
function createBasicModal(id, title, content) {
    // Check if modal already exists
    if (document.getElementById(id)) {
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = id;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <p>${content}</p>
                <div class="form-actions">
                    <button class="btn cancel-btn">Loka</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners to close buttons
    modal.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            hideModal(id);
        });
    });
    
    return modal;
}

/**
 * Create a more complex modal with custom HTML and action buttons
 */
function createCustomModal(id, title, contentHTML, actions = []) {
    // Check if modal already exists
    if (document.getElementById(id)) {
        return document.getElementById(id);
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = id;
    
    let actionsHTML = '';
    if (actions.length > 0) {
        actionsHTML = `
            <div class="form-actions">
                ${actions.map(action => `
                    <button class="btn ${action.class || ''}" id="${action.id || ''}" 
                            ${action.attributes || ''}>
                        ${action.icon ? `<i class="fas fa-${action.icon}"></i> ` : ''}${action.text}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                ${contentHTML}
                ${actionsHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners to close buttons
    modal.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            hideModal(id);
        });
    });
    
    // Add event listeners to action buttons
    actions.forEach(action => {
        if (action.id && action.onClick) {
            const button = modal.querySelector(`#${action.id}`);
            if (button) {
                button.addEventListener('click', action.onClick);
            }
        }
    });
    
    return modal;
}

/**
 * Create a confirmation dialog
 */
function createConfirmDialog(title, message, onConfirm, onCancel = null) {
    const id = 'confirm-dialog-' + Math.random().toString(36).substr(2, 9);
    
    const modal = createCustomModal(id, title, `<p>${message}</p>`, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: `${id}-cancel`,
            onClick: function() {
                hideModal(id);
                if (onCancel) onCancel();
            }
        },
        {
            text: 'Staðfesta',
            class: 'primary-btn',
            id: `${id}-confirm`,
            onClick: function() {
                hideModal(id);
                onConfirm();
            }
        }
    ]);
    
    showModal(id);
    return modal;
}

/**
 * Get appropriate status color
 */
function getStatusColor(status) {
    return STATUS_COLORS[status] || '#4CAF50';
}

// ===== GLOBAL UI INITIALIZATION =====

/**
 * Initialize global UI elements
 */
function initUI() {
    initTheme();
    initSidebar();
    initDropdowns();
    initCurrentDateTime();
    initNotifications();
    setupGlobalEventListeners();
    
    // Add quick action buttons to header on all pages
    addQuickActionButtons();
}

/**
 * Add quick action buttons to header
 */
function addQuickActionButtons() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    
    // Create quick actions container if it doesn't exist
    let quickActionsContainer = document.querySelector('.header-quick-actions');
    if (!quickActionsContainer) {
        quickActionsContainer = document.createElement('div');
        quickActionsContainer.className = 'header-quick-actions';
        
        // Insert before notifications
        const notifications = headerActions.querySelector('.notifications');
        if (notifications) {
            headerActions.insertBefore(quickActionsContainer, notifications);
        } else {
            headerActions.prepend(quickActionsContainer);
        }
    }
    
    // Add quick action buttons
    quickActionsContainer.innerHTML = `
        <button class="quick-btn sick-btn" title="Tilkynna forföll">
            <i class="fas fa-head-side-cough"></i>
        </button>
        <button class="quick-btn patient-btn" title="Uppfæra sjúklingastöðu">
            <i class="fas fa-user-injured"></i>
        </button>
        <button class="quick-btn replacement-btn" title="Finna staðgengil">
            <i class="fas fa-user-plus"></i>
        </button>
    `;
    
    // Add event listeners to quick action buttons
    quickActionsContainer.querySelector('.sick-btn').addEventListener('click', function() {
        reportSickCall();
    });
    
    quickActionsContainer.querySelector('.patient-btn').addEventListener('click', function() {
        updatePatientStatus();
    });
    
    quickActionsContainer.querySelector('.replacement-btn').addEventListener('click', function() {
        findShiftReplacement();
    });
    
    // Add CSS for quick action buttons
    addStyleToHead(`
        .header-quick-actions {
            display: flex;
            gap: 10px;
            margin-right: 15px;
        }
        
        .quick-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .quick-btn:hover {
            background-color: var(--bg-tertiary);
            transform: translateY(-2px);
        }
        
        .sick-btn:hover {
            color: #F44336;
        }
        
        .patient-btn:hover {
            color: #2196F3;
        }
        
        .replacement-btn:hover {
            color: #4CAF50;
        }
        
        @media (max-width: 768px) {
            .header-quick-actions {
                margin-right: 5px;
                gap: 5px;
            }
            
            .quick-btn {
                width: 32px;
                height: 32px;
            }
        }
    `);
}

/**
 * Add CSS style to head
 */
function addStyleToHead(css) {
    if (!css) return;
    
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

/**
 * Report sick call quick action
 */
function reportSickCall() {
    createCustomModal('report-sick-modal', 'Tilkynna forföll', `
        <form id="sick-call-form">
            <div class="form-group">
                <label for="sick-staff">Starfsmaður</label>
                <select class="form-control" id="sick-staff" required>
                    <option value="">Veldu starfsmann</option>
                    ${staffList.map(staff => `<option value="${staff.id}">${staff.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="sick-date">Dagsetning forfalla</label>
                <input type="date" class="form-control" id="sick-date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="sick-reason">Ástæða</label>
                <select class="form-control" id="sick-reason">
                    <option value="veikindi">Veikindi</option>
                    <option value="fjolskyldumal">Fjölskyldumál</option>
                    <option value="annad">Annað</option>
                </select>
            </div>
            <div class="form-group">
                <label for="sick-notes">Athugasemdir</label>
                <textarea class="form-control" id="sick-notes" rows="2"></textarea>
            </div>
            <div class="form-group">
                <div class="checkbox-item">
                    <input type="checkbox" id="find-replacement" checked>
                    <label for="find-replacement">Finna sjálfkrafa staðgengil</label>
                </div>
            </div>
        </form>
    `, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: 'sick-cancel-btn'
        },
        {
            text: 'Tilkynna forföll',
            class: 'primary-btn',
            id: 'sick-submit-btn',
            icon: 'paper-plane',
            onClick: function() {
                const form = document.getElementById('sick-call-form');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                
                const staffSelect = document.getElementById('sick-staff');
                const staffName = staffSelect.options[staffSelect.selectedIndex].text;
                
                hideModal('report-sick-modal');
                
                // Show processing notification
                showToast(`Tilkynni forföll fyrir ${staffName}...`, "info");
                
                // Simulate processing
                setTimeout(() => {
                    if (document.getElementById('find-replacement').checked) {
                        showToast(`Forföll skráð fyrir ${staffName}. Leita að staðgengli...`, "success", 2000);
                        
                        // Simulate finding replacement
                        setTimeout(() => {
                            createCustomModal('replacement-found-modal', 'Staðgengill fundinn', `
                                <div class="replacement-result">
                                    <div class="success-icon">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <p>Anna Björg hefur verið fundin sem staðgengill fyrir ${staffName}.</p>
                                    <div class="match-score">
                                        <div class="match-label">Samsvörunarstig:</div>
                                        <div class="match-stars">
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="far fa-star"></i>
                                        </div>
                                        <div class="match-percent">98%</div>
                                    </div>
                                </div>
                            `, [
                                {
                                    text: 'Senda tilkynningu',
                                    class: 'primary-btn',
                                    id: 'send-replacement-btn',
                                    icon: 'envelope',
                                    onClick: function() {
                                        hideModal('replacement-found-modal');
                                        showToast("Tilkynning send til Anna Björg", "success");
                                    }
                                }
                            ]);
                            
                            showModal('replacement-found-modal');
                            
                            // Add CSS for replacement found
                            addStyleToHead(`
                                .replacement-result {
                                    text-align: center;
                                    padding: 1rem 0;
                                }
                                
                                .success-icon {
                                    font-size: 3rem;
                                    color: var(--success-color);
                                    margin-bottom: 1rem;
                                }
                                
                                .match-score {
                                    margin-top: 1rem;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                }
                                
                                .match-stars {
                                    color: #FFC107;
                                    font-size: 1.2rem;
                                    margin: 0.5rem 0;
                                }
                                
                                .match-percent {
                                    font-weight: bold;
                                    color: var(--success-color);
                                }
                            `);
                        }, 2000);
                    } else {
                        showToast(`Forföll skráð fyrir ${staffName}`, "success");
                    }
                }, 1500);
            }
        }
    ]);
    
    showModal('report-sick-modal');
}

/**
 * Update patient status quick action
 */
function updatePatientStatus() {
    createCustomModal('update-patient-modal', 'Uppfæra sjúklingastöðu', `
        <form id="update-patient-form">
            <div class="form-group">
                <label for="patient-room">Herbergi sjúklings</label>
                <input type="number" class="form-control" id="patient-room" required min="100" max="500" placeholder="t.d. 203">
            </div>
            <div class="form-group">
                <label for="patient-status">Staða</label>
                <select class="form-control" id="patient-status" required>
                    <option value="stable">Stöðugur</option>
                    <option value="improving">Batnar</option>
                    <option value="deteriorating">Versnandi</option>
                    <option value="critical">Alvarlegt</option>
                </select>
            </div>
            <div class="form-group">
                <label for="vital-signs">Lífsmörk</label>
                <div class="vitals-inputs">
                    <div class="vital-input">
                        <label for="blood-pressure">Blóðþrýstingur</label>
                        <input type="text" class="form-control" id="blood-pressure" placeholder="120/80">
                    </div>
                    <div class="vital-input">
                        <label for="heart-rate">Púls</label>
                        <input type="number" class="form-control" id="heart-rate" placeholder="70">
                    </div>
                    <div class="vital-input">
                        <label for="temperature">Hiti</label>
                        <input type="number" class="form-control" id="temperature" placeholder="36.5" step="0.1">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="patient-notes">Athugasemdir</label>
                <textarea class="form-control" id="patient-notes" rows="2"></textarea>
            </div>
        </form>
    `, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: 'update-patient-cancel-btn'
        },
        {
            text: 'Uppfæra',
            class: 'primary-btn',
            id: 'update-patient-submit-btn',
            icon: 'save',
            onClick: function() {
                const form = document.getElementById('update-patient-form');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                
                const roomNumber = document.getElementById('patient-room').value;
                
                hideModal('update-patient-modal');
                
                // Show processing notification
                showToast(`Uppfæri stöðu sjúklings í herbergi ${roomNumber}...`, "info");
                
                // Simulate processing
                setTimeout(() => {
                    showToast(`Staða sjúklings í herbergi ${roomNumber} uppfærð!`, "success");
                }, 1000);
            }
        }
    ]);
    
    showModal('update-patient-modal');
    
    // Add CSS for vitals layout
    addStyleToHead(`
        .vitals-inputs {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
        }
        
        .vital-input label {
            font-size: 0.85rem;
            margin-bottom: 2px;
        }
    `);
}

/**
 * Find shift replacement quick action
 */
function findShiftReplacement() {
    createCustomModal('find-replacement-modal', 'Finna staðgengil', `
        <form id="find-replacement-form">
            <div class="form-group">
                <label for="shift-date">Dagsetning vaktar</label>
                <input type="date" class="form-control" id="shift-date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="shift-time">Vakt</label>
                <select class="form-control" id="shift-time" required>
                    <option value="morning">Morgunvakt (7-15)</option>
                    <option value="evening">Kvöldvakt (15-23)</option>
                    <option value="night">Næturvakt (23-7)</option>
                </select>
            </div>
            <div class="form-group">
                <label for="shift-wing">Álma</label>
                <select class="form-control" id="shift-wing" required>
                    <option value="A">A-Álma</option>
                    <option value="B">B-Álma</option>
                    <option value="C">C-Álma</option>
                </select>
            </div>
            <div class="form-group">
                <label for="replacement-role">Hlutverk</label>
                <select class="form-control" id="replacement-role" required>
                    <option value="nurse">Hjúkrunarfræðingur</option>
                    <option value="assistant">Sjúkraliði</option>
                    <option value="aide">Aðstoðarmaður</option>
                </select>
            </div>
            <div class="form-group">
                <label for="urgent-replacement">Forgangsstig</label>
                <select class="form-control" id="urgent-replacement">
                    <option value="normal">Venjulegt</option>
                    <option value="high">Hár forgangur</option>
                    <option value="critical">Brýnt</option>
                </select>
            </div>
        </form>
    `, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: 'replacement-cancel-btn'
        },
        {
            text: 'Finna staðgengil',
            class: 'primary-btn',
            id: 'replacement-submit-btn',
            icon: 'search',
            onClick: function() {
                const form = document.getElementById('find-replacement-form');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                
                const shiftTimeSelect = document.getElementById('shift-time');
                const shiftTime = shiftTimeSelect.options[shiftTimeSelect.selectedIndex].text;
                
                const wingSelect = document.getElementById('shift-wing');
                const wing = wingSelect.options[wingSelect.selectedIndex].text;
                
                hideModal('find-replacement-modal');
                
                // Show processing notification
                showToast(`Leita að staðgengli fyrir ${shiftTime} í ${wing}...`, "info");
                
                // Simulate processing
                setTimeout(() => {
                    createCustomModal('replacement-options-modal', 'Tillögur að staðgenglum', `
                        <div class="replacement-options">
                            <div class="replacement-option">
                                <div class="replacement-info">
                                    <div class="replacement-avatar">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=nurse4" alt="Anna B.">
                                    </div>
                                    <div class="replacement-details">
                                        <div class="replacement-name">Anna Björg</div>
                                        <div class="replacement-role">Hjúkrunarfræðingur</div>
                                        <div class="match-stars">
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="far fa-star"></i>
                                            <span class="match-percent">98%</span>
                                        </div>
                                    </div>
                                </div>
                                <button class="btn primary-btn contact-btn" data-name="Anna Björg">Hafa samband</button>
                            </div>
                            
                            <div class="replacement-option">
                                <div class="replacement-info">
                                    <div class="replacement-avatar">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=nurse9" alt="Jóhann P.">
                                    </div>
                                    <div class="replacement-details">
                                        <div class="replacement-name">Jóhann Pétur</div>
                                        <div class="replacement-role">Hjúkrunarfræðingur</div>
                                        <div class="match-stars">
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="far fa-star"></i>
                                            <i class="far fa-star"></i>
                                            <span class="match-percent">87%</span>
                                        </div>
                                    </div>
                                </div>
                                <button class="btn primary-btn contact-btn" data-name="Jóhann Pétur">Hafa samband</button>
                            </div>
                            
                            <div class="replacement-option">
                                <div class="replacement-info">
                                    <div class="replacement-avatar">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=nurse11" alt="Þórunn D.">
                                    </div>
                                    <div class="replacement-details">
                                        <div class="replacement-name">Þórunn Dóra</div>
                                        <div class="replacement-role">Hjúkrunarfræðingur</div>
                                        <div class="match-stars">
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="fas fa-star"></i>
                                            <i class="far fa-star"></i>
                                            <i class="far fa-star"></i>
                                            <span class="match-percent">75%</span>
                                        </div>
                                    </div>
                                </div>
                                <button class="btn primary-btn contact-btn" data-name="Þórunn Dóra">Hafa samband</button>
                            </div>
                        </div>
                    `, [
                        {
                            text: 'Loka',
                            class: 'cancel-btn',
                            id: 'close-options-btn'
                        },
                        {
                            text: 'Senda til allra',
                            class: 'primary-btn',
                            id: 'contact-all-btn',
                            icon: 'envelope',
                            onClick: function() {
                                hideModal('replacement-options-modal');
                                showToast("Tilkynningar sendar til allra mögulegra staðgengla", "success");
                            }
                        }
                    ]);
                    
                    showModal('replacement-options-modal');
                    
                    // Add event listeners to contact buttons
                    document.querySelectorAll('.contact-btn').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const name = this.getAttribute('data-name');
                            hideModal('replacement-options-modal');
                            showToast(`Tilkynning send til ${name}`, "success");
                        });
                    });
                    
                    // Add CSS for replacement options
                    addStyleToHead(`
                        .replacement-options {
                            display: flex;
                            flex-direction: column;
                            gap: 15px;
                        }
                        
                        .replacement-option {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding: 10px;
                            border-radius: var(--border-radius);
                            background-color: var(--bg-secondary);
                            border: 1px solid var(--border-light);
                        }
                        
                        .replacement-info {
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        
                        .replacement-avatar {
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            overflow: hidden;
                        }
                        
                        .replacement-avatar img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                        
                        .replacement-name {
                            font-weight: 600;
                        }
                        
                        .replacement-role {
                            font-size: 0.85rem;
                            color: var(--text-secondary);
                        }
                        
                        .match-stars {
                            color: #FFC107;
                            font-size: 0.85rem;
                            margin-top: 2px;
                        }
                        
                        .match-percent {
                            color: var(--text-secondary);
                            margin-left: 5px;
                            font-weight: 500;
                        }
                    `);
                }, 2000);
            }
        }
    ]);
    
    showModal('find-replacement-modal');
}

/**
 * Initialize theme (dark/light mode)
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');
    
    // Apply saved theme or system preference
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    } else if (currentTheme === 'light') {
        document.body.classList.remove('dark-mode');
        updateThemeIcon(false);
    } else if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
    
    // Toggle theme on button click
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            updateThemeIcon(isDarkMode);
            
            // If charts exist, update their colors
            if (typeof updateChartColors === 'function') {
                updateChartColors(isDarkMode);
            }
        });
    }
    
    // Update theme toggle icon
    function updateThemeIcon(isDarkMode) {
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('span');
        if (!icon || !text) return;
        
        if (isDarkMode) {
            icon.classList.replace('fa-moon', 'fa-sun');
            text.textContent = 'Ljóst útlit';
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            text.textContent = 'Dökkt útlit';
        }
    }
}

/**
 * Initialize sidebar behavior
 */
function initSidebar() {
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const appContainer = document.querySelector('.app-container');
    
    // Apply saved state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        appContainer?.classList.add('sidebar-collapsed');
    }
    
    // Toggle sidebar
    if (toggleSidebar && appContainer) {
        toggleSidebar.addEventListener('click', function() {
            appContainer.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', appContainer.classList.contains('sidebar-collapsed') ? 'true' : 'false');
        });
    }
    
    // Make sidebar more responsive
    addStyleToHead(`
        @media (max-width: 768px) {
            .sidebar {
                width: 240px;
                transform: translateX(-240px);
                position: fixed;
                z-index: 1000;
                height: 100%;
            }
            
            .sidebar-collapsed .sidebar {
                transform: translateX(0);
            }
            
            .app-container.sidebar-collapsed .main-content {
                margin-left: 0;
            }
            
            .toggle-btn {
                display: flex;
            }
            
            .main-content {
                margin-left: 0;
                width: 100%;
            }
            
            /* Add overlay when sidebar is open on mobile */
            .sidebar-collapsed:before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 999;
            }
        }
    `);
}

/**
 * Initialize dropdown menus
 */
function initDropdowns() {
    const notificationsBtn = document.getElementById('notifications-btn');
    const notificationsMenu = document.getElementById('notifications-menu');
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    // Toggle notifications dropdown
    if (notificationsBtn && notificationsMenu) {
        notificationsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsMenu.classList.toggle('show');
            profileMenu?.classList.remove('show');
        });
    }
    
    // Toggle profile dropdown
    if (profileBtn && profileMenu) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileMenu.classList.toggle('show');
            notificationsMenu?.classList.remove('show');
        });
    }
    
    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', function() {
        notificationsMenu?.classList.remove('show');
        profileMenu?.classList.remove('show');
    });
    
    // Add swipe support for mobile
    addSwipeSupport(notificationsMenu, 'right', () => {
        notificationsMenu?.classList.remove('show');
    });
    
    addSwipeSupport(profileMenu, 'right', () => {
        profileMenu?.classList.remove('show');
    });
    
    // Enhance dropdowns
    enhanceDropdowns();
}

/**
 * Add swipe support for an element
 */
function addSwipeSupport(element, direction, callback) {
    if (!element) return;
    
    let touchstartX = 0;
    let touchendX = 0;
    let touchstartY = 0;
    let touchendY = 0;
    
    element.addEventListener('touchstart', function(e) {
        touchstartX = e.changedTouches[0].screenX;
        touchstartY = e.changedTouches[0].screenY;
    });
    
    element.addEventListener('touchend', function(e) {
        touchendX = e.changedTouches[0].screenX;
        touchendY = e.changedTouches[0].screenY;
        
        const deltaX = touchendX - touchstartX;
        const deltaY = touchendY - touchstartY;
        
        // Only trigger if horizontal swipe is more significant than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (direction === 'right' && deltaX > 0) {
                callback();
            } else if (direction === 'left' && deltaX < 0) {
                callback();
            }
        }
    });
}

/**
 * Enhance dropdown menus with improved UI and functionality
 */
function enhanceDropdowns() {
    // Make notifications more interactive
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            const content = this.querySelector('.notification-content p').textContent;
            
            showToast("Skoðar tilkynningu...", "info");
            
            // Create a modal with the notification details
            setTimeout(() => {
                createCustomModal('notification-detail', 'Tilkynningaupplýsingar', `
                    <div class="notification-details">
                        <p>${content}</p>
                        <div class="notification-time">Móttekin: ${new Date().toLocaleTimeString('is-IS')}</div>
                    </div>
                `, [
                    {
                        text: 'Merkja sem lesið',
                        class: 'primary-btn',
                        id: 'mark-read-btn',
                        icon: 'check',
                        onClick: function() {
                            // Remove the notification and update badge count
                            const badge = document.querySelector('#notifications-btn .badge');
                            if (badge) {
                                const count = parseInt(badge.textContent) - 1;
                                badge.textContent = count >= 0 ? count : 0;
                                localStorage.setItem('notificationCount', count >= 0 ? count : 0);
                            }
                            
                            // Remove the notification item
                            item.style.opacity = '0';
                            setTimeout(() => {
                                item.style.display = 'none';
                            }, 300);
                            
                            hideModal('notification-detail');
                            showToast("Tilkynning merkt sem lesin", "success");
                        }
                    }
                ]);
                
                showModal('notification-detail');
            }, 500);
        });
    });
    
    // Enhanced notification badge styling
    addStyleToHead(`
        #notifications-btn .badge {
            transition: all 0.3s ease;
        }
        
        .notification-item {
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .notification-item:hover {
            background-color: var(--bg-tertiary);
        }
        
        .notification-details {
            padding: 1rem;
            background-color: var(--bg-secondary);
            border-radius: var(--border-radius);
            margin-bottom: 1rem;
        }
        
        .notification-time {
            font-size: 0.85rem;
            color: var(--text-tertiary);
            margin-top: 0.5rem;
            text-align: right;
        }
    `);
}

/**
 * Initialize current date and time display
 */
function initCurrentDateTime() {
    const currentDateEl = document.getElementById('current-date');
    
    if (currentDateEl) {
        updateDateTime();
        
        // Update every minute
        setInterval(updateDateTime, 60000);
    }
    
    function updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        try {
            currentDateEl.textContent = now.toLocaleDateString('is-IS', options);
        } catch (e) {
            // Fallback if Icelandic locale is not available
            currentDateEl.textContent = now.toLocaleDateString('en-US', options);
        }
    }
}

/**
 * Initialize notifications system
 */
function initNotifications() {
    // Clear existing notification badge counts
    const badgeElement = document.querySelector('#notifications-btn .badge');
    
    if (badgeElement) {
        // Set initial number from local storage or default to 3
        const notificationCount = localStorage.getItem('notificationCount') || 3;
        badgeElement.textContent = notificationCount;
        
        // When notifications are clicked, don't automatically reset count
        // Allow user to mark individual notifications as read
    }
    
    // Add live notification functionality
    setupLiveNotifications();
}

/**
 * Setup periodic notifications for important updates
 */
function setupLiveNotifications() {
    // Simulate new notifications every 5-10 minutes
    setTimeout(() => {
        // Check if we should show a notification (50% chance)
        if (Math.random() > 0.5) {
            // Generate a random notification
            const notifications = [
                "🚨 Sjúklingur í 203 með byltu kl 14:30 - athugaðu lífsmörk",
                "💊 3 sjúklingar þurfa lyfjagjöf innan klukkustundar",
                "👥 Starfsmannaskortur á næturvakt í C-álmu",
                "📋 Nýjar verklagsreglur um sýkingavarnir uppfærðar",
                "🚑 Læknisheimsókn áætluð eftir 30 mínútur"
            ];
            
            const randomIndex = Math.floor(Math.random() * notifications.length);
            const notification = notifications[randomIndex];
            
            // Show toast for the notification
            showToast(notification, "info", 5000);
            
            // Update notification badge count
            const badgeElement = document.querySelector('#notifications-btn .badge');
            if (badgeElement) {
                const count = parseInt(badgeElement.textContent) + 1;
                badgeElement.textContent = count;
                localStorage.setItem('notificationCount', count);
                
                // Flash the badge
                badgeElement.classList.add('flash');
                setTimeout(() => {
                    badgeElement.classList.remove('flash');
                }, 1000);
            }
            
            // Add to notifications menu
            const notificationsMenu = document.getElementById('notifications-menu');
            if (notificationsMenu) {
                const notificationItem = document.createElement('div');
                notificationItem.className = 'notification-item';
                
                // Choose icon based on notification content
                let icon = 'info-circle';
                if (notification.includes('lyfjagjöf')) icon = 'pills';
                if (notification.includes('byltu')) icon = 'exclamation-triangle';
                if (notification.includes('starfsmann')) icon = 'user-nurse';
                if (notification.includes('verklagsregl')) icon = 'clipboard-list';
                if (notification.includes('læknisheims')) icon = 'stethoscope';
                
                // Set notification type class
                let typeClass = '';
                if (notification.includes('🚨') || notification.includes('byltu')) typeClass = 'urgent';
                if (notification.includes('⚠️') || notification.includes('skortur')) typeClass = 'warning';
                
                notificationItem.innerHTML = `
                    <i class="fas fa-${icon}"></i>
                    <div class="notification-content">
                        <p>${notification}</p>
                        <span>Rétt í þessu</span>
                    </div>
                `;
                
                if (typeClass) {
                    notificationItem.classList.add(typeClass);
                }
                
                // Add notification at the top of the list
                const firstItem = notificationsMenu.querySelector('.notification-item');
                if (firstItem) {
                    notificationsMenu.insertBefore(notificationItem, firstItem);
                } else {
                    // Insert after heading
                    const heading = notificationsMenu.querySelector('h3');
                    if (heading) {
                        heading.after(notificationItem);
                    } else {
                        notificationsMenu.appendChild(notificationItem);
                    }
                }
                
                // Add click handler
                notificationItem.addEventListener('click', function() {
                    const content = this.querySelector('.notification-content p').textContent;
                    
                    showToast("Skoðar tilkynningu...", "info");
                    
                    // Create a modal with the notification details
                    setTimeout(() => {
                        createCustomModal('notification-detail', 'Tilkynningaupplýsingar', `
                            <div class="notification-details">
                                <p>${content}</p>
                                <div class="notification-time">Móttekin: ${new Date().toLocaleTimeString('is-IS')}</div>
                            </div>
                        `, [
                            {
                                text: 'Merkja sem lesið',
                                class: 'primary-btn',
                                id: 'mark-read-btn',
                                icon: 'check',
                                onClick: function() {
                                    // Remove the notification and update badge count
                                    const badge = document.querySelector('#notifications-btn .badge');
                                    if (badge) {
                                        const count = parseInt(badge.textContent) - 1;
                                        badge.textContent = count >= 0 ? count : 0;
                                        localStorage.setItem('notificationCount', count >= 0 ? count : 0);
                                    }
                                    
                                    // Remove the notification item
                                    notificationItem.style.opacity = '0';
                                    setTimeout(() => {
                                        notificationItem.style.display = 'none';
                                    }, 300);
                                    
                                    hideModal('notification-detail');
                                    showToast("Tilkynning merkt sem lesin", "success");
                                }
                            }
                        ]);
                        
                        showModal('notification-detail');
                    }, 500);
                });
            }
        }
        
        // Schedule next notification
        const nextTime = 5 * 60 * 1000 + Math.random() * 5 * 60 * 1000; // 5-10 minutes
        setTimeout(setupLiveNotifications, nextTime);
    }, 2000); // Initial delay before first notification
}

/**
 * Setup global event listeners for various system-wide interactions
 */
function setupGlobalEventListeners() {
    // Add toast close functionality
    document.addEventListener('click', function(e) {
        if (e.target.closest('.toast-close')) {
            const toast = e.target.closest('.toast');
            if (toast) {
                toast.classList.remove('show');
            }
        }
    });
    
    // Add escape key functionality for modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close any open modals
            const openModals = document.querySelectorAll('.modal[style*="display: block"]');
            openModals.forEach(modal => {
                hideModal(modal.id);
            });
            
            // Close any open dropdowns
            const notificationsMenu = document.getElementById('notifications-menu');
            const profileMenu = document.getElementById('profile-menu');
            
            if (notificationsMenu?.classList.contains('show')) {
                notificationsMenu.classList.remove('show');
            }
            
            if (profileMenu?.classList.contains('show')) {
                profileMenu.classList.remove('show');
            }
        }
    });
    
    // Add click handlers for toast notifications
    document.addEventListener('click', function(e) {
        const toastEl = document.getElementById('toast-notification');
        
        // Close toast when clicking outside
        if (toastEl && toastEl.classList.contains('show') && !toastEl.contains(e.target)) {
            toastEl.classList.remove('show');
        }
    });
    
    // Add swipe gesture support for mobile navigation
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        let touchStartX = 0;
        
        mainContent.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        mainContent.addEventListener('touchend', function(e) {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            
            // Detect swipe right to open sidebar
            if (diff > 100 && touchStartX < 50) {
                const appContainer = document.querySelector('.app-container');
                if (appContainer && !appContainer.classList.contains('sidebar-collapsed')) {
                    appContainer.classList.add('sidebar-collapsed');
                    localStorage.setItem('sidebarCollapsed', 'true');
                }
            }
            
            // Detect swipe left to close sidebar on mobile
            if (diff < -100 && window.innerWidth <= 768) {
                const appContainer = document.querySelector('.app-container');
                if (appContainer && appContainer.classList.contains('sidebar-collapsed')) {
                    appContainer.classList.remove('sidebar-collapsed');
                    localStorage.setItem('sidebarCollapsed', 'false');
                }
            }
        });
    }
    
    // Add double-click functionality for quick actions in tables
    document.addEventListener('dblclick', function(e) {
        const tableRow = e.target.closest('tr[data-id]');
        if (tableRow) {
            const id = tableRow.getAttribute('data-id');
            const type = tableRow.getAttribute('data-type');
            
            // Handle different entity types
            if (type === 'patient') {
                // Show patient details
                showToast(`Opna upplýsingar um sjúkling #${id}...`, "info");
                // Here you would typically call a function to show patient details
            } else if (type === 'staff') {
                // Show staff details
                showToast(`Opna upplýsingar um starfsmann #${id}...`, "info");
            } else if (type === 'inventory') {
                // Show inventory details
                showToast(`Opna birgðaupplýsingar #${id}...`, "info");
            }
        }
    });
    
    // Add event listener for browser resize to handle responsive layout changes
    window.addEventListener('resize', debounce(function() {
        // Update any responsive layout elements that need JavaScript assistance
        const appContainer = document.querySelector('.app-container');
        
        // On mobile, auto-collapse sidebar when resizing down
        if (window.innerWidth <= 768 && appContainer) {
            if (appContainer.classList.contains('sidebar-collapsed')) {
                appContainer.classList.remove('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', 'false');
            }
        }
    }, 250));
    
    // Add a beforeunload event to warn about unsaved changes
    window.addEventListener('beforeunload', function(e) {
        // Check if there are any unsaved changes (simplified example)
        const hasUnsavedChanges = document.querySelectorAll('form.dirty').length > 0;
        
        if (hasUnsavedChanges) {
            // The message might not be displayed in modern browsers for security reasons
            // but the dialog will still appear
            const message = 'Þú ert með óvistaðar breytingar. Ertu viss um að þú viljir fara?';
            e.returnValue = message;
            return message;
        }
    });
}

// ===== PAGE-SPECIFIC INITIALIZATIONS =====

/**
 * Initialize the dashboard page
 */
function initDashboard() {
    console.log("Initializing Dashboard Page");
    
    // Check if Chart.js is available for charts
    if (typeof Chart !== 'undefined') {
        try {
            initOccupancyChart();
            initStaffChart();
        } catch (error) {
            console.error("Error initializing charts:", error);
        }
    } else {
        console.warn("Chart.js not loaded, skipping chart initialization");
    }
    
    // Set up event listeners
    setupDashboardEventListeners();
    
    // Add event listeners for all dashboard buttons and cards
    setupDashboardCards();
    setupMetricCards();
    setupInventoryItems();
    setupShiftCategories();
    setupStaffBadges();
}

/**
 * Setup dashboard event listeners
 */
function setupDashboardEventListeners() {
    console.log("Setting up dashboard event listeners");
    
    // Set up timeframe selectors for charts
    const timeframeButtons = document.querySelectorAll('.chart-timeframe-btn');
    if (timeframeButtons.length > 0) {
        timeframeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                timeframeButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update chart based on timeframe
                const timeframe = this.getAttribute('data-timeframe');
                updateOccupancyChart(timeframe);
            });
        });
    }
    
    // Set up view selectors for staff chart
    const viewButtons = document.querySelectorAll('.chart-view-btn');
    if (viewButtons.length > 0) {
        viewButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                viewButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update chart based on view
                const view = this.getAttribute('data-view');
                updateStaffChart(view);
            });
        });
    }
    
    // Setup AI Insights refresh button
    const refreshInsightsBtn = document.getElementById('refresh-insights');
    if (refreshInsightsBtn) {
        refreshInsightsBtn.addEventListener('click', function() {
            simulateAIInsightsRefresh();
        });
    }
}

/**
 * Initialize the inventory page
 */
function initInventory() {
    console.log("Initializing Inventory Page");
    
    // Enhanced initialization
    enhancedInitInventory();
}

/**
 * Enhanced initialization for the inventory page
 */
function enhancedInitInventory() {
    console.log("Enhanced Inventory Initialization");
    
    // Load inventory items
    loadInventoryItems();
    
    // Setup event listeners
    setupInventoryEventListeners();
    
    // Ensure DOM is loaded before applying styles
    ensureInventoryDOMLoaded(function() {
        // Apply layout fixes
        organizeInventoryLayout();
        
        // Setup resize handler
        setupInventoryResizeHandler();
    });
}

/**
 * Enhanced schedule initialization to ensure buttons work correctly
 */
function initSchedule() {
    console.log("Initializing Schedule Page with enhanced button handling");
    
    // Initialize the staff list
    initStaffList();
    
    // Show a loading indicator while we set up the page
    const loadingElement = document.createElement('div');
    loadingElement.className = 'schedule-loading';
    loadingElement.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Hleður vaktaáætlun...</span>
        </div>
    `;
    document.querySelector('.schedule-container')?.appendChild(loadingElement);
    
    // Initialize with a short delay to ensure DOM is fully loaded
    setTimeout(() => {
        try {
            // Initialize the staff drag and drop
            initStaffDragDrop();
            
            // Initialize the calendar
            initCalendar();
            
            // Set up direct event listeners for all buttons
            setupDirectButtonHandlers();
            
            // Remove loading indicator
            document.querySelector('.schedule-loading')?.remove();
            
            console.log("Schedule page fully initialized with direct button handlers");
        } catch (error) {
            console.error("Error during schedule initialization:", error);
            showToast("Villa við að hlaða vaktaáætlun", "error");
        }
    }, 500);
}

/**
 * Set up direct event handlers for all schedule page buttons
 */
function setupDirectButtonHandlers() {
    console.log("Setting up direct button handlers for schedule page");
    
    // Auto-schedule button
    const autoScheduleBtn = document.getElementById('auto-schedule-btn');
    if (autoScheduleBtn) {
        console.log("Found auto-schedule button, attaching click handler");
        autoScheduleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Auto-schedule button clicked");
            autoGenerateSchedule();
        });
    } else {
        console.warn("Auto-schedule button not found in DOM");
    }
    
    // Check conflicts button
    const checkConflictsBtn = document.getElementById('check-conflicts-btn');
    if (checkConflictsBtn) {
        console.log("Found check-conflicts button, attaching click handler");
        checkConflictsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Check conflicts button clicked");
            checkScheduleConflicts();
        });
    } else {
        console.warn("Check conflicts button not found in DOM");
    }
    
    // Department filter
    const departmentFilter = document.getElementById('department-filter');
    if (departmentFilter) {
        console.log("Found department filter, attaching change handler");
        departmentFilter.addEventListener('change', function() {
            console.log("Department filter changed to:", this.value);
            filterScheduleByDepartment();
        });
    } else {
        console.warn("Department filter not found in DOM");
    }
    
    // Staff view toggle
    const staffViewToggle = document.getElementById('staff-view-toggle');
    if (staffViewToggle) {
        console.log("Found staff view toggle, attaching click handler");
        staffViewToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Staff view toggle clicked");
            toggleStaffView();
        });
    } else {
        console.warn("Staff view toggle not found in DOM");
    }
    
    // Add shift button
    const addShiftBtn = document.getElementById('add-shift-btn');
    if (addShiftBtn) {
        console.log("Found add-shift button, attaching click handler");
        addShiftBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Add shift button clicked");
            showAddShiftModal(new Date());
        });
    } else {
        console.warn("Add shift button not found in DOM");
    }
    
    // Add staff button
    const addStaffBtn = document.getElementById('add-staff-btn');
    if (addStaffBtn) {
        console.log("Found add-staff button, attaching click handler");
        addStaffBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Add staff button clicked");
            showAddStaffModal();
        });
    } else {
        console.warn("Add staff button not found in DOM");
    }
    
    // Staff filter
    const staffFilter = document.getElementById('staff-filter');
    if (staffFilter) {
        console.log("Found staff filter, attaching change handler");
        staffFilter.addEventListener('change', function() {
            console.log("Staff filter changed to:", this.value);
            filterStaffList(this.value);
        });
    } else {
        console.warn("Staff filter not found in DOM");
    }
    
    // Log success
    console.log("All direct button handlers set up successfully");
}

/**
 * Filter the staff list based on role
 */
function filterStaffList(role) {
    const staffItems = document.querySelectorAll('.staff-item');
    
    if (role === 'all') {
        // Show all staff members
        staffItems.forEach(item => {
            item.style.display = '';
        });
    } else {
        // Filter by role
        staffItems.forEach(item => {
            const staffRole = item.querySelector('.staff-role')?.textContent.toLowerCase() || '';
            
            if (role === 'nurse' && staffRole.includes('hjúkrunarfræðingur')) {
                item.style.display = '';
            } else if (role === 'assistant' && staffRole.includes('sjúkraliði')) {
                item.style.display = '';
            } else if (role === 'aide' && staffRole.includes('aðstoðarmaður')) {
                item.style.display = '';
            } else if (role === 'management' && (staffRole.includes('stjór') || staffRole.includes('læknir'))) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

/**
 * Show modal to add a new staff member
 */
function showAddStaffModal() {
    createCustomModal('add-staff-modal', 'Bæta við starfsmanni', `
        <form id="add-staff-form">
            <div class="form-group">
                <label for="staff-name">Nafn</label>
                <input type="text" class="form-control" id="staff-name" required>
            </div>
            <div class="form-group">
                <label for="staff-role">Hlutverk</label>
                <select class="form-control" id="staff-role" required>
                    <option value="Hjúkrunarfræðingur">Hjúkrunarfræðingur</option>
                    <option value="Sjúkraliði">Sjúkraliði</option>
                    <option value="Aðstoðarmaður">Aðstoðarmaður</option>
                    <option value="Deildarstjóri">Deildarstjóri</option>
                    <option value="Læknir">Læknir</option>
                </select>
            </div>
            <div class="form-group">
                <label for="staff-department">Deild</label>
                <select class="form-control" id="staff-department" required>
                    <option value="A-álma">A-álma</option>
                    <option value="B-álma">B-álma</option>
                    <option value="C-álma">C-álma</option>
                    <option value="Stjórnun">Stjórnun</option>
                    <option value="Læknaþjónusta">Læknaþjónusta</option>
                </select>
            </div>
            <div class="form-group">
                <label for="staff-status">Staða</label>
                <select class="form-control" id="staff-status" required>
                    <option value="available">Laus</option>
                    <option value="busy">Upptekinn</option>
                    <option value="unavailable">Ófáanlegur</option>
                    <option value="sick">Veikur</option>
                </select>
            </div>
            <div class="form-group">
                <label>Vaktir</label>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" id="morning-shift" name="shifts" value="Morgunvakt" checked>
                        <label for="morning-shift">Morgunvakt</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="evening-shift" name="shifts" value="Kvöldvakt" checked>
                        <label for="evening-shift">Kvöldvakt</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="night-shift" name="shifts" value="Næturvakt">
                        <label for="night-shift">Næturvakt</label>
                    </div>
                </div>
            </div>
        </form>
    `, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: 'cancel-add-staff'
        },
        {
            text: 'Bæta við',
            class: 'primary-btn',
            icon: 'user-plus',
            id: 'save-staff-btn',
            onClick: function() {
                console.log("Save staff button clicked");
                const form = document.getElementById('add-staff-form');
                if (form.checkValidity()) {
                    addNewStaffMember();
                    hideModal('add-staff-modal');
                } else {
                    form.reportValidity();
                }
            }
        }
    ]);
    
    showModal('add-staff-modal');
}

/**
 * Add a new staff member to the list
 */
function addNewStaffMember() {
    console.log("Adding new staff member");
    
    // Get form values
    const name = document.getElementById('staff-name').value;
    const role = document.getElementById('staff-role').value;
    const department = document.getElementById('staff-department').value;
    const status = document.getElementById('staff-status').value;
    
    // Get selected shifts
    const shiftCheckboxes = document.querySelectorAll('input[name="shifts"]:checked');
    const shifts = Array.from(shiftCheckboxes).map(cb => cb.value);
    
    // Generate a random color for the staff member
    const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#607D8B', '#3F51B5', '#009688'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Create a new staff member object
    const newStaff = {
        id: staffList.length + 1,
        name: name,
        role: role,
        department: department,
        status: status,
        shifts: shifts,
        color: randomColor,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=staff${staffList.length + 1}`,
        contact: {
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@nursecare.is`,
            phone: `+354 ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`
        },
        lastShift: { date: new Date(Date.now() - 86400000), wing: department.charAt(0), updates: 0, medLogs: 0 }
    };
    
    // Add to staff list
    staffList.push(newStaff);
    
    // Recreate the staff list display
    initStaffDragDrop();
    
    // Show success message
    showToast(`Starfsmanni bætt við: ${name}`, "success");
}

/**
 * Initialize the chatbot page
 */
function initChatbot() {
    // Load chat history
    loadChatHistory();
    
    // Setup event listeners
    setupChatbotEventListeners();
    
    // Fix layout issues
    fixChatbotLayout();
    
    // Add welcome message if no history
    if (chatHistory.length === 0) {
        const welcomeMessage = "Hæ! Ég er NurseCare AI. Hvernig get ég aðstoðað þig með vaktaskipulag, birgðir eða umönnun sjúklinga?";
        addMessageToChat('ai', welcomeMessage);
    } else {
        // Render existing history
        renderChatHistory();
    }
}

/**
 * Setup chatbot event listeners
 */
function setupChatbotEventListeners() {
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendUserMessage();
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', sendUserMessage);
    }
}

/**
 * Send a user message to the chatbot
 */
async function sendUserMessage() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Clear input
    chatInput.value = '';
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Show typing indicator
    showTypingIndicator(true);
    
    try {
        // Process message and get AI response
        const response = await processUserMessage(message);
        
        // Hide typing indicator
        showTypingIndicator(false);
        
        // Add AI response to chat
        addMessageToChat('ai', response);
    } catch (error) {
        console.error('Error processing message:', error);
        showTypingIndicator(false);
        addMessageToChat('ai', 'Því miður kom upp villa við að vinna úr skilaboðum þínum. Vinsamlegast reyndu aftur.');
    }
}

/**
 * Process user message and get AI response
 */
async function processUserMessage(message) {
    try {
        // Get API key and endpoint from window.env
        const apiKey = window.env?.VITE_OPENAI_API_KEY;
        const apiUrl = window.env?.VITE_OPENAI_API_URL;
        
        if (!apiKey || !apiUrl) {
            console.error('Missing API configuration. Please check your environment variables.');
            throw new Error('Missing API configuration');
        }
        
        // Prepare messages array with context and history
        const messages = [
            {
                role: "system",
                content: `You are NurseCare AI, an AI assistant for a nursing home. You communicate in Icelandic and help with:
                - Staff scheduling and shift management
                - Inventory management and supplies
                - Patient care and monitoring
                - General nursing home operations
                
                Guidelines:
                - Always respond in Icelandic
                - Be professional but friendly
                - Focus on nursing home context
                - Provide clear, actionable advice
                - Maintain patient privacy and confidentiality
                - If unsure, ask for clarification
                - For emergencies, direct to human staff`
            },
            ...chatHistory.slice(-5).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.message
            })),
            {
                role: "user",
                content: message
            }
        ];
        
        // Make API request
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API request failed:', response.status, response.statusText, errorData);
            throw new Error(`API request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content.trim();
        
    } catch (error) {
        console.error('Error in processUserMessage:', error);
        // Return a user-friendly error message in Icelandic
        return 'Því miður kom upp villa við að vinna úr skilaboðum þínum. Vinsamlegast reyndu aftur.';
    }
}

/**
 * Initialize the patients page
 */
function initPatients() {
    console.log("Initializing Patients Page");
    
    // Convert patient page to Icelandic and ensure consistent navigation
    translatePatientsPage();
    fixPatientsNavigation();
    
    // Set up patient-specific functionality
    setupPatientEventListeners();
}

/**
 * Initialize the medication page
 */
function initMedication() {
    console.log("Initializing Medication Page");
    // This would be implemented with medication-specific functionality
    
    // For now, just show a toast notification
    showToast("Lyfjasíða í þróun", "info");
}

/**
 * Initialize the staff page
 */
function initStaff() {
    console.log("Initializing Staff Page");
    // This would be implemented with staff management functionality
    
    // For now, just show a toast notification
    showToast("Starfsmannasíða í þróun", "info");
}

// ===== MAKE FUNCTIONS GLOBALLY AVAILABLE =====
// These functions need to be global for event handlers in HTML
window.showToast = showToast;
window.showModal = showModal;
window.hideModal = hideModal;
window.sendUserMessage = sendUserMessage;
window.clearChat = clearChat;

// If we're already on the chatbot page, apply the fixes immediately
if (getCurrentPage() === 'chatbot') {
    console.log("On chatbot page, applying immediate fixes");
    enhancedInitChatbot();
    
    // Add a resize handler to adjust layouts when window is resized
    window.addEventListener('resize', debounce(function() {
        fixChatbotLayout();
    }, 250));
}

// If we're already on the inventory page, apply the fixes immediately
if (getCurrentPage() === 'inventory') {
    ensureInventoryDOMLoaded(function() {
        organizeInventoryLayout();
        setupInventoryResizeHandler();
        console.log("Immediate inventory layout fixes applied");
    });
}

// ===== CHATBOT SUPPORT FUNCTIONS =====

/**
 * Enhanced event listeners setup for chatbot
 * Ensures all buttons and interactions work properly
 */
function setupEnhancedChatbotEventListeners() {
    console.log("Setting up enhanced chatbot event listeners");
    
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    const clearChatButton = document.getElementById('clear-chat');
    
    // Send button click - using both direct and delegation approach
    if (sendButton) {
        // Remove any existing listeners to prevent duplicates
        sendButton.replaceWith(sendButton.cloneNode(true));
        
        // Get the fresh reference
        const freshSendButton = document.getElementById('send-message');
        if (freshSendButton) {
            freshSendButton.addEventListener('click', function() {
                sendUserMessage();
            });
        }
    }
    
    // Also add a delegated event listener for the send button (in case it's dynamically loaded)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'send-message') {
            sendUserMessage();
        }
    });
    
    // Enter key press in input field
    if (chatInput) {
        // Remove any existing listeners
        chatInput.replaceWith(chatInput.cloneNode(true));
        
        // Get the fresh reference
        const freshChatInput = document.getElementById('chat-input');
        if (freshChatInput) {
            freshChatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent default to avoid form submission
                    sendUserMessage();
                }
            });
        }
    }
    
    // Clear chat button
    if (clearChatButton) {
        // Remove any existing listeners
        clearChatButton.replaceWith(clearChatButton.cloneNode(true));
        
        // Get the fresh reference
        const freshClearButton = document.getElementById('clear-chat');
        if (freshClearButton) {
            freshClearButton.addEventListener('click', function() {
                clearChat();
            });
        }
    }
    
    // Also add a delegated event listener for the clear button
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'clear-chat') {
            clearChat();
        }
    });
    
    // Fix layout and styling issues
    fixChatbotLayout();
}

/**
 * Sends user message from the chat input to the chat display
 */
function sendUserMessage() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (message === '') return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    chatInput.value = '';
    chatInput.focus();
    
    // Process the message and get AI response
    processUserMessage(message);
}

/**
 * Show or hide typing indicator
 */
function showTypingIndicator(show) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    // Remove existing typing indicator if present
    const existingIndicator = chatContainer.querySelector('.typing-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    if (show) {
        // Create and add typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai typing-indicator';
        typingIndicator.innerHTML = '<div class="dots"><span>.</span><span>.</span><span>.</span></div>';
        
        chatContainer.appendChild(typingIndicator);
        scrollToBottom();
    }
}

/**
 * Add a message to the chat
 */
function addMessageToChat(sender, message) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    // Create timestamp
    const timestamp = new Date();
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    // Format the message text (handle markdown and links)
    const formattedMessage = formatMessageText(message);
    
    // Add sender icon
    const iconClass = sender === 'user' ? 'fa-user' : 'fa-robot';
    
    // Generate the inner HTML
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="message-content">
            <div class="message-text">${formattedMessage}</div>
            <div class="message-time">${formatTime(timestamp)}</div>
        </div>
    `;
    
    // Add to container
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
    
    // Save to history
    saveChatMessage(sender, message, timestamp);
}

/**
 * Format message text to handle markdown and links
 */
function formatMessageText(text) {
    if (!text) return '';
    
    // Make text HTML-safe
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Convert ** for bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert * for italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert URLs to links
    formatted = formatted.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

/**
 * Scroll chat container to bottom
 */
function scrollToBottom() {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

/**
 * Save chat message to history
 */
function saveChatMessage(sender, message, timestamp) {
    // Add to chat history
    chatHistory.push({
        sender,
        message,
        timestamp
    });
    
    // Trim history if it gets too long
    if (chatHistory.length > MAX_HISTORY_LENGTH) {
        chatHistory = chatHistory.slice(chatHistory.length - MAX_HISTORY_LENGTH);
    }
    
    // Save to localStorage
    try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (error) {
        console.warn('Failed to save chat history to localStorage', error);
    }
}

/**
 * Load chat history from localStorage
 */
function loadChatHistory() {
    try {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            
            // Convert string timestamps back to Date objects
            chatHistory.forEach(item => {
                item.timestamp = new Date(item.timestamp);
            });
        }
    } catch (error) {
        console.warn('Failed to load chat history from localStorage', error);
        chatHistory = [];
    }
}

/**
 * Render the saved chat history
 */
function renderChatHistory() {
    // Clear existing messages first
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Clear existing content
    chatMessages.innerHTML = '';
    
    // Add each message
    chatHistory.forEach(item => {
        addMessageToChat(item.sender, item.message);
    });
}

/**
 * Clear the chat history
 */
function clearChat() {
    // Clear visual chat
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // Clear history array
    chatHistory = [];
    
    // Clear localStorage
    try {
        localStorage.removeItem('chatHistory');
    } catch (error) {
        console.warn('Failed to clear chat history from localStorage', error);
    }
    
    // Add welcome message
    setTimeout(() => {
        const welcomeMessage = "Hæ! Ég er NurseCare AI. Hvernig get ég aðstoðað þig með vaktaskipulag, birgðir eða umönnun sjúklinga?";
        addMessageToChat('ai', welcomeMessage);
    }, 300);
}

/**
 * Fix chatbot layout and styling issues
 */
function fixChatbotLayout() {
    console.log("Fixing chatbot layout");
    
    // Fix chat container height
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
        // Make sure the container has a reasonable height
        if (window.innerHeight > 768) {
            chatContainer.style.height = '500px';
        } else {
            // On smaller screens, make it responsive
            chatContainer.style.height = '50vh';
        }
    }
    
    // Fix input field width
    const chatInputField = document.getElementById('chat-input');
    if (chatInputField) {
        // Make sure the input doesn't overflow
        chatInputField.style.width = '100%';
        chatInputField.style.maxWidth = '100%';
    }
}

/**
 * Add a message to the chat
 */
function addMessageToChat(sender, message) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    // Create timestamp
    const timestamp = new Date();
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    
    // Format the message text (handle markdown and links)
    const formattedMessage = formatMessageText(message);
    
    // Add sender icon
    const iconClass = sender === 'user' ? 'fa-user' : 'fa-robot';
    
    // Generate the inner HTML
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="message-content">
            <div class="message-text">${formattedMessage}</div>
            <div class="message-time">${formatTime(timestamp)}</div>
        </div>
    `;
    
    // Add to container
    chatContainer.appendChild(messageElement);
    
    // Scroll to bottom
    scrollToBottom();
    
    // Save to history
    saveChatMessage(sender, message, timestamp);
}

/**
 * Format message text to handle markdown and links
 */
function formatMessageText(text) {
    if (!text) return '';
    
    // Make text HTML-safe
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Convert ** for bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert * for italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert URLs to links
    formatted = formatted.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

/**
 * Scroll chat container to bottom
 */
function scrollToBottom() {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

/**
 * Save chat message to history
 */
function saveChatMessage(sender, message, timestamp) {
    // Add to chat history
    chatHistory.push({
        sender,
        message,
        timestamp
    });
    
    // Trim history if it gets too long
    if (chatHistory.length > MAX_HISTORY_LENGTH) {
        chatHistory = chatHistory.slice(chatHistory.length - MAX_HISTORY_LENGTH);
    }
    
    // Save to localStorage
    try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (error) {
        console.warn('Failed to save chat history to localStorage', error);
    }
}

/**
 * Load chat history from localStorage
 */
function loadChatHistory() {
    try {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            
            // Convert string timestamps back to Date objects
            chatHistory.forEach(item => {
                item.timestamp = new Date(item.timestamp);
            });
        }
    } catch (error) {
        console.warn('Failed to load chat history from localStorage', error);
        chatHistory = [];
    }
}

/**
 * Render the saved chat history
 */
function renderChatHistory() {
    // Clear existing messages first
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Clear existing content
    chatMessages.innerHTML = '';
    
    // Add each message
    chatHistory.forEach(item => {
        addMessageToChat(item.sender, item.message);
    });
}

/**
 * Clear the chat history
 */
function clearChat() {
    // Clear visual chat
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // Clear history array
    chatHistory = [];
    
    // Clear localStorage
    try {
        localStorage.removeItem('chatHistory');
    } catch (error) {
        console.warn('Failed to clear chat history from localStorage', error);
    }
    
    // Add welcome message
    setTimeout(() => {
        const welcomeMessage = "Hæ! Ég er NurseCare AI. Hvernig get ég aðstoðað þig með vaktaskipulag, birgðir eða umönnun sjúklinga?";
        addMessageToChat('ai', welcomeMessage);
    }, 300);
}

/**
 * Fix chatbot layout and styling issues
 */
function fixChatbotLayout() {
    console.log("Fixing chatbot layout");
    
    // Fix chat container height
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
        // Make sure the container has a reasonable height
        if (window.innerHeight > 768) {
            chatContainer.style.height = '500px';
        } else {
            // On smaller screens, make it responsive
            chatContainer.style.height = '50vh';
        }
    }
    
    // Fix input field width
    const chatInputField = document.getElementById('chat-input');
    if (chatInputField) {
        // Make sure the input doesn't overflow
        chatInputField.style.width = '100%';
        chatInputField.style.maxWidth = '100%';
    }
}

// ===== PATIENTS PAGE FUNCTIONS =====

/**
 * Translate patients page to Icelandic
 */
function translatePatientsPage() {
    // Translation mapping
    const translations = {
        // Header content
        'Patient Records': 'Sjúklingaskrár',
        'Loading...': 'Hleður...',
        'Search patients...': 'Leita að sjúklingum...',
        'Filter': 'Sía',
        'Card View': 'Spjaldayfirlit',
        'Table View': 'Töfluyfirlit',
        'Add Patient': 'Bæta við sjúklingi',
        
        // Table headers
        'Name': 'Nafn',
        'Age': 'Aldur',
        'Room': 'Herbergi',
        'Status': 'Staða',
        'Last Updated': 'Síðast uppfært',
        'Attending Nurse': 'Hjúkrunarfræðingur',
        'Actions': 'Aðgerðir',
        
        // Status values
        'Stable': 'Stöðugur',
        'Critical': 'Alvarlegt',
        'Improving': 'Batnar',
        'Deteriorating': 'Versnandi',
        
        // Button text
        'View': 'Skoða',
        'Edit': 'Breyta',
        'Delete': 'Eyða',
        'Save': 'Vista',
        'Cancel': 'Hætta við',
        
        // Misc
        'No patients found': 'Engir sjúklingar fundust',
        'Patient Details': 'Upplýsingar um sjúkling',
        'Medical History': 'Sjúkrasaga',
        'Medications': 'Lyf',
        'Notes': 'Athugasemdir',
        'Add Note': 'Bæta við athugasemd'
    };
    
    // Replace text in elements
    translateElements(translations);
    
    // Translate placeholders
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
        if (translations[el.getAttribute('placeholder')]) {
            el.setAttribute('placeholder', translations[el.getAttribute('placeholder')]);
        }
    });
    
    // Format dates
    formatPatientDates();
}

/**
 * Helper function to translate text content of elements
 */
function translateElements(translations) {
    // Grab all text nodes
    const textNodes = [];
    const walk = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        null, 
        false
    );
    
    while (walk.nextNode()) {
        textNodes.push(walk.currentNode);
    }
    
    // Replace text if it exists in our translation map
    textNodes.forEach(node => {
        const trimmedText = node.nodeValue.trim();
        if (translations[trimmedText]) {
            node.nodeValue = node.nodeValue.replace(trimmedText, translations[trimmedText]);
        }
    });
    
    // Also check for elements with text content
    Object.keys(translations).forEach(key => {
        document.querySelectorAll(`[data-text="${key}"]`).forEach(el => {
            el.textContent = translations[key];
        });
    });
}

/**
 * Format dates on patient page to Icelandic format
 */
function formatPatientDates() {
    // Format dates in the table
    document.querySelectorAll('.date-column').forEach(el => {
        const dateText = el.textContent.trim();
        if (dateText && !dateText.includes('Síðast uppfært')) {
            try {
                const dateObj = new Date(dateText);
                if (!isNaN(dateObj.getTime())) {
                    el.textContent = formatDate(dateObj, true);
                }
            } catch (e) {
                console.warn('Failed to parse date:', dateText);
            }
        }
    });
}

/**
 * Fix patient page navigation and add consistent UI elements
 */
function fixPatientsNavigation() {
    // Add consistent back button if missing
    if (!document.querySelector('.back-button')) {
        const header = document.querySelector('.page-header');
        if (header) {
            const backButton = document.createElement('button');
            backButton.className = 'back-button btn';
            backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Til baka';
            backButton.addEventListener('click', function() {
                history.back();
            });
            
            header.insertBefore(backButton, header.firstChild);
        }
    }
    
    // Ensure responsive grid layout for patient cards
    const patientCards = document.querySelector('.patient-cards');
    if (patientCards) {
        patientCards.style.display = 'grid';
        patientCards.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        patientCards.style.gap = '1rem';
    }
    
    // Consistent styling for patient detail sections
    document.querySelectorAll('.patient-detail-section').forEach(section => {
        if (!section.classList.contains('enhanced')) {
            section.classList.add('enhanced');
            section.style.marginBottom = '1.5rem';
            section.style.padding = '1rem';
            section.style.borderRadius = 'var(--border-radius)';
            section.style.backgroundColor = 'var(--bg-secondary)';
            section.style.boxShadow = 'var(--shadow-sm)';
        }
    });
}

/**
 * Setup patient page event listeners
 */
function setupPatientEventListeners() {
    // Patient filter functionality
    const filterInput = document.getElementById('patient-filter');
    if (filterInput) {
        filterInput.addEventListener('input', function() {
            filterPatients(this.value.toLowerCase());
        });
    }
    
    // Toggle between card and table view
    const cardViewBtn = document.getElementById('card-view-btn');
    const tableViewBtn = document.getElementById('table-view-btn');
    const patientCards = document.querySelector('.patient-cards');
    const patientTable = document.querySelector('.patient-table');
    
    if (cardViewBtn && tableViewBtn && patientCards && patientTable) {
        cardViewBtn.addEventListener('click', function() {
            patientCards.style.display = 'grid';
            patientTable.style.display = 'none';
            cardViewBtn.classList.add('active');
            tableViewBtn.classList.remove('active');
            localStorage.setItem('patientViewPreference', 'card');
        });
        
        tableViewBtn.addEventListener('click', function() {
            patientCards.style.display = 'none';
            patientTable.style.display = 'table';
            cardViewBtn.classList.remove('active');
            tableViewBtn.classList.add('active');
            localStorage.setItem('patientViewPreference', 'table');
        });
        
        // Apply saved preference if it exists
        const savedViewPreference = localStorage.getItem('patientViewPreference');
        if (savedViewPreference === 'table') {
            tableViewBtn.click();
        } else {
            cardViewBtn.click();
        }
    }
    
    // Add patient button
    const addPatientBtn = document.getElementById('add-patient-btn');
    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', function() {
            showAddPatientModal();
        });
    }
    
    // Add note button
    document.querySelectorAll('.add-note-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const patientId = this.getAttribute('data-patient-id');
            showAddNoteModal(patientId);
        });
    });
    
    // Patient status indicator tooltips
    document.querySelectorAll('.status-indicator').forEach(indicator => {
        const status = indicator.getAttribute('data-status');
        if (status) {
            indicator.title = getStatusDescription(status);
            indicator.style.backgroundColor = getStatusColor(status);
        }
    });
}

/**
 * Filter patients based on search input
 */
function filterPatients(query) {
    const patientCards = document.querySelectorAll('.patient-card');
    const patientRows = document.querySelectorAll('.patient-row');
    
    // Combined array for both card and table views
    const allPatientElements = [...patientCards, ...patientRows];
    
    if (query === '') {
        // Show all if query is empty
        allPatientElements.forEach(el => {
            el.style.display = '';
        });
    } else {
        // Filter based on patient data
        allPatientElements.forEach(el => {
            const patientName = el.querySelector('.patient-name')?.textContent.toLowerCase() || '';
            const patientRoom = el.querySelector('.patient-room')?.textContent.toLowerCase() || '';
            const patientStatus = el.querySelector('.patient-status')?.textContent.toLowerCase() || '';
            
            // Show element if any field matches the query
            if (patientName.includes(query) || patientRoom.includes(query) || patientStatus.includes(query)) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
    }
    
    // Show "no results" message if all are hidden
    const noResultsMessage = document.getElementById('no-results-message');
    if (noResultsMessage) {
        const allHidden = Array.from(allPatientElements).every(el => el.style.display === 'none');
        noResultsMessage.style.display = allHidden ? 'block' : 'none';
    }
}

/**
 * Show modal to add a new patient
 */
function showAddPatientModal() {
    createCustomModal('add-patient-modal', 'Bæta við sjúklingi', `
        <form id="add-patient-form">
            <div class="form-group">
                <label for="patient-name">Nafn</label>
                <input type="text" class="form-control" id="patient-name" required>
            </div>
            <div class="form-row">
                <div class="form-group col-md-6">
                    <label for="patient-age">Aldur</label>
                    <input type="number" class="form-control" id="patient-age" min="0" max="120" required>
                </div>
                <div class="form-group col-md-6">
                    <label for="patient-room">Herbergi</label>
                    <input type="number" class="form-control" id="patient-room" min="100" max="999" required>
                </div>
            </div>
            <div class="form-group">
                <label for="patient-status">Staða</label>
                <select class="form-control" id="patient-status" required>
                    <option value="stable">Stöðugur</option>
                    <option value="improving">Batnar</option>
                    <option value="deteriorating">Versnandi</option>
                    <option value="critical">Alvarlegt</option>
                </select>
            </div>
            <div class="form-group">
                <label for="patient-nurse">Hjúkrunarfræðingur</label>
                <select class="form-control" id="patient-nurse">
                    <option value="">Veldu hjúkrunarfræðing</option>
                    ${getAvailableNurses().map(nurse => `<option value="${nurse.id}">${nurse.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="patient-notes">Athugasemdir</label>
                <textarea class="form-control" id="patient-notes" rows="3"></textarea>
            </div>
        </form>
    `, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: 'cancel-add-patient'
        },
        {
            text: 'Bæta við',
            class: 'primary-btn',
            id: 'submit-add-patient',
            onClick: function() {
                const form = document.getElementById('add-patient-form');
                if (form.checkValidity()) {
                    // Form is valid, process it
                    saveNewPatient();
                    hideModal('add-patient-modal');
                } else {
                    // Trigger browser's built-in validation UI
                    form.reportValidity();
                }
            }
        }
    ]);
    
    showModal('add-patient-modal');
}

/**
 * Get a list of available nurses for assignment
 */
function getAvailableNurses() {
    // This would typically come from your staff database or API
    // For now, return some sample data
    return [
        { id: 'n1', name: 'Anna Björg' },
        { id: 'n2', name: 'Jón Guðmundsson' },
        { id: 'n3', name: 'Sara Jónsdóttir' },
        { id: 'n4', name: 'Kristín Gunnarsdóttir' },
        { id: 'n5', name: 'Gunnar Haraldsson' }
    ];
}

/**
 * Save a new patient (simulated)
 */
function saveNewPatient() {
    const name = document.getElementById('patient-name').value;
    const room = document.getElementById('patient-room').value;
    
    showToast(`Sjúklingi bætt við: ${name}, herbergi ${room}`, "success");
    
    // In a real app, you would send this to your server
    // For demo purposes, we'll reload to simulate server refresh
    setTimeout(() => {
        showToast("Endurhlöðum síðu með nýjum sjúklingi...", "info");
        setTimeout(() => {
            location.reload();
        }, 1000);
    }, 1000);
}

/**
 * Show modal to add a note to a patient
 */
function showAddNoteModal(patientId) {
    // Get patient name (this would typically come from your database)
    // For demo, we'll just grab it from the DOM
    let patientName = "Sjúklingur";
    
    // Try to find the patient name in the DOM
    const patientCard = document.querySelector(`.patient-card[data-id="${patientId}"]`);
    if (patientCard) {
        patientName = patientCard.querySelector('.patient-name').textContent;
    } else {
        const patientRow = document.querySelector(`.patient-row[data-id="${patientId}"]`);
        if (patientRow) {
            patientName = patientRow.querySelector('.patient-name').textContent;
        }
    }
    
    createCustomModal('add-note-modal', `Bæta við athugasemd - ${patientName}`, `
        <form id="add-note-form">
            <div class="form-group">
                <label for="note-type">Tegund athugasemdar</label>
                <select class="form-control" id="note-type" required>
                    <option value="general">Almenn athugasemd</option>
                    <option value="medication">Lyfjagjöf</option>
                    <option value="treatment">Meðferð</option>
                    <option value="vitals">Lífsmörk</option>
                </select>
            </div>
            <div class="form-group">
                <label for="note-content">Athugasemd</label>
                <textarea class="form-control" id="note-content" rows="4" required></textarea>
            </div>
        </form>
    `, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: 'cancel-add-note'
        },
        {
            text: 'Vista',
            class: 'primary-btn',
            id: 'submit-add-note',
            onClick: function() {
                const form = document.getElementById('add-note-form');
                if (form.checkValidity()) {
                    savePatientNote(patientId);
                    hideModal('add-note-modal');
                } else {
                    form.reportValidity();
                }
            }
        }
    ]);
    
    showModal('add-note-modal');
}

/**
 * Save a note for a patient (simulated)
 */
function savePatientNote(patientId) {
    const noteType = document.getElementById('note-type').value;
    const noteContent = document.getElementById('note-content').value;
    
    const noteTypeLabels = {
        'general': 'almenna',
        'medication': 'lyfjagjöf',
        'treatment': 'meðferð',
        'vitals': 'lífsmörk'
    };
    
    showToast(`Athugasemd fyrir ${noteTypeLabels[noteType] || 'almenna'} vistuð.`, "success");
}

/**
 * Get a detailed description for a patient status
 */
function getStatusDescription(status) {
    const descriptions = {
        'stable': 'Sjúklingur er stöðugur. Engar verulegar breytingar á ástandi.',
        'improving': 'Sjúklingi fer batnandi. Jákvæð þróun í heilsufari.',
        'deteriorating': 'Sjúklingi fer hrakandi. Fylgjast þarf vel með.',
        'critical': 'Sjúklingur er í alvarlegu ástandi. Þarfnast stöðugs eftirlits.'
    };
    
    return descriptions[status] || 'Staða óþekkt';
}

// ===== INVENTORY PAGE FUNCTIONS =====

/**
 * Load inventory items from localStorage or use defaults
 */
function loadInventoryItems() {
    try {
        const savedItems = localStorage.getItem('inventoryItems');
        if (savedItems) {
            // Use saved items from localStorage
            const items = JSON.parse(savedItems);
            updateInventoryDisplay(items);
        } else {
            // Use default items for demo
            const defaultItems = getDefaultInventoryItems();
            updateInventoryDisplay(defaultItems);
            
            // Save defaults to localStorage
            localStorage.setItem('inventoryItems', JSON.stringify(defaultItems));
        }
    } catch (error) {
        console.warn('Failed to load inventory items:', error);
        // Use fallback
        updateInventoryDisplay(getDefaultInventoryItems());
    }
}

/**
 * Get default inventory items for demo
 */
function getDefaultInventoryItems() {
    return [
        { id: 1, name: 'Skurðgrímur', category: 'Hlífðarbúnaður', quantity: 200, unit: 'stk', minQuantity: 1000, status: 'low' },
        { id: 2, name: 'Hanskar (S)', category: 'Hlífðarbúnaður', quantity: 1200, unit: 'stk', minQuantity: 500, status: 'ok' },
        { id: 3, name: 'Hanskar (M)', category: 'Hlífðarbúnaður', quantity: 1500, unit: 'stk', minQuantity: 500, status: 'ok' },
        { id: 4, name: 'Hanskar (L)', category: 'Hlífðarbúnaður', quantity: 900, unit: 'stk', minQuantity: 500, status: 'ok' },
        { id: 5, name: 'Bleyjur (M)', category: 'Hjúkrun', quantity: 420, unit: 'stk', minQuantity: 1200, status: 'low' },
        { id: 6, name: 'Sáraumbúðir', category: 'Hjúkrun', quantity: 840, unit: 'stk', minQuantity: 2000, status: 'low' },
        { id: 7, name: 'Sprautur', category: 'Læknavörur', quantity: 790, unit: 'stk', minQuantity: 1000, status: 'ok' },
        { id: 8, name: 'Spritt', category: 'Sótthreinsun', quantity: 82, unit: 'flöskur', minQuantity: 100, status: 'ok' }
    ];
}

/**
 * Update inventory display with items
 */
function updateInventoryDisplay(items) {
    const inventoryTable = document.querySelector('.inventory-table tbody');
    if (!inventoryTable) return;
    
    // Clear existing rows
    inventoryTable.innerHTML = '';
    
    // Add items to table
    items.forEach(item => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id);
        row.setAttribute('data-type', 'inventory');
        
        // Calculate percentage
        const percentage = (item.quantity / item.minQuantity) * 100;
        let statusClass = 'status-ok';
        
        if (percentage <= 25) {
            statusClass = 'status-critical';
        } else if (percentage <= 50) {
            statusClass = 'status-low';
        }
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>${item.minQuantity} ${item.unit}</td>
            <td>
                <div class="status-bar">
                    <div class="status-fill ${statusClass}" style="width: ${Math.min(100, percentage)}%;"></div>
                </div>
            </td>
            <td class="actions-cell">
                <button class="action-btn" title="Breyta"><i class="fas fa-edit"></i></button>
                <button class="action-btn" title="Uppfæra birgðir"><i class="fas fa-sync-alt"></i></button>
                <button class="action-btn" title="Panta meira"><i class="fas fa-shopping-cart"></i></button>
            </td>
        `;
        
        inventoryTable.appendChild(row);
    });
    
    // Add event listeners for buttons
    setupInventoryButtons();
}

/**
 * Setup event listeners for inventory buttons
 */
function setupInventoryButtons() {
    // Edit buttons
    document.querySelectorAll('.inventory-table .fa-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.closest('tr').getAttribute('data-id');
            showEditInventoryModal(itemId);
        });
    });
    
    // Update buttons
    document.querySelectorAll('.inventory-table .fa-sync-alt').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.closest('tr').getAttribute('data-id');
            showUpdateInventoryModal(itemId);
        });
    });
    
    // Order buttons
    document.querySelectorAll('.inventory-table .fa-shopping-cart').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.closest('tr').getAttribute('data-id');
            const itemName = this.closest('tr').querySelector('td:first-child').textContent;
            showToast(`Undirbýr pöntun fyrir: ${itemName}`, "info");
        });
    });
}

/**
 * Ensure inventory DOM is loaded before applying styles
 */
function ensureInventoryDOMLoaded(callback) {
    const checkInterval = setInterval(() => {
        const inventoryTable = document.querySelector('.inventory-table');
        if (inventoryTable) {
            clearInterval(checkInterval);
            callback();
        }
    }, 100);
    
    // Safety timeout to prevent infinite loop
    setTimeout(() => {
        clearInterval(checkInterval);
    }, 10000);
}

/**
 * Organize inventory layout for better user experience
 */
function organizeInventoryLayout() {
    // Add filter input if missing
    const inventoryControls = document.querySelector('.inventory-controls');
    if (inventoryControls && !document.getElementById('inventory-filter')) {
        const filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.id = 'inventory-filter';
        filterInput.className = 'form-control';
        filterInput.placeholder = 'Leita að vörum...';
        
        inventoryControls.appendChild(filterInput);
        
        // Add event listener
        filterInput.addEventListener('input', function() {
            filterInventoryItems(this.value.toLowerCase());
        });
    }
    
    // Style the status bars
    document.querySelectorAll('.status-bar').forEach(bar => {
        if (!bar.classList.contains('enhanced')) {
            bar.classList.add('enhanced');
            bar.style.height = '20px';
            bar.style.borderRadius = '10px';
            bar.style.overflow = 'hidden';
            bar.style.backgroundColor = 'var(--bg-secondary)';
            
            const fill = bar.querySelector('.status-fill');
            if (fill) {
                fill.style.height = '100%';
                fill.style.transition = 'width 0.5s ease';
            }
        }
    });
    
    // Improve status colors
    document.querySelectorAll('.status-critical').forEach(el => {
        el.style.backgroundColor = '#F44336';
    });
    
    document.querySelectorAll('.status-low').forEach(el => {
        el.style.backgroundColor = '#FFC107';
    });
    
    document.querySelectorAll('.status-ok').forEach(el => {
        el.style.backgroundColor = '#4CAF50';
    });
}

/**
 * Setup resize handler for inventory page
 */
function setupInventoryResizeHandler() {
    window.addEventListener('resize', debounce(function() {
        // Adjust layout for different screen sizes
        if (window.innerWidth < 768) {
            // Mobile optimizations
            document.querySelectorAll('.inventory-table').forEach(table => {
                table.classList.add('mobile-optimized');
            });
        } else {
            // Desktop layout
            document.querySelectorAll('.inventory-table').forEach(table => {
                table.classList.remove('mobile-optimized');
            });
        }
    }, 250));
    
    // Initial call
    if (window.innerWidth < 768) {
        document.querySelectorAll('.inventory-table').forEach(table => {
            table.classList.add('mobile-optimized');
        });
    }
}

/**
 * Setup inventory event listeners
 */
function setupInventoryEventListeners() {
    // Add inventory item button
    const addItemBtn = document.getElementById('add-inventory-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', function() {
            showAddInventoryModal();
        });
    }
    
    // Category filter buttons
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Remove active class from all buttons
            document.querySelectorAll('.category-filter').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter items
            filterInventoryByCategory(category);
        });
    });
}

/**
 * Filter inventory items based on search query
 */
function filterInventoryItems(query) {
    const rows = document.querySelectorAll('.inventory-table tbody tr');
    
    rows.forEach(row => {
        const name = row.querySelector('td:first-child').textContent.toLowerCase();
        const category = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        
        if (name.includes(query) || category.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Filter inventory by category
 */
function filterInventoryByCategory(category) {
    const rows = document.querySelectorAll('.inventory-table tbody tr');
    
    if (category === 'all') {
        // Show all items
        rows.forEach(row => {
            row.style.display = '';
        });
    } else {
        // Filter by category
        rows.forEach(row => {
            const rowCategory = row.querySelector('td:nth-child(2)').textContent;
            
            if (rowCategory === category) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
}

// ===== DASHBOARD CHARTS FUNCTIONS =====

/**
 * Initialize the occupancy chart
 */
function initOccupancyChart() {
    const ctx = document.getElementById('occupancy-chart');
    if (!ctx) return;
    
    // Define chart colors based on theme
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e0e0e0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Get occupancy data for the last 7 days
    const occupancyData = getOccupancyData('week');
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: occupancyData.labels,
            datasets: [{
                label: 'Nýting rúma (%)',
                data: occupancyData.values,
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                borderColor: 'rgba(33, 150, 243, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(33, 150, 243, 1)',
                pointBorderColor: '#fff',
                pointRadius: 4,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDarkMode ? '#333' : '#fff',
                    titleColor: isDarkMode ? '#fff' : '#333',
                    bodyColor: isDarkMode ? '#fff' : '#333',
                    borderColor: isDarkMode ? '#555' : '#ddd',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                },
                x: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor
                    }
                }
            }
        }
    });
    
    // Store chart instance in global variable for later reference
    window.occupancyChart = chart;
}

/**
 * Get occupancy data for the chart
 */
function getOccupancyData(timeframe) {
    // This would typically come from your API or database
    // For demo purposes, we'll generate some sample data
    
    let labels = [];
    let values = [];
    
    switch(timeframe) {
        case 'week':
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(formatDate(date));
                
                // Generate random occupancy rate between 70% and 95%
                const occupancyRate = 70 + Math.floor(Math.random() * 25);
                values.push(occupancyRate);
            }
            break;
            
        case 'month':
            // Last 30 days, split into weeks
            for (let i = 4; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - (i * 7));
                labels.push(`Vika ${4 - i + 1}`);
                
                // Generate random occupancy rate between 70% and 95%
                const occupancyRate = 70 + Math.floor(Math.random() * 25);
                values.push(occupancyRate);
            }
            break;
            
        case 'year':
            // Last 12 months
            const monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr', 'Maí', 'Jún',
                'Júl', 'Ágú', 'Sep', 'Okt', 'Nóv', 'Des'
            ];
            
            const currentMonth = new Date().getMonth();
            
            for (let i = 11; i >= 0; i--) {
                const monthIndex = (currentMonth - i + 12) % 12;
                labels.push(monthNames[monthIndex]);
                
                // Generate random occupancy rate between 70% and 95%
                const occupancyRate = 70 + Math.floor(Math.random() * 25);
                values.push(occupancyRate);
            }
            break;
    }
    
    return { labels, values };
}

/**
 * Update occupancy chart with new data
 */
function updateOccupancyChart(timeframe) {
    // Get chart instance
    const chart = window.occupancyChart;
    if (!chart) return;
    
    // Get new data
    const occupancyData = getOccupancyData(timeframe);
    
    // Update chart data
    chart.data.labels = occupancyData.labels;
    chart.data.datasets[0].data = occupancyData.values;
    
    // Refresh chart
    chart.update();
}

/**
 * Initialize the staff chart
 */
function initStaffChart() {
    const ctx = document.getElementById('staff-chart');
    if (!ctx) return;
    
    // Define chart colors based on theme
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e0e0e0' : '#333333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Get staff data
    const staffData = getStaffData('role');
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: staffData.labels,
            datasets: [{
                data: staffData.values,
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)',  // Green
                    'rgba(33, 150, 243, 0.7)', // Blue
                    'rgba(255, 193, 7, 0.7)',  // Yellow
                    'rgba(156, 39, 176, 0.7)'  // Purple
                ],
                borderColor: isDarkMode ? '#333' : '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? '#333' : '#fff',
                    titleColor: isDarkMode ? '#fff' : '#333',
                    bodyColor: isDarkMode ? '#fff' : '#333',
                    borderColor: isDarkMode ? '#555' : '#ddd',
                    borderWidth: 1
                }
            },
            layout: {
                padding: 20
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
    
    // Store chart instance in global variable for later reference
    window.staffChart = chart;
}

/**
 * Get staff data for the chart
 */
function getStaffData(view) {
    // This would typically come from your API or database
    // For demo purposes, we'll generate some sample data
    
    switch(view) {
        case 'role':
            return {
                labels: ['Hjúkrunarfræðingar', 'Sjúkraliðar', 'Aðstoðarfólk', 'Stjórnendur'],
                values: [12, 18, 8, 3]
            };
            
        case 'wing':
            return {
                labels: ['A-álma', 'B-álma', 'C-álma', 'Sameiginlegt'],
                values: [14, 12, 10, 5]
            };
            
        case 'shift':
            return {
                labels: ['Morgunvakt', 'Kvöldvakt', 'Næturvakt', 'Í fríi'],
                values: [16, 10, 6, 9]
            };
    }
}

/**
 * Update staff chart with new data
 */
function updateStaffChart(view) {
    // Get chart instance
    const chart = window.staffChart;
    if (!chart) return;
    
    // Get new data
    const staffData = getStaffData(view);
    
    // Update chart data
    chart.data.labels = staffData.labels;
    chart.data.datasets[0].data = staffData.values;
    
    // Refresh chart
    chart.update();
}

/**
 * Update chart colors based on theme
 */
function updateChartColors(isDarkMode) {
    // Update occupancy chart colors
    const occupancyChart = window.occupancyChart;
    if (occupancyChart) {
        const textColor = isDarkMode ? '#e0e0e0' : '#333333';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Update scales
        occupancyChart.options.scales.y.grid.color = gridColor;
        occupancyChart.options.scales.y.ticks.color = textColor;
        occupancyChart.options.scales.x.grid.color = gridColor;
        occupancyChart.options.scales.x.ticks.color = textColor;
        
        // Update legend
        occupancyChart.options.plugins.legend.labels.color = textColor;
        
        // Update tooltip
        occupancyChart.options.plugins.tooltip.backgroundColor = isDarkMode ? '#333' : '#fff';
        occupancyChart.options.plugins.tooltip.titleColor = isDarkMode ? '#fff' : '#333';
        occupancyChart.options.plugins.tooltip.bodyColor = isDarkMode ? '#fff' : '#333';
        occupancyChart.options.plugins.tooltip.borderColor = isDarkMode ? '#555' : '#ddd';
        
        // Refresh chart
        occupancyChart.update();
    }
    
    // Update staff chart colors
    const staffChart = window.staffChart;
    if (staffChart) {
        const textColor = isDarkMode ? '#e0e0e0' : '#333333';
        
        // Update legend
        staffChart.options.plugins.legend.labels.color = textColor;
        
        // Update tooltip
        staffChart.options.plugins.tooltip.backgroundColor = isDarkMode ? '#333' : '#fff';
        staffChart.options.plugins.tooltip.titleColor = isDarkMode ? '#fff' : '#333';
        staffChart.options.plugins.tooltip.bodyColor = isDarkMode ? '#fff' : '#333';
        staffChart.options.plugins.tooltip.borderColor = isDarkMode ? '#555' : '#ddd';
        
        // Update border color
        staffChart.data.datasets[0].borderColor = isDarkMode ? '#333' : '#fff';
        
        // Refresh chart
        staffChart.update();
    }
}

/**
 * Setup dashboard card functionality
 */
function setupDashboardCards() {
    // Add click functionality to dashboard cards
    document.querySelectorAll('.dashboard-card').forEach(card => {
        card.addEventListener('click', function() {
            const cardType = this.getAttribute('data-type');
            
            // Handle different card types
            switch(cardType) {
                case 'occupancy':
                    showToast("Sýni upplýsingar um nýtingu", "info");
                    break;
                case 'staff':
                    showToast("Sýni upplýsingar um starfsfólk", "info");
                    break;
                case 'alerts':
                    showToast("Sýni allar viðvaranir", "info");
                    break;
                case 'tasks':
                    showToast("Sýni verkefnalista", "info");
                    break;
            }
        });
    });
}

/**
 * Setup metric cards functionality
 */
function setupMetricCards() {
    // Add tooltips to metrics
    document.querySelectorAll('.metric-card').forEach(metric => {
        const metricType = metric.getAttribute('data-metric');
        
        // Add tooltip based on metric type
        switch(metricType) {
            case 'occupancy':
                metric.title = 'Hlutfall af heildarfjölda rúma sem eru í notkun';
                break;
            case 'staffing':
                metric.title = 'Núverandi mönnun sem hlutfall af ákjósanlegri mönnun';
                break;
            case 'avg-stay':
                metric.title = 'Meðaldvalartími sjúklinga í dögum';
                break;
            case 'incidents':
                metric.title = 'Fjöldi skráðra atvika síðastliðinn mánuð';
                break;
        }
    });
}

/**
 * Setup inventory items dashboard overview
 */
function setupInventoryItems() {
    // Add click functionality to inventory items in dashboard
    document.querySelectorAll('.inventory-item').forEach(item => {
        item.addEventListener('click', function() {
            const itemName = this.querySelector('.inventory-item-name').textContent;
            window.location.href = 'inventory.html';
        });
    });
}

/**
 * Setup shift categories dashboard overview
 */
function setupShiftCategories() {
    // Add click functionality to shift category items
    document.querySelectorAll('.shift-category').forEach(category => {
        category.addEventListener('click', function() {
            const categoryType = this.getAttribute('data-category');
            window.location.href = 'schedule.html';
        });
    });
}

/**
 * Setup staff badges functionality
 */
function setupStaffBadges() {
    // Add tooltips and click events to staff badges
    document.querySelectorAll('.staff-badge').forEach(badge => {
        const staffName = badge.getAttribute('data-name');
        const staffRole = badge.getAttribute('data-role');
        
        badge.title = `${staffName} - ${staffRole}`;
        
        badge.addEventListener('click', function() {
            showStaffInfoModal(staffName, staffRole);
        });
    });
}

/**
 * Show the staff info modal
 */
function showStaffInfoModal(name, role) {
    createCustomModal('staff-info-modal', `Upplýsingar um starfsmann - ${name}`, `
        <div class="staff-info">
            <div class="staff-avatar">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${name}" alt="${name}">
            </div>
            <div class="staff-details">
                <h3>${name}</h3>
                <p class="staff-role">${role}</p>
                <div class="staff-contact">
                    <div><i class="fas fa-envelope"></i> ${name.toLowerCase().replace(' ', '.')}@nursecare.is</div>
                    <div><i class="fas fa-phone"></i> +354 ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}</div>
                </div>
                <div class="staff-stats">
                    <div class="stat-item">
                        <div class="stat-label">Vaktir þennan mánuð</div>
                        <div class="stat-value">${Math.floor(10 + Math.random() * 10)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Sjúklingar í umsjón</div>
                        <div class="stat-value">${Math.floor(3 + Math.random() * 7)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Næsta vakt</div>
                        <div class="stat-value">Á morgun, 07:00</div>
                    </div>
                </div>
            </div>
        </div>
    `, [
        {
            text: 'Skoða vaktaáætlun',
            class: 'primary-btn',
            id: 'view-schedule-btn',
            icon: 'calendar-alt',
            onClick: function() {
                window.location.href = 'schedule.html';
            }
        },
        {
            text: 'Loka',
            class: 'cancel-btn',
            id: 'close-staff-info'
        }
    ]);
    
    showModal('staff-info-modal');
    
    // Add styles for staff info modal
    addStyleToHead(`
        .staff-info {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
        }
        
        .staff-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid var(--primary-color);
        }
        
        .staff-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .staff-details {
            flex: 1;
            min-width: 250px;
        }
        
        .staff-role {
            color: var(--text-secondary);
            margin-bottom: 1rem;
        }
        
        .staff-contact {
            margin-bottom: 1.5rem;
            color: var(--text-secondary);
        }
        
        .staff-contact div {
            margin-bottom: 0.5rem;
        }
        
        .staff-contact i {
            width: 20px;
            margin-right: 8px;
            color: var(--primary-color);
        }
        
        .staff-stats {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .stat-item {
            background-color: var(--bg-secondary);
            padding: 0.75rem;
            border-radius: var(--border-radius);
        }
        
        .stat-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
        }
        
        .stat-value {
            font-size: 1.2rem;
            font-weight: 500;
        }
    `);
}

/**
 * Simulate refreshing AI insights on dashboard
 */
function simulateAIInsightsRefresh() {
    const insightsContainer = document.getElementById('ai-insights');
    if (!insightsContainer) return;
    
    // Show loading state
    insightsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-circle-notch fa-spin"></i>
            <p>Uppfæri innsýn...</p>
        </div>
    `;
    
    // Simulate delay
    setTimeout(() => {
        // Get some random insights
        const insights = getRandomInsights();
        
        // Update container
        insightsContainer.innerHTML = '';
        
        // Add insights
        insights.forEach(insight => {
            const insightElement = document.createElement('div');
            insightElement.className = `insight-item ${insight.priority}`;
            
            let iconClass = 'info-circle';
            if (insight.priority === 'high') iconClass = 'exclamation-triangle';
            if (insight.priority === 'medium') iconClass = 'exclamation-circle';
            
            insightElement.innerHTML = `
                <div class="insight-icon">
                    <i class="fas fa-${iconClass}"></i>
                </div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-description">${insight.description}</div>
                </div>
            `;
            
            insightsContainer.appendChild(insightElement);
        });
        
        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'insights-timestamp';
        timestamp.textContent = `Síðast uppfært: ${formatDate(new Date(), true)}`;
        insightsContainer.appendChild(timestamp);
        
        // Show toast
        showToast("Innsýn uppfærð!", "success");
    }, 2000);
}

/**
 * Get random AI insights for dashboard
 */
function getRandomInsights() {
    const allInsights = [
        {
            title: "Mönnunarskortur á næturvakt í C-álmu",
            description: "Það vantar einn hjúkrunarfræðing á næturvaktir í C-álmu næstu 3 daga.",
            priority: "high"
        },
        {
            title: "Lágmarksbirgðir af skurðgrímu",
            description: "Birgðir af skurðgrímu eru undir viðbragðsmörkum (20%). Íhugaðu að panta meira.",
            priority: "high"
        },
        {
            title: "Aukin tíðni bylta í B-álmu",
            description: "Síðastliðna viku hafa 3 byltutilvik verið skráð í B-álmu, samanborið við 0 vikuna áður.",
            priority: "medium"
        },
        {
            title: "Batnandi nýtingarhlutfall",
            description: "Nýtingarhlutfall rúma er 93% þennan mánuð, sem er 5% hærra en í síðasta mánuði.",
            priority: "low"
        },
        {
            title: "Minnkandi fjarvistir starfsfólks",
            description: "Fjarvistir starfsfólks hafa minnkað um 18% samanborið við sama tímabil í fyrra.",
            priority: "low"
        },
        {
            title: "Yfirstandandi lyfjagjafir",
            description: "3 sjúklingar eiga að fá lyf innan klukkustundar.",
            priority: "medium"
        },
        {
            title: "Sjúklingur með hækkandi hita",
            description: "Sjúklingur í herbergi 203 er með hita sem fer hækkandi. Síðasta mæling: 38.5°C.",
            priority: "medium"
        },
        {
            title: "Læknisheimsókn áætluð eftir 30 mínútur",
            description: "Dr. Jónsson mun heimsækja sjúklinga í A-álmu kl. 14:30.",
            priority: "low"
        }
    ];
    
    // Shuffle insights
    const shuffled = [...allInsights].sort(() => 0.5 - Math.random());
    
    // Return 4-6 random insights
    const count = 4 + Math.floor(Math.random() * 3);
    return shuffled.slice(0, count);
}

/**
 * Hide a modal dialog
 * @param {string} id - The modal ID
 */
function hideModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    
    // Remove active class to hide the modal
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Create a custom modal dialog
 * @param {string} id - The modal ID
 * @param {string} title - The modal title
 * @param {string} content - The HTML content of the modal
 * @param {Array} buttons - Array of button objects {text, class, id, icon, onClick}
 */
function createCustomModal(id, title, content, buttons = []) {
    // Remove existing modal with the same ID if it exists
    const existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    modalContainer.id = id;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Create modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h3');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = title;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.addEventListener('click', () => hideModal(id));
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // Create modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = content;
    
    // Create modal footer with buttons
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    // Add buttons to modal footer
    buttons.forEach(button => {
        const btnElement = document.createElement('button');
        btnElement.textContent = button.text;
        btnElement.className = button.class || '';
        if (button.id) btnElement.id = button.id;
        
        // Add icon if provided
        if (button.icon) {
            btnElement.innerHTML = `<i class="fas fa-${button.icon}"></i> ${button.text}`;
        }
        
        // Add click event handler
        if (button.onClick) {
            btnElement.addEventListener('click', button.onClick);
        } else {
            // Default to close modal if no click handler
            btnElement.addEventListener('click', () => hideModal(id));
        }
        
        modalFooter.appendChild(btnElement);
    });
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    
    // Add footer only if there are buttons
    if (buttons.length > 0) {
        modalContent.appendChild(modalFooter);
    }
    
    modalContainer.appendChild(modalContent);
    
    // Add modal to document
    document.body.appendChild(modalContainer);
    
    // Return the modal ID
    return id;
}

/**
 * Add a stylesheet to the document head
 * @param {string} css - The CSS to add
 */
function addStyleToHead(css) {
    // Create style element
    const style = document.createElement('style');
    style.textContent = css;
    
    // Add to head
    document.head.appendChild(style);
    
    return style;
}

// ===== MEDICATION MANAGEMENT FUNCTIONS =====

/**
 * Setup medication table functionality
 */
function setupMedicationTable() {
    // Add click functionality to medication items
    document.querySelectorAll('.medication-table tbody tr').forEach(row => {
        row.addEventListener('click', function() {
            // Get medication data from row
            const medId = this.getAttribute('data-id');
            const medName = this.querySelector('td:nth-child(1)').textContent;
            const dosage = this.querySelector('td:nth-child(2)').textContent;
            const frequency = this.querySelector('td:nth-child(3)').textContent;
            const route = this.querySelector('td:nth-child(4)').textContent;
            const patientName = this.querySelector('td:nth-child(5)').textContent;
            const scheduledTime = this.querySelector('td:nth-child(6)').textContent;
            const status = this.querySelector('td:nth-child(7)').textContent;
            
            // Show medication details modal
            showMedicationModal(medId, medName, dosage, frequency, route, patientName, scheduledTime, status);
        });
    });
}

/**
 * Show medication details modal
 */
function showMedicationModal(id, name, dosage, frequency, route, patient, scheduledTime, status) {
    // Create status class for styling
    let statusClass = 'status-pending';
    if (status === 'Gefið') statusClass = 'status-given';
    if (status === 'Frestað') statusClass = 'status-delayed';
    if (status === 'Hætt við') statusClass = 'status-cancelled';
    
    // Get notes for this medication (demo data)
    const notes = getMedicationNotes(id);
    
    // Create notes HTML
    let notesHtml = '';
    if (notes.length > 0) {
        notesHtml = `
            <div class="medication-notes">
                <h4>Athugasemdir</h4>
                <ul class="notes-list">
                    ${notes.map(note => `
                        <li class="note-item">
                            <div class="note-header">
                                <span class="note-author">${note.author}</span>
                                <span class="note-time">${formatDate(note.timestamp, true)}</span>
                            </div>
                            <div class="note-content">${note.text}</div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // Create action buttons based on current status
    const actionButtons = [];
    
    if (status === 'Óafgreitt') {
        actionButtons.push(
            {
                text: 'Merkja sem gefið',
                class: 'primary-btn',
                id: 'mark-given-btn',
                icon: 'check',
                onClick: function() {
                    updateMedicationStatus(id, 'Gefið');
                    hideModal('medication-modal');
                }
            },
            {
                text: 'Fresta',
                class: 'warning-btn',
                id: 'delay-btn',
                icon: 'clock',
                onClick: function() {
                    showDelayMedicationModal(id, name, patient);
                }
            },
            {
                text: 'Hætta við',
                class: 'danger-btn',
                id: 'cancel-btn',
                icon: 'times',
                onClick: function() {
                    showCancelMedicationModal(id, name, patient);
                }
            }
        );
    } else if (status === 'Gefið') {
        actionButtons.push(
            {
                text: 'Bæta við athugasemd',
                class: 'primary-btn',
                id: 'add-note-btn',
                icon: 'comment-medical',
                onClick: function() {
                    showAddNoteModal(id, name, patient);
                }
            }
        );
    } else if (status === 'Frestað') {
        actionButtons.push(
            {
                text: 'Merkja sem gefið',
                class: 'primary-btn',
                id: 'mark-given-btn',
                icon: 'check',
                onClick: function() {
                    updateMedicationStatus(id, 'Gefið');
                    hideModal('medication-modal');
                }
            },
            {
                text: 'Uppfæra tíma',
                class: 'warning-btn',
                id: 'update-time-btn',
                icon: 'clock',
                onClick: function() {
                    showUpdateTimeModal(id, name, patient);
                }
            },
            {
                text: 'Hætta við',
                class: 'danger-btn',
                id: 'cancel-btn',
                icon: 'times',
                onClick: function() {
                    showCancelMedicationModal(id, name, patient);
                }
            }
        );
    } else if (status === 'Hætt við') {
        actionButtons.push(
            {
                text: 'Merkja sem gefið',
                class: 'primary-btn',
                id: 'mark-given-btn',
                icon: 'check',
                onClick: function() {
                    updateMedicationStatus(id, 'Gefið');
                    hideModal('medication-modal');
                }
            }
        );
    }
    
    // Create action buttons HTML
    const actionButtonsHtml = actionButtons.map(button => `
        <button class="action-btn ${button.class}" id="${button.id}" title="${button.text}">
            <i class="fas fa-${button.icon}"></i>
        </button>
    `).join('');
    
    // Create modal content
    const modalContent = `
        <div class="medication-details">
            <h3>${name}</h3>
            <p><strong>Dosage:</strong> ${dosage}</p>
            <p><strong>Frequency:</strong> ${frequency}</p>
            <p><strong>Route:</strong> ${route}</p>
            <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
            <p><strong>Status:</strong> ${status}</p>
            <div class="notes">${notesHtml}</div>
            <div class="actions">${actionButtonsHtml}</div>
        </div>
    `;
    
    // Show medication details modal
    createCustomModal('medication-modal', 'Medication Details', modalContent, [
        {
            text: 'Loka',
            class: 'cancel-btn',
            id: 'close-medication-modal'
        }
    ]);
}

/**
 * Filter medications by status
 */
function filterMedicationsByStatus(status) {
    const rows = document.querySelectorAll('.medication-table tbody tr');
    
    if (status === 'all') {
        // Show all rows
        rows.forEach(row => {
            row.style.display = '';
        });
    } else {
        // Filter by status
        rows.forEach(row => {
            const rowStatus = row.querySelector('td:nth-child(7)').textContent;
            
            if (status === 'pending' && rowStatus === 'Óafgreitt') {
                row.style.display = '';
            } else if (status === 'given' && rowStatus === 'Gefið') {
                row.style.display = '';
            } else if (status === 'delayed' && rowStatus === 'Frestað') {
                row.style.display = '';
            } else if (status === 'cancelled' && rowStatus === 'Hætt við') {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
}

// ===== CHART MODULE =====

/**
 * Initialize charts on the dashboard
 */
function initDashboardCharts() {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return;
    }
    
    // Apply global chart defaults
    applyChartDefaults();
    
    // Initialize specific charts
    initOccupancyChart();
    initStaffDistributionChart();
    initPatientStatusChart();
    initMedicationAdherenceChart();
}

/**
 * Apply global defaults for all charts
 */
function applyChartDefaults() {
    // Set global defaults for all charts
    Chart.defaults.font.family = "'Open Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 4;
    Chart.defaults.plugins.tooltip.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim();
    Chart.defaults.plugins.tooltip.titleColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    Chart.defaults.plugins.tooltip.bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.usePointStyle = true;
    Chart.defaults.plugins.tooltip.boxPadding = 3;
    
    // Set responsive defaults
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    
    // Define our own defaults for common chart types
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    
    // Register plugin for rounded corners on bar charts if needed
    if (!Chart.registry.getPlugin('roundedCorners')) {
        const roundedCorners = {
            id: 'roundedCorners',
            beforeDraw: function(chart) {
                if (chart.config.type !== 'bar') {
                    return;
                }
                
                const ctx = chart.ctx;
                ctx.save();
                
                chart.data.datasets.forEach((dataset, datasetIndex) => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    
                    if (!meta.hidden) {
                        meta.data.forEach((element) => {
                            const { x, y, width, height } = element;
                            const radius = 4;
                            
                            // Only round the top corners
                            ctx.beginPath();
                            ctx.moveTo(x, y + radius);
                            ctx.lineTo(x, y);
                            ctx.lineTo(x + width, y);
                            ctx.lineTo(x + width, y + radius);
                            ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
                            ctx.lineTo(x + radius, y);
                            ctx.quadraticCurveTo(x, y, x, y + radius);
                            ctx.closePath();
                            
                            ctx.fillStyle = element.options.backgroundColor;
                            ctx.fill();
                        });
                    }
                });
                
                ctx.restore();
            }
        };
        
        Chart.register(roundedCorners);
    }
}

/**
 * Initialize occupancy chart
 */
function initOccupancyChart() {
    const canvas = document.getElementById('occupancy-chart');
    if (!canvas) return;
    
    // Get chart data
    const data = getOccupancyData();
    
    // Define colors
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const gradient = canvas.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(32, 156, 238, 0.3)');
    gradient.addColorStop(1, 'rgba(32, 156, 238, 0)');
    
    // Create chart
    const occupancyChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Rúmanýting',
                data: data.values,
                fill: 'start',
                backgroundColor: gradient,
                borderColor: primaryColor,
                borderWidth: 2,
                pointBackgroundColor: primaryColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.3
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
    
    // Store chart in window object for later reference
    window.occupancyChart = occupancyChart;
    
    // Add time period selector functionality
    setupChartTimePeriodSelector('occupancy-time-selector', occupancyChart, getOccupancyData);
}

/**
 * Get occupancy data
 */
function getOccupancyData(period = 'week') {
    // This would normally come from an API call
    // For demo purposes, we'll generate sample data
    
    let labels = [];
    let values = [];
    
    switch (period) {
        case 'day':
            // Hourly data for today
            for (let i = 0; i < 24; i += 2) {
                const hour = i.toString().padStart(2, '0') + ':00';
                labels.push(hour);
                
                // Generate random value between 70-95%
                const value = Math.floor(Math.random() * 25) + 70;
                values.push(value);
            }
            break;
            
        case 'week':
            // Daily data for the past week
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const today = new Date().getDay();
            
            for (let i = 6; i >= 0; i--) {
                const dayIndex = (today - i + 7) % 7;
                labels.push(dayNames[dayIndex]);
                
                // Generate random value between 70-95%
                const value = Math.floor(Math.random() * 25) + 70;
                values.push(value);
            }
            break;
            
        case 'month':
            // Weekly data for the past month
            for (let i = 4; i >= 0; i--) {
                labels.push(`Week ${5-i}`);
                
                // Generate random value between 70-95%
                const value = Math.floor(Math.random() * 25) + 70;
                values.push(value);
            }
            break;
            
        case 'year':
            // Monthly data for the past year
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonth = new Date().getMonth();
            
            for (let i = 11; i >= 0; i--) {
                const monthIndex = (currentMonth - i + 12) % 12;
                labels.push(monthNames[monthIndex]);
                
                // Generate random value between 70-95%
                const value = Math.floor(Math.random() * 25) + 70;
                values.push(value);
            }
            break;
    }
    
    return {
        labels: labels,
        values: values
    };
}

/**
 * Initialize staff distribution chart
 */
function initStaffDistributionChart() {
    const canvas = document.getElementById('staff-distribution-chart');
    if (!canvas) return;
    
    // Get chart data
    const data = getStaffDistributionData();
    
    // Define colors
    const colors = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(153, 102, 255, 0.8)'
    ];
    
    // Create chart
    const staffChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: colors,
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            cutout: '60%',
            radius: '90%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} (${Math.round(context.raw / data.values.reduce((a, b) => a + b, 0) * 100)}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Store chart in window object for later reference
    window.staffChart = staffChart;
    
    // Add view selector functionality
    setupChartViewSelector('staff-view-selector', staffChart, getStaffDistributionData);
}

/**
 * Get staff distribution data
 */
function getStaffDistributionData(view = 'role') {
    // This would normally come from an API call
    // For demo purposes, we'll use sample data
    
    let labels = [];
    let values = [];
    
    switch (view) {
        case 'role':
            labels = ['Hjúkrunarfræðingar', 'Sjúkraliðar', 'Aðstoðarfólk', 'Læknar', 'Stjórnendur'];
            values = [14, 22, 8, 5, 3];
            break;
            
        case 'department':
            labels = ['Bráðadeild', 'Gjörgæsla', 'Skurðdeild', 'Barnadeild', 'Öldrunardeild'];
            values = [12, 8, 10, 7, 15];
            break;
            
        case 'shift':
            labels = ['Morgunvakt', 'Kvöldvakt', 'Næturvakt', 'Í fríi'];
            values = [20, 15, 10, 7];
            break;
    }
    
    return {
        labels: labels,
        values: values
    };
}

/**
 * Initialize patient status chart
 */
function initPatientStatusChart() {
    const canvas = document.getElementById('patient-status-chart');
    if (!canvas) return;
    
    // Get chart data
    const data = getPatientStatusData();
    
    // Define colors
    const colors = [
        'rgba(54, 162, 235, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(255, 99, 132, 0.7)'
    ];
    
    // Create chart
    const patientChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.7', '1')),
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Store chart in window object for later reference
    window.patientChart = patientChart;
}

/**
 * Get patient status data
 */
function getPatientStatusData() {
    // This would normally come from an API call
    // For demo purposes, we'll use sample data
    
    return {
        labels: ['Stöðugt ástand', 'Í bataferlinu', 'Þarf aukið eftirlit', 'Bráðatilfelli'],
        values: [18, 12, 7, 3]
    };
}

/**
 * Initialize medication adherence chart
 */
function initMedicationAdherenceChart() {
    const canvas = document.getElementById('medication-adherence-chart');
    if (!canvas) return;
    
    // Get chart data
    const data = getMedicationAdherenceData();
    
    // Create chart
    const medicationChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} (${Math.round(context.raw / data.values.reduce((a, b) => a + b, 0) * 100)}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Store chart in window object for later reference
    window.medicationChart = medicationChart;
}

/**
 * Get medication adherence data
 */
function getMedicationAdherenceData() {
    // This would normally come from an API call
    // For demo purposes, we'll use sample data
    
    return {
        labels: ['Gefið á réttum tíma', 'Gefið of seint', 'Frestað', 'Hætt við'],
        values: [32, 5, 3, 2]
    };
}

/**
 * Setup chart time period selector
 */
function setupChartTimePeriodSelector(selectorId, chart, dataFunction) {
    const selector = document.getElementById(selectorId);
    if (!selector || !chart || !dataFunction) return;
    
    // Set up event listener for selector
    selector.addEventListener('change', function() {
        const period = this.value;
        const data = dataFunction(period);
        
        // Update chart data
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        
        // Update chart
        chart.update();
    });
}

/**
 * Setup chart view selector
 */
function setupChartViewSelector(selectorId, chart, dataFunction) {
    const selector = document.getElementById(selectorId);
    if (!selector || !chart || !dataFunction) return;
    
    // Set up event listener for selector
    selector.addEventListener('change', function() {
        const view = this.value;
        const data = dataFunction(view);
        
        // Update chart data
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        
        // Update chart
        chart.update();
    });
}

/**
 * Update charts based on theme
 */
function updateChartsTheme(isDarkMode) {
    // Update global chart defaults
    Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    Chart.defaults.plugins.tooltip.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim();
    Chart.defaults.plugins.tooltip.titleColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    Chart.defaults.plugins.tooltip.bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    Chart.defaults.plugins.tooltip.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    
    // Update all existing charts
    Object.keys(window).forEach(key => {
        if (window[key] instanceof Chart) {
            // Update grid colors
            if (window[key].options.scales) {
                Object.keys(window[key].options.scales).forEach(scaleKey => {
                    const scale = window[key].options.scales[scaleKey];
                    if (scale.grid) {
                        scale.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
                    }
                });
            }
            
            // Update chart
            window[key].update();
        }
    });
}

/**
 * Initialize the staff list with sample data
 */
function initStaffList() {
    console.log("Initializing staff list");
    
    // Sample staff data
    staffList = [
        {
            id: 1,
            name: 'Anna Björg',
            role: 'Hjúkrunarfræðingur',
            department: 'A-álma',
            status: 'available',
            shifts: ['Morgunvakt', 'Kvöldvakt'],
            color: '#4CAF50',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nurse1',
            contact: {
                email: 'anna.bjorg@nursecare.is',
                phone: '+354 123-4567'
            },
            lastShift: { date: new Date(Date.now() - 86400000), wing: 'A', updates: 4, medLogs: 3 }
        },
        {
            id: 2,
            name: 'Jóhann Pétur',
            role: 'Hjúkrunarfræðingur',
            department: 'B-álma',
            status: 'busy',
            shifts: ['Morgunvakt', 'Næturvakt'],
            color: '#2196F3',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nurse2',
            contact: {
                email: 'johann.petur@nursecare.is',
                phone: '+354 234-5678'
            },
            lastShift: { date: new Date(Date.now() - 172800000), wing: 'B', updates: 2, medLogs: 4 }
        },
        {
            id: 3,
            name: 'Guðrún Jóna',
            role: 'Sjúkraliði',
            department: 'A-álma',
            status: 'available',
            shifts: ['Kvöldvakt', 'Næturvakt'],
            color: '#9C27B0',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nurse3',
            contact: {
                email: 'gudrun.jona@nursecare.is',
                phone: '+354 345-6789'
            },
            lastShift: { date: new Date(Date.now() - 259200000), wing: 'A', updates: 3, medLogs: 2 }
        }
    ];
    
    console.log("Staff list initialized with", staffList.length, "members");
}

/**
 * Initialize the staff drag and drop functionality
 */
function initStaffDragDrop() {
    console.log("Initializing staff drag and drop");
    
    const staffListContainer = document.getElementById('staff-list');
    if (!staffListContainer) {
        console.warn("Staff list container not found");
        return;
    }
    
    staffListContainer.innerHTML = '';
    
    staffList.forEach(staff => {
        const staffItem = document.createElement('div');
        staffItem.className = 'staff-item';
        staffItem.setAttribute('data-id', staff.id);
        staffItem.setAttribute('draggable', 'true');
        staffItem.style.borderLeftColor = staff.color;
        
        staffItem.innerHTML = `
            <div class="staff-avatar">
                <img src="${staff.avatar}" alt="${staff.name}">
                <span class="status-indicator ${staff.status}"></span>
            </div>
            <div class="staff-info">
                <div class="staff-name">${staff.name}</div>
                <div class="staff-role">${staff.role}</div>
            </div>
        `;
        
        staffItem.addEventListener('dragstart', handleDragStart);
        staffListContainer.appendChild(staffItem);
    });
    
    setupCalendarDropZones();
}

/**
 * Handle drag start event
 */
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
    e.dataTransfer.effectAllowed = 'copy';
    e.target.classList.add('dragging');
    
    e.target.addEventListener('dragend', function() {
        e.target.classList.remove('dragging');
    }, { once: true });
}

/**
 * Set up drop zones on the calendar
 */
function setupCalendarDropZones() {
    console.log("Setting up calendar drop zones");
    
    if (typeof FullCalendar !== 'undefined' && calendar) {
        console.log("FullCalendar found, setting up drop zones");
    }
}

/**
 * Initialize the calendar for the schedule page
 */
function initCalendar() {
    console.log("Initializing schedule calendar");
    
    const calendarEl = document.getElementById('schedule-calendar');
    if (!calendarEl) {
        console.warn("Calendar element not found");
        return;
    }
    
    try {
        if (typeof FullCalendar !== 'undefined') {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'timeGridWeek',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                slotDuration: '01:00:00',
                slotLabelFormat: {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                },
                businessHours: {
                    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                    startTime: '07:00',
                    endTime: '23:00'
                },
                editable: true,
                droppable: true,
                selectable: true,
                nowIndicator: true,
                firstDay: 1,
                locale: 'is',
                allDaySlot: false,
                height: 'auto',
                eventTimeFormat: {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                },
                eventClick: function(info) {
                    showShiftDetails(info.event);
                },
                dateClick: function(info) {
                    showAddShiftModal(info.date);
                },
                drop: function(info) {
                    handleStaffDrop(info);
                },
                events: getShiftEvents()
            });
            
            calendar.render();
            console.log("Calendar initialized successfully");
        } else {
            console.warn("FullCalendar library not available");
            calendarEl.innerHTML = '<div class="calendar-fallback">Hleður dagatal...</div>';
        }
    } catch (error) {
        console.error("Error initializing calendar:", error);
        calendarEl.innerHTML = '<div class="calendar-error">Villa við að hlaða dagatali</div>';
    }
}

/**
 * Get shift events data for the calendar
 */
function getShiftEvents() {
    return [
        {
            title: 'Anna Björg - Morgunvakt',
            start: '2025-03-26T07:00:00',
            end: '2025-03-26T15:00:00',
            backgroundColor: '#4CAF50',
            borderColor: '#4CAF50',
            extendedProps: {
                staffId: 1,
                shiftType: 'Morgunvakt',
                department: 'A-álma'
            }
        },
        {
            title: 'Jóhann Pétur - Morgunvakt',
            start: '2025-03-27T07:00:00',
            end: '2025-03-27T15:00:00',
            backgroundColor: '#2196F3',
            borderColor: '#2196F3',
            extendedProps: {
                staffId: 2,
                shiftType: 'Morgunvakt',
                department: 'B-álma'
            }
        }
    ];
}

/**
 * Show shift details when a calendar event is clicked
 */
function showShiftDetails(event) {
    const staffId = event.extendedProps.staffId;
    const staff = staffList.find(s => s.id === staffId);
    
    if (!staff) {
        console.warn("Staff member not found:", staffId);
        return;
    }
    
    createCustomModal('shift-details-modal', 'Upplýsingar um vakt', `
        <div class="shift-details">
            <div class="staff-header">
                <div class="staff-avatar">
                    <img src="${staff.avatar}" alt="${staff.name}">
                </div>
                <div class="staff-info">
                    <h3>${staff.name}</h3>
                    <div class="staff-role">${staff.role}</div>
                </div>
            </div>
            <div class="shift-info">
                <div class="info-row">
                    <div class="info-label">Vakt:</div>
                    <div class="info-value">${event.extendedProps.shiftType}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Dags:</div>
                    <div class="info-value">${formatDate(event.start, true)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Tími:</div>
                    <div class="info-value">${formatTime(event.start)} - ${formatTime(event.end)}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Deild:</div>
                    <div class="info-value">${event.extendedProps.department}</div>
                </div>
            </div>
        </div>
    `, [
        {
            text: 'Breyta vakt',
            class: 'primary-btn',
            icon: 'edit',
            id: 'edit-shift-btn',
            onClick: function() {
                hideModal('shift-details-modal');
                showEditShiftModal(event);
            }
        },
        {
            text: 'Eyða vakt',
            class: 'danger-btn',
            icon: 'trash',
            id: 'delete-shift-btn',
            onClick: function() {
                hideModal('shift-details-modal');
                showDeleteShiftConfirmation(event);
            }
        },
        {
            text: 'Loka',
            class: 'cancel-btn',
            id: 'close-shift-details'
        }
    ]);
    
    showModal('shift-details-modal');
}

/**
 * Show add shift modal
 */
function showAddShiftModal(date) {
    createCustomModal('add-shift-modal', 'Bæta við vakt', `
        <form id="add-shift-form">
            <div class="form-group">
                <label for="staff-select">Starfsmaður</label>
                <select class="form-control" id="staff-select" required>
                    <option value="">Veldu starfsmann</option>
                    ${staffList.map(staff => `<option value="${staff.id}">${staff.name} (${staff.role})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="shift-type">Tegund vaktar</label>
                <select class="form-control" id="shift-type" required>
                    <option value="Morgunvakt">Morgunvakt (07:00-15:00)</option>
                    <option value="Kvöldvakt">Kvöldvakt (15:00-23:00)</option>
                    <option value="Næturvakt">Næturvakt (23:00-07:00)</option>
                </select>
            </div>
            <div class="form-group">
                <label for="shift-date">Dagsetning</label>
                <input type="date" class="form-control" id="shift-date" required value="${date.toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="shift-department">Deild</label>
                <select class="form-control" id="shift-department" required>
                    <option value="A-álma">A-álma</option>
                    <option value="B-álma">B-álma</option>
                    <option value="C-álma">C-álma</option>
                </select>
            </div>
            <div class="form-group">
                <label for="shift-notes">Athugasemdir</label>
                <textarea class="form-control" id="shift-notes" rows="2"></textarea>
            </div>
        </form>
    `, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: 'cancel-add-shift'
        },
        {
            text: 'Vista vakt',
            class: 'primary-btn',
            icon: 'save',
            id: 'save-shift-btn',
            onClick: function() {
                const form = document.getElementById('add-shift-form');
                if (form.checkValidity()) {
                    saveShift();
                    hideModal('add-shift-modal');
                } else {
                    form.reportValidity();
                }
            }
        }
    ]);
    
    showModal('add-shift-modal');
}

/**
 * Handle dropping a staff member onto the calendar
 */
function handleStaffDrop(info) {
    const staffId = parseInt(info.draggedEl.getAttribute('data-id'));
    const staff = staffList.find(s => s.id === staffId);
    
    if (!staff) {
        console.warn("Staff member not found:", staffId);
        return;
    }
    
    const dropHour = info.date.getHours();
    let shiftType = 'Morgunvakt';
    
    if (dropHour >= 15 && dropHour < 23) {
        shiftType = 'Kvöldvakt';
    } else if (dropHour >= 23 || dropHour < 7) {
        shiftType = 'Næturvakt';
    }
    
    const shiftEvent = {
        title: `${staff.name} - ${shiftType}`,
        start: getShiftStartTime(info.date, shiftType),
        end: getShiftEndTime(info.date, shiftType),
        backgroundColor: staff.color,
        borderColor: staff.color,
        extendedProps: {
            staffId: staff.id,
            shiftType: shiftType,
            department: staff.department
        }
    };
    
    calendar.addEvent(shiftEvent);
    showToast(`Vakt bætt við fyrir ${staff.name}`, "success");
}

/**
 * Get shift start time based on shift type
 */
function getShiftStartTime(date, shiftType) {
    const startDate = new Date(date);
    
    switch (shiftType) {
        case 'Morgunvakt':
            startDate.setHours(7, 0, 0);
            break;
        case 'Kvöldvakt':
            startDate.setHours(15, 0, 0);
            break;
        case 'Næturvakt':
            startDate.setHours(23, 0, 0);
            break;
    }
    
    return startDate;
}

/**
 * Get shift end time based on shift type
 */
function getShiftEndTime(date, shiftType) {
    const endDate = new Date(date);
    
    switch (shiftType) {
        case 'Morgunvakt':
            endDate.setHours(15, 0, 0);
            break;
        case 'Kvöldvakt':
            endDate.setHours(23, 0, 0);
            break;
        case 'Næturvakt':
            endDate.setDate(endDate.getDate() + 1);
            endDate.setHours(7, 0, 0);
            break;
    }
    
    return endDate;
}

/**
 * Save a new shift to the calendar
 */
function saveShift() {
    const staffId = parseInt(document.getElementById('staff-select').value);
    const shiftType = document.getElementById('shift-type').value;
    const shiftDate = document.getElementById('shift-date').value;
    const department = document.getElementById('shift-department').value;
    
    const staff = staffList.find(s => s.id === staffId);
    
    if (!staff) {
        console.warn("Staff member not found:", staffId);
        showToast("Villa við að vista vakt", "error");
        return;
    }
    
    const date = new Date(shiftDate);
    
    const shiftEvent = {
        title: `${staff.name} - ${shiftType}`,
        start: getShiftStartTime(date, shiftType),
        end: getShiftEndTime(date, shiftType),
        backgroundColor: staff.color,
        borderColor: staff.color,
        extendedProps: {
            staffId: staff.id,
            shiftType: shiftType,
            department: department
        }
    };
    
    calendar.addEvent(shiftEvent);
    showToast(`Vakt vistuð fyrir ${staff.name}`, "success");
}

/**
 * Setup schedule page event listeners
 */
function setupScheduleEventListeners() {
    const checkConflictsBtn = document.getElementById('check-conflicts-btn');
    if (checkConflictsBtn) {
        checkConflictsBtn.addEventListener('click', checkScheduleConflicts);
    }
    
    const autoScheduleBtn = document.getElementById('auto-schedule-btn');
    if (autoScheduleBtn) {
        autoScheduleBtn.addEventListener('click', autoGenerateSchedule);
    }
    
    const departmentFilter = document.getElementById('department-filter');
    if (departmentFilter) {
        departmentFilter.addEventListener('change', filterScheduleByDepartment);
    }
    
    const staffViewToggle = document.getElementById('staff-view-toggle');
    if (staffViewToggle) {
        staffViewToggle.addEventListener('click', toggleStaffView);
    }
}

/**
 * Check for schedule conflicts
 */
function checkScheduleConflicts() {
    showToast("Leita að árekstrum í vaktaáætlun...", "info");
    
    setTimeout(() => {
        createCustomModal('conflicts-modal', 'Árekstrar í vaktaáætlun', `
            <div class="conflicts-results">
                <div class="conflicts-summary">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>2 árekstrar fundust í vaktaáætlun</p>
                </div>
                <div class="conflicts-list">
                    <div class="conflict-item">
                        <div class="conflict-title">Tvöföld vakt</div>
                        <div class="conflict-details">
                            <p>Anna Björg er skráð á morgunvakt og kvöldvakt þann 28. mars.</p>
                            <div class="conflict-actions">
                                <button class="btn btn-sm primary-btn">Skoða</button>
                                <button class="btn btn-sm warning-btn">Laga</button>
                            </div>
                        </div>
                    </div>
                    <div class="conflict-item">
                        <div class="conflict-title">Ófullnægjandi hvíldartími</div>
                        <div class="conflict-details">
                            <p>Kristín Helga er með minna en 11 klst milli vakta þann 26.-27. mars.</p>
                            <div class="conflict-actions">
                                <button class="btn btn-sm primary-btn">Skoða</button>
                                <button class="btn btn-sm warning-btn">Laga</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `, [
            {
                text: 'Laga alla árekstra',
                class: 'primary-btn',
                icon: 'magic',
                id: 'fix-all-conflicts-btn'
            },
            {
                text: 'Loka',
                class: 'cancel-btn',
                id: 'close-conflicts'
            }
        ]);
        
        showModal('conflicts-modal');
    }, 1500);
}

/**
 * Auto-generate a schedule for the selected time period
 * This function simulates an AI-powered schedule generation
 */
function autoGenerateSchedule() {
    console.log("Auto-generating schedule...");
    
    // Show loading dialog to indicate work in progress
    createCustomModal('auto-schedule-modal', 'Sjálfvirk vaktaskipulag', `
        <div class="ai-loading">
            <div class="ai-loading-spinner"></div>
            <h3>AI Vaktaskipulag í vinnslu</h3>
            <p>Greini mönnunarþarfir og búa til hagkvæma vaktaskipulag...</p>
            
            <div class="ai-status">
                <div class="status-text">Greini núverandi mönnun... </div>
                <div class="progress-bar">
                    <div class="progress" style="width: 35%"></div>
                </div>
            </div>
        </div>
    `, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: 'cancel-auto-btn',
            onClick: function() {
                hideModal('auto-schedule-modal');
            }
        }
    ]);
    
    showModal('auto-schedule-modal');
    
    // Simulate AI processing stages
    simulateAISchedulingProcess();
}

/**
 * Simulate AI processing with staged progress updates
 */
function simulateAISchedulingProcess() {
    const stages = [
        { text: "Greini núverandi mönnun...", progress: 25 },
        { text: "Meta þarfir og færni starfsmanna...", progress: 45 },
        { text: "Jafna vaktaálag...", progress: 65 },
        { text: "Lágmarka árekstra...", progress: 85 },
        { text: "Fínstilli vaktaskipulag...", progress: 95 }
    ];
    
    let currentStage = 0;
    
    // Update progress bar and status message at intervals
    const progressInterval = setInterval(() => {
        if (currentStage >= stages.length) {
            clearInterval(progressInterval);
            completeAutoSchedule();
            return;
        }
        
        const stage = stages[currentStage];
        const statusText = document.querySelector('.ai-status .status-text');
        const progressBar = document.querySelector('.ai-status .progress');
        
        if (statusText && progressBar) {
            statusText.textContent = stage.text;
            progressBar.style.width = `${stage.progress}%`;
        }
        
        currentStage++;
    }, 1200); // Update every 1.2 seconds
}

/**
 * Complete the auto-schedule process and show results
 */
function completeAutoSchedule() {
    // Hide the loading modal
    hideModal('auto-schedule-modal');
    
    // Show results dialog
    setTimeout(() => {
        createCustomModal('schedule-results-modal', 'Vaktaskipulag tilbúið', `
            <div class="schedule-results">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Vaktaskipulag tilbúið!</h3>
                <p>AI hefur búið til hagkvæma vaktaskipulag fyrir næstu 2 vikur. Vaktirnar eru nú sýndar í dagatalinu.</p>
                
                <div class="results-stats">
                    <div class="stats-item">
                        <div class="stats-value">97%</div>
                        <div class="stats-label">Mönnunarhlutfall</div>
                    </div>
                    <div class="stats-item">
                        <div class="stats-value">0</div>
                        <div class="stats-label">Árekstrar</div>
                    </div>
                    <div class="stats-item">
                        <div class="stats-value">48</div>
                        <div class="stats-label">Vaktir úthlutaðar</div>
                    </div>
                </div>
                
                <div class="results-notes">
                    <div class="note-title">Athugasemdir:</div>
                    <ul>
                        <li>Allar óskir starfsmanna voru uppfylltar</li>
                        <li>Vaktaálag er jafnt á milli starfsmanna</li>
                        <li>Sjúkraliðar eru alltaf með hjúkrunarfræðingi</li>
                    </ul>
                </div>
            </div>
        `, [
            {
                text: 'Loka',
                class: 'cancel-btn',
                id: 'close-results-btn'
            },
            {
                text: 'Samþykkja vaktaskipulag',
                class: 'primary-btn',
                icon: 'check',
                id: 'apply-schedule-btn',
                onClick: function() {
                    hideModal('schedule-results-modal');
                    applyGeneratedSchedule();
                }
            }
        ]);
        
        showModal('schedule-results-modal');
        
        // Add some CSS for the results modal
        addStyleToHead(`
            .schedule-results {
                text-align: center;
                padding: 1rem 0;
            }
            
            .success-icon {
                font-size: 3rem;
                color: var(--success-color);
                margin-bottom: 1rem;
            }
            
            .results-stats {
                display: flex;
                justify-content: space-around;
                margin: 1.5rem 0;
            }
            
            .stats-item {
                text-align: center;
            }
            
            .stats-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--primary-color);
            }
            
            .stats-label {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .results-notes {
                text-align: left;
                margin-top: 1.5rem;
                padding: 1rem;
                background-color: var(--bg-secondary);
                border-radius: var(--border-radius);
            }
            
            .note-title {
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            
            .results-notes ul {
                margin: 0;
                padding-left: 1.5rem;
            }
            
            .results-notes li {
                margin-bottom: 0.375rem;
            }
        `);
    }, 500);
}

/**
 * Apply the generated schedule to the calendar
 */
function applyGeneratedSchedule() {
    // Clear any existing events in the calendar
    calendar.removeAllEvents();
    
    // Get the start date (today)
    const today = new Date();
    
    // Generate shifts for two weeks
    for (let day = 0; day < 14; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);
        
        // Determine the shifts for this day
        createShiftsForDay(currentDate, day);
    }
    
    // Update the schedule summary
    updateScheduleSummary();
    
    // Show success message
    showToast("Vaktaskipulag hefur verið vistað í dagatalið", "success");
}

/**
 * Create shifts for a specific day
 */
function createShiftsForDay(date, dayIndex) {
    // Define the morning, evening, and night shifts
    const shifts = ['Morgunvakt', 'Kvöldvakt', 'Næturvakt'];
    
    // Determine how many staff members we need for each shift based on day of week
    // Weekends might need fewer staff
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    const staffPerShift = {
        'Morgunvakt': isWeekend ? 2 : 3,
        'Kvöldvakt': isWeekend ? 2 : 3,
        'Næturvakt': isWeekend ? 1 : 2
    };
    
    // Get available staff for each shift
    for (const shift of shifts) {
        const neededStaff = staffPerShift[shift];
        
        // Filter staff members who can work this shift
        const availableStaff = staffList.filter(staff => {
            // Check if this staff member is available for this shift
            return staff.shifts.includes(shift) && 
                  staff.status !== 'unavailable' && 
                  staff.status !== 'sick';
        });
        
        // Use a simple algorithm to assign staff
        // In a real system, you'd have a more sophisticated algorithm
        // that considers recent shifts, preferences, etc.
        for (let i = 0; i < neededStaff && i < availableStaff.length; i++) {
            // Get the staff member
            const staffMember = availableStaff[(dayIndex + i) % availableStaff.length];
            
            // Create the shift
            createShiftEvent(date, shift, staffMember);
        }
    }
}

/**
 * Create a shift event on the calendar
 */
function createShiftEvent(date, shiftType, staffMember) {
    // Determine shift times
    const start = getShiftStartTime(date, shiftType);
    const end = getShiftEndTime(date, shiftType);
    
    // Determine the department/wing
    const department = staffMember.department || 'A-álma';
    
    // Create the event
    const shiftEvent = {
        title: `${staffMember.name} - ${shiftType}`,
        start: start,
        end: end,
        backgroundColor: staffMember.color || '#4CAF50',
        borderColor: staffMember.color || '#4CAF50',
        extendedProps: {
            staffId: staffMember.id,
            shiftType: shiftType,
            department: department
        }
    };
    
    // Add to calendar
    calendar.addEvent(shiftEvent);
}

/**
 * Update the schedule summary information
 */
function updateScheduleSummary() {
    // Count the total number of shifts
    const totalShifts = calendar.getEvents().length;
    
    // Count the number of staff members assigned
    const assignedStaff = new Set();
    calendar.getEvents().forEach(event => {
        assignedStaff.add(event.extendedProps.staffId);
    });
    
    // Calculate the staffing percentage
    const staffingPercentage = Math.round((assignedStaff.size / staffList.length) * 100);
    
    // Update the UI
    const totalShiftsElem = document.querySelector('.summary-item:nth-child(1) .summary-value');
    if (totalShiftsElem) {
        totalShiftsElem.textContent = totalShifts;
    }
    
    const staffOnShiftElem = document.querySelector('.summary-item:nth-child(2) .summary-value');
    if (staffOnShiftElem) {
        staffOnShiftElem.textContent = `${assignedStaff.size}/${staffList.length}`;
    }
    
    const staffingPercentageElem = document.querySelector('.summary-item:nth-child(3) .summary-value');
    if (staffingPercentageElem) {
        staffingPercentageElem.textContent = `${staffingPercentage}%`;
    }
}

/**
 * Show edit shift modal
 */
function showEditShiftModal(event) {
    // Find the staff member
    const staffId = event.extendedProps.staffId;
    const staff = staffList.find(s => s.id === staffId);
    
    if (!staff) {
        console.warn("Staff member not found:", staffId);
        return;
    }
    
    createCustomModal('edit-shift-modal', 'Breyta vakt', `
        <form id="edit-shift-form">
            <div class="form-group">
                <label for="edit-staff-select">Starfsmaður</label>
                <select class="form-control" id="edit-staff-select" required>
                    ${staffList.map(s => `<option value="${s.id}" ${s.id === staffId ? 'selected' : ''}>${s.name} (${s.role})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="edit-shift-type">Tegund vaktar</label>
                <select class="form-control" id="edit-shift-type" required>
                    <option value="Morgunvakt" ${event.extendedProps.shiftType === 'Morgunvakt' ? 'selected' : ''}>Morgunvakt (07:00-15:00)</option>
                    <option value="Kvöldvakt" ${event.extendedProps.shiftType === 'Kvöldvakt' ? 'selected' : ''}>Kvöldvakt (15:00-23:00)</option>
                    <option value="Næturvakt" ${event.extendedProps.shiftType === 'Næturvakt' ? 'selected' : ''}>Næturvakt (23:00-07:00)</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-shift-date">Dagsetning</label>
                <input type="date" class="form-control" id="edit-shift-date" required value="${event.start.toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="edit-shift-department">Deild</label>
                <select class="form-control" id="edit-shift-department" required>
                    <option value="A-álma" ${event.extendedProps.department === 'A-álma' ? 'selected' : ''}>A-álma</option>
                    <option value="B-álma" ${event.extendedProps.department === 'B-álma' ? 'selected' : ''}>B-álma</option>
                    <option value="C-álma" ${event.extendedProps.department === 'C-álma' ? 'selected' : ''}>C-álma</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-shift-notes">Athugasemdir</label>
                <textarea class="form-control" id="edit-shift-notes" rows="2"></textarea>
            </div>
        </form>
    `, [
        {
            text: 'Hætta við',
            class: 'cancel-btn',
            id: 'cancel-edit-shift'
        },
        {
            text: 'Vista breytingar',
            class: 'primary-btn',
            icon: 'save',
            id: 'save-edit-shift-btn',
            onClick: function() {
                const form = document.getElementById('edit-shift-form');
                if (form.checkValidity()) {
                    updateShift(event);
                    hideModal('edit-shift-modal');
                } else {
                    form.reportValidity();
                }
            }
        }
    ]);
    
    showModal('edit-shift-modal');
}

/**
 * Update a shift with edited information
 */
function updateShift(eventToUpdate) {
    const staffId = parseInt(document.getElementById('edit-staff-select').value);
    const shiftType = document.getElementById('edit-shift-type').value;
    const shiftDate = document.getElementById('edit-shift-date').value;
    const department = document.getElementById('edit-shift-department').value;
    
    const staff = staffList.find(s => s.id === staffId);
    
    if (!staff) {
        console.warn("Staff member not found:", staffId);
        showToast("Villa við að uppfæra vakt", "error");
        return;
    }
    
    // Create date object from input
    const date = new Date(shiftDate);
    
    // Determine new times
    const start = getShiftStartTime(date, shiftType);
    const end = getShiftEndTime(date, shiftType);
    
    // Update the event
    eventToUpdate.setProp('title', `${staff.name} - ${shiftType}`);
    eventToUpdate.setProp('backgroundColor', staff.color || '#4CAF50');
    eventToUpdate.setProp('borderColor', staff.color || '#4CAF50');
    eventToUpdate.setStart(start);
    eventToUpdate.setEnd(end);
    eventToUpdate.setExtendedProp('staffId', staffId);
    eventToUpdate.setExtendedProp('shiftType', shiftType);
    eventToUpdate.setExtendedProp('department', department);
    
    // Show success notification
    showToast("Vakt uppfærð", "success");
}

/**
 * Show confirmation before deleting a shift
 */
function showDeleteShiftConfirmation(event) {
    createConfirmDialog(
        'Eyða vakt',
        'Ertu viss um að þú viljir eyða þessari vakt?',
        function() {
            // User confirmed, delete the shift
            event.remove();
            showToast("Vakt eytt", "success");
        }
    );
}

/**
 * Filter schedule by department
 */
function filterScheduleByDepartment() {
    const department = document.getElementById('department-filter').value;
    
    if (department === 'all') {
        // Show all events
        calendar.getEvents().forEach(event => {
            event.setProp('display', 'auto');
        });
    } else {
        // Filter events
        calendar.getEvents().forEach(event => {
            if (event.extendedProps.department === department) {
                event.setProp('display', 'auto');
            } else {
                event.setProp('display', 'none');
            }
        });
    }
}

/**
 * Toggle between different staff views
 */
function toggleStaffView() {
    const staffListContainer = document.querySelector('.staff-list');
    if (!staffListContainer) return;
    
    // Toggle between list and grid view
    staffListContainer.classList.toggle('grid-view');
    
    // Update the button icon
    const toggleButton = document.getElementById('staff-view-toggle');
    if (toggleButton) {
        const icon = toggleButton.querySelector('i');
        if (icon) {
            if (staffListContainer.classList.contains('grid-view')) {
                icon.classList.replace('fa-list', 'fa-th');
            } else {
                icon.classList.replace('fa-th', 'fa-list');
            }
        }
    }
    
    // Add some CSS for grid view if it doesn't exist
    if (!document.getElementById('staff-grid-style')) {
        const style = document.createElement('style');
        style.id = 'staff-grid-style';
        style.textContent = `
            .staff-list.grid-view {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 0.75rem;
            }
            
            .staff-list.grid-view .staff-item {
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding: 1rem;
            }
            
            .staff-list.grid-view .staff-avatar {
                width: 50px;
                height: 50px;
                margin-right: 0;
                margin-bottom: 0.75rem;
            }
            
            .staff-list.grid-view .staff-name {
                margin-bottom: 0.25rem;
            }
            
            @media (max-width: 576px) {
                .staff-list.grid-view {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;
        document.head.appendChild(style);
    }
}