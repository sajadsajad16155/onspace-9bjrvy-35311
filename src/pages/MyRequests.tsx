import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewRequest } from '@/types';
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const statusConfig = {
  pending: { label: 'قيد الانتظار', icon: <Clock className="w-3 h-3" />, cls: 'badge-pending' },
  reviewing: { label: 'قيد المراجعة', icon: <Clock className="w-3 h-3 animate-spin" />, cls: 'badge-pending' },
  approved: { label: 'تمت الموافقة', icon: <CheckCircle className="w-3 h-3" />, cls: 'badge-positive' },
  rejected: { label: 'مرفوض', icon: <XCircle className="w-3 h-3" />, cls: 'badge-negative' },
};

const reasonLabels: Record<string, string> = {
  incorrect_content: 'المحتوى غير صحيح',
  wrong_person: 'النتيجة تخص شخصًا آخر',
  outdated_content: 'محتوى قديم',
  privacy_concern: 'مخاوف تتعلق بالخصوصية',
  misleading_classification: 'تصنيف مضلل',
  other: 'سبب آخر',
};

export default function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('review_requests')
      .select('*, result:results(title, source_name, source_url), person:persons(full_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRequests(data as ReviewRequest[]);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(218,56%,5%)' }}>
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5" style={{ color: 'hsl(189,100%,50%)' }} />
          <div>
            <div className="text-[10px] tracking-widest uppercase mb-0.5" style={{ color: 'hsl(189,100%,50%)' }}>
              MY REVIEW REQUESTS
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'hsl(195,100%,92%)' }}>طلبات المراجعة</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(189,100%,50%)' }} />
          </div>
        ) : requests.length === 0 ? (
          <div className="intel-panel p-12 text-center rounded-lg">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'hsl(189,100%,50%)' }} />
            <div className="text-sm font-semibold mb-1" style={{ color: 'hsl(215,15%,60%)' }}>
              لا توجد طلبات مراجعة
            </div>
            <div className="text-xs" style={{ color: 'hsl(215,15%,45%)' }}>
              يمكنك طلب مراجعة أي نتيجة من خلال أيقونة العلم في بطاقة النتيجة
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const status = statusConfig[req.status] || statusConfig.pending;
              return (
                <div key={req.id} className="intel-panel p-5 rounded-lg" style={{ borderColor: 'hsl(218,40%,18%)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs font-bold" style={{ color: 'hsl(189,100%,50%)' }}>
                          {req.request_number}
                        </span>
                        <span className={status.cls + ' text-[10px]'}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>

                      {req.result && (
                        <div className="text-sm font-medium mb-1 truncate" style={{ color: 'hsl(195,80%,85%)' }}>
                          {(req.result as { title?: string }).title || 'نتيجة غير محددة'}
                        </div>
                      )}

                      <div className="text-xs mb-2" style={{ color: 'hsl(215,15%,55%)' }}>
                        السبب: <span style={{ color: 'hsl(215,20%,65%)' }}>{reasonLabels[req.reason] || req.reason}</span>
                      </div>

                      {req.details && (
                        <div className="text-xs p-2.5 rounded"
                          style={{ background: 'hsla(218,40%,12%,0.6)', border: '1px solid hsl(218,40%,18%)', color: 'hsl(215,15%,60%)' }}>
                          {req.details}
                        </div>
                      )}

                      {req.admin_notes && (
                        <div className="mt-2 text-xs p-2.5 rounded"
                          style={{ background: 'hsla(160,100%,50%,0.05)', border: '1px solid hsla(160,100%,50%,0.15)', color: 'hsl(160,100%,65%)' }}>
                          <span className="text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'hsl(160,100%,40%)' }}>ملاحظة الإدارة:</span>
                          {req.admin_notes}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px]" style={{ color: 'hsl(215,15%,50%)' }}>
                        {new Date(req.created_at).toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      {req.reviewed_at && (
                        <div className="text-[10px] mt-0.5" style={{ color: 'hsl(215,15%,40%)' }}>
                          راجع: {new Date(req.reviewed_at).toLocaleDateString('ar')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
