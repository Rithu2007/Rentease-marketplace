# RentEase - Luxurious Furniture & Appliance Rentals

RentEase is a production-grade, dark-luxury Furniture and Appliance Rental + Purchase web application tailored for the Indian market. It features a React 18 + TypeScript + Vite frontend powered by GSAP, Framer Motion, and Three.js for stunning 3D animations, and a Node.js + Express backend running over a PostgreSQL database.

---

## Technical Stack Overview

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (luxury dark palette: `#0A0A0F` background, `#D4A853` gold accent, `#00D4AA` teal accent)
- **3D Graphics & Animations**: Three.js + GSAP + Framer Motion (floating hero models, starfield particle system, and 360-degree color-lerping product inspector)
- **Navigation & Data Fetching**: React Router v6, Axios, and React Query

### Backend
- **Framework**: Node.js + Express.js
- **Database**: PostgreSQL (using `pg` pool with support for `DATABASE_URL` strings)
- **Security & Session**: JWT session tokens stored in secure `httpOnly` cookies, bcryptjs password hashing, Passport.js Google OAuth 2.0
- **Service Integrations**: Razorpay Node SDK (payment order generation and signature verification), Nodemailer (HTML invoices)

---

## Getting Started & Local Installation

### Prerequisites
1. **Node.js**: Install Node.js (v18.x or higher) from [nodejs.org](https://nodejs.org/).
2. **PostgreSQL**: Install PostgreSQL (v12.x or higher) from [postgresql.org](https://www.postgresql.org/).

---

### Step 1: Database Setup

1. Open your terminal or `psql` shell as a superuser.
2. Create the `rentease` database:
   ```sql
   CREATE DATABASE rentease;
   ```
3. Run the schema script to create all 11 required tables, keys, and GIN indexes:
   ```bash
   psql -U postgres -d rentease -f server/db/schema.sql
   ```
4. Load the seed dataset of exactly 100 products (12 categories) with color variants and Unsplash images:
   ```bash
   psql -U postgres -d rentease -f server/db/seed.sql
   ```

---

### Step 2: Environment Configuration

Create a `.env` file in the root workspace folder (`rentease/.env`) using the following template:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/rentease
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=rentease

# Google OAuth (Leave empty to enable mock simulation bypass)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# JWT Config
JWT_SECRET=rentease_super_secret_jwt_key_2026_luxury_dark_theme
JWT_EXPIRES_IN=7d

# Razorpay Keys (Leave empty to enable mock gateway simulation bypass)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Email SMTP (Leave empty to save invoices in server/scratch/ instead of crashing)
SMTP_USER=youremail@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="RentEase Support" <youremail@gmail.com>

# App Configs
CLIENT_URL=http://localhost:5173
SERVER_PORT=5000
NODE_ENV=development
```

---

### Step 3: Server Dependencies & Execution

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Express server in development mode:
   ```bash
   npm run dev
   ```
   *The server will boot on port `5000` and output the database connection validation check.*

---

### Step 4: Client Dependencies & Execution

1. Open a separate terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client web portal will launch on [http://localhost:5173](http://localhost:5173).*

---

## Key Features & Testing Guide

### 1. Zero-Config Sandbox Mode (Fallbacks)
If you do not configure Google Console or Razorpay credentials in your `.env`:
- **Simulated Google Login**: Clicking "Sign in with Google" displays an interactive overlay. Select or enter any email/name to log in or register instantly.
- **Simulated Payment Gateway**: On checkout, a custom mock Razorpay popup matches the native Razorpay design. Authorizing the payment triggers the backend signature verification, creating the PostgreSQL order, clearing your cart, and generating an invoice.
- **Invoice Console Logging**: Nodemailer HTML invoices are saved under `rentease/scratch/invoice_[order_id].html` for quick local inspection.

### 2. Autocomplete Search Bar
- Expands with glowing borders. Debounced at 250ms.
- Searches via PostgreSQL GIN Index (`tsvector`).
- Highlights matching letters in gold, returning rich thumbnails, prices, and category badges.
- Displays up to 5 recent queries from `localStorage`. Supports full keyboard navigation.

### 3. 360° Interactive Product Viewer
- In the product details page, click the "360° View" tab.
- Mouse dragging rotates the custom-made Three.js models.
- Swapping color swatches interpolates (lerps) the model color over 20 frames.

### 4. Product Comparisons
- Check "Compare" on up to 3 cards.
- Click the floating toolbar's "Compare" button to see a side-by-side spec sheet comparison (prices, ratings, warranties, dimensions).
