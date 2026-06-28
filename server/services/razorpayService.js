const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('WARNING: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not defined in .env. Real Razorpay is disabled; mock payments will be used.');
}

const createRazorpayOrder = async (amount, currency = 'INR') => {
  // Amount in Razorpay is in paisa (1 INR = 100 paisa)
  const amountInPaisa = Math.round(amount * 100);

  if (!razorpay) {
    const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    console.log(`[RAZORPAY MOCK] Generated mock order: ${mockOrderId} for amount: ₹${amount}`);
    return {
      id: mockOrderId,
      entity: 'order',
      amount: amountInPaisa,
      amount_paid: 0,
      amount_due: amountInPaisa,
      currency: currency,
      receipt: `rcpt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes: [],
      created_at: Math.floor(Date.now() / 1000),
      isMock: true,
      key_id: 'mock_key_id_rentease_1234'
    };
  }

  try {
    const options = {
      amount: amountInPaisa,
      currency,
      receipt: `rcpt_${Date.now()}`,
    };
    
    const order = await razorpay.orders.create(options);
    return {
      ...order,
      key_id: process.env.RAZORPAY_KEY_ID,
      isMock: false
    };
  } catch (error) {
    console.error('Razorpay Create Order Failure:', error);
    throw error;
  }
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!razorpay) {
    console.log(`[RAZORPAY MOCK] Verifying mock signature for Order: ${orderId}, Payment: ${paymentId}`);
    // A mock signature starts with mock_sig_ or accepts simple test tokens
    return signature.startsWith('mock_sig_') || signature === 'mock_bypass_payment_success';
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
      
    return generatedSignature === signature;
  } catch (error) {
    console.error('Razorpay HMAC signature generation failed:', error);
    return false;
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  isMockEnabled: () => !razorpay
};
