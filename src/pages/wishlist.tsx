import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useWishlist } from '@/stores/wishlistContext';
import { useStore } from '@/stores/storeContext';
import { formatPrice, getDiscount } from '@/lib/utils';
import { Product } from '@/types';

const WishlistCard = ({ product }: { product: Product }) => {
  const { removeFromWishlist } = useWishlist();
  const { addToCart } = useStore();
  const discount = product.originalPrice ? getDiscount(product.price, product.originalPrice) : 0;

  return (
    <div className="glass rounded-xl overflow-hidden group animate-slide-in flex flex-col sm:flex-row">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative shrink-0">
        <div className="w-full sm:w-40 h-40 overflow-hidden bg-muted/30">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.badge && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-bold bg-primary text-primary-foreground">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-xs font-bold bg-destructive text-white">
              -{discount}%
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <p className="text-xs text-primary font-medium mb-1">{product.category}</p>
          <Link to={`/product/${product.id}`}>
            <h3 className="font-semibold text-sm leading-snug mb-2 hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{product.description}</p>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-primary">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through mb-0.5">{formatPrice(product.originalPrice)}</span>
            )}
            {discount > 0 && (
              <span className="text-xs text-green-400 font-semibold mb-0.5">-{discount}%</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => addToCart(product)}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 glow-cyan transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Add to Cart
          </button>
          <button
            onClick={() => removeFromWishlist(product.id)}
            className="w-10 h-10 rounded-xl bg-muted border border-border hover:bg-destructive/20 hover:border-destructive/40 hover:text-destructive transition-all flex items-center justify-center"
            aria-label="Remove from wishlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Wishlist = () => {
  const { wishlist } = useWishlist();
  const { addToCart } = useStore();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-400" fill="currentColor" />
            My Wishlist
          </h1>
          <span className="text-sm text-muted-foreground">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</span>
        </div>

        {wishlist.length > 0 ? (
          <>
            {/* Bulk Add to Cart */}
            {wishlist.length > 1 && (
              <div className="glass gradient-border rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Add all to cart</p>
                  <p className="text-xs text-muted-foreground">{wishlist.length} items · {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(wishlist.reduce((s, p) => s + p.price, 0))}</p>
                </div>
                <button
                  onClick={() => wishlist.forEach(p => addToCart(p))}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 glow-cyan transition-all"
                >
                  Add All to Cart
                </button>
              </div>
            )}

            <div className="space-y-4">
              {wishlist.map(product => (
                <WishlistCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <Heart className="w-10 h-10 text-red-400/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
              Save items you love by tapping the heart icon on any product.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all glow-cyan text-sm"
            >
              <Sparkles className="w-4 h-4" /> Explore Products
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;