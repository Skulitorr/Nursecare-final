import OpenAI from 'openai';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateSession } from '../scripts/auth.js';

console.log('OpenAI Proxy Module Loaded');

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

router.use(limiter);

// Middleware to validate user session
router.use((req, res, next) => {
    if (!validateSession(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// Generate AI report
router.post('/generate', async (req, res) => {
    try {
        const { prompt, context } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Construct system message with medical context
        const systemMessage = `You are an AI assistant helping healthcare professionals at a hospital. 
        You specialize in medical documentation and patient care summaries.
        Always maintain patient confidentiality and use professional medical terminology.
        Format your responses in a clear, structured way suitable for medical documentation.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: `Context: ${JSON.stringify(context)}\n\nTask: ${prompt}` }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        res.json({
            summary: response.choices[0].message.content,
            usage: response.usage
        });

    } catch (error) {
        console.error('OpenAI generate error:', error);
        res.status(500).json({
            error: 'Error generating AI response',
            details: error.message
        });
    }
});

// Process chat messages
router.post('/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Construct system message for chat context
        const systemMessage = `You are a helpful AI assistant in a hospital setting.
        You can help with medical queries but always remind users to consult healthcare professionals for medical advice.
        You have access to hospital protocols and can help with administrative tasks.
        Keep responses clear, professional, and evidence-based when possible.`;

        // Prepare conversation history
        const messages = [
            { role: "system", content: systemMessage },
            ...history.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: "user", content: message }
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages,
            temperature: 0.7,
            max_tokens: 500
        });

        res.json({
            message: response.choices[0].message.content,
            usage: response.usage
        });

    } catch (error) {
        console.error('OpenAI chat error:', error);
        res.status(500).json({
            error: 'Error processing chat message',
            details: error.message
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

export default router;