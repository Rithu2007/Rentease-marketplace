# RentEase - Luxurious Standalone Furniture & Appliance Rentals

RentEase is a production-grade, dark-luxury Furniture and Appliance Rental + Purchase web application tailored for the Indian market. 

This application has been fully refactored into a **completely standalone frontend-only application** that runs entirely client-side, powered by a local `localStorage` database, and is fully ready to deploy on **Netlify** with zero configuration, external databases, or backend dependencies.

The backend Node/Express/PostgreSQL codebase remains preserved under the `server/` directory solely to demonstrate full-stack architecture for internship reviews and portfolio reviews.

---

## Technical Stack Overview

- **Framework**: React 18 + TypeScript + Vite
- **Data Layer**: Static local catalog ([products.ts](file:///c:/Users/Ritish/OneDrive/Desktop/RentEase/client/src/data/products.ts)) containing 100 premium products, variants, dimensions, and specifications.
- **Client-Side Storage**: Synchronized `localStorage` database for all user profiles, shopping carts, product reviews, wishlists, and order histories.
- **3D Graphics & Animations**: Three.js + GSAP + Framer Motion (floating hero models, starfield particle system, and 360-degree color-lerping product inspector).
- **Navigation & Querying**: React Router v6, local state managers, and React Query (mocked for async transitions and skeletons).
- **Hosting Compatibility**: Direct static build for Netlify/Vercel (pre-configured with SPA route redirects via [public/_redirects](file:///c:/Users/Ritish/OneDrive/Desktop/RentEase/client/public/_redirects)).

---

## Getting Started & Local Installation

### Prerequisites
- **Node.js**: Install Node.js (v18.x or higher) from [nodejs.org](https://nodejs.org/).

### Start the Application (Development Mode)
You do not need to set up databases, seeds, or environment variables. Simply start the Vite development server:

1. In your terminal, run from the root workspace directory:
   ```bash
   npm run dev --prefix client
   ```
   *(Or navigate into the `client/` folder and run `npm run dev`)*
2. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Standalone Frontend Architecture

All business logic, database queries, and session management are handled directly in the browser:

### 1. Local Authentication & OTP
- User credentials, profile pictures, and onboarding details are stored under `rentease_users` and `rentease_current_user`.
- Forgot password requests generate simulated verification OTPs in the user notification container.

### 2. Shopping Cart & Wishlist Contexts
- Shopping cart items and purchase/rental modes are synced in `localStorage` under `rentease_cart_${userId}`.
- Wishlist items and custom price drop alerts are synced in `localStorage` under `rentease_wishlist_${userId}`.

### 3. Catalog Filtering & Search Autocomplete
- Debounced autocomplete search in the navbar performs full text-matching locally against the static products list.
- The Products Page executes client-side sorting, price checking, color filter checks, category checking, availability checks, and pagination (offset + limit) of the 100 products.

### 4. Interactive 3D Viewer & Reviews
- Switch between 2D high-res galleries and 360-degree Three.js interactive model inspectors.
- Submit ratings and product reviews, which are stored in `localStorage` under `rentease_reviews_${productId}` for instant rendering.

### 5. Checkout Simulator & Orders Dashboard
- Address book is managed in `localStorage` under `rentease_addresses_${userId}`.
- Click "Pay" to open the interactive payment gateway simulator (bypassing Razorpay server queries).
- Completing a simulated payment clears the cart, generates a detailed invoice receipt, stores the order in `rentease_orders_${userId}` (and item lists in `rentease_order_details_${orderId}`), and populates active rental contracts in `rentease_active_rentals_${userId}`.
- Review past purchases, download detailed invoices, and check remaining rental duration days directly on your Dashboard.

---

## Portfolio Full-Stack Assets (Dormant)
The Express backend files reside under the [server/](file:///c:/Users/Ritish/OneDrive/Desktop/RentEase/server) directory. This includes:
- PostgreSQL GIN indexes, schema definitions ([schema.sql](file:///c:/Users/Ritish/OneDrive/Desktop/RentEase/server/db/schema.sql)), and data seeds ([seed.sql](file:///c:/Users/Ritish/OneDrive/Desktop/RentEase/server/db/seed.sql)).
- Nodemailer HTML templates, JWT session cookies, and Razorpay server-side signature validators.
