import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Package, CheckCircle2, Truck, MapPin, Clock, XCircle,
  ShoppingBag, RefreshCw, Phone, MessageSquare
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getOrders } from '@/lib/storage';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order } from '@/types';

const STATUS_ORDER: Order['status'][] = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const TIMELINE_STEPS = [
  {
    status: 'Pending' as Order['status'],
    label: 'Order Placed',
    sub: 'Your order has been placed successfully',
    icon: ShoppingBag,
  },
  {
    status: 'Processing' as Order['status'],
    label: 'Processing',
    sub: 'Your order is being prepared',
    icon: RefreshCw,
  },
  {
    status: 'Shipped' as Order['status'],
    label: 'Shipped',
    sub: 'Package handed over to delivery partner',
    icon: Truck,
  },
  {
    status: 'Delivered' as Order['status'],
    label: 'Delivered',
    sub: 'Package delivered to your address',
    icon: CheckCircle2,
  },
];

const getStepIndex = (status: Order['status']) => {
  if (status === 'Cancelled') return -1;
  return STATUS_ORDER.indexOf(status);
};

const OrderTracking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orders = getOrders();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Order not found</h2>
            <p className="text-muted-foreground text-sm mb-6">Order ID <span className="text-primary font-mono">{id}</span> does not exist.</p>
            <Link to="/orders" className="text-primary hover:underline text-sm">← Back to Orders</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'Cancelled';
  const isDelivered = order.status === 'Delivered';

  // Simulate step dates based on order date
  const orderDate = new Date(order.date);
  const getStepDate = (offset: number) => {
    const d = new Date(orderDate);
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const STEP_DATES = [
    getStepDate(0),
    getStepDate(1),
    getStepDate(2),
    isDelivered ? getStepDate(4) : 'Expected: ' + getStepDate(4),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Back to orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Track Order</h1>
            <p className="text-xs text-muted-foreground font-mono">{order.id}</p>
          </div>
        </div>

        {/* Status Banner */}
        {isCancelled ? (
          <div className="glass rounded-2xl p-5 mb-6 border border-destructive/30 bg-destructive/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="font-bold text-destructive">Order Cancelled</p>
              <p className="text-sm text-muted-foreground">This order has been cancelled. Refund will be processed within 5-7 business days.</p>
            </div>
          </div>
        ) : isDelivered ? (
          <div className="glass gradient-border rounded-2xl p-5 mb-6 border-green-500/30 bg-green-500/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="font-bold text-green-400">Delivered Successfully!</p>
              <p className="text-sm text-muted-foreground">Your order was delivered on {getStepDate(4)}.</p>
            </div>
          </div>
        ) : (
          <div className="glass gradient-border rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 animate-pulse-glow">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold">On the way!</p>
              <p className="text-sm text-muted-foreground">Estimated delivery: {getStepDate(4)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold text-primary text-sm">{order.status}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-6 text-sm uppercase tracking-wider text-muted-foreground">Shipment Progress</h2>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
              {/* Progress line */}
              <div
                className="absolute left-5 top-5 w-0.5 bg-primary transition-all duration-1000"
                style={{ height: currentStep > 0 ? `${(currentStep / (TIMELINE_STEPS.length - 1)) * 100}%` : '0%' }}
              />

              <div className="space-y-8">
                {TIMELINE_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isCompleted = i <= currentStep;
                  const isActive = i === currentStep;

                  return (
                    <div key={step.status} className="relative flex items-start gap-5">
                      {/* Icon */}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground' + (isActive && !isDelivered ? ' animate-pulse-glow' : '')
                            : 'bg-muted border-2 border-border text-muted-foreground'
                        }`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-semibold text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.label}
                              {isActive && !isDelivered && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">Current</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>
                          </div>
                          <p className={`text-xs shrink-0 ${isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                            {isCompleted ? STEP_DATES[i] : i === TIMELINE_STEPS.length - 1 ? STEP_DATES[i] : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Delivery Address
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{order.address}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Order Summary
            </h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Placed on</span>
                <span>{formatDate(order.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span>{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{order.items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-border pt-1.5 mt-1.5">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="glass rounded-2xl p-5 mb-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Order Items
          </h3>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <p className="font-semibold text-sm shrink-0">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-3">Need Help?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="h-10 rounded-xl bg-muted hover:bg-muted/80 text-sm transition-colors flex items-center justify-center gap-2">
              <Phone className="w-4 h-4 text-primary" /> Call Support
            </button>
            <button className="h-10 rounded-xl bg-muted hover:bg-muted/80 text-sm transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Chat with Us
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderTracking;
