import { CartItem, User, Order } from '@/types';

const CART_KEY = 'nexshop_cart';
const USER_KEY = 'nexshop_user';
const ORDERS_KEY = 'nexshop_orders';

// Cart
export const getCart = (): CartItem[] => {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCart = (cart: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
};

// User
export const getUser = (): User | null => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const saveUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

// Orders
export const getOrders = (): Order[] => {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : getMockOrders();
  } catch {
    return getMockOrders();
  }
};

export const saveOrder = (order: Order) => {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

const getMockOrders = (): Order[] => [
  {
    id: 'ORD-2026-0012',
    date: '2026-03-15',
    items: [
      {
        id: '1',
        name: 'Sony WH-1000XM5 Wireless Headphones',
        price: 24999,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
        rating: 4.8,
        reviewCount: 12450,
        category: 'Electronics',
        badge: 'Best Seller',
        description: '',
        inStock: true,
      },
    ],
    total: 24999,
    status: 'Delivered',
    address: '42 MG Road, Bangalore, Karnataka 560001',
    paymentMethod: 'UPI',
  },
  {
    id: 'ORD-2026-0008',
    date: '2026-03-02',
    items: [
      {
        id: '5',
        name: 'Atomic Habits by James Clear',
        price: 499,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&h=100&fit=crop',
        rating: 4.9,
        reviewCount: 45621,
        category: 'Books',
        badge: 'Bestseller',
        description: '',
        inStock: true,
      },
    ],
    total: 998,
    status: 'Delivered',
    address: '42 MG Road, Bangalore, Karnataka 560001',
    paymentMethod: 'Cash on Delivery',
  },
  {
    id: 'ORD-2026-0015',
    date: '2026-03-28',
    items: [
      {
        id: '7',
        name: 'MacBook Pro 14" M3 Pro',
        price: 199900,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop',
        rating: 4.9,
        reviewCount: 5234,
        category: 'Electronics',
        badge: 'Premium',
        description: '',
        inStock: true,
      },
    ],
    total: 199900,
    status: 'Shipped',
    address: '42 MG Road, Bangalore, Karnataka 560001',
    paymentMethod: 'UPI',
  },
];

