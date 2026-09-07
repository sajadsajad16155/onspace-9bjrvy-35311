import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen intel-grid flex items-center justify-center p-4" style={{ background: 'hsl(218,56%,5%)' }}>
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="text-8xl font-bold font-mono opacity-10" style={{ color: 'hsl(189,100%,50%)' }}>404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-14 h-14 opacity-30" style={{ color: 'hsl(189,100%,50%)' }} />
            </div>
          </div>
        </div>
        <div className="text-xs tracking-[0.3em] uppercase font-mono mb-2" style={{ color: 'hsl(354,100%,61%)' }}>
          ACCESS DENIED — ROUTE NOT FOUND
        </div>
        <div className="text-lg font-semibold mb-1" style={{ color: 'hsl(195,100%,85%)' }}>الصفحة غير موجودة</div>
        <p className="text-sm mb-6" style={{ color: 'hsl(215,15%,55%)' }}>
          المسار المطلوب غير موجود في هذا النظام
        </p>
        <button onClick={() => navigate('/')} className="btn-intel">
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
