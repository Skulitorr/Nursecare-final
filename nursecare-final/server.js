// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Validate API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY || !OPENAI_API_KEY.startsWith('sk-')) {
    console.error('Invalid or missing OpenAI API key');
    process.exit(1);
}

const app = express();

// Initialize OpenAI without the invalid timeout parameter
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3
});

// Configure CORS to accept requests from the web container domain
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from the root directory
app.use(express.static('./'));

app.use(express.json());

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // For demo purposes, use a simple check
    // In production, you would validate against a database and use proper password hashing
    if (username === 'admin' && password === 'admin123') {
        res.json({
            success: true,
            token: 'demo-token-123',
            message: 'Innskráning tókst!'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Rangt notandanafn eða lykilorð'
        });
    }
});

// API Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    apiKeySet: !!process.env.OPENAI_API_KEY
  });
});

// NurseCare AI Chat API Route
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Valid messages array is required' 
      });
    }
    
    // Add system message to instruct the AI to respond in Icelandic
    const fullMessages = [
      {
        role: "system",
        content: "You are NurseCare AI, an intelligent assistant for healthcare professionals in a nursing facility. Respond in Icelandic unless specified otherwise. Be concise, accurate, and helpful. Act as a knowledgeable doctor or nurse with expertise in healthcare."
      },
      ...messages
    ];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }
    
    res.json({ 
      response: aiResponse,
      usage: completion.usage,
      success: true
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(error.status || 500).json({
      error: 'Failed to get AI response',
      details: error.message,
      success: false
    });
  }
});

// Legacy API route for compatibility with older code
app.post('/api/generate', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'Text parameter is required' 
      });
    }
    
    // Create a simple message structure for the legacy endpoint
    const messages = [
      {
        role: "system",
        content: `You are NurseCare AI, an intelligent assistant for healthcare professionals in a nursing facility. 
        Respond in Icelandic unless specified otherwise. Be concise, accurate and helpful.`
      },
      {
        role: "user",
        content: text
      }
    ];
    
    console.log('Processing legacy generate request');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 0.7,
      max_tokens: 400
    });
    
    const result = completion.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('No response from OpenAI');
    }
    
    res.json({ result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});