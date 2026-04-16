import React, { useState, useEffect, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Zap, Mail, Lock, AlertCircle, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { useStore } from '@/stores/storeContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const OtpInputInline = ({ value, onChange, length = 4, disabled, error }: { value: string; onChange: (val: string) => void; length?: number; disabled?: boolean; error?: boolean }) => {
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
        const nd = [...digits]; nd[i - 1] = ''; onChange(nd.join(''));
      } else {
        const nd = [...digits]; nd[i] = ''; onChange(nd.join(''));
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    setTimeout(() => refs.current[Math.min(pasted.length, length - 1)]?.focus(), 0);
  };
  return (
    <div className={cn('flex gap-3 justify-center', error && 'animate-shake')}>
      {Array.from({ length }).map((_, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }}
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1}
          value={digits[i] || ''} onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
          onClick={() => refs.current[i]?.select()} disabled={disabled}
          className={cn('w-14 h-14 text-center text-2xl font-bold rounded-xl bg-input border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-destructive text-destructive' : digits[i] ? 'border-primary text-primary' : 'border-border focus:border-primary')}
          aria-label={`OTP digit ${i + 1}`} />
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

type LoginMode = 'password' | 'otp';
type OtpStep = 'email' | 'verify';

const CountdownTimer = ({ seconds, onExpire }: { seconds: number; onExpire: () => void }) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

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
          <circle
            cx="14" cy="14" r={radius} fill="none"
            stroke="hsl(187 100% 50%)" strokeWidth="2.5"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
          {remaining}
        </span>
      </div>
      <span>Resend code in {remaining}s</span>
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';
  const { login } = useStore();

  // Password login state
  const [pwForm, setPwForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);

  // OTP login state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendKey, setResendKey] = useState(0);

  const [mode, setMode] = useState<LoginMode>('password');
  const [googleLoading, setGoogleLoading] = useState(false);

  // --- Password login ---
  const validatePw = () => {
    const errs: Record<string, string> = {};
    if (!pwForm.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pwForm.email)) errs.email = 'Enter a valid email';
    if (!pwForm.password) errs.password = 'Password is required';
    else if (pwForm.password.length < 6) errs.password = 'Minimum 6 characters';
    return errs;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: pwForm.email, password: pwForm.password });
    if (error) { toast.error(error.message); setPwLoading(false); return; }
    if (data.user) {
      login({
        id: data.user.id,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.username || data.user.email!.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email: data.user.email!,
      });
      navigate(returnTo);
    }
  };

  // --- OTP login ---
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!otpEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      toast.error('Enter a valid email address');
      return;
    }
    setOtpLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: otpEmail, options: { shouldCreateUser: true } });
    if (error) { toast.error(error.message); setOtpLoading(false); return; }
    setOtpLoading(false);
    setOtpStep('verify');
    setOtp('');
    setCanResend(false);
    setResendKey(k => k + 1);
    toast.success('OTP sent! Check your email.', { style: TOAST_STYLE });
  };

  const handleResend = async () => {
    if (!canResend) return;
    setOtpLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: otpEmail, options: { shouldCreateUser: true } });
    if (error) { toast.error(error.message); setOtpLoading(false); return; }
    setOtpLoading(false);
    setOtp('');
    setOtpError(false);
    setCanResend(false);
    setResendKey(k => k + 1);
    toast.success('New OTP sent!', { style: TOAST_STYLE });
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) { setOtpError(true); setTimeout(() => setOtpError(false), 600); return; }
    setOtpLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ email: otpEmail, token: otp, type: 'email' });
    if (error) {
      toast.error('Invalid or expired OTP. Please try again.');
      setOtpError(true);
      setTimeout(() => setOtpError(false), 600);
      setOtp('');
      setOtpLoading(false);
      return;
    }
    if (data.user) {
      login({
        id: data.user.id,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.username || data.user.email!.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email: data.user.email!,
      });
      navigate(returnTo);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { access_type: 'offline', prompt: 'consent' }, skipBrowserRedirect: false },
    });
    if (error) { toast.error(error.message); setGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse-glow">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="orbitron text-2xl font-bold text-gradient-cyan">NEXSHOP</span>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
        </div>

        <div className="glass gradient-border rounded-2xl p-8">
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || pwLoading || otpLoading}
            className="w-full h-11 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-3 mb-5 disabled:opacity-60 border border-gray-200"
          >
            {googleLoading ? <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-gray-800 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Mode toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-5">
            {(['password', 'otp'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setOtpStep('email'); setOtp(''); setPwErrors({}); }}
                className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${
                  mode === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'password' ? '🔑 Password' : '📧 Email OTP'}
              </button>
            ))}
          </div>

          {/* Password mode */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="email" type="email" value={pwForm.email}
                    onChange={e => setPwForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com" autoComplete="email"
                    className={`w-full h-11 pl-10 pr-4 rounded-xl bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${pwErrors.email ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                  />
                </div>
                {pwErrors.email && <p className="mt-1.5 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {pwErrors.email}</p>}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="password" type={showPassword ? 'text' : 'password'} value={pwForm.password}
                    onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••" autoComplete="current-password"
                    className={`w-full h-11 pl-10 pr-12 rounded-xl bg-input border text-sm focus:outline-none focus:ring-1 transition-all ${pwErrors.password ? 'border-destructive focus:ring-destructive' : 'border-border focus:border-primary focus:ring-primary'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors.password && <p className="mt-1.5 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {pwErrors.password}</p>}
              </div>
              <button type="submit" disabled={pwLoading || googleLoading}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 glow-cyan flex items-center justify-center gap-2">
                {pwLoading ? <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          )}

          {/* OTP mode */}
          {mode === 'otp' && (
            <div className="space-y-5">
              {otpStep === 'email' ? (
                <form onSubmit={handleSendOtp} noValidate className="space-y-5">
                  <div>
                    <label htmlFor="otp-email" className="block text-sm font-medium mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input id="otp-email" type="email" value={otpEmail}
                        onChange={e => setOtpEmail(e.target.value)}
                        placeholder="you@example.com" autoComplete="email"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-input border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm focus:outline-none transition-all"
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">We'll send a 4-digit code to this email</p>
                  </div>
                  <button type="submit" disabled={otpLoading || googleLoading}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 glow-cyan flex items-center justify-center gap-2">
                    {otpLoading ? <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Sending...</> : 'Send OTP →'}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Back + info */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setOtpStep('email'); setOtp(''); }} className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-muted transition-colors" aria-label="Back">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <p className="text-sm font-medium">Check your inbox</p>
                      <p className="text-xs text-muted-foreground">Sent to <span className="text-primary">{otpEmail}</span></p>
                    </div>
                  </div>

                  {/* OTP boxes */}
                  <div>
                    <p className="text-center text-sm font-medium mb-4">Enter 4-digit verification code</p>
                    <OtpInputInline value={otp} onChange={setOtp} length={4} disabled={otpLoading} error={otpError} />
                  </div>

                  {/* Verify button */}
                  <button onClick={handleVerifyOtp} disabled={otpLoading || otp.length < 4}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 glow-cyan flex items-center justify-center gap-2">
                    {otpLoading ? <><span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> Verifying...</> : <><CheckCircle2 className="w-4 h-4" /> Verify & Sign In</>}
                  </button>

                  {/* Countdown / resend */}
                  <div className="flex items-center justify-center">
                    {canResend ? (
                      <button onClick={handleResend} disabled={otpLoading}
                        className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-60">
                        <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                      </button>
                    ) : (
                      <CountdownTimer key={resendKey} seconds={60} onExpire={() => setCanResend(true)} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
