-- Database creation schema for RentEase (PostgreSQL)

-- Note: The database 'rentease' can be created manually or if run with a superuser:
-- CREATE DATABASE rentease;
-- \c rentease;

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NULL,
  google_id VARCHAR(100) NULL,
  phone VARCHAR(15) NULL,
  profile_picture VARCHAR(300) NULL,
  is_new_user BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences Table
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(50) DEFAULT 'both' CHECK (purpose IN ('buy','rent','both')),
  spaces JSONB NULL,
  budget_min INT DEFAULT 500,
  budget_max INT DEFAULT 200000,
  style VARCHAR(50) DEFAULT 'Modern'
);

-- Addresses Table
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) DEFAULT 'Home',
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  flat VARCHAR(100) NOT NULL,
  street VARCHAR(150) NOT NULL,
  area VARCHAR(100) NOT NULL,
  city VARCHAR(80) NOT NULL,
  state VARCHAR(80) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  landmark VARCHAR(100) NULL,
  is_default BOOLEAN DEFAULT FALSE
);

-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  material VARCHAR(80) NOT NULL,
  dimensions VARCHAR(100) NOT NULL,
  weight VARCHAR(30) NOT NULL,
  warranty VARCHAR(50) NOT NULL,
  buy_price DECIMAL(10,2) NOT NULL,
  rent_price_week DECIMAL(10,2) NOT NULL,
  rent_price_month DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 4.0,
  review_count INT DEFAULT 0,
  stock_quantity INT DEFAULT 50,
  is_available BOOLEAN DEFAULT TRUE,
  condition_type VARCHAR(50) DEFAULT 'new' CHECK (condition_type IN ('new','like_new','refurbished')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create GIN index for full-text search across multiple columns
CREATE INDEX idx_products_fts ON products USING gin(to_tsvector('english', name || ' ' || brand || ' ' || category || ' ' || description));

-- Product Variants Table
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  colour_name VARCHAR(50) NOT NULL,
  colour_hex VARCHAR(7) NOT NULL,
  images JSONB NOT NULL, -- JSONB array of 4 image URLs
  stock INT DEFAULT 20
);

-- Cart Table
CREATE TABLE cart (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  mode VARCHAR(50) DEFAULT 'buy' CHECK (mode IN ('buy','rent')),
  rental_duration VARCHAR(30) NULL
);

-- Wishlist Table
CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  wishlist_alerts BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);

-- Orders Table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id INT NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(100) NULL,
  razorpay_payment_id VARCHAR(100) NULL,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed')),
  order_status VARCHAR(50) DEFAULT 'ordered' CHECK (order_status IN ('ordered','shipped','delivered','returned')),
  subtotal DECIMAL(10,2) NOT NULL,
  gst DECIMAL(10,2) NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('buy','rent')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  rental_duration VARCHAR(30) NULL,
  rental_start_date DATE NULL,
  rental_end_date DATE NULL
);

-- Reviews Table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promo Codes Table
CREATE TABLE promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percent','flat')),
  discount_value DECIMAL(10,2) NOT NULL,
  expiry_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
