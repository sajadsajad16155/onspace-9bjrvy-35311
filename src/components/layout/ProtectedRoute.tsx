import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface Props {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(218,56%,5%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 opacity-20" style={{ borderColor: 'hsl(189,100%,50%)' }} />
            <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: 'hsl(189,100%,50%)' }} />
          </div>
          <div className="text-xs tracking-widest uppercase animate-pulse" style={{ color: 'hsl(189,100%,50%)' }}>
            AUTHENTICATING...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
