module.exports = {
  PRODUCT_RECOMENDATION_PROMPT: `You are a product recommendation specialist for a vegetable shop.
You will be given a list of active products. Each has: index, name, stock, totalOrdered (last 7 days), and basketCount (total in all users' baskets).
Select 6 products by their index number:
- "popular": the 3 with the highest combined demand (totalOrdered + basketCount)
- "overstocked": the 2 products which are highest in stock quantity
- "random": 1 product chosen completely at random from the remaining products
No product should appear in more than one list.
Only respond with JSON in this exact format, no extra text:
{"popular":[0,1,2],"overstocked":[3,4],"random":5}`,

  RECIPES_FROM_CART_PROMPT: (ingredientList) =>
    `I have the following vegetables in my cart: ${ingredientList}.
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

  RECIPE_BY_NAME_PROMPT: (name) =>
    `Give me a full recipe for "${name}". Include:
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
};
