const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Middleware to protect routes (your existing JWT auth)
const authMiddleware = require('../middleware/auth'); // assuming you have this

// ────────────────────────────────────────────────
// POST /api/payments/create-order
// Creates Razorpay Order (called from frontend checkout)
// Expects: { amount, receipt, currency = "INR", notes? }
// ────────────────────────────────────────────────
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { amount, receipt = `receipt_${Date.now()}`, currency = 'INR', notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // paise
      currency,
      receipt,
      notes: {
        userId: req.userId,
        ...notes,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
});

// ────────────────────────────────────────────────
// POST /api/payments/verify
// Verify payment after successful checkout (webhook or frontend callback)
// Expects: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// ────────────────────────────────────────────────
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Generate signature to verify
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed - Invalid signature' });
    }

    // Payment is valid → update your order status in MySQL
    // Example: await updateOrderStatus(razorpay_order_id, 'Paid', razorpay_payment_id);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
});

module.exports = router;
