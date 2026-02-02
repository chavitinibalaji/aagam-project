const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

router.get('/', async (req, res) => {
  const { category = 'all', search } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR weight LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  try {
    const [products] = await pool.query(query, params);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
