const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const ORDERS_FILE = path.join(__dirname, '../../data/orders.json');

async function readOrders() {
    try {
        const data = await fs.readFile(ORDERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { orders: [] };
    }
}

async function writeOrders(data) {
    await fs.writeFile(ORDERS_FILE, JSON.stringify(data, null, 2));
}

// Get delivery status for an order
router.get('/:orderId/status', authenticate, async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const ordersData = await readOrders();
        const order = ordersData.orders.find(o => o.id === orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // If delivery info exists on order, return it; else map from order.status
        const delivery = order.delivery || { status: order.status || 'pending', location: null };
        res.json({ orderId: order.id, status: delivery.status, location: delivery.location || null });
    } catch (error) {
        console.error('Error getting delivery status:', error);
        res.status(500).json({ message: 'Error fetching delivery status' });
    }
});

// Update delivery status and optional location
router.put('/:orderId/status', authenticate, async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { status, location } = req.body;

        const ordersData = await readOrders();
        const orderIndex = ordersData.orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return res.status(404).json({ message: 'Order not found' });

        const order = ordersData.orders[orderIndex];
        order.delivery = order.delivery || {};
        if (status) {
            order.delivery.status = status;
            order.status = status; // keep order.status in sync
        }
        if (location) {
            order.delivery.location = location;
        }
        order.updatedAt = new Date();

        ordersData.orders[orderIndex] = order;
        await writeOrders(ordersData);

        res.json({ message: 'Delivery status updated', orderId: order.id, delivery: order.delivery });
    } catch (error) {
        console.error('Error updating delivery status:', error);
        res.status(500).json({ message: 'Error updating delivery status' });
    }
});

module.exports = router;
