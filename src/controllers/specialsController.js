const OpenAI = require('openai');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Basket = require('../models/Basket');
const Special = require('../models/Special');

const { PRODUCT_RECOMENDATION_PROMPT } = require('../config/prompts');
const cron = require('node-cron');
const client = new OpenAI({
  baseURL: 'https://models.github.ai/inference',
  apiKey: process.env.GITHUB_TOKEN,
});

async function gatherProductData() {
  const products = await Product.find({ isActive: true }).select('_id name stock');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentOrders = await Order.find({ createdAt: { $gte: sevenDaysAgo } });
  const orderTotals = new Map();
  for (const order of recentOrders) {
    for (const item of order.items) {
      const key = item.product.toString();
      orderTotals.set(key, (orderTotals.get(key) || 0) + item.quantity);
    }
  }

  const allBaskets = await Basket.find({});
  const basketTotals = new Map();
  for (const basket of allBaskets) {
    for (const item of basket.items) {
      const key = item.product.toString();
      basketTotals.set(key, (basketTotals.get(key) || 0) + item.quantity);
    }
  }

  return products.map((p, i) => ({
    index: i,
    name: p.name,
    stock: p.stock,
    totalOrdered: orderTotals.get(p._id.toString()) || 0,
    basketCount: basketTotals.get(p._id.toString()) || 0,
    _id: p._id.toString(),
  }));
}

async function generateSpecials() {
    const productData = await gatherProductData();

    if (productData.length < 6) {
      throw new Error('Not enough active products to generate specials (minimum 6 required)');
    }

    const userMessage = `Here is the product data (${productData.length} products, indices 0 to ${productData.length - 1}):\n${JSON.stringify(productData)}\n\n${PRODUCT_RECOMENDATION_PROMPT}`;

    const response = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.2,
      top_p: 1.0,
      max_tokens: 200,
    });

    const text = response.choices[0].message.content || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI did not return valid JSON');

    const parsed = JSON.parse(match[0]);

    if (!Array.isArray(parsed.popular) || !Array.isArray(parsed.overstocked) || !parsed.random) {
      throw new Error('AI response missing popular, overstocked, or random fields');
    }

    const validIndex = i => Number.isInteger(i) && i >= 0 && i < productData.length;
    const toId = i => productData[i]._id;

    const popularIds = parsed.popular.filter(validIndex).slice(0, 3).map(toId);
    const popularIndices = new Set(parsed.popular.filter(validIndex).slice(0, 3));
    const overstockedIds = parsed.overstocked
      .filter(i => validIndex(i) && !popularIndices.has(i))
      .slice(0, 2)
      .map(toId);
    const randomId = validIndex(parsed.random) && !popularIndices.has(parsed.random) ? toId(parsed.random) : null;

    if (popularIds.length < 3 || overstockedIds.length < 2 || !randomId) {
      throw new Error('AI returned insufficient valid product indices');
    }

    await Special.deleteMany({});
    const special = await Special.create({
      popular: popularIds,
      overstocked: overstockedIds,
      random: randomId,
      generatedAt: new Date(),
    });

    return special;
  }


const regenerateSpecials = async (req, res) => {
  try {
    const special = await generateSpecials();
    return res.json(special);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to regenerate specials', error: err.message });
  }
};


//Get generated specials. if specials dont exist it calls the generateSpecials function to generate them for the first time
const getSpecials = async (req, res) => {
  try {
    let special = await Special.findOne()
      .populate('popular')
      .populate('overstocked')
      .populate('random');

    if (!special) {
      const generated = await generateSpecials();
      special = await Special.findById(generated._id)
        .populate('popular')
        .populate('overstocked')
        .populate('random');
    }

    return res.json(special);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch specials', error: err.message });
  }
};

// regenerate specials once per minute
cron.schedule('* * * * *', () => {
  console.log('cron: regenerating specials...');
  generateSpecials()
    .then(() => console.log('cron: specials regenerated successfully'))
    .catch(err => console.error('cron: failed to regenerate specials:', err.message));
});

module.exports = { regenerateSpecials, getSpecials };
