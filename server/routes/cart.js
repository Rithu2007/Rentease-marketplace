const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   GET /api/cart
// @desc    Get all cart items for the authenticated user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Join products and variants to return current prices, images, and brand details
    const cartRes = await db.query(
      `SELECT c.id, c.product_id, c.variant_id, c.quantity, c.mode, c.rental_duration,
              p.name, p.brand, p.category, p.buy_price, p.rent_price_week, p.rent_price_month,
              pv.colour_name, pv.colour_hex, pv.images, p.stock_quantity as max_product_stock, pv.stock as max_variant_stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       JOIN product_variants pv ON c.variant_id = pv.id
       WHERE c.user_id = $1
       ORDER BY c.id ASC`,
      [userId]
    );

    res.json(cartRes.rows);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/cart
// @desc    Add a product to the cart (or increment quantity if exists)
router.post('/', authenticateToken, async (req, res, next) => {
  const { productId, variantId, quantity = 1, mode = 'buy', rentalDuration } = req.body;
  const userId = req.user.id;

  if (!productId || !variantId) {
    return res.status(400).json({ message: 'Product ID and Variant ID are required.' });
  }

  try {
    // Check if item already exists in cart with same mode and variant
    const checkRes = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2 AND variant_id = $3 AND mode = $4',
      [userId, productId, variantId, mode]
    );

    if (checkRes.rows.length > 0) {
      // Increment quantity
      const cartItem = checkRes.rows[0];
      const newQty = cartItem.quantity + parseInt(quantity);
      
      const updateRes = await db.query(
        'UPDATE cart SET quantity = $1, rental_duration = $2 WHERE id = $3 RETURNING *',
        [newQty, mode === 'rent' ? rentalDuration : null, cartItem.id]
      );
      return res.json({ success: true, message: 'Cart item quantity updated.', cart: updateRes.rows[0] });
    }

    // Insert new cart item
    const insertRes = await db.query(
      `INSERT INTO cart (user_id, product_id, variant_id, quantity, mode, rental_duration) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, productId, variantId, parseInt(quantity), mode, mode === 'rent' ? rentalDuration : null]
    );

    res.status(201).json({
      success: true,
      message: 'Product added to cart successfully.',
      cart: insertRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/cart/:id
// @desc    Update quantity or duration of a cart item
router.put('/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const { quantity, rentalDuration } = req.body;
  const userId = req.user.id;

  try {
    // Verify item belongs to user
    const checkRes = await db.query('SELECT id, mode FROM cart WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    const item = checkRes.rows[0];

    // Build update dynamic parameters
    let fields = [];
    let params = [];

    if (quantity !== undefined) {
      params.push(parseInt(quantity));
      fields.push(`quantity = $${params.length}`);
    }

    if (rentalDuration !== undefined && item.mode === 'rent') {
      params.push(rentalDuration);
      fields.push(`rental_duration = $${params.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No parameters provided to update.' });
    }

    params.push(id);
    const updateRes = await db.query(
      `UPDATE cart SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    res.json({ success: true, message: 'Cart updated.', cart: updateRes.rows[0] });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/cart/:id
// @desc    Remove a product from the cart
router.delete('/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const deleteRes = await db.query('DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found.' });
    }

    res.json({ success: true, message: 'Item removed from cart successfully.' });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/cart
// @desc    Clear the user's cart (usually after order placement)
router.delete('/', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  try {
    await db.query('DELETE FROM cart WHERE user_id = $1', [userId]);
    res.json({ success: true, message: 'Cart cleared successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
