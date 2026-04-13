import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Package } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useStore } from '@/stores/storeContext';
import { formatPrice } from '@/lib/utils';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useStore();
  const navigate = useNavigate();

  const savings = cart.reduce((sum, item) => {
    const orig = item.originalPrice ?? item.price;
    return sum + (orig - item.price) * item.quantity;
  }, 0);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center animate-slide-in">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet. Start shopping!</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all glow-cyan"
          >
            <Package className="w-4 h-4" /> Browse Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">
          Shopping Cart <span className="text-muted-foreground text-lg font-normal">({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="glass rounded-xl p-4 flex gap-4 animate-slide-in">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg shrink-0 bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                  <h3 className="font-medium text-sm leading-snug mb-2 line-clamp-2">{item.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                    {item.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(item.originalPrice)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-background transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-background transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/20 hover:text-destructive transition-colors text-muted-foreground"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="glass gradient-border rounded-xl p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>You Save</span>
                    <span>-{formatPrice(savings)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-green-400">{cartTotal >= 499 ? 'FREE' : formatPrice(49)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-primary text-lg">{formatPrice(cartTotal + (cartTotal >= 499 ? 0 : 49))}</span>
                </div>
              </div>
              {savings > 0 && (
                <div className="bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2 text-xs text-green-400 mb-4">
                  🎉 You're saving {formatPrice(savings)} on this order!
                </div>
              )}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all glow-cyan flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/"
                className="block text-center mt-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
