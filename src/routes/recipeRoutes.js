const express = require('express');
const { getRecipesFromCart, getRecipeByName } = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

//Get /backend/recipes/from-cart  generate recipes from the user's current basket
router.get('/from-cart', getRecipesFromCart);

//Get /backend/recipes/:name get 
router.get('/:name', getRecipeByName);

module.exports = router;
