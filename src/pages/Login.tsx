import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithPassword } from '@/lib/auth';
import { mapSupabaseUser, fetchUserProfile } from '@/lib/auth';
import { toast } from 'sonner';
import { Shield, Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bootSeq, setBootSeq] = useState(0);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setBootSeq(p => p < 4 ? p + 1 : p), 400);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('الرجاء إدخال البريد الإلكتروني وكلمة المرور'); return; }
    setSubmitting(true);
    try {
      const supabaseUser = await signInWithPassword(form.email, form.password);
      const profile = await fetchUserProfile(supabaseUser.id);
      login(mapSupabaseUser(supabaseUser, profile || undefined));
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      toast.error(msg.includes('Invalid') ? 'بيانات الدخول غير صحيحة' : msg);
      setSubmitting(false);
    }
  };

  const bootLines = [
    '> INITIALIZING SECURE TERMINAL...',
    '> LOADING INTELLIGENCE PROTOCOLS...',
    '> ESTABLISHING ENCRYPTED CONNECTION...',
    '> AUTHENTICATION MODULE READY.',
  ];

  return (
    <div className="min-h-screen intel-grid flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'hsl(218,56%,5%)' }}>
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-px h-px rounded-full animate-pulse"
            style={{
              background: 'hsl(189,100%,50%)',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0.2 + Math.random() * 0.4,
            }} />
        ))}
      </div>

      <div className="w-full max-w-md relative">
        {/* Boot sequence */}
        <div className="mb-6 font-mono text-[11px] space-y-1" style={{ color: 'hsla(189,100%,50%,0.5)' }}>
          {bootLines.slice(0, bootSeq).map((line, i) => (
            <div key={i} className="animate-fade-in-up">{line}</div>
          ))}
        </div>

        <div className="intel-panel-primary rounded-lg overflow-hidden">
          {/* Terminal header */}
          <div className="px-6 py-4 border-b text-center"
            style={{ background: 'hsl(218,50%,7%)', borderColor: 'hsla(189,100%,50%,0.2)' }}>
            <div className="flex justify-center mb-3">
              <div className="relative w-14 h-14 flex items-center justify-center rounded-full"
                style={{ background: 'hsla(189,100%,50%,0.08)', border: '2px solid hsla(189,100%,50%,0.3)' }}>
                <Shield className="w-7 h-7" style={{ color: 'hsl(189,100%,50%)' }} />
                <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ background: 'hsl(189,100%,50%)' }} />
              </div>
            </div>
            <div className="text-xs tracking-[0.3em] uppercase font-mono mb-1" style={{ color: 'hsl(189,100%,50%)' }}>
              SECURE SYSTEM ACCESS
            </div>
            <div className="text-[11px] tracking-widest" style={{ color: 'hsl(215,15%,55%)' }}>
              IDENTIFICATION REQUIRED
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(189,100%,50%)' }}>
                ID / EMAIL
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(215,15%,50%)' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="intel-input pr-10"
                  placeholder="your@email.com"
                  autoComplete="email"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(189,100%,50%)' }}>
                ACCESS CODE / PASSWORD
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(215,15%,50%)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="intel-input pr-10 pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  dir="ltr"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute left-3 top-1/2 -translate-y-1/2">
                  {showPw
                    ? <EyeOff className="w-4 h-4" style={{ color: 'hsl(215,15%,50%)' }} />
                    : <Eye className="w-4 h-4" style={{ color: 'hsl(215,15%,50%)' }} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-intel-primary w-full mt-6">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : (
                '[ ACCESS SYSTEM ]'
              )}
            </button>

            <div className="text-center text-xs pt-2" style={{ color: 'hsl(215,15%,50%)' }}>
              ليس لديك حساب؟{' '}
              <Link to="/register" className="font-medium hover:underline" style={{ color: 'hsl(189,100%,60%)' }}>
                تسجيل جديد
              </Link>
            </div>
          </form>

          <div className="px-6 py-3 border-t text-center"
            style={{ borderColor: 'hsla(189,100%,50%,0.1)', background: 'hsla(189,100%,50%,0.02)' }}>
            <div className="text-[10px] font-mono animate-blink" style={{ color: 'hsla(189,100%,50%,0.4)' }}>
              ■ SECURE CONNECTION ESTABLISHED ■
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-[11px]" style={{ color: 'hsl(215,15%,40%)' }}>
          منظومة مراقبة | Intelligence Media Monitoring Platform
        </div>
      </div>
    </div>
  );
}
