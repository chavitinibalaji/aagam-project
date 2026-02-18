const express = require('express');
const router = express.Router();
const db = require('../models');
const { Product } = db;

// GET /api/inventory - Get all products (public - no auth required)
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch inventory' });
  }
});

// GET /api/inventory/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/inventory - Add new product (admin only - add auth later if needed)
router.post('/', async (req, res) => {
  const { name, price, mrp, off, weight, img, cat, highlights, deliveryTime, tags } = req.body;

  try {
    const product = await Product.create({
      name,
      price,
      mrp,
      off,
      weight,
      img,
      cat,
      highlights,
      deliveryTime,
      tags,
    });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add product' });
  }
});

// PUT /api/inventory/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.update(req.body);
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// DELETE /api/inventory/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
