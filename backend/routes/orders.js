const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const db = require('../models');
const { Order } = db;

// POST /api/orders - Create new order (from cart/checkout)
router.post('/', protect, async (req, res) => {
  const { items, total, address } = req.body;

  if (!items?.length || !total || !address) {
    return res.status(400).json({ message: 'Items, total, and address required' });
  }

  try {
    const order = await Order.create({
      userId: req.user.id,
      items,
      total,
      address,
      status: 'processing',
      timeline: [
        { title: 'Order Placed', completed: true, time: new Date() },
        { title: 'Processing', completed: false },
        { title: 'Out for Delivery', completed: false },
        { title: 'Delivered', completed: false },
      ],
    });

    // Optional: clear user's cart after order
    // await db.CartItem.destroy({ where: { cartId: (await db.Cart.findOne({where:{userId:req.user.id}})).id } });

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// GET /api/orders - Get all orders for the user
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Get single order details
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/orders/:id/cancel - Cancel order (if allowed)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'processing') {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    await order.update({ status: 'cancelled' });
    res.json({ message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

module.exports = router;
