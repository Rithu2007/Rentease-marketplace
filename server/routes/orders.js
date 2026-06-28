const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/authMiddleware');
const { sendInvoiceEmail } = require('../services/emailService');

// Helper to calculate rental end date based on duration
const getRentalEndDate = (startDateStr, durationStr) => {
  const startDate = new Date(startDateStr);
  let monthsToAdd = 3; // Default fallback
  
  if (durationStr) {
    const match = durationStr.match(/^(\d+)/);
    if (match) {
      monthsToAdd = parseInt(match[1]);
    }
  }
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + monthsToAdd);
  return endDate;
};

// @route   POST /api/orders/create
// @desc    Place a new order, clear cart, deduct stock, and send email invoice
router.post('/create', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  const {
    addressId,
    razorpayOrderId,
    razorpayPaymentId,
    subtotal,
    gst,
    deliveryCharge,
    total,
    mode, // 'buy' or 'rent'
    deliveryDate = new Date() // Selected starting date for rentals
  } = req.body;

  if (!addressId || !mode || !total) {
    return res.status(400).json({ message: 'Address ID, Order Mode, and Total are required.' });
  }

  const client = await db.pool.connect();

  try {
    // Start Transaction
    await client.query('BEGIN');

    // 1. Fetch current cart items to prevent client-side manipulation of prices/products
    const cartRes = await client.query(
      `SELECT c.product_id, c.variant_id, c.quantity, c.mode as cart_mode, c.rental_duration,
              p.buy_price, p.rent_price_month, p.name as product_name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );

    if (cartRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // 2. Validate address exists
    const addrRes = await client.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
    if (addrRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Shipping address not found.' });
    }
    const address = addrRes.rows[0];

    // 3. Create order record
    // Default payment_status to 'paid' if Razorpay payment details are provided
    const paymentStatus = razorpayPaymentId ? 'paid' : 'pending';
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, address_id, razorpay_order_id, razorpay_payment_id, payment_status, order_status, subtotal, gst, delivery_charge, total, mode)
       VALUES ($1, $2, $3, $4, $5, 'ordered', $6, $7, $8, $9, $10) RETURNING *`,
      [userId, addressId, razorpayOrderId || null, razorpayPaymentId || null, paymentStatus, subtotal, gst, deliveryCharge, total, mode]
    );
    const order = orderRes.rows[0];

    // 4. Create order items, update stocks
    const orderItemsToInsert = [];
    for (const item of cartRes.rows) {
      const unitPrice = item.cart_mode === 'rent' ? item.rent_price_month : item.buy_price;
      
      // Calculate start and end date for rentals
      let rStart = null;
      let rEnd = null;
      if (item.cart_mode === 'rent') {
        rStart = new Date(deliveryDate);
        rEnd = getRentalEndDate(rStart, item.rental_duration);
      }

      // Check product variant stock availability
      const stockRes = await client.query(
        'SELECT stock, colour_name FROM product_variants WHERE id = $1 FOR UPDATE',
        [item.variant_id]
      );
      if (stockRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: `Variant details not found for product: ${item.product_name}` });
      }

      const variantStock = stockRes.rows[0].stock;
      if (variantStock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Insufficient stock for product variant: ${item.product_name} (${stockRes.rows[0].colour_name}). Available: ${variantStock}`
        });
      }

      // Decrement variant stock
      await client.query(
        'UPDATE product_variants SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.variant_id]
      );

      // Decrement overall product stock
      await client.query(
        'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2',
        [item.quantity, item.product_id]
      );

      // Save order items insertion
      const itemInsertRes = await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, rental_duration, rental_start_date, rental_end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [order.id, item.product_id, item.variant_id, item.quantity, unitPrice, item.rental_duration, rStart, rEnd]
      );
      
      // Keep track for email
      orderItemsToInsert.push({
        ...itemInsertRes.rows[0],
        name: item.product_name,
        colour_name: stockRes.rows[0].colour_name
      });
    }

    // 5. Clear cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    // Commit Transaction
    await client.query('COMMIT');

    // 6. Send Invoice Email (fire and forget / async)
    const userRes = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
    const userEmail = userRes.rows[0].email;
    sendInvoiceEmail(userEmail, order, orderItemsToInsert, address).catch(err => {
      console.error('Invoice emailing background failure:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      orderId: order.id,
      order
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// @route   GET /api/orders
// @desc    Get order history list for the user
router.get('/', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  try {
    const ordersRes = await db.query(
      `SELECT o.id, o.created_at, o.total, o.order_status, o.payment_status, o.mode,
              COUNT(oi.id) as items_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json(ordersRes.rows);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/rentals
// @desc    Get active rentals tracker lists (remaining days, photos, etc.)
router.get('/rentals', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  try {
    const rentalsRes = await db.query(
      `SELECT oi.id, oi.rental_duration, oi.rental_start_date, oi.rental_end_date, oi.quantity,
              p.id as product_id, p.name, p.brand, p.category, pv.colour_name, pv.images->>0 as thumbnail,
              (oi.rental_end_date - CURRENT_DATE) as days_remaining
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE o.user_id = $1 AND o.mode = 'rent' AND o.payment_status = 'paid'
       ORDER BY oi.rental_start_date DESC`,
      [userId]
    );

    res.json(rentalsRes.rows);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/:id
// @desc    Get full order details (billing, item lines)
router.get('/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const orderRes = await db.query(
      `SELECT o.*, 
              a.full_name as shipping_name, a.phone as shipping_phone, a.flat, a.street, a.area, a.city, a.state, a.pincode, a.landmark
       FROM orders o
       JOIN addresses a ON o.address_id = a.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, userId]
    );

    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Fetch order line items
    const itemsRes = await db.query(
      `SELECT oi.id, oi.quantity, oi.unit_price, oi.rental_duration, oi.rental_start_date, oi.rental_end_date,
              p.name, p.brand, pv.colour_name, pv.images->>0 as thumbnail
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      success: true,
      order,
      items: itemsRes.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
