import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, Package, Home, Smartphone, Truck, CreditCard, Loader2 } from 'lucide-react';
import { useStore } from '@/stores/storeContext';
import { saveOrder } from '@/lib/storage';
import { formatPrice, generateOrderId, formatDate } from '@/lib/utils';
import { CheckoutFormData, Order } from '@/types';

type Step = 'processing' | 'success';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useStore();
  const formData: CheckoutFormData = location.state?.formData;

  const [step, setStep] = useState<Step>('processing');
  const [order, setOrder] = useState<Order | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!formData || cart.length === 0) {
      navigate('/cart');
      return;
    }

    // Simulate payment processing
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        // Place order
        const newOrder: Order = {
          id: generateOrderId(),
          date: new Date().toISOString().split('T')[0],
          items: [...cart],
          total: cartTotal + (cartTotal >= 499 ? 0 : 49),
          status: 'Pending',
          address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.pincode}`,
          paymentMethod: formData.paymentMethod === 'upi' ? 'UPI' : formData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card',
        };
        saveOrder(newOrder);
        setOrder(newOrder);
        clearCart();
        setTimeout(() => setStep('success'), 300);
      }
      setProgress(Math.min(p, 100));
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const PaymentIcon = formData?.paymentMethod === 'upi' ? Smartphone : formData?.paymentMethod === 'cod' ? Truck : CreditCard;

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          {/* Animated ring */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div
              className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
              style={{ borderRightColor: 'transparent', borderBottomColor: 'transparent' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <PaymentIcon className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2">Processing Payment</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {formData?.paymentMethod === 'upi' && `Confirming UPI payment from ${formData.upiId}`}
            {formData?.paymentMethod === 'cod' && 'Setting up Cash on Delivery...'}
            {formData?.paymentMethod === 'card' && 'Verifying card details securely...'}
          </p>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Please do not close this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* BG effects */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-green-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-success-ping">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-green-400">Order Placed!</h1>
          <p className="text-muted-foreground text-sm">
            Thank you {formData?.fullName.split(' ')[0]}! Your order has been confirmed.
          </p>
        </div>

        {/* Order Card */}
        {order && (
          <div className="glass gradient-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Order ID</p>
                <p className="font-bold text-primary orbitron">{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                <p className="font-medium text-sm">{formatDate(order.date)}</p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Payment</span><span>{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Paid</span><span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-xs text-orange-400 font-medium">Pending Confirmation</span>
              <span className="text-xs text-muted-foreground ml-auto">Est. delivery: 3-5 days</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="h-11 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" /> View Orders
          </button>
          <button
            onClick={() => navigate('/')}
            className="h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all glow-cyan flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Continue Shopping
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-primary" /> Order confirmation sent to {formData?.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
