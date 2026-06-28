const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   GET /api/products/search
// @desc    Get autocomplete search suggestions (Limit 8)
router.get('/search', async (req, res, next) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.json([]);
  }

  try {
    const queryTerm = q.trim();
    // Search using full-text tsquery OR ILIKE partial matches
    // Joins the first variant to get product images JSON
    const searchRes = await db.query(
      `SELECT p.id, p.name, p.brand, p.category, p.buy_price, p.rent_price_month,
              pv.images->>0 as thumbnail
       FROM products p
       LEFT JOIN LATERAL (
         SELECT images FROM product_variants WHERE product_id = p.id LIMIT 1
       ) pv ON TRUE
       WHERE to_tsvector('english', p.name || ' ' || p.brand || ' ' || p.category || ' ' || p.description) @@ plainto_tsquery('english', $1)
          OR p.name ILIKE $2
          OR p.brand ILIKE $2
          OR p.category ILIKE $2
       LIMIT 8`,
      [queryTerm, `%${queryTerm}%`]
    );

    res.json(searchRes.rows);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/compare
// @desc    Get details for up to 3 products for comparison
router.get('/compare', async (req, res, next) => {
  const { ids } = req.query;
  if (!ids) {
    return res.status(400).json({ message: 'Product IDs are required for comparison.' });
  }

  const idList = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
  if (idList.length === 0) {
    return res.status(400).json({ message: 'Invalid product IDs.' });
  }

  if (idList.length > 3) {
    return res.status(400).json({ message: 'You can compare up to 3 products only.' });
  }

  try {
    // Fetch products and their first variant details
    const productsRes = await db.query(
      `SELECT p.*, pv.id as variant_id, pv.images, pv.colour_name, pv.colour_hex
       FROM products p
       LEFT JOIN LATERAL (
         SELECT id, images, colour_name, colour_hex FROM product_variants WHERE product_id = p.id LIMIT 1
       ) pv ON TRUE
       WHERE p.id = ANY($1)`,
      [idList]
    );

    res.json(productsRes.rows);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products
// @desc    Get products with filters, sorting, and pagination
router.get('/', async (req, res, next) => {
  const {
    category,
    minPrice,
    maxPrice,
    color,
    condition,
    isAvailable,
    sortBy,
    mode = 'buy', // 'buy' or 'rent'
    limit = 20,
    offset = 0
  } = req.query;

  try {
    let queryParams = [];
    let filterClauses = [];

    // Filter by Categories
    if (category) {
      const categoriesList = category.split(',');
      queryParams.push(categoriesList);
      filterClauses.push(`p.category = ANY($${queryParams.length})`);
    }

    // Filter by Price (Depends on Buy or Rent mode)
    if (minPrice) {
      queryParams.push(parseFloat(minPrice));
      const priceCol = mode === 'rent' ? 'p.rent_price_month' : 'p.buy_price';
      filterClauses.push(`${priceCol} >= $${queryParams.length}`);
    }

    if (maxPrice) {
      queryParams.push(parseFloat(maxPrice));
      const priceCol = mode === 'rent' ? 'p.rent_price_month' : 'p.buy_price';
      filterClauses.push(`${priceCol} <= $${queryParams.length}`);
    }

    // Filter by Condition (Rent mode only)
    if (condition && mode === 'rent') {
      const conditionList = condition.split(',');
      queryParams.push(conditionList);
      filterClauses.push(`p.condition_type = ANY($${queryParams.length})`);
    }

    // Filter by Color (Join variants table)
    if (color) {
      const colorsList = color.split(',');
      queryParams.push(colorsList);
      filterClauses.push(`EXISTS (
        SELECT 1 FROM product_variants pv 
        WHERE pv.product_id = p.id AND pv.colour_name = ANY($${queryParams.length})
      )`);
    }

    // Filter by Availability
    if (isAvailable === 'true') {
      filterClauses.push(`p.is_available = TRUE AND p.stock_quantity > 0`);
    }

    let whereClause = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'p.created_at DESC'; // Default newest
    if (sortBy) {
      const priceCol = mode === 'rent' ? 'p.rent_price_month' : 'p.buy_price';
      switch (sortBy) {
        case 'price_low_high':
          orderBy = `${priceCol} ASC`;
          break;
        case 'price_high_low':
          orderBy = `${priceCol} DESC`;
          break;
        case 'newest':
          orderBy = 'p.created_at DESC';
          break;
        case 'popular':
          orderBy = 'p.review_count DESC';
          break;
        case 'rating':
          orderBy = 'p.rating DESC';
          break;
      }
    }

    // Pagination Limit/Offset
    queryParams.push(parseInt(limit));
    const limitPlaceholder = `$${queryParams.length}`;
    queryParams.push(parseInt(offset));
    const offsetPlaceholder = `$${queryParams.length}`;

    // Execute query joining variants to get swatches and dynamic display image
    const productsRes = await db.query(
      `SELECT p.*,
              COALESCE(
                (SELECT json_agg(json_build_object('id', pv.id, 'colour_name', pv.colour_name, 'colour_hex', pv.colour_hex, 'images', pv.images))
                 FROM product_variants pv WHERE pv.product_id = p.id),
                '[]'::json
              ) as variants
       FROM products p
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
      queryParams
    );

    res.json({
      success: true,
      products: productsRes.rows,
      limit: parseInt(limit),
      offset: parseInt(offset),
      count: productsRes.rows.length
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/:id
// @desc    Get detailed product by ID (including all variants, reviews, and recommendations)
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    // Fetch base product
    const productRes = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    const product = productRes.rows[0];

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Fetch variants
    const variantsRes = await db.query(
      'SELECT id, colour_name, colour_hex, images, stock FROM product_variants WHERE product_id = $1',
      [id]
    );

    // Fetch reviews (join user profile name)
    const reviewsRes = await db.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at, u.name as user_name, u.profile_picture as user_avatar
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    // Fetch recommendations ("You may also like" - 6 products in same category excluding current)
    const recommendationsRes = await db.query(
      `SELECT p.id, p.name, p.brand, p.category, p.buy_price, p.rent_price_month, p.rating, p.review_count,
              pv.images->>0 as thumbnail
       FROM products p
       LEFT JOIN LATERAL (
         SELECT images FROM product_variants WHERE product_id = p.id LIMIT 1
       ) pv ON TRUE
       WHERE p.category = $1 AND p.id != $2 AND p.is_available = TRUE
       LIMIT 6`,
      [product.category, id]
    );

    res.json({
      success: true,
      product,
      variants: variantsRes.rows,
      reviews: reviewsRes.rows,
      recommendations: recommendationsRes.rows
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add a star rating + text review for a product (Auth required)
router.post('/:id/reviews', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const { rating, reviewText } = req.body;
  const userId = req.user.id;

  if (!rating || !reviewText || reviewText.trim() === '') {
    return res.status(400).json({ message: 'Star rating and review description are required.' });
  }

  try {
    // Save review
    await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, review_text) VALUES ($1, $2, $3, $4)',
      [userId, id, rating, reviewText]
    );

    // Recalculate average rating and review count
    const statsRes = await db.query(
      'SELECT AVG(rating) as avg_rating, COUNT(id) as total_reviews FROM reviews WHERE product_id = $1',
      [id]
    );
    const { avg_rating, total_reviews } = statsRes.rows[0];

    // Update products table
    await db.query(
      'UPDATE products SET rating = $1, review_count = $2 WHERE id = $3',
      [parseFloat(avg_rating || rating).toFixed(2), total_reviews, id]
    );

    // Retrieve username for immediate front-end render
    const userRes = await db.query('SELECT name, profile_picture FROM users WHERE id = $1', [userId]);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review: {
        rating: parseInt(rating),
        review_text: reviewText,
        created_at: new Date(),
        user_name: userRes.rows[0].name,
        user_avatar: userRes.rows[0].profile_picture
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
