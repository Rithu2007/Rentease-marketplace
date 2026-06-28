import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { WishlistItem } from '../types';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: WishlistItem[];
  isLoading: boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  toggleAlerts: (wishlistId: number, alertsFlag: boolean) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch wishlist items (only if user is logged in)
  const { data: wishlist = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      const response = await api.get('/wishlist');
      return response.data;
    },
    enabled: !!user,
  });

  // Toggle Wishlist Mutation
  const toggleMutation = useMutation({
    mutationFn: async (productId: number) => {
      const exists = wishlist.some((item) => item.product_id === productId);
      if (exists) {
        await api.delete(`/wishlist/${productId}`);
      } else {
        await api.post('/wishlist', { productId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    },
  });

  // Toggle Price Drop Alerts Mutation
  const toggleAlertsMutation = useMutation({
    mutationFn: async (payload: { wishlistId: number; alertsFlag: boolean }) => {
      await api.put(`/wishlist/${payload.wishlistId}`, {
        wishlistAlerts: payload.alertsFlag,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
    },
  });

  const toggleWishlist = async (productId: number) => {
    await toggleMutation.mutateAsync(productId);
  };

  const toggleAlerts = async (wishlistId: number, alertsFlag: boolean) => {
    await toggleAlertsMutation.mutateAsync({ wishlistId, alertsFlag });
  };

  const isWishlisted = (productId: number): boolean => {
    return wishlist.some((item) => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        toggleWishlist,
        toggleAlerts,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
