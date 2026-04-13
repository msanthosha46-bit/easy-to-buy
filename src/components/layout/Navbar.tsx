import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, LogOut, Package, Zap, Menu, X, Heart, UserCircle, Clock, Tag, ChevronRight, Trash2 } from 'lucide-react';
import { useStore } from '@/stores/storeContext';
import { useWishlist } from '@/stores/wishlistContext';
import { PRODUCTS, CATEGORIES } from '@/constants/products';
import { formatPrice } from '@/lib/utils';

const RECENT_KEY = 'nexshop_recent_searches';
const MAX_RECENT = 6;

const getRecentSearches = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const saveRecentSearch = (q: string) => {
  const prev = getRecentSearches().filter(s => s.toLowerCase() !== q.toLowerCase());
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
};
const removeRecentSearch = (q: string) => {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecentSearches().filter(s => s !== q)));
};
const clearRecentSearches = () => localStorage.removeItem(RECENT_KEY);

interface NavbarProps {
  searchQuery?: string;
  onSearch?: (q: string) => void;
}

const Navbar = ({ searchQuery = '', onSearch }: NavbarProps) => {
  const { cartCount, user, logout } = useStore();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute suggestions
  const query = localSearch.trim().toLowerCase();
  const matchedProducts = query.length >= 1
    ? PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      ).slice(0, 5)
    : [];
  const matchedCategories = query.length >= 1
    ? CATEGORIES.filter(c => c !== 'All' && c.toLowerCase().includes(query))
    : [];

  // Build flat navigation list for keyboard nav
  const navItems: Array<{ type: 'recent' | 'category' | 'product'; value: string; id?: string }> = [
    ...(query === '' ? recentSearches.map(r => ({ type: 'recent' as const, value: r })) : []),
    ...matchedCategories.map(c => ({ type: 'category' as const, value: c })),
    ...matchedProducts.map(p => ({ type: 'product' as const, value: p.name, id: p.id })),
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openDropdown = () => {
    setRecentSearches(getRecentSearches());
    setDropdownOpen(true);
    setActiveIndex(-1);
  };

  const commitSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setDropdownOpen(false);
    setActiveIndex(-1);
    setLocalSearch(trimmed);
    if (onSearch) {
      onSearch(trimmed);
    } else {
      navigate(`/?search=${encodeURIComponent(trimmed)}`);
    }
  }, [onSearch, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    commitSearch(localSearch);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, navItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && navItems[activeIndex]) {
        const item = navItems[activeIndex];
        if (item.type === 'product' && item.id) {
          saveRecentSearch(item.value);
          setDropdownOpen(false);
          navigate(`/product/${item.id}`);
        } else {
          commitSearch(item.value);
        }
      } else {
        commitSearch(localSearch);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const showDropdown = dropdownOpen && (navItems.length > 0 || query === '');
  const showEmpty = dropdownOpen && query.length >= 1 && matchedProducts.length === 0 && matchedCategories.length === 0;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="orbitron text-lg font-bold text-gradient-cyan hidden sm:block">NEXSHOP</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl" ref={containerRef}>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={localSearch}
                onChange={e => { setLocalSearch(e.target.value); setActiveIndex(-1); }}
                onFocus={openDropdown}
                onKeyDown={handleKeyDown}
                placeholder="Search products, brands, categories..."
                className="w-full h-10 pl-4 pr-12 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                autoComplete="off"
                aria-label="Search products"
                aria-expanded={showDropdown || showEmpty}
                aria-haspopup="listbox"
                role="combobox"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-10 w-12 flex items-center justify-center bg-primary text-primary-foreground rounded-r-lg hover:bg-primary/90 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* ── Dropdown ─────────────────────────────────────────── */}
              {(showDropdown || showEmpty) && (
                <div
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-1.5 rounded-xl glass border border-border shadow-2xl overflow-hidden z-50 animate-slide-in"
                  style={{ boxShadow: '0 8px 32px hsl(187 100% 50% / 0.08), 0 4px 16px rgba(0,0,0,0.4)' }}
                >
                  {/* Recent Searches (only when no query) */}
                  {query === '' && recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-3 pt-3 pb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Recent Searches</span>
                        <button
                          type="button"
                          onClick={() => { clearRecentSearches(); setRecentSearches([]); }}
                          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      {recentSearches.map((r, idx) => (
                        <div
                          key={r}
                          role="option"
                          aria-selected={activeIndex === idx}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors group ${
                            activeIndex === idx ? 'bg-primary/10' : 'hover:bg-muted/60'
                          }`}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onMouseDown={e => { e.preventDefault(); commitSearch(r); }}
                        >
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-sm truncate">{r}</span>
                          <button
                            type="button"
                            onMouseDown={e => {
                              e.stopPropagation();
                              e.preventDefault();
                              removeRecentSearch(r);
                              setRecentSearches(getRecentSearches());
                            }}
                            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:text-destructive transition-all"
                            aria-label={`Remove ${r} from recent searches`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state for no query + no recent */}
                  {query === '' && recentSearches.length === 0 && (
                    <div className="px-4 py-5 text-center">
                      <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-sm text-muted-foreground">Start typing to search products</p>
                    </div>
                  )}

                  {/* Category matches */}
                  {matchedCategories.length > 0 && (
                    <div>
                      <div className="px-3 pt-3 pb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Categories</span>
                      </div>
                      {matchedCategories.map((cat, i) => {
                        const idx = recentSearches.length + i; // offset for keyboard nav (query='' only)
                        const navIdx = navItems.findIndex(n => n.type === 'category' && n.value === cat);
                        return (
                          <div
                            key={cat}
                            role="option"
                            aria-selected={activeIndex === navIdx}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                              activeIndex === navIdx ? 'bg-primary/10' : 'hover:bg-muted/60'
                            }`}
                            onMouseEnter={() => setActiveIndex(navIdx)}
                            onMouseDown={e => { e.preventDefault(); commitSearch(cat); }}
                          >
                            <Tag className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            <span className="flex-1 text-sm">
                              <span className="text-primary font-medium">{cat}</span>
                              <span className="text-muted-foreground"> in Categories</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Product matches */}
                  {matchedProducts.length > 0 && (
                    <div>
                      <div className="px-3 pt-3 pb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Products</span>
                      </div>
                      {matchedProducts.map(product => {
                        const navIdx = navItems.findIndex(n => n.type === 'product' && n.id === product.id);
                        return (
                          <div
                            key={product.id}
                            role="option"
                            aria-selected={activeIndex === navIdx}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                              activeIndex === navIdx ? 'bg-primary/10' : 'hover:bg-muted/60'
                            }`}
                            onMouseEnter={() => setActiveIndex(navIdx)}
                            onMouseDown={e => {
                              e.preventDefault();
                              saveRecentSearch(product.name);
                              setDropdownOpen(false);
                              navigate(`/product/${product.id}`);
                            }}
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-9 h-9 rounded-lg object-cover bg-muted shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate leading-tight">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                            <span className="text-sm font-bold text-primary shrink-0">{formatPrice(product.price)}</span>
                          </div>
                        );
                      })}

                      {/* View all results */}
                      {query && (
                        <button
                          type="button"
                          onMouseDown={e => { e.preventDefault(); commitSearch(localSearch); }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-3 border-t border-border text-sm text-primary font-medium hover:bg-primary/5 transition-colors"
                        >
                          <Search className="w-3.5 h-3.5" />
                          View all results for &ldquo;{localSearch}&rdquo;
                        </button>
                      )}
                    </div>
                  )}

                  {/* No results */}
                  {showEmpty && (
                    <div className="px-4 py-5 text-center">
                      <p className="text-sm text-muted-foreground">No results for &ldquo;{localSearch}&rdquo;</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Actions */}
          <nav className="flex items-center gap-1">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={`Wishlist with ${wishlist.length} items`}
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {wishlist.length > 9 ? '9+' : wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:block text-sm font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold animate-pulse-glow">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Orders */}
            <Link
              to="/orders"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
            >
              <Package className="w-5 h-5" />
              <span>Orders</span>
            </Link>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label="My Profile"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-primary/40" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium">{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/20 hover:text-destructive transition-colors text-sm"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-sm font-medium text-primary"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:block">Login</span>
              </Link>
            )}

            {/* Mobile menu */}
            <button
              className="sm:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="sm:hidden py-3 border-t border-border animate-slide-in space-y-1">
            <Link to="/orders" className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              <Package className="w-5 h-5 text-primary" />
              <span className="font-medium">My Orders</span>
            </Link>
            <Link to="/wishlist" className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              <Heart className="w-5 h-5 text-red-400" />
              <span className="font-medium">Wishlist {wishlist.length > 0 && `(${wishlist.length})`}</span>
            </Link>
            {user && (
              <Link to="/profile" className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                <UserCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">My Profile</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
