const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   GET /api/wishlist
// @desc    Get user's wishlist items
router.get('/', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  try {
    const wishlistRes = await db.query(
      `SELECT w.id, w.product_id, w.wishlist_alerts, w.added_at,
              pv.id as variant_id,
              p.name, p.brand, p.category, p.buy_price, p.rent_price_month, p.rating, p.review_count,
              pv.images->>0 as thumbnail
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN LATERAL (
         SELECT id, images FROM product_variants WHERE product_id = p.id LIMIT 1
       ) pv ON TRUE
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [userId]
    );

    res.json(wishlistRes.rows);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/wishlist
// @desc    Add a product to wishlist
router.post('/', authenticateToken, async (req, res, next) => {
  const { productId } = req.body;
  const userId = req.user.id;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required.' });
  }

  try {
    // Check if already in wishlist
    const checkRes = await db.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (checkRes.rows.length > 0) {
      return res.status(409).json({ message: 'Product is already in your wishlist.' });
    }

    const insertRes = await db.query(
      'INSERT INTO wishlist (user_id, product_id, wishlist_alerts) VALUES ($1, $2, FALSE) RETURNING *',
      [userId, productId]
    );

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist.',
      wishlist: insertRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/wishlist/:id
// @desc    Toggle price drop notifications for a wishlist item
router.put('/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const { wishlistAlerts } = req.body;
  const userId = req.user.id;

  if (wishlistAlerts === undefined) {
    return res.status(400).json({ message: 'wishlistAlerts boolean is required.' });
  }

  try {
    const updateRes = await db.query(
      'UPDATE wishlist SET wishlist_alerts = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [wishlistAlerts, id, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ message: 'Wishlist item not found.' });
    }

    res.json({
      success: true,
      message: wishlistAlerts ? 'Price drop alerts activated.' : 'Price drop alerts deactivated.',
      wishlist: updateRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove a product from wishlist
router.delete('/:productId', authenticateToken, async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const deleteRes = await db.query(
      'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [userId, productId]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ message: 'Product was not in your wishlist.' });
    }

    res.json({ success: true, message: 'Product removed from wishlist.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
