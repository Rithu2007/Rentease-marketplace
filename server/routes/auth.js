const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');

// Temporary in-memory store for OTPs (Key: email, Value: { otp, expires })
const otpStore = new Map();

// Helper to generate JWT token and set httpOnly cookie
const sendSessionCookie = (res, user) => {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, is_new_user: user.is_new_user },
    process.env.JWT_SECRET,
    { expiresIn: '12h' } // Short-lived token for session security
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    // No maxAge: this makes it a Session Cookie that clears when the browser is closed
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    // Check if user already exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const insertRes = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, is_new_user) 
       VALUES ($1, $2, $3, $4, TRUE) RETURNING id, name, email, phone, is_new_user`,
      [name, email, passwordHash, phone || null]
    );
    const user = insertRes.rows[0];

    // Create session cookie
    sendSessionCookie(res, user);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      user
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Log in with email & password
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];

    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Create session cookie
    sendSessionCookie(res, user);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile_picture: user.profile_picture,
        is_new_user: user.is_new_user
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Trigger forgot password - Send OTP via Nodemailer
router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'No user account found with this email.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins expiry
    otpStore.set(email, { otp, expires });

    console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);

    // Attempt to send email
    if (process.env.SMTP_USER && process.env.SMTP_USER !== 'youremail@gmail.com') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"RentEase Support" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'RentEase Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0A0A0F; color: #E5E5E5; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.06);">
            <h2 style="color: #D4A853; text-align: center;">RentEase Password Reset</h2>
            <p>You requested a password reset. Please use the following One-Time Password (OTP) to reset your password. This OTP is valid for 15 minutes.</p>
            <div style="background-color: #111118; border: 1px dashed #D4A853; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; color: #00D4AA; letter-spacing: 5px;">
              ${otp}
            </div>
            <p style="font-size: 11px; color: #88888F; text-align: center; margin-top: 20px;">If you did not request this, you can safely ignore this email.</p>
          </div>
        `
      });
    }

    res.json({
      success: true,
      message: 'Password reset OTP has been generated.',
      // In development mode, return the OTP so developers can inspect it
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/reset-password
// @desc    Verify OTP and reset password
router.post('/reset-password', async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
  }

  try {
    const record = otpStore.get(email);
    if (!record) {
      return res.status(400).json({ message: 'No OTP requested for this email.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    // Reset password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
    
    // Clear OTP
    otpStore.delete(email);

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current session user profile
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const userRes = await db.query(
      'SELECT id, name, email, phone, profile_picture, is_new_user, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profile_picture: user.profile_picture,
      is_new_user: user.is_new_user
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/logout
// @desc    Clear JWT session cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  });
  res.json({ success: true });
});

/* --- Google OAuth Routes --- */

// Initiates Google auth (Real Flow)
router.get('/google', (req, res, next) => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  } else {
    res.status(501).json({ message: 'Google OAuth is not configured on this server.' });
  }
});

// Callback from Google (Real Flow)
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`http://localhost:5173/login?error=oauth_failed`);
    }
    
    sendSessionCookie(res, user);
    
    // After callback succeeds -> redirect to: http://localhost:5173/auth/callback
    res.redirect(`http://localhost:5173/auth/callback`);
  })(req, res, next);
});

// @route   POST /api/auth/mock-google
// @desc    Mock Google OAuth Sign in / registration
router.post('/mock-google', async (req, res, next) => {
  const { name, email, profilePicture } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: 'Name and Email are required for mock Google login.' });
  }

  try {
    const mockGoogleId = `mock_g_${email.replace(/[@.]/g, '_')}`;
    
    // Check if user exists
    let userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = userRes.rows[0];

    if (!user) {
      // Create a new Google OAuth user
      const insertRes = await db.query(
        `INSERT INTO users (name, email, google_id, profile_picture, is_new_user) 
         VALUES ($1, $2, $3, $4, TRUE) RETURNING *`,
        [name, email, mockGoogleId, profilePicture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`]
      );
      user = insertRes.rows[0];
    } else if (!user.google_id) {
      // Link mock Google ID to existing account
      const updateRes = await db.query(
        `UPDATE users SET google_id = $1, profile_picture = COALESCE(profile_picture, $2) 
         WHERE id = $3 RETURNING *`,
        [mockGoogleId, profilePicture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`, user.id]
      );
      user = updateRes.rows[0];
    }

    sendSessionCookie(res, user);

    res.json({
      success: true,
      message: 'Mock Google login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile_picture: user.profile_picture,
        is_new_user: user.is_new_user
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
