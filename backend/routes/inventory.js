const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Path to inventory data file
const INVENTORY_FILE = path.join(__dirname, '../../data/inventory.json');

// Initialize inventory data if file doesn't exist
async function initializeInventory() {
    try {
        await fs.access(INVENTORY_FILE);
    } catch (error) {
        // Create initial inventory data
        const initialInventory = [
            {
                id: 1,
                name: 'Aashirvaad Atta',
                category: 'groceries',
                stock: 25,
                minStock: 10,
                lastUpdated: new Date().toISOString(),
                price: 180,
                unit: 'kg'
            },
            {
                id: 2,
                name: 'Fresh Milk',
                category: 'dairy',
                stock: 8,
                minStock: 5,
                lastUpdated: new Date().toISOString(),
                price: 25,
                unit: 'liters'
            },
            {
                id: 3,
                name: 'Fresh Vegetables',
                category: 'vegetables',
                stock: 45,
                minStock: 15,
                lastUpdated: new Date().toISOString(),
                price: 50,
                unit: 'kg'
            },
            {
                id: 4,
                name: 'Rice Pack',
                category: 'groceries',
                stock: 3,
                minStock: 8,
                lastUpdated: new Date().toISOString(),
                price: 120,
                unit: 'kg'
            },
            {
                id: 5,
                name: 'Fruit Basket',
                category: 'fruits',
                stock: 12,
                minStock: 6,
                lastUpdated: new Date().toISOString(),
                price: 200,
                unit: 'basket'
            },
            {
                id: 6,
                name: 'Soft Drinks',
                category: 'beverages',
                stock: 30,
                minStock: 12,
                lastUpdated: new Date().toISOString(),
                price: 35,
                unit: 'bottles'
            }
        ];

        await fs.writeFile(INVENTORY_FILE, JSON.stringify({ inventory: initialInventory }, null, 2));
    }
}

// Get all inventory items
router.get('/', async (req, res) => {
    try {
        await initializeInventory();
        const data = await fs.readFile(INVENTORY_FILE, 'utf8');
        const inventoryData = JSON.parse(data);
        res.json(inventoryData);
    } catch (error) {
        console.error('Error reading inventory:', error);
        res.status(500).json({ message: 'Error reading inventory data' });
    }
});

// Get inventory item by ID
router.get('/:id', async (req, res) => {
    try {
        await initializeInventory();
        const data = await fs.readFile(INVENTORY_FILE, 'utf8');
        const inventoryData = JSON.parse(data);
        const item = inventoryData.inventory.find(item => item.id === parseInt(req.params.id));

        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        res.json(item);
    } catch (error) {
        console.error('Error reading inventory item:', error);
        res.status(500).json({ message: 'Error reading inventory item' });
    }
});

// Adjust stock for an inventory item
router.post('/:id/adjust', async (req, res) => {
    try {
        await initializeInventory();
        const { adjustment, reason, notes } = req.body;
        const itemId = parseInt(req.params.id);

        const data = await fs.readFile(INVENTORY_FILE, 'utf8');
        const inventoryData = JSON.parse(data);
        const itemIndex = inventoryData.inventory.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        const item = inventoryData.inventory[itemIndex];
        const oldStock = item.stock;
        item.stock = Math.max(0, item.stock + adjustment);
        item.lastUpdated = new Date().toISOString();

        // Add stock adjustment history
        if (!item.history) {
            item.history = [];
        }
        item.history.push({
            date: new Date().toISOString(),
            adjustment: adjustment,
            oldStock: oldStock,
            newStock: item.stock,
            reason: reason || 'manual_adjustment',
            notes: notes || ''
        });

        await fs.writeFile(INVENTORY_FILE, JSON.stringify(inventoryData, null, 2));

        // Broadcast stock change via WebSocket (will be handled by server.js)
        const WebSocket = require('ws');
        // Note: In a real implementation, you'd emit this through the WebSocket server

        res.json({
            message: 'Stock adjusted successfully',
            item: item,
            oldStock: oldStock,
            newStock: item.stock
        });
    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(500).json({ message: 'Error adjusting stock' });
    }
});

// Bulk update inventory
router.post('/bulk-update', async (req, res) => {
    try {
        await initializeInventory();
        const { updates } = req.body;

        const data = await fs.readFile(INVENTORY_FILE, 'utf8');
        const inventoryData = JSON.parse(data);

        const updatedItems = [];

        updates.forEach(update => {
            const item = inventoryData.inventory.find(item => item.id === update.id);
            if (item) {
                item.stock = Math.max(0, update.stock);
                item.lastUpdated = new Date().toISOString();
                updatedItems.push(item);
            }
        });

        await fs.writeFile(INVENTORY_FILE, JSON.stringify(inventoryData, null, 2));

        res.json({
            message: 'Bulk inventory update completed',
            updatedItems: updatedItems
        });
    } catch (error) {
        console.error('Error bulk updating inventory:', error);
        res.status(500).json({ message: 'Error bulk updating inventory' });
    }
});

