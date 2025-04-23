import express from 'express';
import cors from 'cors';
import axios from 'axios';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const PORT = 5000;

// Setup enhanced CORS to ensure it works with Bolt
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add options pre-flight handling for all routes
app.options('*', cors());

// Health check route
app.get("/test", (req, res) => {
    console.log("Health check request received");
    res.send("✅ The proxy is working!");
});

// OpenAI test route
app.get("/openai", (req, res) => {
    console.log("OpenAI test route accessed");
    res.json({ message: "OpenAI Proxy is working!" });
});

// Enhanced OpenAI route with better error handling
app.post("/openai", async (req, res) => {
    console.log("OpenAI API request received");
    try {
        // Validate API key
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error("API key missing");
            throw new Error('OpenAI API key not configured in environment variables');
        }

        // Validate request body
        if (!req.body.messages || !Array.isArray(req.body.messages)) {
            console.error("Invalid request body format");
            return res.status(400).json({ error: 'Invalid request format: messages array required' });
        }

        console.log("Sending request to OpenAI API");
        const openAIResponse = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: req.body.messages,
                max_tokens: 1000
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                timeout: 30000 // 30 second timeout
            }
        );

        console.log("OpenAI API response received successfully");
        res.json(openAIResponse.data);
    } catch (error) {
        console.error("🚨 OpenAI API Error:", error.response ? error.response.data : error.message);
        
        // Enhanced error response
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error?.message 
            || error.message 
            || "Failed to connect to OpenAI API";
            
        res.status(statusCode).json({ 
            error: errorMessage,
            details: error.response?.data || error.message
        });
    }
});

app.get("/", (req, res) => {
    res.json({ message: "OpenAI Proxy is working!" });
});

// Start HTTP server with enhanced logging
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`✅ Proxy server running on port ${PORT}`);
    console.log(`Server URLs:`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`  http://127.0.0.1:${PORT}`);
}).on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});