const express = require('express');
const Product = require('../models/Product');
const db = require('../config/db');

const router = express.Router();

// Get all products
router.get('/', (req, res) => {
    try {
        const productsData = db.getProducts();
        res.json(productsData);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get product by ID
router.get('/:id', (req, res) => {
    try {
        const productsData = db.getProducts();
        const product = productsData.products.find(p => p.id == req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new product
router.post('/', (req, res) => {
    try {
        const productData = req.body;
        const product = new Product(productData);

        // Validate product
        const validation = product.validate();
        if (!validation.isValid) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Save product
        const productsData = db.getProducts();
        productsData.products.push(product.toJSON());

        if (db.saveProducts(productsData)) {
            res.status(201).json({
                message: 'Product created successfully',
                product: product.toJSON()
            });
        } else {
            res.status(500).json({ message: 'Failed to save product' });
        }
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update product
router.put('/:id', (req, res) => {
    try {
        const productsData = db.getProducts();
        const productIndex = productsData.products.findIndex(p => p.id == req.params.id);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const updatedData = { ...productsData.products[productIndex], ...req.body };
        const product = new Product(updatedData);

        // Validate updated product
        const validation = product.validate();
        if (!validation.isValid) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Update product
        productsData.products[productIndex] = product.toJSON();

        if (db.saveProducts(productsData)) {
            res.json({
                message: 'Product updated successfully',
                product: product.toJSON()
            });
        } else {
            res.status(500).json({ message: 'Failed to update product' });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete product
router.delete('/:id', (req, res) => {
    try {
        const productsData = db.getProducts();
        const productIndex = productsData.products.findIndex(p => p.id == req.params.id);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Remove product
        productsData.products.splice(productIndex, 1);

        if (db.saveProducts(productsData)) {
            res.json({ message: 'Product deleted successfully' });
        } else {
            res.status(500).json({ message: 'Failed to delete product' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get products by category
router.get('/category/:category', (req, res) => {
    try {
        const productsData = db.getProducts();
        const categoryProducts = productsData.products.filter(p => p.cat === req.params.category);
        res.json({ products: categoryProducts });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Search products
router.get('/search/:query', (req, res) => {
    try {
        const query = req.params.query.toLowerCase();
        const productsData = db.getProducts();

        const searchResults = productsData.products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.cat.toLowerCase().includes(query)
        );

        res.json({ products: searchResults });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update product stock
router.put('/:id/stock', (req, res) => {
    try {
        const { stock } = req.body;
        const productsData = db.getProducts();
        const productIndex = productsData.products.findIndex(p => p.id == req.params.id);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update stock
        productsData.products[productIndex].stock = Math.max(0, stock);
        productsData.products[productIndex].updatedAt = new Date();

        if (db.saveProducts(productsData)) {
            res.json({
                message: 'Stock updated successfully',
                product: productsData.products[productIndex]
            });
        } else {
            res.status(500).json({ message: 'Failed to update stock' });
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;