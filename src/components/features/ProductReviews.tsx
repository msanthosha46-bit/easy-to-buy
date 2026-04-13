import React, { useState, useEffect, useCallback } from 'react';
import { Star, Edit2, Trash2, Send, Loader2, MessageSquarePlus, ChevronDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/stores/storeContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
  user_profiles: {
    username: string | null;
    email: string;
  };
}

interface RatingSummary {
  avg: number;
  total: number;
  breakdown: Record<number, number>; // star → count
}

// ── Interactive Star Picker ──────────────────────────────────────────────────
const StarPicker = ({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const [hovered, setHovered] = useState(0);
  const cls = size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  const active = hovered || value;

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHovered(0)}
      role="group"
      aria-label="Star rating"
    >
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          className={`transition-transform ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={cls}
            fill={star <= active ? 'hsl(45 100% 55%)' : 'none'}
            stroke={star <= active ? 'hsl(45 100% 55%)' : 'hsl(215 20% 35%)'}
          />
        </button>
      ))}
    </div>
  );
};

// ── Avatar initial circle ────────────────────────────────────────────────────
const Avatar = ({ name, email }: { name: string | null; email: string }) => {
  const display = name || email.split('@')[0];
  const initial = display.charAt(0).toUpperCase();
  const colors = [
    'bg-cyan-500/20 text-cyan-400',
    'bg-purple-500/20 text-purple-400',
    'bg-green-500/20 text-green-400',
    'bg-orange-500/20 text-orange-400',
    'bg-pink-500/20 text-pink-400',
  ];
  const color = colors[display.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${color}`}>
      {initial}
    </div>
  );
};

// ── Rating bar row ───────────────────────────────────────────────────────────
const RatingBar = ({ stars, count, total }: { stars: number; count: number; total: number }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 w-10 shrink-0">
        <span className="text-xs text-muted-foreground">{stars}</span>
        <Star className="w-3 h-3 text-yellow-400" fill="hsl(45 100% 55%)" stroke="hsl(45 100% 55%)" />
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-7 text-right">{count}</span>
    </div>
  );
};

// ── LABEL CONSTANTS ──────────────────────────────────────────────────────────
const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const PAGE_SIZE = 5;

