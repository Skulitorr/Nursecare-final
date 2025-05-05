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

    // Updated Icelandic system message for nursing home context
    const systemMessage = `Þú ert NurseCare, gervigreindur hjúkrunaraðstoðarmaður sem vinnur í hjúkrunarheimili á Íslandi. Þú talar og skilur íslensku. Þitt hlutverk er að styðja starfsfólk með:

- Svörum við spurningum um starfsfólk, vaktaskipan, lyfjagjafir, skýrslugerð og skjólstæðinga
- Einföldum samantektum og útskýringum á íslensku
- Mikilli skilvirkni og stuttum svörum sem spara tíma
- Þolinmæði gagnvart stafsetningarvillum eða ófullkominni málfræði
- Vinalegu og faglegu viðmóti

Svaraðu alltaf á skýru íslensku, notaðu emoji þar sem við á (t.d. ✅ eða 💊), og vertu hnitmiðaður en hjálpsamur.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: `Context: ${JSON.stringify(context)}\n\nTask: ${prompt}` }
      ],
      temperature: 0.7,
      max_tokens: 300 // Reduced token count for more concise responses
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
      details: error.message || 'Unknown error',
      // Icelandic error message
      message: "⚠️ Það kom upp villa við tengingu við gervigreindina. Reyndu aftur eftir smá stund."
    });
  }
}