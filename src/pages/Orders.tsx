import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronDown, ChevronUp, ShoppingBag, Truck, CheckCircle2, Clock, XCircle, RefreshCw, MapPin } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getOrders } from '@/lib/storage';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order } from '@/types';

const STATUS_CONFIG: Record<Order['status'], { icon: React.ElementType; color: string; bg: string; dot: string }> = {
  Pending: { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', dot: 'bg-orange-400' },
  Processing: { icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', dot: 'bg-blue-400' },
  Shipped: { icon: Truck, color: 'text-primary', bg: 'bg-primary/10 border-primary/20', dot: 'bg-primary' },
  Delivered: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', dot: 'bg-green-400' },
  Cancelled: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', dot: 'bg-destructive' },
};

const OrderCard = ({ order }: { order: Order }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const config = STATUS_CONFIG[order.status];
  const Icon = config.icon;

  return (
    <div className="glass rounded-xl overflow-hidden animate-slide-in">
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm orbitron text-primary">{order.id}</p>
              <p className="text-xs text-muted-foreground">{formatDate(order.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${config.bg} ${config.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${order.status === 'Shipped' || order.status === 'Processing' ? 'animate-pulse' : ''}`} />
              <Icon className="w-3 h-3" />
              {order.status}
            </div>
            <span className="font-bold text-base">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Items preview */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex -space-x-2">
            {order.items.slice(0, 3).map((item, i) => (
              <img
                key={i}
                src={item.image}
                alt={item.name}
                className="w-10 h-10 rounded-lg object-cover bg-muted border-2 border-card"
              />
            ))}
            {order.items.length > 3 && (
              <div className="w-10 h-10 rounded-lg bg-muted border-2 border-card flex items-center justify-center text-xs font-bold">
                +{order.items.length - 3}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium line-clamp-1">{order.items[0].name}{order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}</p>
            <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
          </div>
        </div>

        {/* Address */}
        <p className="text-xs text-muted-foreground flex items-start gap-1.5 mb-4">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
          {order.address}
        </p>

        {/* Track Order Button */}
        {order.status !== 'Cancelled' && (
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="w-full h-9 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
          >
            <Truck className="w-3.5 h-3.5" /> Track Order
          </button>
        )}
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-3 border-t border-border text-xs text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors flex items-center justify-center gap-1"
        aria-expanded={expanded}
      >
        {expanded ? <><ChevronUp className="w-3 h-3" /> Hide Details</> : <><ChevronDown className="w-3 h-3" /> View All Items</>}
      </button>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-3 animate-slide-in bg-muted/10">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.category}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price)}</p>
              </div>
              <p className="font-semibold text-sm shrink-0">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between font-bold text-sm">
            <span>Order Total</span>
            <span className="text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const Orders = () => {
  const orders = getOrders();
  const [filter, setFilter] = useState<Order['status'] | 'All'>('All');

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" /> My Orders
          </h1>
          <span className="text-sm text-muted-foreground">{orders.length} total orders</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {(['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {status}
              {status !== 'All' && orders.filter(o => o.status === status).length > 0 && (
                <span className="ml-1.5 opacity-70">({orders.filter(o => o.status === status).length})</span>
              )}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No {filter !== 'All' ? filter.toLowerCase() : ''} orders</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {filter === 'All' ? "You haven't placed any orders yet." : `No orders with "${filter}" status.`}
            </p>
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all glow-cyan text-sm">
              Start Shopping
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
