const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
require('dotenv').config();

router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword]
    );

    const token = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: { id: result.insertId, name, email, phone }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const router = express.Router();

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'aagam_jwt_secret_key';

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user already exists
        const usersData = db.getUsers();
        const existingUser = usersData.users.find(user => user.email === email);

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            phone
        });

        // Validate user data
        const validation = user.validate();
        if (!validation.isValid) {
            return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
        }

        // Hash password
        await user.hashPassword();

        // Save user
        usersData.users.push(user.toJSON());
        db.saveUsers(usersData);

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: user.getProfile(),
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const usersData = db.getUsers();
        const userData = usersData.users.find(user => user.email === email);

        if (!userData) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create user instance and verify password
        const user = new User(userData);
        const isValidPassword = await user.verifyPassword(password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive()) {
            return res.status(403).json({ message: 'Account is suspended' });
        }

        // Update last login
        user.updateLastLogin();
        // Save updated user data
        const userIndex = usersData.users.findIndex(u => u.id === user.id);
        usersData.users[userIndex] = user.toJSON();
        db.saveUsers(usersData);

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            user: user.getProfile(),
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
    try {
        const usersData = db.getUsers();
        const userData = usersData.users.find(user => user.id === req.user.userId);

        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = new User(userData);
        res.json(user.getProfile());
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        const usersData = db.getUsers();
        const userIndex = usersData.users.findIndex(u => u.id === req.user.userId);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = new User(usersData.users[userIndex]);

        // Update fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        // Validate
        const validation = user.validate();
        if (!validation.isValid) {
            return res.status(400).json({ message: 'Validation failed', errors: validation.errors });
        }

        // Save
        usersData.users[userIndex] = user.toJSON();
        db.saveUsers(usersData);

        res.json({
            message: 'Profile updated successfully',
            user: user.getProfile()
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const usersData = db.getUsers();
        const userIndex = usersData.users.findIndex(u => u.id === req.user.userId);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = new User(usersData.users[userIndex]);

        // Verify current password
        const isValid = await user.verifyPassword(currentPassword);
        if (!isValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Set new password
        user.password = newPassword;
        await user.hashPassword();

        // Save
        usersData.users[userIndex] = user.toJSON();
        db.saveUsers(usersData);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
