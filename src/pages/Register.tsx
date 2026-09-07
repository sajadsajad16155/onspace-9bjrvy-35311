import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { sendOtp, verifyOtpAndSetPassword, fetchUserProfile } from '@/lib/auth';
import { mapSupabaseUser } from '@/lib/auth';
import { toast } from 'sonner';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

type Step = 'email' | 'otp' | 'password';

export default function Register() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    email: '', fullName: '', otp: '', password: '', confirmPassword: '',
  });

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) { toast.error('أدخل البريد الإلكتروني'); return; }
    setSubmitting(true);
    try {
      await sendOtp(form.email);
      toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      setStep('otp');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل إرسال رمز التحقق');
    }
    setSubmitting(false);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.otp.length < 4) { toast.error('أدخل رمز التحقق المكون من 4 أرقام'); return; }
    setStep('password');
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (form.password !== form.confirmPassword) { toast.error('كلمتا المرور غير متطابقتين'); return; }
    setSubmitting(true);
    try {
      const supabaseUser = await verifyOtpAndSetPassword(form.email, form.otp, form.password, form.fullName);
      const profile = await fetchUserProfile(supabaseUser!.id);
      login(mapSupabaseUser(supabaseUser!, profile || undefined));
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إنشاء الحساب';
      toast.error(msg.includes('expired') || msg.includes('invalid') ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' : msg);
      setStep('otp');
    }
    setSubmitting(false);
  };

  const stepTitles: Record<Step, { en: string; ar: string }> = {
    email: { en: 'NEW OPERATOR REGISTRATION', ar: 'تسجيل حساب جديد' },
    otp: { en: 'VERIFY IDENTITY', ar: 'التحقق من الهوية' },
    password: { en: 'SET ACCESS CODE', ar: 'تعيين كلمة المرور' },
  };

  return (
    <div className="min-h-screen intel-grid flex items-center justify-center p-4"
      style={{ background: 'hsl(218,56%,5%)' }}>
      <div className="w-full max-w-md">
        <div className="intel-panel-primary rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b text-center"
            style={{ background: 'hsl(218,50%,7%)', borderColor: 'hsla(189,100%,50%,0.2)' }}>
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 flex items-center justify-center rounded-full"
                style={{ background: 'hsla(189,100%,50%,0.08)', border: '2px solid hsla(189,100%,50%,0.3)' }}>
                <Shield className="w-6 h-6" style={{ color: 'hsl(189,100%,50%)' }} />
              </div>
            </div>
            <div className="text-xs tracking-[0.25em] uppercase font-mono mb-0.5" style={{ color: 'hsl(189,100%,50%)' }}>
              {stepTitles[step].en}
            </div>
            <div className="text-sm font-semibold" style={{ color: 'hsl(195,100%,85%)' }}>
              {stepTitles[step].ar}
            </div>
            {/* Steps indicator */}
            <div className="flex justify-center gap-2 mt-3">
              {(['email', 'otp', 'password'] as Step[]).map((s, i) => (
                <div key={s} className="w-6 h-1 rounded-full transition-all"
                  style={{
                    background: s === step ? 'hsl(189,100%,50%)' :
                      ['email', 'otp', 'password'].indexOf(step) > i ? 'hsl(160,100%,50%)' : 'hsl(218,40%,20%)',
                  }} />
              ))}
            </div>
          </div>

          <div className="p-6">
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(189,100%,50%)' }}>
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(215,15%,50%)' }} />
                    <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                      className="intel-input pr-10" placeholder="أدخل اسمك الكامل" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(189,100%,50%)' }}>
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(215,15%,50%)' }} />
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="intel-input pr-10" placeholder="your@email.com" dir="ltr" required />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-intel-primary w-full mt-2">
                  {submitting ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded text-xs text-center"
                  style={{ background: 'hsla(189,100%,50%,0.05)', border: '1px solid hsla(189,100%,50%,0.15)', color: 'hsl(189,100%,70%)' }}>
                  تم إرسال رمز التحقق إلى<br />
                  <span className="font-mono font-bold">{form.email}</span>
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(189,100%,50%)' }}>
                    رمز التحقق (4 أرقام)
                  </label>
                  <input value={form.otp} onChange={e => setForm(p => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    className="intel-input text-center font-mono text-2xl tracking-[0.5em]"
                    placeholder="0000" maxLength={4} required dir="ltr" />
                </div>
                <button type="submit" className="btn-intel-primary w-full">
                  التحقق والمتابعة
                </button>
                <button type="button" onClick={() => { sendOtp(form.email); toast.success('تم إعادة الإرسال'); }}
                  className="w-full text-xs text-center hover:underline" style={{ color: 'hsl(215,15%,55%)' }}>
                  إعادة إرسال الرمز
                </button>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(189,100%,50%)' }}>
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(215,15%,50%)' }} />
                    <input type={showPw ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="intel-input pr-10 pl-10" placeholder="6 أحرف على الأقل" dir="ltr" required />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute left-3 top-1/2 -translate-y-1/2">
                      {showPw ? <EyeOff className="w-4 h-4" style={{ color: 'hsl(215,15%,50%)' }} /> : <Eye className="w-4 h-4" style={{ color: 'hsl(215,15%,50%)' }} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(189,100%,50%)' }}>
                    تأكيد كلمة المرور
                  </label>
                  <input type="password" value={form.confirmPassword}
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="intel-input" placeholder="أعد إدخال كلمة المرور" dir="ltr" required />
                </div>
                <button type="submit" disabled={submitting} className="btn-intel-primary w-full mt-2">
                  {submitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                </button>
              </form>
            )}

            <div className="text-center text-xs pt-4" style={{ color: 'hsl(215,15%,50%)' }}>
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="font-medium hover:underline" style={{ color: 'hsl(189,100%,60%)' }}>
                تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
