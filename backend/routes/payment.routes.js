const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Your JWT middleware
const authMiddleware = require('../middleware/auth');

// ────────────────────────────────────────────────
// POST /api/payments/create-order
// ────────────────────────────────────────────────
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { amount, receipt = `receipt_${Date.now()}`, currency = 'INR', notes = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // in paise
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
      amount: order.amount / 100, // return in rupees for frontend
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay order',
      error: error.message,
    });
  }
});

// ────────────────────────────────────────────────
// POST /api/payments/verify
// Frontend calls this after successful checkout
// ────────────────────────────────────────────────
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

    // TODO: Update your MySQL order status here
    // Example:
    // await pool.query(
    //   'UPDATE orders SET payment_status = "Paid", razorpay_payment_id = ?, updated_at = NOW() WHERE razorpay_order_id = ? AND user_id = ?',
    //   [razorpay_payment_id, razorpay_order_id, req.userId]
    // );

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// ────────────────────────────────────────────────
// POST /api/payments/webhook
// Razorpay webhook – IMPORTANT: must use raw body
// ────────────────────────────────────────────────
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // ← very important!
  async (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) {
        console.error('Razorpay webhook secret not set!');
        return res.status(500).send('Server misconfigured');
      }

      const signature = req.headers['x-razorpay-signature'];
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(req.body);
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        console.warn('Invalid webhook signature');
        return res.status(400).send('Invalid signature');
      }

      let event;
      try {
        event = JSON.parse(req.body.toString());
      } catch (parseErr) {
        console.error('Invalid JSON in webhook:', parseErr);
        return res.status(400).send('Invalid payload');
      }

      // Respond immediately to Razorpay (they retry if not 200)
      res.status(200).send('Webhook received');

      // Process event asynchronously (don't block response)
      (async () => {
        try {
          if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const orderId = payment.order_id;
            const paymentId = payment.id;

            console.log(`Payment captured: ${paymentId} for order ${orderId}`);

            // TODO: Update database
            // await pool.query(
            //   'UPDATE orders SET payment_status = "Paid", razorpay_payment_id = ?, updated_at = NOW() WHERE razorpay_order_id = ?',
            //   [paymentId, orderId]
            // );

            // Optional: send email, update inventory, etc.
          }

          // Handle other events if needed (payment.failed, order.paid, etc.)
        } catch (processErr) {
          console.error('Webhook processing error:', processErr);
          // You can log to Sentry / external service here
        }
      })();
    } catch (err) {
      console.error('Webhook route error:', err);
      res.status(500).send('Internal error');
    }
  }
);

module.exports = router;
