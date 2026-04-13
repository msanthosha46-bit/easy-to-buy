import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/features/ProductCard';
import { PRODUCTS, CATEGORIES } from '@/constants/products';
import { ChevronDown, SlidersHorizontal, Sparkles, TrendingUp, ShieldCheck, Truck } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const Index = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchQuery(q);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    let list = [...PRODUCTS];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      list = list.filter(p => p.category === selectedCategory);
    }

    switch (sortBy) {
      case 'price-low': list.sort((a, b) => a.price - b.price); break;
      case 'price-high': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    }

    return list;
  }, [searchQuery, selectedCategory, sortBy]);

  const features = [
    { icon: Truck, label: 'Free Delivery', sub: 'On orders above ₹499' },
    { icon: ShieldCheck, label: 'Secure Payment', sub: '100% protected' },
    { icon: TrendingUp, label: 'Best Deals', sub: 'Up to 70% off daily' },
    { icon: Sparkles, label: 'Premium Quality', sub: 'Verified products' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar searchQuery={searchQuery} onSearch={setSearchQuery} />

      {/* Hero Banner */}
      {!searchQuery && selectedCategory === 'All' && (
        <section className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
          <img
            src={heroBanner}
            alt="NexShop Hero Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8 md:px-16">
            <div className="max-w-lg animate-slide-in">
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-2 orbitron">Next-Gen Shopping</p>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                <span className="text-gradient-cyan">Future</span> of<br />
                <span className="text-white">E-Commerce</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mb-6">
                Discover premium products with AI-powered recommendations and instant delivery.
              </p>
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all glow-cyan text-sm"
              >
                Shop Now →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features Bar */}
      {!searchQuery && (
        <section className="border-y border-border bg-card/30">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8" id="products">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground glow-cyan'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              {searchQuery && <span className="text-primary"> for "{searchQuery}"</span>}
            </span>
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:border-primary cursor-pointer"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm">Try a different search term or category.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm hover:bg-primary/20 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
