import { create } from "zustand";

/* =========================
   ✅ TYPES
========================= */

// User Type
type User = {
  id: string;
  email: string;
  name: string;
};

// Cart Item Type
type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

/* =========================
   ✅ STORE TYPE
========================= */

type Store = {
  user: User | null;
  cart: CartItem[];

  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;

  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  // Computed
  cartCount: number;
};

/* =========================
   ✅ STORE
========================= */

export const useStore = create<Store>((set, get) => ({
  user: null,
  cart: [],

  /* =========================
     AUTH
  ========================= */

  setUser: (user) => set({ user }),

  logout: () => set({ user: null }),

  /* =========================
     CART
  ========================= */

  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((p) => p.id === item.id);

      if (existing) {
        return {
          cart: state.cart.map((p) =>
            p.id === item.id
              ? { ...p, quantity: p.quantity + 1 }
              : p
          ),
        };
      }

      return {
        cart: [...state.cart, { ...item, quantity: 1 }],
      };
    }),

  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    })),

  clearCart: () => set({ cart: [] }),

  /* =========================
     COMPUTED
  ========================= */

  get cartCount() {
    return get().cart.reduce((total, item) => total + item.quantity, 0);
  },
}));