// Get low stock alerts
router.get('/alerts/low-stock', async (req, res) => {
    try {
        await initializeInventory();
        const data = await fs.readFile(INVENTORY_FILE, 'utf8');
        const inventoryData = JSON.parse(data);

        const lowStockItems = inventoryData.inventory.filter(item =>
            item.stock <= item.minStock && item.stock > 0
        );

        const outOfStockItems = inventoryData.inventory.filter(item =>
            item.stock === 0
        );

        res.json({
            lowStock: lowStockItems,
            outOfStock: outOfStockItems,
            totalAlerts: lowStockItems.length + outOfStockItems.length
        });
    } catch (error) {
        console.error('Error getting stock alerts:', error);
        res.status(500).json({ message: 'Error getting stock alerts' });
    }
});

// Get inventory statistics
router.get('/stats/summary', async (req, res) => {
    try {
        await initializeInventory();
        const data = await fs.readFile(INVENTORY_FILE, 'utf8');
        const inventoryData = JSON.parse(data);

        const stats = {
            totalItems: inventoryData.inventory.length,
            inStockItems: inventoryData.inventory.filter(item => item.stock > 0).length,
            lowStockItems: inventoryData.inventory.filter(item => item.stock > 0 && item.stock <= item.minStock).length,
            outOfStockItems: inventoryData.inventory.filter(item => item.stock === 0).length,
            totalValue: inventoryData.inventory.reduce((sum, item) => sum + (item.stock * item.price), 0),
            lastUpdated: new Date().toISOString()
        };

        res.json(stats);
    } catch (error) {
        console.error('Error getting inventory stats:', error);
        res.status(500).json({ message: 'Error getting inventory statistics' });
    }
});

// Add new inventory item
router.post('/', async (req, res) => {
    try {
        await initializeInventory();
        const { name, category, stock, minStock, price, unit } = req.body;

        const data = await fs.readFile(INVENTORY_FILE, 'utf8');
        const inventoryData = JSON.parse(data);

        const newItem = {
            id: Math.max(...inventoryData.inventory.map(item => item.id), 0) + 1,
            name,
            category,
            stock: stock || 0,
            minStock: minStock || 5,
            price: price || 0,
            unit: unit || 'pieces',
            lastUpdated: new Date().toISOString(),
            history: []
        };

        inventoryData.inventory.push(newItem);
        await fs.writeFile(INVENTORY_FILE, JSON.stringify(inventoryData, null, 2));

        res.status(201).json({
            message: 'Inventory item added successfully',
            item: newItem
        });
    } catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ message: 'Error adding inventory item' });
    }
});

// Update inventory item
router.put('/:id', async (req, res) => {
    try {
        await initializeInventory();
        const { name, category, stock, minStock, price, unit } = req.body;
        const itemId = parseInt(req.params.id);

        const data = await fs.readFile(INVENTORY_FILE, 'utf8');
        const inventoryData = JSON.parse(data);
        const itemIndex = inventoryData.inventory.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        const item = inventoryData.inventory[itemIndex];
        item.name = name || item.name;
        item.category = category || item.category;
        item.stock = stock !== undefined ? stock : item.stock;
        item.minStock = minStock !== undefined ? minStock : item.minStock;
        item.price = price !== undefined ? price : item.price;
        item.unit = unit || item.unit;
        item.lastUpdated = new Date().toISOString();

        await fs.writeFile(INVENTORY_FILE, JSON.stringify(inventoryData, null, 2));

        res.json({
            message: 'Inventory item updated successfully',
            item: item
        });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ message: 'Error updating inventory item' });
    }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
    try {
        await initializeInventory();
        const itemId = parseInt(req.params.id);

        const data = await fs.readFile(INVENTORY_FILE, 'utf8');
        const inventoryData = JSON.parse(data);
        const itemIndex = inventoryData.inventory.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        const deletedItem = inventoryData.inventory.splice(itemIndex, 1)[0];
        await fs.writeFile(INVENTORY_FILE, JSON.stringify(inventoryData, null, 2));

        res.json({
            message: 'Inventory item deleted successfully',
            item: deletedItem
        });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ message: 'Error deleting inventory item' });
    }
});

module.exports = router;