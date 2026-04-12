const OpenAI = require('openai');
const Basket = require('../models/Basket');

const client = new OpenAI({
  baseURL: 'https://models.github.ai/inference',
  apiKey: process.env.GITHUB_TOKEN,
});

const callModel = async (messages) => {
  const response = await client.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages,
    temperature: 1.0,
    top_p: 1.0,
    max_tokens: 1000,
  });
  return response.choices[0].message.content || '';
};

// GET /api/recipes/from-cart
// Generates 5 recipe suggestions based on what is currently in the user's basket.
const getRecipesFromCart = async (req, res) => {
  try {
    const basket = await Basket.findOne({ user: req.user._id }).populate(
      'items.product',
      'name unit isActive'
    );

    const activeItems = basket
      ? basket.items.filter((item) => item.product && item.product.isActive)
      : [];

    if (activeItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    const ingredientList = activeItems
      .map((item) => `${item.quantity}x ${item.product.name} (${item.product.unit})`)
      .join(', ');

    const text = await callModel([
      {
        role: 'user',
        content: `I have the following vegetables in my cart: ${ingredientList}.
Suggest 5 recipes I could make using some or all of these ingredients.
For each recipe provide: name, brief description, and a list of ingredients.
Format your response as a JSON array like this:
[
  {
    "name": "Recipe Name",
    "description": "Brief description",
    "ingredients": ["ingredient 1", "ingredient 2"]
  }
]
Only respond with the JSON array, no extra text.`,
      },
    ]);

    let recipes = [];

    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        recipes = JSON.parse(match[0]);
      }
    } catch {
      return res.json({ items: ingredientList, recipes: [], raw: text });
    }

    return res.json({ items: ingredientList, recipes });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch recipes', error: err.message });
  }
};

// GET /api/recipes/:name
// Get a full recipe with step-by-step instructions for a named dish.
const getRecipeByName = async (req, res) => {
  const name = decodeURIComponent(req.params.name);

  try {
    const text = await callModel([
      {
        role: 'user',
        content: `Give me a full recipe for "${name}". Include:
- A list of ingredients with quantities
- Step-by-step cooking instructions
Format your response as JSON like this:
{
  "name": "Recipe Name",
  "servings": "4",
  "prepTime": "15 minutes",
  "cookTime": "30 minutes",
  "ingredients": ["200g ingredient 1", "1 tbsp ingredient 2"],
  "steps": ["Step 1 description", "Step 2 description"]
}
Only respond with the JSON object, no extra text.`,
      },
    ]);

    let recipe = null;

    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        recipe = JSON.parse(match[0]);
      }
    } catch {
      return res.json({ recipe: null, raw: text });
    }

    if (!recipe) return res.status(404).json({ message: 'Could not generate recipe' });
    return res.json(recipe);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch recipe', error: err.message });
  }
};

module.exports = { getRecipesFromCart, getRecipeByName };
