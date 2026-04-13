import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types';
import { toast } from 'sonner';

const WISHLIST_KEY = 'nexshop_wishlist';

const getStoredWishlist = (): Product[] => {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isWishlisted: (id: string) => boolean;
  removeFromWishlist: (id: string) => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    setWishlist(getStoredWishlist());
  }, []);

  const save = (items: Product[]) => {
    setWishlist(items);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  };

  const toggleWishlist = (product: Product) => {
    const exists = wishlist.some(p => p.id === product.id);
    if (exists) {
      save(wishlist.filter(p => p.id !== product.id));
      toast('Removed from wishlist', {
        style: { background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 15% 25% / 0.5)', color: 'white' },
      });
    } else {
      save([...wishlist, product]);
      toast.success('Added to wishlist ♥', {
        style: { background: 'hsl(220 20% 10%)', border: '1px solid hsl(0 84% 60% / 0.4)', color: 'white' },
      });
    }
  };

  const isWishlisted = (id: string) => wishlist.some(p => p.id === id);

  const removeFromWishlist = (id: string) => {
    save(wishlist.filter(p => p.id !== id));
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
