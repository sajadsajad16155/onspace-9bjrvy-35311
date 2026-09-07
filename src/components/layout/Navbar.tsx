import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';
import { toast } from 'sonner';
import { Shield, Search, FileText, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    logout();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 border-b" style={{
      background: 'hsl(218, 50%, 7%)',
      borderColor: 'hsl(218, 40%, 15%)',
    }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 flex items-center justify-center rounded"
              style={{ background: 'hsla(189,100%,50%,0.1)', border: '1px solid hsla(189,100%,50%,0.4)' }}>
              <Shield className="w-4 h-4" style={{ color: 'hsl(189,100%,50%)' }} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider" style={{ color: 'hsl(189,100%,50%)' }}>
                منظومة مراقبة
              </div>
              <div className="text-[10px] tracking-widest uppercase opacity-50" style={{ color: 'hsl(189,100%,70%)' }}>
                INTELLIGENCE PLATFORM
              </div>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" active={isActive('/')} icon={<Search className="w-3.5 h-3.5" />} label="بحث" />
            <NavLink to="/requests" active={isActive('/requests')} icon={<FileText className="w-3.5 h-3.5" />} label="طلباتي" />
            {user.role === 'admin' && (
              <NavLink to="/admin" active={location.pathname.startsWith('/admin')} icon={<Settings className="w-3.5 h-3.5" />} label="الإدارة" />
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 px-3 py-2 rounded transition-all"
              style={{
                background: menuOpen ? 'hsla(189,100%,50%,0.08)' : 'transparent',
                border: '1px solid',
                borderColor: menuOpen ? 'hsla(189,100%,50%,0.3)' : 'transparent',
              }}
            >
              <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
                style={{ background: 'hsla(189,100%,50%,0.15)', color: 'hsl(189,100%,50%)' }}>
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-xs font-medium" style={{ color: 'hsl(189,100%,80%)' }}>{user.username}</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: user.role === 'admin' ? 'hsl(38,100%,56%)' : 'hsl(215,15%,55%)' }}>
                  {user.role === 'admin' ? 'ADMIN' : 'USER'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 opacity-60" style={{ color: 'hsl(189,100%,50%)' }} />
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 rounded shadow-2xl z-50 overflow-hidden"
                style={{ background: 'hsl(218,50%,8%)', border: '1px solid hsl(218,40%,18%)' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'hsl(218,40%,15%)' }}>
                  <div className="text-sm font-medium" style={{ color: 'hsl(195,100%,90%)' }}>{user.email}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'hsl(215,15%,55%)' }}>
                    {user.role === 'admin' ? '● ADMIN ACCESS' : '● STANDARD USER'}
                  </div>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { navigate('/'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-right transition-colors hover:bg-white/5"
                    style={{ color: 'hsl(195,100%,80%)' }}
                  >
                    <Search className="w-4 h-4 opacity-60" />
                    بحث جديد
                  </button>
                  <button
                    onClick={() => { navigate('/requests'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-right transition-colors hover:bg-white/5"
                    style={{ color: 'hsl(195,100%,80%)' }}
                  >
                    <FileText className="w-4 h-4 opacity-60" />
                    طلبات المراجعة
                  </button>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => { navigate('/admin'); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-right transition-colors hover:bg-white/5"
                      style={{ color: 'hsl(38,100%,60%)' }}
                    >
                      <Settings className="w-4 h-4 opacity-60" />
                      لوحة الإدارة
                    </button>
                  )}
                  <div className="my-1 border-t" style={{ borderColor: 'hsl(218,40%,15%)' }} />
                  <button
                    onClick={() => { handleSignOut(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-right transition-colors hover:bg-red-500/10"
                    style={{ color: 'hsl(354,100%,61%)' }}
                  >
                    <LogOut className="w-4 h-4 opacity-60" />
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}
    </nav>
  );
}

function NavLink({ to, active, icon, label }: { to: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-all"
      style={{
        color: active ? 'hsl(189,100%,50%)' : 'hsl(215,20%,65%)',
        background: active ? 'hsla(189,100%,50%,0.08)' : 'transparent',
        borderBottom: active ? '1px solid hsl(189,100%,50%)' : '1px solid transparent',
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
