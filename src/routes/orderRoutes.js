const express = require('express');
const { body } = require('express-validator');
const {
  getOrders,
  getOrder,
  createOrder,
  uploadPhoto,
  reviewPhoto,
  updateOrderStatus,
  updateTracking,
  getTracking,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getOrders);
router.get('/:id', getOrder);
router.get('/:id/tracking', getTracking);

router.post(
  '/',
  [
    body('deliveryAddress.street').notEmpty().withMessage('Street is required'),
    body('deliveryAddress.city').notEmpty().withMessage('City is required'),
    body('deliveryAddress.postcode').notEmpty().withMessage('Postcode is required'),
  ],
  createOrder
);

//photo upload for admin
router.put('/:id/photo', adminOnly, uploadPhoto);

//deny/approach order photo for customer
router.put('/:id/approval', reviewPhoto);

//orderstatus update for admin
router.put('/:id/status', adminOnly, updateOrderStatus);
router.put('/:id/tracking', adminOnly, updateTracking);

module.exports = router;
