const express = require('express');
const { getRecipesFromCart, getRecipeByName } = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

//Get /api/recipes/from-cart  generate recipes from the user's current basket
router.get('/from-cart', getRecipesFromCart);

//Get /api/recipes/:name get 
router.get('/:name', getRecipeByName);

module.exports = router;
