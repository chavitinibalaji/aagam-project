const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const db = require('../models');
const { User } = db;

// GET /api/address - Get all saved addresses for the user
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['addresses'] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ addresses: user.addresses || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/address - Add a new address
router.post('/', protect, async (req, res) => {
  const { type, address, name, phone } = req.body;

  if (!address || !name || !phone) {
    return res.status(400).json({ message: 'Address, name, and phone are required' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const currentAddresses = user.addresses || [];
    currentAddresses.push({ type: type || 'Other', address, name, phone });

    await user.update({ addresses: currentAddresses });

    res.status(201).json({
      message: 'Address added',
      addresses: currentAddresses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/address/:index - Update an existing address by index
router.put('/:index', protect, async (req, res) => {
  const { index } = req.params;
  const { type, address, name, phone } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addresses = user.addresses || [];
    if (index < 0 || index >= addresses.length) {
      return res.status(404).json({ message: 'Address not found' });
    }

    addresses[index] = {
      ...addresses[index],
      type: type || addresses[index].type,
      address: address || addresses[index].address,
      name: name || addresses[index].name,
      phone: phone || addresses[index].phone,
    };

    await user.update({ addresses });

    res.json({ message: 'Address updated', addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/address/:index - Delete address by index
router.delete('/:index', protect, async (req, res) => {
  const { index } = req.params;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const addresses = user.addresses || [];
    if (index < 0 || index >= addresses.length) {
      return res.status(404).json({ message: 'Address not found' });
    }

    addresses.splice(index, 1);
    await user.update({ addresses });

    res.json({ message: 'Address deleted', addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
