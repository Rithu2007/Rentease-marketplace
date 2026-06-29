import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { products } from '../data/products';

interface CartTotals {
  subtotal: number;
  gst: number;
  deliveryCharge: number;
  deposit: number;
  total: number;
}

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  addToCart: (productId: number, variantId: number, quantity: number, mode: 'buy' | 'rent', rentalDuration?: string) => Promise<void>;
  updateCartItem: (cartId: number, quantity: number, rentalDuration?: string) => Promise<void>;
  removeFromCart: (cartId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totals: CartTotals;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync cart items when user changes
  useEffect(() => {
    setIsLoading(true);
    const key = `rentease_cart_${user?.id || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
    setIsLoading(false);
  }, [user]);

  const addToCart = async (productId: number, variantId: number, quantity: number, mode: 'buy' | 'rent', rentalDuration?: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const variant = prod.variants?.find(v => v.id === variantId);
    if (!variant) return;

    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product_id === productId && item.variant_id === variantId && item.mode === mode);
      let updated;
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx].quantity = Math.min(
          updated[existingIdx].quantity + quantity,
          variant.stock
        );
      } else {
        const newItem: CartItem = {
          id: Math.max(...prev.map(i => i.id), 0) + 1,
          product_id: productId,
          variant_id: variantId,
          quantity,
          mode,
          rental_duration: rentalDuration || (mode === 'rent' ? '3_months' : null),
          name: prod.name,
          brand: prod.brand,
          category: prod.category,
          buy_price: prod.buy_price,
          rent_price_week: prod.rent_price_week,
          rent_price_month: prod.rent_price_month,
          colour_name: variant.colour_name,
          colour_hex: variant.colour_hex,
          images: variant.images,
          max_product_stock: prod.stock_quantity,
          max_variant_stock: variant.stock
        };
        updated = [...prev, newItem];
      }
      localStorage.setItem(`rentease_cart_${user?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
  };

  const updateCartItem = async (cartId: number, quantity: number, rentalDuration?: string) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.id === cartId) {
          return {
            ...item,
            quantity: Math.min(quantity, item.max_variant_stock),
            rental_duration: rentalDuration !== undefined ? rentalDuration : item.rental_duration
          };
        }
        return item;
      });
      localStorage.setItem(`rentease_cart_${user?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = async (cartId: number) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.id !== cartId);
      localStorage.setItem(`rentease_cart_${user?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem(`rentease_cart_${user?.id || 'guest'}`);
  };

  // Compute Cart Totals Reactively
  const getTotals = (): CartTotals => {
    let subtotal = 0;
    let deposit = 0;

    cartItems.forEach((item) => {
      const price = item.mode === 'rent' ? parseFloat(item.rent_price_month) : parseFloat(item.buy_price);
      subtotal += price * item.quantity;

      if (item.mode === 'rent') {
        deposit += parseFloat(item.rent_price_month) * item.quantity;
      }
    });

    const gst = Math.round(subtotal * 0.18); // GST at 18%
    const deliveryCharge = subtotal > 5000 || subtotal === 0 ? 0 : 350; // Free above ₹5000
    const total = subtotal + gst + deliveryCharge + deposit;

    return {
      subtotal,
      gst,
      deliveryCharge,
      deposit,
      total,
    };
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        totals: getTotals(),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
