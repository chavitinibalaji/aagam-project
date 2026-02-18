const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const db = require('../models');
const { User } = db;

// GET /api/profile - Get user profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'phone', 'avatar', 'addresses', 'location'],
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/profile - Update profile
router.put('/', protect, async (req, res) => {
  const { name, phone, avatar, addresses, location } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      avatar: avatar || user.avatar,
      addresses: addresses || user.addresses,
      location: location || user.location,
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      addresses: user.addresses,
      location: user.location,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
