const express = require('express');
const Order = require('../models/Order');
const db = require('../config/db');

const router = express.Router();

// Get all orders
router.get('/', (req, res) => {
    try {
        const ordersData = db.getOrders();
        res.json(ordersData);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get order by ID
router.get('/:id', (req, res) => {
    try {
        const ordersData = db.getOrders();
        const order = ordersData.orders.find(o => o.id === req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new order
router.post('/', (req, res) => {
    try {
        const orderData = req.body;
        const order = new Order(orderData);

        // Validate order
        const validation = order.validate();
        if (!validation.isValid) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Calculate total if not provided
        if (!order.total) {
            order.calculateTotal();
        }

        // Save order
        const ordersData = db.getOrders();
        ordersData.orders.push(order.toJSON());

        if (db.saveOrders(ordersData)) {
            res.status(201).json({
                message: 'Order created successfully',
                order: order.toJSON()
            });
        } else {
            res.status(500).json({ message: 'Failed to save order' });
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update order status
router.put('/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        const ordersData = db.getOrders();
        const orderIndex = ordersData.orders.findIndex(o => o.id === req.params.id);

        if (orderIndex === -1) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = new Order(ordersData.orders[orderIndex]);

        // Update status
        if (order.updateStatus(status)) {
            ordersData.orders[orderIndex] = order.toJSON();

            if (db.saveOrders(ordersData)) {
                res.json({
                    message: 'Order status updated successfully',
                    order: order.toJSON()
                });
            } else {
                res.status(500).json({ message: 'Failed to update order status' });
            }
        } else {
            res.status(400).json({ message: 'Invalid status' });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get orders by user
router.get('/user/:userId', (req, res) => {
    try {
        const ordersData = db.getOrders();
        const userOrders = ordersData.orders.filter(o => o.userId == req.params.userId);
        res.json({ orders: userOrders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get orders by status
router.get('/status/:status', (req, res) => {
    try {
        const ordersData = db.getOrders();
        const statusOrders = ordersData.orders.filter(o => o.status === req.params.status);
        res.json({ orders: statusOrders });
    } catch (error) {
        console.error('Error fetching orders by status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update order
router.put('/:id', (req, res) => {
    try {
        const ordersData = db.getOrders();
        const orderIndex = ordersData.orders.findIndex(o => o.id === req.params.id);

        if (orderIndex === -1) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const updatedData = { ...ordersData.orders[orderIndex], ...req.body };
        const order = new Order(updatedData);

        // Validate updated order
        const validation = order.validate();
        if (!validation.isValid) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: validation.errors
            });
        }

        // Update order
        ordersData.orders[orderIndex] = order.toJSON();

        if (db.saveOrders(ordersData)) {
            res.json({
                message: 'Order updated successfully',
                order: order.toJSON()
            });
        } else {
            res.status(500).json({ message: 'Failed to update order' });
        }
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete order
router.delete('/:id', (req, res) => {
    try {
        const ordersData = db.getOrders();
        const orderIndex = ordersData.orders.findIndex(o => o.id === req.params.id);

        if (orderIndex === -1) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Remove order
        ordersData.orders.splice(orderIndex, 1);

        if (db.saveOrders(ordersData)) {
            res.json({ message: 'Order deleted successfully' });
        } else {
            res.status(500).json({ message: 'Failed to delete order' });
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get order statistics
router.get('/stats/overview', (req, res) => {
    try {
        const ordersData = db.getOrders();
        const orders = ordersData.orders;

        const stats = {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            confirmed: orders.filter(o => o.status === 'confirmed').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            totalRevenue: orders.reduce((sum, o) => sum + o.total, 0)
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;