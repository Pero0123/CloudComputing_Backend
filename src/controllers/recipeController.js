const OpenAI = require('openai');
const Basket = require('../models/Basket');
const { RECIPES_FROM_CART_PROMPT, RECIPE_BY_NAME_PROMPT } = require('../config/prompts');

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

//get /backend/recipes/from-cart
//generates 5 recipe suggestions based on what is currently in the users basket.
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
      { role: 'user', content: RECIPES_FROM_CART_PROMPT(ingredientList) },
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

//get /backend/recipes/:name
//get a list of 5 recipe ideas
const getRecipeByName = async (req, res) => {
  const name = decodeURIComponent(req.params.name);

  try {
    const text = await callModel([
      { role: 'user', content: RECIPE_BY_NAME_PROMPT(name) },
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
