// Uses the RapidAPI LLaMA endpoint to generate recipes from a given ingredient/vegetable.

const callLlama = async (messages) => {
  const response = await fetch('https://open-ai21.p.rapidapi.com/conversationllama', {
    method: 'POST',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'open-ai21.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, web_access: false }),
  });

  if (!response.ok) {
    throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// GET /api/recipes?ingredient=tomato
const getRecipesByIngredient = async (req, res) => {
  const { ingredient } = req.query;
  if (!ingredient) {
    return res.status(400).json({ message: 'ingredient query param is required' });
  }

  try {
    const data = await callLlama([
      {
        role: 'user',
        content: `Suggest 5 recipes that use ${ingredient.trim()} as a main ingredient.
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

    // The API returns the reply in result.result or similar — try to parse JSON from it
    const text = data.result || data.message || data.text || '';
    let recipes = [];

    try {
      // Extract JSON array from the response text
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        recipes = JSON.parse(match[0]);
      }
    } catch {
      // If parsing fails, return the raw text so the client still gets something
      return res.json({ ingredient, recipes: [], raw: text });
    }

    return res.json({ ingredient, recipes });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch recipes', error: err.message });
  }
};

// GET /api/recipes/:name
// Get a full recipe with step-by-step instructions for a named dish
const getRecipeByName = async (req, res) => {
  const name = decodeURIComponent(req.params.name);

  try {
    const data = await callLlama([
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

    const text = data.result || data.message || data.text || '';
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

module.exports = { getRecipesByIngredient, getRecipeByName };
