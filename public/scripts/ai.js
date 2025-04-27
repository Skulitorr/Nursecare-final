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
    }

    setupEventListeners() {
        eventBus.on(Events.PATIENT_UPDATED, (data) => {
            this.updateContext('patient', data);
        });
        
        eventBus.on(Events.VITALS_UPDATED, (data) => {
            this.updateContext('vitals', data);
        });
    }

    updateContext(type, data) {
        this.context[type] = data;
    }

    clearContext() {
        this.context = {};
    }

    async generateShiftReport(promptTemplate = 'Generate a shift report summary') {
        console.log('Generating shift report...');
        
        try {
            const prompt = this.enrichPrompt(promptTemplate);
            const response = await apiClient.generateReport(prompt, this.context);
            
            eventBus.emit(Events.AI_REPORT_GENERATED, {
                report: response.summary,
                timestamp: new Date().toISOString()
            });
            
            return response.summary;
            
        } catch (error) {
            console.error('Error generating report:', error);
            eventBus.emit(Events.AI_ERROR, error);
            throw error;
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
    }

    clearChatHistory() {
        this.chatHistory = [];
    }

    // Throttled chat processing to prevent spam
    processChatMessage = throttle(async (message) => {
        console.log('Processing chat message:', message);
        
        try {
            this.addToChatHistory(message, 'user');
            
            const response = await apiClient.processChatMessage({
                message,
                history: this.chatHistory
            });
            
            this.addToChatHistory(response.message, 'assistant');
            
            eventBus.emit(Events.AI_CHAT_MESSAGE, {
                message: response.message,
                role: 'assistant',
                timestamp: new Date().toISOString()
            });
            
            return response;
            
        } catch (error) {
            console.error('Error processing chat message:', error);
            eventBus.emit(Events.AI_ERROR, error);
            throw error;
        }
    }, 1000);

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
            Generate a concise medical summary for the patient with the following information:
            ${JSON.stringify(patientData)}
            
            Include:
            - Key diagnoses
            - Current medications
            - Recent vital signs
            - Important notes
            - Recommendations
        `;
        
        try {
            const response = await apiClient.generateReport(prompt, { patient: patientData });
            return response.summary;
        } catch (error) {
            console.error('Error generating medical summary:', error);
            eventBus.emit(Events.AI_ERROR, error);
            throw error;
        }
    }

    async analyzeTrends(data, type = 'vitals') {
        console.log(`Analyzing ${type} trends...`);
        
        const prompt = `
            Analyze the following ${type} data and identify significant trends or patterns:
            ${JSON.stringify(data)}
            
            Please provide:
            - Key observations
            - Notable changes
            - Potential areas of concern
            - Recommendations for follow-up
        `;
        
        try {
            const response = await apiClient.generateReport(prompt, { [type]: data });
            return response.summary;
        } catch (error) {
            console.error('Error analyzing trends:', error);
            eventBus.emit(Events.AI_ERROR, error);
            throw error;
        }
    }

    async getRecommendations(context) {
        console.log('Getting AI recommendations...');
        
        const prompt = `
            Based on the following context:
            ${JSON.stringify(context)}
            
            Please provide:
            - Care recommendations
            - Potential risks to monitor
            - Suggested interventions
            - Follow-up actions
        `;
        
        try {
            const response = await apiClient.generateReport(prompt, context);
            return response.summary;
        } catch (error) {
            console.error('Error getting recommendations:', error);
            eventBus.emit(Events.AI_ERROR, error);
            throw error;
        }
    }
}

// Create and export singleton instance
const aiManager = new AIManager();
export default aiManager;