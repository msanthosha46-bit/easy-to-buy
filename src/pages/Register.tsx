import React, { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Mail, Lock, User, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useStore } from '@/stores/storeContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
}

const OtpInput = ({ value, onChange, length = 4, disabled, error }: OtpInputProps) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);
  const handleChange = (i: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[i] = digit;
    onChange(newDigits.join(''));
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };
  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[i] && i > 0) {
        refs.current[i - 1]?.focus();
        const newDigits = [...digits];
        newDigits[i - 1] = '';
        onChange(newDigits.join(''));
      } else {
        const newDigits = [...digits];
        newDigits[i] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    const focusIdx = Math.min(pasted.length, length - 1);
    setTimeout(() => refs.current[focusIdx]?.focus(), 0);
  };
  return (
    <div className={cn('flex gap-3 justify-center', error && 'animate-shake')}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onClick={() => refs.current[i]?.select()}
          disabled={disabled}
          className={cn(
            'w-14 h-14 text-center text-2xl font-bold rounded-xl bg-input border-2 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-destructive focus:border-destructive focus:ring-destructive/30 text-destructive'
              : digits[i]
              ? 'border-primary text-primary'
              : 'border-border focus:border-primary'
          )}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const TOAST_STYLE = { background: 'hsl(220 20% 10%)', border: '1px solid hsl(187 100% 50% / 0.4)', color: 'white' };

type Step = 'info' | 'otp' | 'password';

const CountdownTimer = ({ seconds, onExpire }: { seconds: number; onExpire: () => void }) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => { setRemaining(seconds); }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const pct = (remaining / seconds) * 100;
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r={radius} fill="none" stroke="hsl(215 20% 20%)" strokeWidth="2.5" />
          <circle cx="14" cy="14" r={radius} fill="none" stroke="hsl(187 100% 50%)" strokeWidth="2.5"
            strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">{remaining}</span>
      </div>
      <span>Resend code in {remaining}s</span>
    </div>
  );
};

