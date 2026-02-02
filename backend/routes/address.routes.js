const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const [address] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.userId]
    );
    res.json({ success: true, count: address.length, data: address });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { tag, full_address, latitude, longitude, is_default = 0 } = req.body;

  if (!tag?.trim() || !full_address?.trim()) {
    return res.status(400).json({ success: false, message: 'Tag and address required' });
  }

  try {
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.userId]);
    }

    const [result] = await pool.query(
      'INSERT INTO addresses (user_id, tag, full_address, latitude, longitude, is_default) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, tag.trim(), full_address.trim(), latitude || null, longitude || null, is_default]
    );

    res.status(201).json({
      success: true,
      message: 'Address added',
      data: { id: result.insertId, tag, full_address, latitude, longitude, is_default }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { tag, full_address, latitude, longitude, is_default } = req.body;

  try {
    const [existing] = await pool.query(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    if (is_default !== undefined && is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.userId]);
    }

    await pool.query(
      'UPDATE addresses SET tag = ?, full_address = ?, latitude = ?, longitude = ?, is_default = ? WHERE id = ? AND user_id = ?',
      [tag?.trim(), full_address?.trim(), latitude, longitude, is_default, req.params.id, req.userId]
    );

    res.json({ success: true, message: 'Address updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
