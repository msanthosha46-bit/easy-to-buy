import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Github, Twitter, Instagram } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-border bg-card/50 mt-16">
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="orbitron font-bold text-gradient-cyan">NEXSHOP</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The next-generation shopping experience. Fast, secure, and futuristic.
          </p>
          <div className="flex gap-3 mt-4">
            {[Github, Twitter, Instagram].map((Icon, i) => (
              <button key={i} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors" aria-label="Social link">
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Shop</h3>
          <ul className="space-y-2 text-sm">
            {['Electronics', 'Clothing', 'Books', 'Home & Kitchen'].map(cat => (
              <li key={cat}><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">{cat}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Account</h3>
          <ul className="space-y-2 text-sm">
            {[['Login', '/login'], ['Register', '/register'], ['Orders', '/orders'], ['Cart', '/cart']].map(([label, path]) => (
              <li key={label}><Link to={path} className="text-muted-foreground hover:text-primary transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Support</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>24/7 Customer Care</li>
            <li>Free Returns (30 days)</li>
            <li>Secure Payments</li>
            <li>Fast Delivery</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">© 2026 NexShop. All rights reserved.</p>
      
      </div>
    </div>
  </footer>
);

export default Footer;
