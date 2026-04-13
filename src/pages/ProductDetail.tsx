import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, ShoppingCart, Heart, ArrowLeft, Zap, Truck, ShieldCheck,
  RefreshCw, Package, Share2, CheckCircle2
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/features/ProductCard';
import ProductReviews from '@/components/features/ProductReviews';
import { PRODUCTS } from '@/constants/products';
import { useStore } from '@/stores/storeContext';
import { useWishlist } from '@/stores/wishlistContext';
import { formatPrice, getDiscount } from '@/lib/utils';
import { toast } from 'sonner';

const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const cls = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cls}
          fill={star <= Math.round(rating) ? 'hsl(45 100% 55%)' : 'none'}
          stroke={star <= Math.round(rating) ? 'hsl(45 100% 55%)' : 'hsl(215 20% 35%)'}
        />
      ))}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useStore();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = PRODUCTS.find(p => p.id === id);
  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Product not found</h2>
          <Link to="/" className="text-primary hover:underline">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const relatedProducts = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const discount = product.originalPrice ? getDiscount(product.price, product.originalPrice) : 0;
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) addToCart(product);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-primary transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </button>
          <span>/</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/?category=${product.category}`)}>{product.category}</span>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Image */}
          <div className="relative">
            <div className="glass gradient-border rounded-2xl overflow-hidden aspect-square">
              <img
                src={product.image.replace('w=400&h=400', 'w=800&h=800')}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-lg text-sm font-bold bg-primary text-primary-foreground">
                  {product.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="absolute top-4 right-4 px-3 py-1 rounded-lg text-sm font-bold bg-destructive text-white">
                  -{discount}%
                </span>
              )}
            </div>
            {/* Share button */}
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Share product"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-sm text-primary font-medium mb-2">{product.category}</p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-4">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-5">
              <StarRating rating={product.rating} size="md" />
              <span className="font-semibold text-yellow-400">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through mb-1">{formatPrice(product.originalPrice)}</span>
                  <span className="mb-1 px-2 py-0.5 rounded-md bg-green-500/15 border border-green-500/25 text-green-400 text-sm font-semibold">
                    Save {formatPrice(product.originalPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">{product.description}</p>

            {/* Stock Status */}
            <div className={`flex items-center gap-2 mb-6 text-sm font-medium ${product.inStock ? 'text-green-400' : 'text-destructive'}`}>
              <CheckCircle2 className="w-4 h-4" />
              {product.inStock ? 'In Stock — Ready to ship' : 'Out of Stock'}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <label className="text-sm font-medium text-muted-foreground">Qty:</label>
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-l-xl bg-muted border border-border hover:bg-muted/80 transition-colors flex items-center justify-center font-bold"
                  aria-label="Decrease quantity"
                >−</button>
                <span className="w-12 h-10 flex items-center justify-center border-y border-border bg-input text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-r-xl bg-muted border border-border hover:bg-muted/80 transition-colors flex items-center justify-center font-bold"
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  added
                    ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                    : 'bg-muted hover:bg-primary/20 border border-border hover:border-primary/50 hover:text-primary'
                } disabled:opacity-50`}
              >
                {added ? <><CheckCircle2 className="w-4 h-4" /> Added!</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 glow-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" /> Buy Now
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`w-12 h-12 rounded-xl border transition-all flex items-center justify-center ${
                  wishlisted
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'bg-muted border-border hover:border-red-500/40 hover:text-red-400'
                }`}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className="w-5 h-5" fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'Above ₹499' },
                { icon: ShieldCheck, label: 'Secure Pay', sub: '100% Safe' },
                { icon: RefreshCw, label: 'Easy Return', sub: '30 Days' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="glass rounded-xl p-3 text-center">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section — live from Supabase */}
        <ProductReviews
          productId={product.id}
          productRating={product.rating}
          productReviewCount={product.reviewCount}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Related Products
              </h2>
              <Link to={`/?category=${product.category}`} className="text-sm text-primary hover:underline">
                View all in {product.category}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
