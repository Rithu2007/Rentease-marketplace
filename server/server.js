// Programmatically verify and install express-session if not present
try {
  require('express-session');
} catch (e) {
  console.log('express-session is missing. Installing it programmatically...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install express-session', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('Failed to install express-session via npm install. Proceeding anyway.', err.message);
  }
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const db = require('./db/connection');
const errorHandler = require('./middleware/errorHandler');
const { updateAllImages } = require('./db/update_images');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Passport Strategies
require('./services/passport');

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// Enable Gzip compression
app.use(compression());

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session middleware (express-session) is initialized BEFORE passport.initialize() and passport.session()
app.use(session({
  secret: process.env.JWT_SECRET || 'rentease_session_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // development
    sameSite: 'lax'
  }
}));

// Initialize Passport sessions
app.use(passport.initialize());
app.use(passport.session());

// API Routes Mapping
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbTest = await db.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: dbTest.rows[0].now,
      time: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Temporary route to trigger database image updates manually if needed
app.get('/api/admin/update-images', async (req, res, next) => {
  try {
    await updateAllImages();
    const testRes = await db.query('SELECT images FROM product_variants LIMIT 1');
    res.json({ 
      success: true, 
      message: "Database images successfully updated to stable Unsplash URLs!",
      sample: testRes.rows[0]?.images
    });
  } catch (err) {
    next(err);
  }
});

// Serve static assets in production (optional fallback)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

// Global Error Handler Middleware (Must be last)
app.use(errorHandler);

// Test database connection and start listening

const startServer = async () => {
  try {
    const res = await db.query('SELECT NOW()');
    console.log(`Database connected successfully. Server time on DB: ${res.rows[0].now}`);
    
    // Auto-update deprecated Unsplash URLs to stable IDs
    await updateAllImages();
    
    app.listen(PORT, () => {
      console.log(`RentEase Backend Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`Allowed CORS Origin: ${clientUrl}`);
    });
  } catch (error) {
    console.error('CRITICAL: Database connection failed. Express server not started.');
    console.error(error.stack || error.message);
    process.exit(1);
  }
};

startServer();

