const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const db = require('../models');

const { Cart, CartItem, Product } = db;

// Get or create active cart
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({
    where: { userId, status: 'active' },
    include: [{ model: CartItem, include: [Product] }],
  });

  if (!cart) {
    cart = await Cart.create({ userId, status: 'active', total: 0 });
  }

  return cart;
}

// GET /api/cart
router.get('/', protect, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    let total = 0;

    const items = cart.CartItems.map(item => {
      const priceNum = parseFloat(item.Product.price.replace('₹', '')) || 0;
      const subtotal = priceNum * item.quantity;
      total += subtotal;
      return {
        productId: item.productId,
        name: item.Product.name,
        price: item.Product.price,
        img: item.Product.img,
        weight: item.Product.weight,
        quantity: item.quantity,
        subtotal: subtotal.toFixed(2),
      };
    });

    await cart.update({ total });

    res.json({ cartId: cart.id, items, total: total.toFixed(2), itemCount: items.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// POST /api/cart/add
router.post('/add', protect, async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  try {
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const cart = await getOrCreateCart(req.user.id);

    let cartItem = await CartItem.findOne({ where: { cartId: cart.id, productId } });

    if (cartItem) {
      cartItem.quantity += Number(quantity);
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity: Number(quantity),
      });
    }

    // Recalculate total
    const items = await CartItem.findAll({ where: { cartId: cart.id }, include: [Product] });
    let total = 0;
    items.forEach(i => total += (parseFloat(i.Product.price.replace('₹', '')) || 0) * i.quantity);

    await cart.update({ total });

    res.json({ message: 'Added to cart', cartTotal: total.toFixed(2) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add item' });
  }
});

// PUT /api/cart/update
router.put('/update', protect, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const cart = await getOrCreateCart(req.user.id);
    const item = await CartItem.findOne({ where: { cartId: cart.id, productId } });

    if (!item) return res.status(404).json({ message: 'Item not in cart' });

    if (quantity <= 0) {
      await item.destroy();
    } else {
      item.quantity = quantity;
      await item.save();
    }

    // Recalculate
    const items = await CartItem.findAll({ where: { cartId: cart.id }, include: [Product] });
    let total = 0;
    items.forEach(i => total += (parseFloat(i.Product.price.replace('₹', '')) || 0) * i.quantity);

    await cart.update({ total });

    res.json({ message: quantity > 0 ? 'Updated' : 'Removed', cartTotal: total.toFixed(2) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update' });
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await CartItem.destroy({ where: { cartId: cart.id, productId: req.params.productId } });

    // Recalculate total...
    const items = await CartItem.findAll({ where: { cartId: cart.id }, include: [Product] });
    let total = 0;
    items.forEach(i => total += (parseFloat(i.Product.price.replace('₹', '')) || 0) * i.quantity);

    await cart.update({ total });

    res.json({ message: 'Removed', cartTotal: total.toFixed(2) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove' });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', protect, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await CartItem.destroy({ where: { cartId: cart.id } });
    await cart.update({ total: 0 });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear cart' });
  }
});

module.exports = router;
