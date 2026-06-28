import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';

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
  const queryClient = useQueryClient();

  // Fetch cart items using React Query (only if user is logged in)
  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data;
    },
    enabled: !!user,
  });

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async (payload: { productId: number; variantId: number; quantity: number; mode: 'buy' | 'rent'; rentalDuration?: string }) => {
      await api.post('/cart', {
        productId: payload.productId,
        variantId: payload.variantId,
        quantity: payload.quantity,
        mode: payload.mode,
        rentalDuration: payload.rentalDuration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  // Update Cart Mutation
  const updateCartMutation = useMutation({
    mutationFn: async (payload: { cartId: number; quantity: number; rentalDuration?: string }) => {
      await api.put(`/cart/${payload.cartId}`, {
        quantity: payload.quantity,
        rentalDuration: payload.rentalDuration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  // Remove Cart Item Mutation
  const removeCartMutation = useMutation({
    mutationFn: async (cartId: number) => {
      await api.delete(`/cart/${cartId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  // Clear Cart Mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });

  const addToCart = async (productId: number, variantId: number, quantity: number, mode: 'buy' | 'rent', rentalDuration?: string) => {
    await addToCartMutation.mutateAsync({ productId, variantId, quantity, mode, rentalDuration });
  };

  const updateCartItem = async (cartId: number, quantity: number, rentalDuration?: string) => {
    await updateCartMutation.mutateAsync({ cartId, quantity, rentalDuration });
  };

  const removeFromCart = async (cartId: number) => {
    await removeCartMutation.mutateAsync(cartId);
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  // Compute Cart Totals Reactively
  const getTotals = (): CartTotals => {
    let subtotal = 0;
    let deposit = 0;

    cartItems.forEach((item) => {
      const price = item.mode === 'rent' ? parseFloat(item.rent_price_month) : parseFloat(item.buy_price);
      subtotal += price * item.quantity;

      // Security deposit for rentals: 1 month of rent per item
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
