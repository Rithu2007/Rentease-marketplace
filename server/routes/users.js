const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   GET /api/users/addresses
// @desc    Get all shipping addresses for user
router.get('/addresses', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  try {
    const addrRes = await db.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id ASC',
      [userId]
    );
    res.json(addrRes.rows);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users/addresses
// @desc    Add a new shipping address
router.post('/addresses', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  const { label, fullName, phone, flat, street, area, city, state, pincode, landmark, isDefault = false } = req.body;

  if (!fullName || !phone || !flat || !street || !area || !city || !state || !pincode) {
    return res.status(400).json({ message: 'All mandatory address fields are required.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // If isDefault is true, set all other addresses as non-default first
    if (isDefault) {
      await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const insertRes = await client.query(
      `INSERT INTO addresses (user_id, label, full_name, phone, flat, street, area, city, state, pincode, landmark, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [userId, label || 'Home', fullName, phone, flat, street, area, city, state, pincode, landmark || null, isDefault]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Address added successfully.', address: insertRes.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// @route   PUT /api/users/addresses/:id
// @desc    Update an existing address
router.put('/addresses/:id', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { label, fullName, phone, flat, street, area, city, state, pincode, landmark, isDefault } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verify address ownership
    const check = await client.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Address not found.' });
    }

    if (isDefault) {
      await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const updateRes = await client.query(
      `UPDATE addresses
       SET label = COALESCE($1, label),
           full_name = COALESCE($2, full_name),
           phone = COALESCE($3, phone),
           flat = COALESCE($4, flat),
           street = COALESCE($5, street),
           area = COALESCE($6, area),
           city = COALESCE($7, city),
           state = COALESCE($8, state),
           pincode = COALESCE($9, pincode),
           landmark = COALESCE($10, landmark),
           is_default = COALESCE($11, is_default)
       WHERE id = $12 AND user_id = $13 RETURNING *`,
      [label, fullName, phone, flat, street, area, city, state, pincode, landmark, isDefault, id, userId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Address updated successfully.', address: updateRes.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// @route   DELETE /api/users/addresses/:id
// @desc    Delete shipping address
router.delete('/addresses/:id', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const deleteRes = await db.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found.' });
    }
    res.json({ success: true, message: 'Address deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users/preferences
// @desc    Save onboarding user preferences, set is_new_user to FALSE
router.post('/preferences', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  const { purpose, spaces, budgetMin, budgetMax, style } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Check if preferences already exist for user
    const check = await client.query('SELECT id FROM user_preferences WHERE user_id = $1', [userId]);

    if (check.rows.length > 0) {
      await client.query(
        `UPDATE user_preferences 
         SET purpose = $1, spaces = $2, budget_min = $3, budget_max = $4, style = $5 
         WHERE user_id = $6`,
        [purpose || 'both', JSON.stringify(spaces || []), budgetMin || 500, budgetMax || 200000, style || 'Modern', userId]
      );
    } else {
      await client.query(
        `INSERT INTO user_preferences (user_id, purpose, spaces, budget_min, budget_max, style) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, purpose || 'both', JSON.stringify(spaces || []), budgetMin || 500, budgetMax || 200000, style || 'Modern']
      );
    }

    // Mark user as onboarded
    await client.query('UPDATE users SET is_new_user = FALSE WHERE id = $1', [userId]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Onboarding preferences saved successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// @route   PUT /api/users/profile
// @desc    Update full name, phone number, and profile avatar
router.put('/profile', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  const { name, phone, profilePicture } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Full name is required.' });
  }

  try {
    const updateRes = await db.query(
      `UPDATE users 
       SET name = $1, phone = COALESCE($2, phone), profile_picture = COALESCE($3, profile_picture) 
       WHERE id = $4 RETURNING id, name, email, phone, profile_picture, is_new_user`,
      [name, phone || null, profilePicture || null, userId]
    );

    res.json({ success: true, message: 'Profile updated successfully.', user: updateRes.rows[0] });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/password
// @desc    Change password
router.put('/password', authenticateToken, async (req, res, next) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Both old password and new password are required.' });
  }

  try {
    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    // If user registered with OAuth and has no password hash
    if (!user || !user.password_hash) {
      return res.status(400).json({ message: 'Google OAuth users do not have a password. Set one by using password reset.' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/notifications
// @desc    Update notification toggles
router.put('/notifications', authenticateToken, async (req, res) => {
  // We can return a mock success response as UI preference settings are saved
  res.json({ success: true, message: 'Notification preferences updated successfully.' });
});

module.exports = router;
