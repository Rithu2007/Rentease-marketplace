export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profile_picture: string | null;
  is_new_user: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  description: string;
  material: string;
  dimensions: string;
  weight: string;
  warranty: string;
  buy_price: string;
  rent_price_week: string;
  rent_price_month: string;
  rating: string;
  review_count: number;
  stock_quantity: number;
  is_available: boolean;
  condition_type: 'new' | 'like_new' | 'refurbished';
  condition?: string;
  height_cm?: number;
  width_cm?: number;
  created_at: string;
  variants?: ProductVariant[];
  thumbnail?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  colour_name: string;
  colour_hex: string;
  images: string[] | string; // Can be parsed JSON array of strings
  stock: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  mode: 'buy' | 'rent';
  rental_duration: string | null;
  name: string;
  brand: string;
  category: string;
  buy_price: string;
  rent_price_week: string;
  rent_price_month: string;
  colour_name: string;
  colour_hex: string;
  images: string[] | string; // Unsplash JSON array or first string
  max_product_stock: number;
  max_variant_stock: number;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  wishlist_alerts: boolean;
  added_at: string;
  name: string;
  brand: string;
  category: string;
  buy_price: string;
  rent_price_month: string;
  rating: string;
  review_count: number;
  thumbnail: string;
}

export interface Address {
  id: number;
  user_id: number;
  label: string;
  full_name: string;
  phone: string;
  flat: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
}

export interface Order {
  id: number;
  user_id: number;
  address_id: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'ordered' | 'shipped' | 'delivered' | 'returned';
  subtotal: string;
  gst: string;
  delivery_charge: string;
  total: string;
  mode: 'buy' | 'rent';
  created_at: string;
  items_count?: number;
}

export interface OrderDetail extends Order {
  shipping_name: string;
  shipping_phone: string;
  flat: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string | null;
  items: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: number;
  quantity: number;
  unit_price: string;
  rental_duration: string | null;
  rental_start_date: string | null;
  rental_end_date: string | null;
  name: string;
  brand: string;
  colour_name: string;
  thumbnail: string;
}

export interface ActiveRental {
  id: number;
  rental_duration: string;
  rental_start_date: string;
  rental_end_date: string;
  quantity: number;
  product_id: number;
  name: string;
  brand: string;
  category: string;
  colour_name: string;
  thumbnail: string;
  days_remaining: number;
}

export interface Review {
  id: number;
  rating: number;
  review_text: string;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
}

export interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percent' | 'flat';
  discount_value: string;
  expiry_date: string;
  is_active: boolean;
}
