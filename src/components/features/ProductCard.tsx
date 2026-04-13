import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Zap, Heart } from 'lucide-react';
import { Product } from '@/types';
import { useStore } from '@/stores/storeContext';
import { useWishlist } from '@/stores/wishlistContext';
import { formatPrice, getDiscount } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(star => (
      <Star
        key={star}
        className="w-3 h-3"
        fill={star <= Math.floor(rating) ? 'hsl(45 100% 55%)' : star <= rating ? 'hsl(45 100% 55%)' : 'none'}
        stroke={star <= rating ? 'hsl(45 100% 55%)' : 'hsl(215 20% 35%)'}
      />
    ))}
  </div>
);

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useStore();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const discount = product.originalPrice ? getDiscount(product.price, product.originalPrice) : 0;
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="glass rounded-xl overflow-hidden card-3d gradient-border group cursor-pointer">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </Link>
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

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
          className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
            wishlisted
              ? 'bg-red-500/90 text-white opacity-100'
              : 'bg-background/80 text-muted-foreground hover:text-red-400'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Quick add overlay */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={() => addToCart(product)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300 glow-cyan"
            aria-label={`Add ${product.name} to cart`}
          >
            <Zap className="w-4 h-4" />
            Quick Add
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={product.rating} />
          <span className="text-xs text-muted-foreground">({product.reviewCount.toLocaleString()})</span>
        </div>

        <div className="flex items-end gap-2 mb-3">
          <span className="font-bold text-lg text-primary">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        <button
          onClick={() => addToCart(product)}
          className="w-full h-9 rounded-lg bg-muted hover:bg-primary/20 border border-border hover:border-primary/50 text-sm font-medium transition-all flex items-center justify-center gap-2 hover:text-primary"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
