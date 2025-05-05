import apiClient from './api-client.js';
import eventBus, { Events } from './event-bus.js';
import { throttle, debounce } from './utils.js';

console.log('AI Module Loaded');

class AIManager {
    constructor() {
        this.context = {};
        this.chatHistory = [];
        this.maxHistoryLength = 20;
        this.typingTimeout = 1000;
        this.setupEventListeners();
        console.debug('AI Manager initialized');
    }

    setupEventListeners() {
        eventBus.on(Events.PATIENT_UPDATED, (data) => {
            this.updateContext('patient', data);
        });
        
        eventBus.on(Events.VITALS_UPDATED, (data) => {
            this.updateContext('vitals', data);
        });
        
        console.debug('AI event listeners set up');
    }

    updateContext(type, data) {
        this.context[type] = data;
        console.debug(`AI context updated for ${type}`, data);
    }

    clearContext() {
        this.context = {};
        console.debug('AI context cleared');
    }

    async generateShiftReport(promptTemplate = 'Generate a shift report summary') {
        console.log('Generating shift report...');
        
        try {
            const prompt = this.enrichPrompt(promptTemplate);
            console.debug('Sending shift report request to API', { prompt, context: this.context });
            
            const response = await apiClient.generateReport(prompt, this.context);
            
            // If the response format is different in Vercel, handle it
            const summary = response.summary || response.message || response.text || 
                           (typeof response === 'string' ? response : 'No response text available');
            
            eventBus.emit(Events.AI_REPORT_GENERATED, {
                report: summary,
                timestamp: new Date().toISOString()
            });
            
            return summary;
            
        } catch (error) {
            console.error('Error generating report:', error);
            eventBus.emit(Events.AI_ERROR, error);
            
            // Return fallback response when API fails
            return this.getFallbackResponse('report');
        }
    }

    enrichPrompt(basePrompt) {
        const contextInfo = Object.entries(this.context)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n');
            
        return `
            Based on the following context:
            ${contextInfo}
            
            ${basePrompt}
            
            Please format the response in a clear, professional manner suitable for medical documentation.
            Respond in Icelandic.
        `;
    }

    addToChatHistory(message, role = 'user') {
        this.chatHistory.push({
            role,
            content: message,
            timestamp: new Date().toISOString()
        });
        
        // Trim history if exceeding max length
        if (this.chatHistory.length > this.maxHistoryLength) {
            this.chatHistory = this.chatHistory.slice(-this.maxHistoryLength);
        }
        
        console.debug(`Added message to chat history (${role})`, message);
    }

    clearChatHistory() {
        this.chatHistory = [];
        console.debug('Chat history cleared');
    }

    // Throttled chat processing to prevent spam
    processChatMessage = throttle(async (message) => {
        console.log('Processing chat message:', message);
        
        try {
            this.addToChatHistory(message, 'user');
            
            const contextWithHistory = {
                ...this.context,
                history: this.chatHistory.slice(0, -1) // Exclude the message we just added
            };
            
            console.debug('Sending chat message to API', { message, context: contextWithHistory });
            
            const response = await apiClient.processChatMessage(message, contextWithHistory);
            
            // Extract the response text, handling different response formats
            let responseText;
            if (response && response.summary) {
                responseText = response.summary;
            } else if (response && response.message) {
                responseText = response.message;
            } else if (typeof response === 'string') {
                responseText = response;
            } else {
                console.warn('Unexpected response format:', response);
                responseText = "Ég er ekki alveg viss hvað þú átt við 🤔 — geturðu útskýrt nánar?";
            }
            
            this.addToChatHistory(responseText, 'assistant');
            
            eventBus.emit(Events.AI_CHAT_MESSAGE, {
                message: responseText,
                role: 'assistant',
                timestamp: new Date().toISOString()
            });
            
            return responseText;
            
        } catch (error) {
            console.error('Error processing chat message:', error);
            eventBus.emit(Events.AI_ERROR, error);
            
            // Return fallback response when API fails
            const fallbackResponse = this.getFallbackResponse('chat', message);
            this.addToChatHistory(fallbackResponse, 'assistant');
            
            return fallbackResponse;
        }
    }, 1000);

