const express = require('express');
const router = express.Router();
const razorpayService = require('../services/razorpayService');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   POST /api/payment/create-order
// @desc    Create a new Razorpay order (or mock order if keys are missing)
router.post('/create-order', authenticateToken, async (req, res, next) => {
  const { amount, currency = 'INR' } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Order amount is required.' });
  }

  try {
    const order = await razorpayService.createRazorpayOrder(parseFloat(amount), currency);
    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: order.key_id,
      isMock: order.isMock
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/payment/verify
// @desc    Verify Razorpay payment signature
router.post('/verify', authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Missing verification parameters: order_id, payment_id, and signature are required.'
    });
  }

  const isValid = razorpayService.verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (isValid) {
    res.json({
      success: true,
      message: 'Payment verification successful.'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Payment verification failed. Invalid signature.'
    });
  }
});

module.exports = router;
