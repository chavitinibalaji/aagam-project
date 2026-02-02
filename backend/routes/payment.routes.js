const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { amount, receipt = `receipt_${Date.now()}`, currency = 'INR', notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes: { userId: req.userId, ...notes }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Verify Payment (called from frontend after success)
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Update order in database
    const [result] = await pool.query(
      `UPDATE orders 
       SET payment_status = 'Paid',
           razorpay_payment_id = ?,
           paid_at = NOW(),
           status = 'Confirmed'
       WHERE razorpay_order_id = ? 
         AND user_id = ? 
         AND payment_status = 'Pending'`,
      [razorpay_payment_id, razorpay_order_id, req.userId]
    );

    if (result.affectedRows === 0) {
      return res.json({ success: true, message: 'Order already processed or not found' });
    }

    res.json({
      success: true,
      message: 'Payment verified and order confirmed',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Webhook (Razorpay server-to-server)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET);
    shasum.update(req.body);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      return res.status(400).send('Invalid signature');
    }

    let event;
    try {
      event = JSON.parse(req.body.toString());
    } catch (e) {
      return res.status(400).send('Invalid JSON');
    }

    res.status(200).send('Webhook received');

    // Process async
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      await pool.query(
        `UPDATE orders 
         SET payment_status = 'Paid',
             razorpay_payment_id = ?,
             paid_at = NOW(),
             status = 'Confirmed'
         WHERE razorpay_order_id = ? 
           AND payment_status != 'Paid'`,
        [paymentId, orderId]
      );

      console.log(`Webhook: Payment captured - Order ${orderId}, Payment ${paymentId}`);
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

module.exports = router;