const StepIndicator = ({ step }: { step: Step }) => {
  const steps = [
    { key: 'info', label: 'Details' },
    { key: 'otp', label: 'Verify' },
    { key: 'password', label: 'Secure' },
  ] as const;
  const current = steps.findIndex(s => s.key === step);

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current ? 'bg-primary text-primary-foreground' :
              i === current ? 'bg-primary text-primary-foreground animate-pulse-glow' :
              'bg-muted text-muted-foreground border border-border'
            }`}>
              {i < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] font-medium ${i === current ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 mb-4 transition-all ${i < current ? 'bg-primary' : 'bg-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useStore();

  const [step, setStep] = useState<Step>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendKey, setResendKey] = useState(0);

  // --- Step 1: send OTP ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = 'Enter your full name (min 2 characters)';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) { toast.error(error.message); setLoading(false); return; }

    setLoading(false);
    setStep('otp');
    setOtp('');
    setCanResend(false);
    setResendKey(k => k + 1);
    toast.success('OTP sent! Check your email.', { style: TOAST_STYLE });
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setLoading(false);
    setOtp('');
    setOtpError(false);
    setCanResend(false);
    setResendKey(k => k + 1);
    toast.success('New OTP sent!', { style: TOAST_STYLE });
  };

  // --- Step 2: verify OTP → go to password ---
  const handleVerifyOtp = async () => {
    if (otp.length < 4) { setOtpError(true); setTimeout(() => setOtpError(false), 600); return; }
    setLoading(true);

    // Verify OTP — this signs in the user temporarily; we'll then update password
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) {
      toast.error('Invalid or expired OTP. Please try again.');
      setOtpError(true);
      setTimeout(() => setOtpError(false), 600);
      setOtp('');
      setLoading(false);
      return;
    }

    console.log('OTP verified, user:', data.user?.email);
    setLoading(false);
    setStep('password');
  };

  // --- Step 3: set password ---
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password || password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (password !== confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      password,
      data: { full_name: name.trim(), username: name.trim() },
    });

    if (error) { toast.error(error.message); setLoading(false); return; }

    if (data.user) {
      login({ id: data.user.id, name: name.trim(), email });
      toast.success('Account created! Welcome to NexShop.', { style: TOAST_STYLE });
      navigate('/');
    }
  };

  const passwordStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  };
  const strength = passwordStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', 'bg-destructive', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-400'][strength];

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { access_type: 'offline', prompt: 'consent' }, skipBrowserRedirect: false },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden py-8">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse-glow">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="orbitron text-2xl font-bold text-gradient-cyan">NEXSHOP</span>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm">Join millions of smart shoppers</p>
        </div>

        <div className="glass gradient-border rounded-2xl p-8">
          <StepIndicator step={step} />

          {/* Step 1 — Info + OTP send */}
          {step === 'info' && (
            <>
              <button onClick={handleGoogleLogin} disabled={googleLoading || loading}
                className="w-full h-11 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-3 mb-5 disabled:opacity-60 border border-gray-200">
                {googleLoading ? <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-gray-800 animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or register with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <form onSubmit={handleSendOtp} noValidate className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                      className={`w-full h-11 pl-10 pr-4 rounded-xl bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${errors.name ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`} />
                  </div>
                  {errors.name && <p className="mt-1.5 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                      className={`w-full h-11 pl-10 pr-4 rounded-xl bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${errors.email ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`} />
                  </div>
                  {errors.email && <p className="mt-1.5 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
                  <p className="mt-1.5 text-xs text-muted-foreground">We'll send a 4-digit verification code</p>
                </div>
                <button type="submit" disabled={loading || googleLoading}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 glow-cyan flex items-center justify-center gap-2 mt-2">
                  {loading ? <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Sending OTP...</> : 'Send Verification Code →'}
                </button>
              </form>
            </>
          )}

          {/* Step 2 — OTP verification */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setStep('info')} className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-muted transition-colors" aria-label="Back">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <p className="text-sm font-medium">Enter your OTP</p>
                  <p className="text-xs text-muted-foreground">Sent to <span className="text-primary">{email}</span></p>
                </div>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm font-medium">Check your inbox</p>
                <p className="text-xs text-muted-foreground mt-1">Enter the 4-digit code we sent you</p>
              </div>

              <OtpInput value={otp} onChange={setOtp} length={4} disabled={loading} error={otpError} />

              <button onClick={handleVerifyOtp} disabled={loading || otp.length < 4}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 glow-cyan flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Verifying...</> : <><CheckCircle2 className="w-4 h-4" /> Verify Code</>}
              </button>

              <div className="flex items-center justify-center">
                {canResend ? (
                  <button onClick={handleResend} disabled={loading}
                    className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-60">
                    <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                  </button>
                ) : (
                  <CountdownTimer key={resendKey} seconds={60} onExpire={() => setCanResend(true)} />
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Set password */}
          {step === 'password' && (
            <div className="space-y-1">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-green-400" />
                </div>
                <p className="text-sm font-medium">Email Verified!</p>
                <p className="text-xs text-muted-foreground mt-1">Now set a secure password for <span className="text-primary">{email}</span></p>
              </div>

              <form onSubmit={handleSetPassword} noValidate className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password"
                      className={`w-full h-11 pl-10 pr-12 rounded-xl bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${errors.password ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`} />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-muted'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{strengthLabel}</p>
                    </div>
                  )}
                  {errors.password && <p className="mt-1.5 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input id="confirm" type="password" value={confirm}
                      onChange={e => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password"
                      className={`w-full h-11 pl-10 pr-12 rounded-xl bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${errors.confirm ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`} />
                    {confirm && password === confirm && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                  </div>
                  {errors.confirm && <p className="mt-1.5 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.confirm}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 glow-cyan flex items-center justify-center gap-2 mt-2">
                  {loading ? <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Creating account...</> : 'Complete Registration 🎉'}
                </button>
              </form>
            </div>
          )}

          {step === 'info' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
