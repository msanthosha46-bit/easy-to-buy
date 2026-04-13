import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, User, Phone, Mail, CreditCard, Smartphone, Truck, Lock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useStore } from '@/stores/storeContext';
import { formatPrice } from '@/lib/utils';
import { CheckoutFormData } from '@/types';

const INITIAL: CheckoutFormData = {
  fullName: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
  paymentMethod: 'upi', upiId: '', cardNumber: '', cardExpiry: '', cardCvv: '',
};

const STATES = ['Andhra Pradesh','Assam','Bihar','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu & Kashmir','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal'];

const Checkout = () => {
  const { cart, cartTotal, user } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<CheckoutFormData>({
    ...INITIAL,
    fullName: user?.name || '',
    email: user?.email || '',
  });
  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});

  const setField = (key: keyof CheckoutFormData, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const errs: Partial<CheckoutFormData> = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone)) errs.phone = '10-digit phone required';
    if (!form.address.trim()) errs.address = 'Required';
    if (!form.city.trim()) errs.city = 'Required';
    if (!form.state) errs.state = 'Required';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) errs.pincode = '6-digit pincode required';
    if (form.paymentMethod === 'upi' && !form.upiId?.trim()) errs.upiId = 'UPI ID required';
    if (form.paymentMethod === 'card') {
      if (!form.cardNumber?.replace(/\s/g, '') || form.cardNumber.replace(/\s/g, '').length < 16) errs.cardNumber = 'Valid 16-digit card required';
      if (!form.cardExpiry?.trim()) errs.cardExpiry = 'Required';
      if (!form.cardCvv?.trim() || form.cardCvv.length < 3) errs.cardCvv = 'Valid CVV required';
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    navigate('/payment', { state: { formData: form } });
  };

  const InputField = ({ id, label, icon: Icon, type = 'text', value, placeholder, error, onChange, maxLength }: {
    id: keyof CheckoutFormData; label: string; icon: React.ElementType; type?: string;
    value: string; placeholder: string; error?: string; onChange: (v: string) => void; maxLength?: number;
  }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full h-10 pl-9 pr-3 rounded-lg bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${
            error ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'
          }`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );

  const delivery = cartTotal >= 499 ? 0 : 49;
  const total = cartTotal + delivery;

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" /> Secure Checkout
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping */}
              <div className="glass rounded-xl p-6">
                <h2 className="font-bold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <InputField id="fullName" label="Full Name" icon={User} value={form.fullName} placeholder="John Doe" error={errors.fullName} onChange={v => setField('fullName', v)} />
                  </div>
                  <InputField id="email" label="Email" icon={Mail} type="email" value={form.email} placeholder="you@example.com" error={errors.email} onChange={v => setField('email', v)} />
                  <InputField id="phone" label="Phone" icon={Phone} type="tel" value={form.phone} placeholder="9876543210" error={errors.phone} onChange={v => setField('phone', v.replace(/\D/g, '').slice(0, 10))} maxLength={10} />
                  <div className="sm:col-span-2">
                    <InputField id="address" label="Street Address" icon={MapPin} value={form.address} placeholder="House No, Street, Area" error={errors.address} onChange={v => setField('address', v)} />
                  </div>
                  <InputField id="city" label="City" icon={MapPin} value={form.city} placeholder="Mumbai" error={errors.city} onChange={v => setField('city', v)} />
                  <div>
                    <label htmlFor="state" className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">State</label>
                    <select
                      id="state"
                      value={form.state}
                      onChange={e => setField('state', e.target.value)}
                      className={`w-full h-10 px-3 rounded-lg bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${errors.state ? 'border-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                    >
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <p className="mt-1 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.state}</p>}
                  </div>
                  <InputField id="pincode" label="Pincode" icon={MapPin} value={form.pincode} placeholder="560001" error={errors.pincode} onChange={v => setField('pincode', v.replace(/\D/g, '').slice(0, 6))} maxLength={6} />
                </div>
              </div>

              {/* Payment */}
              <div className="glass rounded-xl p-6">
                <h2 className="font-bold mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" />Payment Method</h2>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { value: 'upi', label: 'UPI', icon: Smartphone },
                    { value: 'cod', label: 'Cash on Delivery', icon: Truck },
                    { value: 'card', label: 'Card', icon: CreditCard },
                  ].map(({ value, label, icon: Icon }) => (
                    <label key={value} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.paymentMethod === value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                      <input type="radio" name="paymentMethod" value={value} checked={form.paymentMethod === value} onChange={() => setField('paymentMethod', value)} className="sr-only" />
                      <Icon className={`w-5 h-5 ${form.paymentMethod === value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-medium text-center">{label}</span>
                    </label>
                  ))}
                </div>

                {form.paymentMethod === 'upi' && (
                  <div className="animate-slide-in">
                    <InputField id="upiId" label="UPI ID" icon={Smartphone} value={form.upiId || ''} placeholder="yourname@upi" error={errors.upiId} onChange={v => setField('upiId', v)} />
                    <p className="text-xs text-muted-foreground mt-2">E.g. 9876543210@paytm, name@gpay, name@ybl</p>
                  </div>
                )}

                {form.paymentMethod === 'cod' && (
                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground animate-slide-in">
                    <Truck className="w-5 h-5 text-primary mb-2" />
                    Pay with cash when your order is delivered. ₹30 COD charge may apply.
                  </div>
                )}

                {form.paymentMethod === 'card' && (
                  <div className="space-y-4 animate-slide-in">
                    <div>
                      <label htmlFor="cardNumber" className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Card Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="cardNumber"
                          type="text"
                          inputMode="numeric"
                          value={form.cardNumber || ''}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                            setField('cardNumber', v.replace(/(.{4})/g, '$1 ').trim());
                          }}
                          placeholder="1234 5678 9012 3456"
                          className={`w-full h-10 pl-9 pr-3 rounded-lg bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${errors.cardNumber ? 'border-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                        />
                      </div>
                      {errors.cardNumber && <p className="mt-1 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.cardNumber}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="cardExpiry" className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Expiry</label>
                        <input id="cardExpiry" type="text" value={form.cardExpiry || ''} onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,4); setField('cardExpiry', v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v); }} placeholder="MM/YY" className={`w-full h-10 px-3 rounded-lg bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${errors.cardExpiry ? 'border-destructive' : 'border-border focus:border-primary focus:ring-primary'}`} />
                        {errors.cardExpiry && <p className="mt-1 text-xs text-destructive">{errors.cardExpiry}</p>}
                      </div>
                      <div>
                        <label htmlFor="cardCvv" className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">CVV</label>
                        <input id="cardCvv" type="password" value={form.cardCvv || ''} onChange={e => setField('cardCvv', e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="•••" maxLength={4} className={`w-full h-10 px-3 rounded-lg bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${errors.cardCvv ? 'border-destructive' : 'border-border focus:border-primary focus:ring-primary'}`} />
                        {errors.cardCvv && <p className="mt-1 text-xs text-destructive">{errors.cardCvv}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary */}
            <div>
              <div className="glass gradient-border rounded-xl p-6 sticky top-24">
                <h2 className="font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                      <p className="text-xs font-semibold shrink-0">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span><span className={delivery === 0 ? 'text-green-400' : ''}>{delivery === 0 ? 'FREE' : formatPrice(delivery)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span>Total</span><span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all glow-cyan flex items-center justify-center gap-2 mt-4"
                >
                  <Lock className="w-4 h-4" /> Place Order
                </button>
                <p className="text-center text-xs text-muted-foreground mt-3">🔒 256-bit SSL encrypted & secure</p>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
