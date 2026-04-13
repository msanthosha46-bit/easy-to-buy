import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Camera, CheckCircle2, AlertCircle, LogOut, Calendar, Edit2, X, Loader2,
  ShoppingBag, Truck, Clock, Package, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useStore } from '@/stores/storeContext';
import { getOrders } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Order } from '@/types';

const STATUS_COLORS: Record<Order['status'], string> = {
  Pending: 'text-orange-400',
  Processing: 'text-blue-400',
  Shipped: 'text-primary',
  Delivered: 'text-green-400',
  Cancelled: 'text-destructive',
};

const Profile = () => {
  const { user, login, logout } = useStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orders = getOrders();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [editingName, setEditingName] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.created_at) {
        setCreatedAt(data.user.created_at);
      }
      const metaAvatar = data.user?.user_metadata?.avatar_url;
      if (metaAvatar && !avatarUrl) setAvatarUrl(metaAvatar);
    });
  }, []);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const orderStats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    active: orders.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length,
  };

  const recentOrders = orders.slice(0, 3);

  const handleSaveName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed === user.name) {
      setEditingName(false);
      return;
    }
    if (trimmed.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setNameLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmed, username: trimmed },
    });

    if (error) {
      toast.error(error.message);
      setNameLoading(false);
      return;
    }

    login({ ...user, name: trimmed, avatar: avatarUrl || undefined });
    toast.success('Display name updated!');
    setEditingName(false);
    setNameLoading(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setAvatarLoading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setAvatarLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

    setAvatarUrl(publicUrl);
    login({ ...user, name: user.name, avatar: publicUrl });
    toast.success('Avatar updated!');
    setAvatarLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-xs text-muted-foreground">Manage your account details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="glass gradient-border rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-4 border-primary/30">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarUrl('')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-3xl font-bold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg disabled:opacity-60"
                  aria-label="Upload avatar"
                >
                  {avatarLoading ? (
                    <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                  aria-label="Choose avatar image"
                />
              </div>

              <p className="text-xs text-muted-foreground mb-4">JPG, PNG or WebP · Max 2MB</p>

              <div className="w-full mb-3">
                <label
                  htmlFor="display-name-input"
                  className="block text-xs font-medium text-muted-foreground mb-1 text-left"
                >
                  Display Name
                </label>

                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      id="display-name-input"
                      name="displayName"
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') {
                          setEditingName(false);
                          setDisplayName(user.name);
                        }
                      }}
                      className="flex-1 h-9 px-3 rounded-lg bg-input border border-primary/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                      maxLength={50}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={nameLoading}
                      className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-60 transition-all"
                      aria-label="Save name"
                    >
                      {nameLoading ? (
                        <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setDisplayName(user.name);
                      }}
                      className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-all"
                      aria-label="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-semibold text-left truncate">{user.name}</span>
                    <button
                      onClick={() => setEditingName(true)}
                      className="w-7 h-7 rounded-md bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all"
                      aria-label="Edit name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="w-full">
                <label className="block text-xs font-medium text-muted-foreground mb-1 text-left">
                  Email Address
                </label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-muted/50 border border-border">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{user.email}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-left flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Email cannot be changed here
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-semibold">{memberSince}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full h-9 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass gradient-border rounded-2xl p-5">
              <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Order Summary
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Total Orders',
                    value: orderStats.total,
                    icon: ShoppingBag,
                    color: 'text-primary',
                    bg: 'bg-primary/10',
                  },
                  {
                    label: 'Delivered',
                    value: orderStats.delivered,
                    icon: CheckCircle2,
                    color: 'text-green-400',
                    bg: 'bg-green-400/10',
                  },
                  {
                    label: 'Active',
                    value: orderStats.active,
                    icon: Truck,
                    color: 'text-blue-400',
                    bg: 'bg-blue-400/10',
                  },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className={`rounded-xl p-4 ${bg} text-center`}>
                    <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                  Recent Orders
                </h2>
                <Link
                  to="/orders"
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map(order => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors group"
                    >
                      <img
                        src={order.items[0].image}
                        alt={order.items[0].name}
                        className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-primary">{order.id}</p>
                        <p className="text-sm font-medium line-clamp-1 mt-0.5">
                          {order.items[0].name}
                          {order.items.length > 1 && (
                            <span className="text-muted-foreground">
                              {' '}
                              +{order.items.length - 1} more
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </p>
                        <p className="text-sm font-bold mt-0.5">
                          ₹{order.total.toLocaleString('en-IN')}
                        </p>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors mt-1 ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No orders placed yet</p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all glow-cyan"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Account Details
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Account ID', value: user.id.slice(0, 8) + '...' + user.id.slice(-4) },
                  { label: 'Email', value: user.email },
                  { label: 'Account Type', value: 'Standard Customer' },
                  { label: 'Member Since', value: memberSince },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium text-right ml-4 truncate max-w-[200px]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;