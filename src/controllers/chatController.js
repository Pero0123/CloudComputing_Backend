// AI assistant chatbox using the RapidAPI LLaMA endpoint.
// The assistant is scoped to a vegetable ordering context.

const SYSTEM_PROMPT = {
  role: 'user',
  content: `You are a helpful assistant for a vegetable ordering service.
You help customers with questions about vegetables, their orders, recipes, and general cooking advice.
Keep responses concise and friendly.`,
};

// POST /api/chat
// Body: { messages: [{ role: 'user'|'assistant', content: string }] }
// The client maintains the conversation history and sends it with each request.
const chat = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: 'messages array is required' });
  }

  // Validate each message has role and content
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return res.status(400).json({ message: 'Each message must have role and content' });
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ message: "role must be 'user' or 'assistant'" });
    }
  }

  try {
    const response = await fetch('https://open-ai21.p.rapidapi.com/conversationllama', {
      method: 'POST',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'open-ai21.p.rapidapi.com',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [SYSTEM_PROMPT, ...messages],
        web_access: false,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ message: `AI service error: ${response.statusText}` });
    }

    const data = await response.json();
    const reply = data.result || data.message || data.text || '';

    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { chat };
