// AI assistant chatbox using the GitHub AI inference endpoint (gpt-4o-mini).
// The system prompt is configurable in src/config/prompts.js.
// The user's current cart is automatically injected into the system context.

const OpenAI = require('openai');
const { CHAT_SYSTEM_PROMPT } = require('../config/prompts');
const Basket = require('../models/Basket');

const client = new OpenAI({
  baseURL: 'https://models.github.ai/inference',
  apiKey: process.env.GITHUB_TOKEN,
});

// POST /api/chat
// Body: { messages: [{ role: 'user'|'assistant', content: string }] }
// The client maintains the conversation history and sends it with each request.
const chat = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: 'messages array is required' });
  }

  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return res.status(400).json({ message: 'Each message must have role and content' });
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ message: "role must be 'user' or 'assistant'" });
    }
  }

  try {
    // Fetch the user's basket to give the AI context about what they have
    const basket = await Basket.findOne({ user: req.user._id }).populate(
      'items.product',
      'name unit isActive'
    );

    const activeItems = basket
      ? basket.items.filter((item) => item.product && item.product.isActive)
      : [];

    let systemContent = CHAT_SYSTEM_PROMPT;
    if (activeItems.length > 0) {
      const cartSummary = activeItems
        .map((item) => `${item.quantity}x ${item.product.name} (${item.product.unit})`)
        .join(', ');
      systemContent += `\n\nThe user currently has the following items in their cart: ${cartSummary}.`;
    }

    const response = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'system', content: systemContent }, ...messages],
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 1000,
    });

    const reply = response.choices[0].message.content || '';
    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { chat };
