const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const CARTS_FILE = path.join(__dirname, '../../data/carts.json');

async function ensureCartsFile() {
    try {
        await fs.access(CARTS_FILE);
    } catch (err) {
        await fs.writeFile(CARTS_FILE, JSON.stringify({ carts: [] }, null, 2));
    }
}

async function readCarts() {
    await ensureCartsFile();
    const data = await fs.readFile(CARTS_FILE, 'utf8');
    return JSON.parse(data);
}

async function writeCarts(data) {
    await fs.writeFile(CARTS_FILE, JSON.stringify(data, null, 2));
}

// Get current user's cart
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const cartsData = await readCarts();
        const cart = cartsData.carts.find(c => c.userId == userId) || { userId, items: [] };
        res.json(cart);
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ message: 'Error fetching cart' });
    }
});

// Add item to cart
router.post('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId, quantity } = req.body;
        if (!productId) return res.status(400).json({ message: 'productId is required' });

        const qty = parseInt(quantity) || 1;

        const cartsData = await readCarts();
        let cart = cartsData.carts.find(c => c.userId == userId);
        if (!cart) {
            cart = { userId, items: [] };
            cartsData.carts.push(cart);
        }

        const itemIndex = cart.items.findIndex(i => i.productId == productId);
        if (itemIndex === -1) {
            cart.items.push({ productId, quantity: qty });
        } else {
            cart.items[itemIndex].quantity += qty;
        }

        await writeCarts(cartsData);
        res.status(201).json({ message: 'Item added to cart', cart });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Error adding to cart' });
    }
});

// Update cart item quantity
router.put('/:productId', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const productId = req.params.productId;
        const { quantity } = req.body;

        const cartsData = await readCarts();
        const cart = cartsData.carts.find(c => c.userId == userId);
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const itemIndex = cart.items.findIndex(i => i.productId == productId);
        if (itemIndex === -1) return res.status(404).json({ message: 'Item not in cart' });

        if (quantity <= 0) {
            // remove item
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = parseInt(quantity);
        }

        await writeCarts(cartsData);
        res.json({ message: 'Cart updated', cart });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Error updating cart' });
    }
});

// Remove item from cart
router.delete('/:productId', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const productId = req.params.productId;

        const cartsData = await readCarts();
        const cart = cartsData.carts.find(c => c.userId == userId);
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const itemIndex = cart.items.findIndex(i => i.productId == productId);
        if (itemIndex !== -1) cart.items.splice(itemIndex, 1);

        await writeCarts(cartsData);
        res.json({ message: 'Item removed', cart });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Error removing item from cart' });
    }
});

// Clear cart
router.delete('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const cartsData = await readCarts();
        const cartIndex = cartsData.carts.findIndex(c => c.userId == userId);
        if (cartIndex !== -1) {
            cartsData.carts.splice(cartIndex, 1);
            await writeCarts(cartsData);
        }
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Error clearing cart' });
    }
});

module.exports = router;