    // Generate fallback responses when API is unavailable
    getFallbackResponse(type, message = '') {
        console.debug('Generating fallback response for type:', type);
        
        if (type === 'chat') {
            // Simple keyword matching for a few common queries in Icelandic
            const lowercaseMsg = message.toLowerCase();
            
            if (lowercaseMsg.includes('hæ') || lowercaseMsg.includes('halló') || lowercaseMsg.includes('hallo')) {
                return 'Hæ! Hvernig get ég aðstoðað þig í dag? 👋';
            }
            
            if (lowercaseMsg.includes('veik') || lowercaseMsg.includes('sjúk')) {
                return 'Algengustu veikindi á þessum árstíma eru kvef og flensa. Viltu nánar upplýsingar? 🤒';
            }
            
            if (lowercaseMsg.includes('vakt') || lowercaseMsg.includes('vakta')) {
                return 'Vaktaáætlunin sýnir að það eru 8 starfsmenn á dagvakt, 5 á kvöldvakt og 3 á næturvakt í dag. 📋';
            }
            
            if (lowercaseMsg.includes('sjúkling') || lowercaseMsg.includes('patient') || lowercaseMsg.includes('skjólstæðing')) {
                return 'Það eru 18 sjúklingar á deildinni í dag. Viltu sjá lista yfir þá? 👨‍👩‍👧‍👦';
            }
            
            if (lowercaseMsg.includes('lyf') || lowercaseMsg.includes('lyfjagjöf')) {
                return 'Næstu lyfjagjafir eru kl. 14:00. Viltu sjá nákvæma lyfjalista? 💊';
            }
            
            // Default response when offline
            return '⚠️ Ég get ekki svarað nákvæmlega núna vegna þess að ég hef ekki netsamband. Get ég aðstoðað með eitthvað annað?';
        }
        
        if (type === 'report') {
            return '⚠️ Ekki tókst að búa til sjálfvirka skýrslu. Vinsamlegast skráðu skýrsluna handvirkt eða reyndu aftur síðar þegar nettenging er betri.';
        }
        
        return '⚠️ Það kom upp villa við tengingu við gervigreindina. Reyndu aftur eftir smá stund.';
    }

    // Debounced typing indicator
    handleTyping = debounce(() => {
        eventBus.emit(Events.AI_CHAT_MESSAGE, {
            type: 'typing',
            timestamp: new Date().toISOString()
        });
    }, 300);

    async generateMedicalSummary(patientData) {
        console.log('Generating medical summary...');
        
        const prompt = `
            Generate a concise medical summary in Icelandic for the patient with the following information:
            ${JSON.stringify(patientData)}
            
            Include:
            - Key diagnoses (Helstu sjúkdómsgreiningar)
            - Current medications (Lyf sem sjúklingur tekur)
            - Recent vital signs (Nýlegar lífsmörk)
            - Important notes (Mikilvægar athugasemdir)
            - Recommendations (Tillögur)
        `;
        
        try {
            console.debug('Sending medical summary request to API');
            const response = await apiClient.generateReport(prompt, { patient: patientData });
            return response.summary || response.message || 'Engin samantekt tiltæk';
        } catch (error) {
            console.error('Error generating medical summary:', error);
            eventBus.emit(Events.AI_ERROR, error);
            return this.getFallbackResponse('summary');
        }
    }

    async analyzeTrends(data, type = 'vitals') {
        console.log(`Analyzing ${type} trends...`);
        
        const prompt = `
            Analyze the following ${type} data and identify significant trends or patterns.
            Respond in Icelandic.
            
            Data: ${JSON.stringify(data)}
            
            Please provide:
            - Key observations (Helstu athuganir)
            - Notable changes (Athyglisverðar breytingar)
            - Potential areas of concern (Möguleg áhyggjuefni)
            - Recommendations for follow-up (Tillögur um eftirfylgni)
        `;
        
        try {
            console.debug(`Sending ${type} trends analysis request to API`);
            const response = await apiClient.generateReport(prompt, { [type]: data });
            return response.summary || response.message || 'Engin þróunargreining tiltæk';
        } catch (error) {
            console.error('Error analyzing trends:', error);
            eventBus.emit(Events.AI_ERROR, error);
            return this.getFallbackResponse('analysis');
        }
    }

    async getRecommendations(context) {
        console.log('Getting AI recommendations...');
        
        const prompt = `
            Based on the following context:
            ${JSON.stringify(context)}
            
            Please provide in Icelandic:
            - Care recommendations (Umönnunartillögur)
            - Potential risks to monitor (Möguleg áhætta sem þarf að fylgjast með)
            - Suggested interventions (Tillögur að inngripum)
            - Follow-up actions (Eftirfylgni)
        `;
        
        try {
            console.debug('Sending recommendations request to API');
            const response = await apiClient.generateReport(prompt, context);
            return response.summary || response.message || 'Engar tillögur tiltækar';
        } catch (error) {
            console.error('Error getting recommendations:', error);
            eventBus.emit(Events.AI_ERROR, error);
            return this.getFallbackResponse('recommendations');
        }
    }
}

// Create and export singleton instance
const aiManager = new AIManager();
export default aiManager;
// Named exports for direct function usage
export const generateShiftReport = (...args) => aiManager.generateShiftReport(...args);
export const processChatMessage = (...args) => aiManager.processChatMessage(...args);