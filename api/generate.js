// OpenAI API Endpoint for Vercel Serverless Functions
import OpenAI from 'openai';

export default async function handler(req, res) {
  console.debug("API endpoint called: /api/generate");
  
  // Check for POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, context = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Initialize OpenAI with API key from environment variable
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // System message for healthcare context
    const systemMessage = `You are an AI assistant helping healthcare professionals at a nursing facility. 
    You specialize in medical documentation and patient care summaries.
    Always maintain patient confidentiality and use professional medical terminology.
    Format your responses in a clear, structured way suitable for medical documentation.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: `Context: ${JSON.stringify(context)}\n\nTask: ${prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Return the generated content
    return res.status(200).json({
      summary: response.choices[0].message.content,
      usage: response.usage
    });
  } catch (error) {
    console.error('OpenAI generate error:', error);
    return res.status(500).json({
      error: 'Error generating AI response',
      details: error.message || 'Unknown error'
    });
  }
}