import React, { createContext, useContext, useState, useEffect } from 'react';
import { WishlistItem } from '../types';
import { useAuth } from './AuthContext';
import { products } from '../data/products';

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
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync wishlist when user changes
  useEffect(() => {
    setIsLoading(true);
    const key = `rentease_wishlist_${user?.id || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        setWishlist([]);
      }
    } else {
      setWishlist([]);
    }
    setIsLoading(false);
  }, [user]);

  const toggleWishlist = async (productId: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    setWishlist(prev => {
      const exists = prev.some(item => item.product_id === productId);
      let updated;
      if (exists) {
        updated = prev.filter(item => item.product_id !== productId);
      } else {
        const newItem: WishlistItem = {
          id: Math.max(...prev.map(i => i.id), 0) + 1,
          product_id: productId,
          wishlist_alerts: false,
          added_at: new Date().toISOString(),
          name: prod.name,
          brand: prod.brand,
          category: prod.category,
          buy_price: prod.buy_price,
          rent_price_month: prod.rent_price_month,
          rating: prod.rating,
          review_count: prod.review_count,
          thumbnail: prod.thumbnail || (prod.variants?.[0]?.images?.[0] as string) || ''
        };
        updated = [...prev, newItem];
      }
      localStorage.setItem(`rentease_wishlist_${user?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleAlerts = async (wishlistId: number, alertsFlag: boolean) => {
    setWishlist(prev => {
      const updated = prev.map(item => {
        if (item.id === wishlistId) {
          return {
            ...item,
            wishlist_alerts: alertsFlag
          };
        }
        return item;
      });
      localStorage.setItem(`rentease_wishlist_${user?.id || 'guest'}`, JSON.stringify(updated));
      return updated;
    });
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
