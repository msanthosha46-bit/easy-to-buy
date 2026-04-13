import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, User } from '@/types';
import { getCart, saveCart, clearCart as storeClearCart } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface StoreContextType {
  cart: CartItem[];
  user: User | null;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  login: (user: User) => void;
  logout: () => void;
  authLoading: boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

const mapSupabaseUser = (supaUser: { id: string; email?: string | null; user_metadata?: Record<string, string> }): User => ({
  id: supaUser.id,
  name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.user_metadata?.username || supaUser.email?.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'User',
  email: supaUser.email || '',
  avatar: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture,
});

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setCart(getCart());

    let mounted = true;

    // Check existing session (page refresh / OAuth redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      if (mounted) setAuthLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(mapSupabaseUser(session.user));
        setAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      const updated = existing
        ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...product, quantity: 1 }];
      saveCart(updated);
      return updated;
    });
    toast.success(`${product.name.slice(0, 30)}... added to cart`, {
      style: { background: 'hsl(220 20% 10%)', border: '1px solid hsl(187 100% 50% / 0.4)', color: 'white' },
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const updated = prev.filter(i => i.id !== id);
      saveCart(updated);
      return updated;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) { removeFromCart(id); return; }
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, quantity } : i);
      saveCart(updated);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    storeClearCart();
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <StoreContext.Provider value={{
      cart, user, addToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, cartTotal, login, logout, authLoading,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
