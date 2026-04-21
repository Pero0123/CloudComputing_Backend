require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const basketRoutes = require('./routes/basketRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const specialsRoutes = require('./routes/specialsRoutes');

const app = express();

connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/backend/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/backend/auth', authRoutes);
app.use('/backend/products', productRoutes);
app.use('/backend/basket', basketRoutes);
app.use('/backend/orders', orderRoutes);
app.use('/backend/orders/:orderId/messages', messageRoutes);
app.use('/backend/recipes', recipeRoutes);
app.use('/backend/specials', specialsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
