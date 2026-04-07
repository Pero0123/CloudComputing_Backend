const express = require('express');
const { getRecipesFromCart, getRecipeByName } = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// GET /api/recipes/from-cart — generate recipes from the user's current basket
router.get('/from-cart', getRecipesFromCart);

// GET /api/recipes/:name — get full recipe for a named dish
router.get('/:name', getRecipeByName);

module.exports = router;