// ── Main Component ───────────────────────────────────────────────────────────
const ProductReviews = ({ productId, productRating, productReviewCount }: {
  productId: string;
  productRating: number;
  productReviewCount: number;
}) => {
  const { user } = useStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    avg: productRating,
    total: productReviewCount,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ── Compute summary from reviews ──────────────────────────────────────────
  const computeSummary = (allReviews: Review[]) => {
    if (allReviews.length === 0) return;
    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let total = 0;
    allReviews.forEach(r => {
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
      total += r.rating;
    });
    setSummary({
      avg: parseFloat((total / allReviews.length).toFixed(1)),
      total: allReviews.length,
      breakdown,
    });
  };

  // ── Fetch all reviews for summary + paginate display ─────────────────────
  const fetchReviews = useCallback(async (currentPage = 1) => {
    setLoading(true);

    // Fetch all for summary
    const { data: allData } = await supabase
      .from('product_reviews')
      .select('*, user_profiles(username, email)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (allData && allData.length > 0) {
      computeSummary(allData as Review[]);
    }

    // Paginated display
    const from = 0;
    const to = currentPage * PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, user_profiles(username, email)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setReviews(data as Review[]);
      setHasMore(data.length === currentPage * PAGE_SIZE && (allData?.length ?? 0) > currentPage * PAGE_SIZE);
    }

    // Find current user's review
    if (user && allData) {
      const myReview = (allData as Review[]).find(r => r.user_id === user.id) || null;
      setUserReview(myReview);
      if (myReview) {
        setFormRating(myReview.rating);
        setFormTitle(myReview.title || '');
        setFormBody(myReview.body);
      }
    }

    setLoading(false);
  }, [productId, user]);

  useEffect(() => {
    fetchReviews(1);
    setPage(1);
  }, [productId, user]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchReviews(next);
  };

  // ── Submit or update review ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (formRating === 0) { toast.error('Please select a star rating'); return; }
    if (formBody.trim().length < 10) { toast.error('Review must be at least 10 characters'); return; }

    setFormSubmitting(true);

    if (editMode && userReview) {
      // Update existing
      const { error } = await supabase
        .from('product_reviews')
        .update({
          rating: formRating,
          title: formTitle.trim() || null,
          body: formBody.trim(),
        })
        .eq('id', userReview.id);

      if (error) {
        toast.error('Failed to update review');
        console.error(error);
      } else {
        toast.success('Review updated!');
        setEditMode(false);
        fetchReviews(page);
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: formRating,
          title: formTitle.trim() || null,
          body: formBody.trim(),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this product. Edit your existing review.');
        } else {
          toast.error('Failed to submit review');
          console.error(error);
        }
      } else {
        toast.success('Review submitted! Thank you.');
        setFormTitle('');
        setFormBody('');
        setFormRating(0);
        fetchReviews(1);
        setPage(1);
      }
    }

    setFormSubmitting(false);
  };

  // ── Delete review ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!userReview) return;
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', userReview.id);

    if (error) {
      toast.error('Failed to delete review');
    } else {
      toast.success('Review deleted');
      setUserReview(null);
      setFormRating(0);
      setFormTitle('');
      setFormBody('');
      setDeleteConfirm(false);
      setEditMode(false);
      fetchReviews(1);
      setPage(1);
    }
  };

  const displayAvg = summary.total > 0 ? summary.avg : productRating;
  const displayTotal = summary.total > 0 ? summary.total : productReviewCount;

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-400" fill="hsl(45 100% 55%)" />
        Customer Reviews
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ── Rating Summary ────────────────────────────────────────────── */}
        <div className="glass gradient-border rounded-2xl p-6 flex flex-col items-center">
          <div className="text-6xl font-bold text-gradient-cyan mb-2">{displayAvg}</div>
          <StarPicker value={Math.round(displayAvg)} size="md" />
          <p className="text-sm text-muted-foreground mt-2 mb-5">
            {displayTotal.toLocaleString('en-IN')} {displayTotal === 1 ? 'review' : 'reviews'}
          </p>
          <div className="w-full space-y-2.5">
            {[5, 4, 3, 2, 1].map(star => (
              <RatingBar
                key={star}
                stars={star}
                count={summary.breakdown[star] || 0}
                total={summary.total}
              />
            ))}
          </div>
        </div>

        {/* ── Write / Edit Review Form ──────────────────────────────────── */}
        <div className="lg:col-span-2">
          {!user ? (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[220px]">
              <MessageSquarePlus className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-semibold mb-1">Share your experience</p>
              <p className="text-sm text-muted-foreground mb-5">
                Sign in to write a review for this product
              </p>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 glow-cyan transition-all"
              >
                Sign In to Review
              </Link>
            </div>
          ) : userReview && !editMode ? (
            /* User's existing review (view mode) */
            <div className="glass gradient-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Your Review</p>
                  <StarPicker value={userReview.rating} size="sm" />
                  {userReview.title && (
                    <p className="font-semibold mt-2">{userReview.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-xs font-medium transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-destructive/10 hover:text-destructive text-xs font-medium transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleDelete}
                        className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium hover:bg-muted/80 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{userReview.body}</p>
              <p className="text-xs text-muted-foreground mt-3">
                Posted on {new Date(userReview.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ) : (
            /* Write / Edit form */
            <form onSubmit={handleSubmit} className="glass gradient-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">
                  {editMode ? 'Edit Your Review' : 'Write a Review'}
                </p>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setFormRating(userReview!.rating); setFormTitle(userReview!.title || ''); setFormBody(userReview!.body); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Your Rating <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <StarPicker value={formRating} onChange={setFormRating} size="lg" />
                  {formRating > 0 && (
                    <span className="text-sm font-medium text-yellow-400 transition-all">
                      {RATING_LABELS[formRating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="review-title" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Review Title <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Summarize your experience..."
                  maxLength={100}
                  className="w-full h-10 px-3 rounded-xl bg-input border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Body */}
              <div>
                <label htmlFor="review-body" className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Your Review <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="review-body"
                  value={formBody}
                  onChange={e => setFormBody(e.target.value)}
                  placeholder="Tell others about your experience with this product... (min. 10 characters)"
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  {formBody.trim().length > 0 && formBody.trim().length < 10 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> At least 10 characters required
                    </p>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{formBody.length}/1000</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={formSubmitting || formRating === 0}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {formSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-4 h-4" /> {editMode ? 'Update Review' : 'Submit Review'}</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Review List ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <MessageSquarePlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">No reviews yet</p>
          <p className="text-sm text-muted-foreground">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, idx) => {
            const isOwn = user?.id === review.user_id;
            const name = review.user_profiles?.username || review.user_profiles?.email?.split('@')[0] || 'Anonymous';
            return (
              <div
                key={review.id}
                className={`glass rounded-xl p-5 transition-all animate-slide-in ${isOwn ? 'border border-primary/25' : ''}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={review.user_profiles?.username} email={review.user_profiles?.email || ''} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{name}</p>
                          {isOwn && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/25">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StarPicker value={review.rating} size="sm" />
                        <span className="text-xs font-bold text-yellow-400">{RATING_LABELS[review.rating]}</span>
                      </div>
                    </div>

                    {review.title && (
                      <p className="font-semibold text-sm mt-2">{review.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{review.body}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <ChevronDown className="w-4 h-4" /> Load more reviews
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default ProductReviews;
