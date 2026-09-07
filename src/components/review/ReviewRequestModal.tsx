import { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ReviewReason } from '@/types';

interface Props {
  resultId?: string;
  personId?: string;
  resultTitle?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const reasons: { value: ReviewReason; label: string }[] = [
  { value: 'incorrect_content', label: 'المحتوى غير صحيح' },
  { value: 'wrong_person', label: 'النتيجة تخص شخصًا آخر' },
  { value: 'outdated_content', label: 'المحتوى قديم وغير ذي صلة' },
  { value: 'privacy_concern', label: 'مخاوف تتعلق بالخصوصية' },
  { value: 'misleading_classification', label: 'التصنيف بالذكاء الاصطناعي مضلل' },
  { value: 'other', label: 'سبب آخر' },
];

export default function ReviewRequestModal({ resultId, personId, resultTitle, onClose, onSubmitted }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [requestNumber, setRequestNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.fullName || user?.username || '',
    email: user?.email || '',
    reason: '' as ReviewReason | '',
    details: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason) { toast.error('الرجاء اختيار سبب الطلب'); return; }
    if (!user) { toast.error('يجب تسجيل الدخول أولاً'); return; }

    setLoading(true);
    const reqNum = `REQ-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const { error } = await supabase.from('review_requests').insert({
      request_number: reqNum,
      user_id: user.id,
      person_id: personId,
      result_id: resultId,
      requester_name: form.name,
      requester_email: form.email,
      reason: form.reason,
      details: form.details,
      status: 'pending',
    });

    setLoading(false);

    if (error) {
      console.error('Review request error:', error);
      toast.error('حدث خطأ أثناء إرسال الطلب');
      return;
    }

    setRequestNumber(reqNum);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md intel-panel-primary rounded-lg overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'hsl(218,40%,18%)', background: 'hsl(218,50%,7%)' }}>
          <div>
            <div className="text-xs tracking-widest uppercase mb-0.5" style={{ color: 'hsl(189,100%,50%)' }}>
              CONTENT REVIEW REQUEST
            </div>
            <div className="text-sm font-semibold" style={{ color: 'hsl(195,100%,90%)' }}>
              طلب مراجعة المحتوى
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" style={{ color: 'hsl(215,15%,60%)' }} />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {resultTitle && (
              <div className="p-3 rounded text-xs"
                style={{ background: 'hsla(218,40%,12%,0.8)', border: '1px solid hsl(218,40%,20%)', color: 'hsl(215,20%,65%)' }}>
                <span style={{ color: 'hsl(215,15%,50%)' }}>النتيجة: </span>
                {resultTitle.length > 80 ? resultTitle.slice(0, 80) + '...' : resultTitle}
              </div>
            )}

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'hsl(215,15%,60%)' }}>الاسم</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="intel-input" placeholder="اسمك" required />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'hsl(215,15%,60%)' }}>البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="intel-input" placeholder="your@email.com" required />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'hsl(215,15%,60%)' }}>سبب الطلب *</label>
              <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value as ReviewReason }))}
                className="intel-input" required>
                <option value="">-- اختر السبب --</option>
                {reasons.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'hsl(215,15%,60%)' }}>تفاصيل إضافية</label>
              <textarea value={form.details} onChange={e => setForm(p => ({ ...p, details: e.target.value }))}
                className="intel-input resize-none" rows={3} placeholder="أي تفاصيل إضافية تساعد في مراجعة الطلب..." />
            </div>

            <button type="submit" disabled={loading} className="btn-intel-primary w-full">
              {loading ? 'جاري الإرسال...' : 'SUBMIT REQUEST'}
            </button>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12" style={{ color: 'hsl(160,100%,50%)' }} />
            </div>
            <div>
              <div className="text-base font-semibold mb-1" style={{ color: 'hsl(160,100%,60%)' }}>
                REQUEST RECEIVED ✓
              </div>
              <div className="text-sm" style={{ color: 'hsl(215,20%,65%)' }}>
                تم استلام طلبك بنجاح
              </div>
            </div>
            <div className="p-4 rounded-lg text-right space-y-2"
              style={{ background: 'hsla(160,100%,50%,0.05)', border: '1px solid hsla(160,100%,50%,0.2)' }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'hsl(215,15%,50%)' }}>رقم الطلب:</span>
                <span className="font-mono font-bold" style={{ color: 'hsl(160,100%,60%)' }}>{requestNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: 'hsl(215,15%,50%)' }}>الحالة:</span>
                <span className="badge-pending">PENDING REVIEW</span>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'hsl(215,15%,55%)' }}>
              يمكنك متابعة حالة طلبك من قسم "طلباتي"
            </p>
            <button onClick={onSubmitted} className="btn-intel w-full">
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
