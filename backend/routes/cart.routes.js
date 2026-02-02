const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT ci.id AS cart_item_id, ci.quantity, 
             p.id, p.name, p.price, p.mrp, p.off, p.weight, p.img_url, p.category
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [req.userId]);

    let subtotal = 0;
    let mrpDiscount = 0;

    items.forEach(item => {
      item.itemTotal = item.price * item.quantity;
      subtotal += item.itemTotal;
      if (item.mrp) mrpDiscount += (item.mrp - item.price) * item.quantity;
    });

    const deliveryFee = subtotal >= 500 ? 0 : 30;
    const handlingFee = 10;
    const grandTotal = subtotal + deliveryFee + handlingFee;

    res.json({
      success: true,
      items,
      count: items.length,
      subtotal,
      deliveryFee,
      handlingFee,
      grandTotal,
      savings: {
        mrpDiscount,
        deliverySavings: deliveryFee === 0 ? 30 : 0,
        handlingSavings: 10,
        totalSavings: mrpDiscount + (deliveryFee === 0 ? 30 : 0) + 10
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ success: false, message: 'Product ID required' });

  try {
    const [existing] = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.userId, product_id]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, existing[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.userId, product_id, quantity]
      );
    }

    res.json({ success: true, message: 'Item added/updated in cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:cart_item_id', authMiddleware, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ success: false, message: 'Invalid quantity' });

  try {
    const [result] = await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, req.params.cart_item_id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Cart item not found' });

    res.json({ success: true, message: 'Quantity updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:cart_item_id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.cart_item_id, req.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Cart item not found' });

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
