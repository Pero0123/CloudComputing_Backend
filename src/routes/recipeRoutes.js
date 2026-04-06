const express = require('express');
const { getRecipesByIngredient, getRecipeByName } = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// GET /api/recipes?ingredient=tomato
router.get('/', getRecipesByIngredient);

// GET /api/recipes/:name  e.g. /api/recipes/tomato%20soup
router.get('/:name', getRecipeByName);

module.exports = router;
