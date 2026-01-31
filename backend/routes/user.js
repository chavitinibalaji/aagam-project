const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const ADDR_FILE = path.join(__dirname, '../../data/addresses.json');

async function ensureFile() {
    try {
        await fs.access(ADDR_FILE);
    } catch (err) {
        await fs.writeFile(ADDR_FILE, JSON.stringify({ users: {} }, null, 2));
    }
}

async function readData() {
    await ensureFile();
    const raw = await fs.readFile(ADDR_FILE, 'utf8');
    return JSON.parse(raw);
}

async function writeData(data) {
    await fs.writeFile(ADDR_FILE, JSON.stringify(data, null, 2));
}

// Get addresses for authenticated user
router.get('/addresses', authenticate, async (req, res) => {
    try {
        const userId = String(req.user.userId);
        const data = await readData();
        const addresses = data.users[userId] || [];
        res.json(addresses);
    } catch (error) {
        console.error('Error reading addresses:', error);
        res.status(500).json({ message: 'Error fetching addresses' });
    }
});

// Add new address
router.post('/addresses', authenticate, async (req, res) => {
    try {
        const userId = String(req.user.userId);
        const addr = req.body;
        addr.id = addr.id || Date.now();
        addr.createdAt = addr.createdAt || new Date().toISOString();

        const data = await readData();
        if (!data.users[userId]) data.users[userId] = [];

        // If isDefault, unset others
        if (addr.isDefault) {
            data.users[userId].forEach(a => a.isDefault = false);
        }

        data.users[userId].push(addr);
        await writeData(data);
        res.status(201).json(addr);
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ message: 'Error saving address' });
    }
});

// Update address
router.put('/addresses/:id', authenticate, async (req, res) => {
    try {
        const userId = String(req.user.userId);
        const id = Number(req.params.id);
        const data = await readData();
        const list = data.users[userId] || [];
        const idx = list.findIndex(a => Number(a.id) === id);
        if (idx === -1) return res.status(404).json({ message: 'Address not found' });

        const updated = { ...list[idx], ...req.body };

        // If isDefault set, unset others
        if (updated.isDefault) {
            list.forEach(a => a.isDefault = false);
        }

        list[idx] = updated;
        data.users[userId] = list;
        await writeData(data);
        res.json(updated);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ message: 'Error updating address' });
    }
});

// Set default address
router.put('/addresses/:id/default', authenticate, async (req, res) => {
    try {
        const userId = String(req.user.userId);
        const id = Number(req.params.id);
        const data = await readData();
        const list = data.users[userId] || [];
        const idx = list.findIndex(a => Number(a.id) === id);
        if (idx === -1) return res.status(404).json({ message: 'Address not found' });

        list.forEach(a => a.isDefault = Number(a.id) === id);
        data.users[userId] = list;
        await writeData(data);
        res.json({ message: 'Default address set', address: list[idx] });
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({ message: 'Error setting default address' });
    }
});

// Delete address
router.delete('/addresses/:id', authenticate, async (req, res) => {
    try {
        const userId = String(req.user.userId);
        const id = Number(req.params.id);
        const data = await readData();
        const list = data.users[userId] || [];
        const idx = list.findIndex(a => Number(a.id) === id);
        if (idx === -1) return res.status(404).json({ message: 'Address not found' });

        const removed = list.splice(idx, 1)[0];
        data.users[userId] = list;
        await writeData(data);
        res.json({ message: 'Address deleted', address: removed });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Error deleting address' });
    }
});

module.exports = router;
