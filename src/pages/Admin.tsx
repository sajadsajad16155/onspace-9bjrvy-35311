import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewRequest } from '@/types';
import { toast } from 'sonner';
import {
  Shield, Users, Search, FileText, EyeOff, Clock,
  CheckCircle, XCircle, Eye, Loader2, BarChart2, Database
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalSearches: number;
  totalPersons: number;
  totalResults: number;
  pendingReviews: number;
  hiddenResults: number;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalSearches: 0, totalPersons: 0, totalResults: 0, pendingReviews: 0, hiddenResults: 0 });
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [
      { count: users },
      { count: searches },
      { count: persons },
      { count: results },
      { count: pending },
      { count: hidden },
      { data: reqs },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('searches').select('*', { count: 'exact', head: true }),
      supabase.from('persons').select('*', { count: 'exact', head: true }),
      supabase.from('results').select('*', { count: 'exact', head: true }),
      supabase.from('review_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('results').select('*', { count: 'exact', head: true }).eq('is_hidden', true),
      supabase.from('review_requests')
        .select('*, result:results(title, source_name, source_url, is_hidden), person:persons(full_name)')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    setStats({
      totalUsers: users || 0,
      totalSearches: searches || 0,
      totalPersons: persons || 0,
      totalResults: results || 0,
      pendingReviews: pending || 0,
      hiddenResults: hidden || 0,
    });
    if (reqs) setRequests(reqs as ReviewRequest[]);
    setLoading(false);
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'hide' | 'restore', resultId?: string) => {
    const updates: Record<string, unknown> = {
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updates.status = 'approved';
      updates.admin_notes = 'تمت الموافقة على الطلب.';
    } else if (action === 'reject') {
      updates.status = 'rejected';
      updates.admin_notes = 'تم رفض الطلب.';
    } else if (action === 'hide' && resultId) {
      updates.status = 'approved';
      updates.admin_notes = 'تم إخفاء النتيجة من المنصة. المحتوى الأصلي لا يزال متاحًا لدى الناشر الأصلي.';
      await supabase.from('results').update({ is_hidden: true }).eq('id', resultId);
    } else if (action === 'restore' && resultId) {
      updates.status = 'rejected';
      updates.admin_notes = 'تم رفض طلب الإخفاء واستعادة النتيجة.';
      await supabase.from('results').update({ is_hidden: false }).eq('id', resultId);
    }

    const { error } = await supabase.from('review_requests').update(updates).eq('id', requestId);
    if (error) { toast.error('فشل تنفيذ الإجراء'); return; }

    toast.success('تم تنفيذ الإجراء بنجاح');
    fetchData();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(218,56%,5%)' }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(189,100%,50%)' }} />
    </div>
  );

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen" style={{ background: 'hsl(218,56%,5%)' }}>
      {/* Admin header */}
      <div className="border-b px-4 sm:px-6 py-4"
        style={{ background: 'hsl(218,50%,7%)', borderColor: 'hsla(38,100%,56%,0.3)' }}>
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <Shield className="w-5 h-5" style={{ color: 'hsl(38,100%,56%)' }} />
          <div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: 'hsl(38,100%,56%)' }}>
              ADMIN COMMAND CENTER
            </div>
            <div className="text-sm font-semibold" style={{ color: 'hsl(195,100%,90%)' }}>
              لوحة إدارة المنصة
            </div>
          </div>
          {stats.pendingReviews > 0 && (
            <span className="mr-auto px-2.5 py-1 rounded text-xs font-bold"
              style={{ background: 'hsla(354,100%,61%,0.15)', color: 'hsl(354,100%,61%)', border: '1px solid hsla(354,100%,61%,0.3)' }}>
              {stats.pendingReviews} طلب معلق
            </span>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: <Users className="w-4 h-4" />, label: 'المستخدمون', val: stats.totalUsers, color: 'hsl(189,100%,50%)' },
            { icon: <Search className="w-4 h-4" />, label: 'عمليات البحث', val: stats.totalSearches, color: 'hsl(189,100%,60%)' },
            { icon: <Database className="w-4 h-4" />, label: 'الشخصيات', val: stats.totalPersons, color: 'hsl(160,100%,50%)' },
            { icon: <BarChart2 className="w-4 h-4" />, label: 'النتائج', val: stats.totalResults, color: 'hsl(160,100%,60%)' },
            { icon: <Clock className="w-4 h-4" />, label: 'طلبات معلقة', val: stats.pendingReviews, color: 'hsl(38,100%,56%)' },
            { icon: <EyeOff className="w-4 h-4" />, label: 'نتائج مخفية', val: stats.hiddenResults, color: 'hsl(354,100%,61%)' },
          ].map(({ icon, label, val, color }) => (
            <div key={label} className="intel-panel p-4 rounded-lg text-center">
              <div className="flex justify-center mb-2" style={{ color }}>{icon}</div>
              <div className="text-2xl font-bold font-mono" style={{ color }}>{val}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'hsl(215,15%,50%)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b" style={{ borderColor: 'hsl(218,40%,18%)' }}>
          {[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'reviews', label: `طلبات المراجعة (${stats.pendingReviews} معلقة)` },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id as 'overview' | 'reviews')}
              className="px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px"
              style={{
                color: activeTab === id ? 'hsl(189,100%,50%)' : 'hsl(215,15%,55%)',
                borderColor: activeTab === id ? 'hsl(189,100%,50%)' : 'transparent',
              }}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="intel-panel p-6 rounded-lg">
            <div className="text-sm font-semibold mb-2" style={{ color: 'hsl(195,100%,85%)' }}>
              نظرة عامة على المنصة
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'hsl(215,15%,60%)' }}>
              مرحبًا بك في لوحة إدارة منظومة مراقبة. من هنا يمكنك إدارة طلبات المراجعة، مراقبة نشاط المنصة،
              وإدارة المحتوى المخفي. استخدم تبويب "طلبات المراجعة" للاطلاع على الطلبات المعلقة والتعامل معها.
            </p>
            <div className="mt-4 p-3 rounded text-xs"
              style={{ background: 'hsla(38,100%,56%,0.06)', border: '1px solid hsla(38,100%,56%,0.2)', color: 'hsl(38,100%,65%)' }}>
              ⚠ إخفاء النتيجة يؤثر فقط على رؤيتها داخل هذه المنصة. المحتوى الأصلي لا يزال متاحًا لدى الناشر الأصلي.
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {pendingRequests.length > 0 && (
              <div>
                <div className="text-[10px] tracking-widest uppercase mb-3" style={{ color: 'hsl(38,100%,56%)' }}>
                  PENDING REVIEW — طلبات بانتظار المراجعة ({pendingRequests.length})
                </div>
                <div className="space-y-3">
                  {pendingRequests.map(req => (
                    <ReviewRequestCard key={req.id} request={req} onAction={handleAction} />
                  ))}
                </div>
              </div>
            )}

            {processedRequests.length > 0 && (
              <div>
                <div className="text-[10px] tracking-widest uppercase mb-3" style={{ color: 'hsl(215,15%,50%)' }}>
                  PROCESSED — طلبات مُعالجة ({processedRequests.length})
                </div>
                <div className="space-y-2">
                  {processedRequests.slice(0, 10).map(req => (
                    <div key={req.id} className="intel-panel p-3 rounded-lg flex items-center gap-3">
                      <span className={req.status === 'approved' ? 'badge-positive' : 'badge-negative'}>
                        {req.status === 'approved' ? 'موافق عليه' : 'مرفوض'}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'hsl(189,100%,50%)' }}>{req.request_number}</span>
                      <span className="text-xs flex-1 truncate" style={{ color: 'hsl(215,15%,60%)' }}>
                        {(req.result as { title?: string })?.title || 'نتيجة غير محددة'}
                      </span>
                      <span className="text-[10px]" style={{ color: 'hsl(215,15%,45%)' }}>
                        {new Date(req.created_at).toLocaleDateString('ar')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {requests.length === 0 && (
              <div className="intel-panel p-12 text-center rounded-lg">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'hsl(160,100%,50%)' }} />
                <div className="text-sm" style={{ color: 'hsl(215,15%,55%)' }}>لا توجد طلبات مراجعة حالياً</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ReviewRequestCardProps {
  request: ReviewRequest;
  onAction: (id: string, action: 'approve' | 'reject' | 'hide' | 'restore', resultId?: string) => void;
}

function ReviewRequestCard({ request: req, onAction }: ReviewRequestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const resultData = req.result as { title?: string; source_name?: string; source_url?: string; is_hidden?: boolean } | undefined;
  const personData = req.person as { full_name?: string } | undefined;

  const reasonLabels: Record<string, string> = {
    incorrect_content: 'محتوى غير صحيح',
    wrong_person: 'شخص آخر',
    outdated_content: 'محتوى قديم',
    privacy_concern: 'خصوصية',
    misleading_classification: 'تصنيف مضلل',
    other: 'أخرى',
  };

  return (
    <div className="intel-panel rounded-lg overflow-hidden"
      style={{ borderColor: 'hsla(38,100%,56%,0.25)' }}>
      <div className="flex items-start gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-xs font-bold" style={{ color: 'hsl(189,100%,50%)' }}>{req.request_number}</span>
            <span className="badge-pending text-[10px]">PENDING</span>
            <span className="px-2 py-0.5 rounded text-[10px]"
              style={{ background: 'hsla(218,40%,15%,0.8)', color: 'hsl(215,20%,65%)', border: '1px solid hsl(218,40%,22%)' }}>
              {reasonLabels[req.reason] || req.reason}
            </span>
          </div>

          {resultData?.title && (
            <div className="text-sm font-medium mb-1 truncate" style={{ color: 'hsl(195,80%,85%)' }}>
              {resultData.title}
            </div>
          )}

          <div className="flex items-center gap-3 text-[11px] mb-2" style={{ color: 'hsl(215,15%,55%)' }}>
            {personData?.full_name && <span>الشخصية: <span style={{ color: 'hsl(189,100%,60%)' }}>{personData.full_name}</span></span>}
            {resultData?.source_name && <span>المصدر: {resultData.source_name}</span>}
            <span>{new Date(req.created_at).toLocaleDateString('ar')}</span>
          </div>

          {req.details && (
            <div className="text-xs p-2.5 rounded mb-2"
              style={{ background: 'hsla(218,40%,12%,0.6)', border: '1px solid hsl(218,40%,18%)', color: 'hsl(215,15%,60%)' }}>
              {req.details}
            </div>
          )}

          {resultData?.is_hidden && (
            <div className="text-[10px] mb-2" style={{ color: 'hsl(354,100%,61%)' }}>
              ⚠ هذه النتيجة مخفية حالياً
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        <button onClick={() => onAction(req.id, 'approve', req.result_id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
          style={{ background: 'hsla(160,100%,50%,0.08)', border: '1px solid hsla(160,100%,50%,0.3)', color: 'hsl(160,100%,55%)' }}>
          <CheckCircle className="w-3 h-3" /> موافقة
        </button>

        <button onClick={() => onAction(req.id, 'reject')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
          style={{ background: 'hsla(354,100%,61%,0.08)', border: '1px solid hsla(354,100%,61%,0.3)', color: 'hsl(354,100%,61%)' }}>
          <XCircle className="w-3 h-3" /> رفض
        </button>

        {req.result_id && !resultData?.is_hidden && (
          <button onClick={() => onAction(req.id, 'hide', req.result_id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
            style={{ background: 'hsla(38,100%,56%,0.08)', border: '1px solid hsla(38,100%,56%,0.3)', color: 'hsl(38,100%,60%)' }}>
            <EyeOff className="w-3 h-3" /> إخفاء النتيجة
          </button>
        )}

        {req.result_id && resultData?.is_hidden && (
          <button onClick={() => onAction(req.id, 'restore', req.result_id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
            style={{ background: 'hsla(189,100%,50%,0.08)', border: '1px solid hsla(189,100%,50%,0.3)', color: 'hsl(189,100%,60%)' }}>
            <Eye className="w-3 h-3" /> استعادة النتيجة
          </button>
        )}

        {resultData?.source_url && (
          <a href={resultData.source_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium mr-auto transition-all"
            style={{ background: 'hsla(218,40%,15%,0.6)', border: '1px solid hsl(218,40%,22%)', color: 'hsl(215,20%,65%)' }}>
            عرض المصدر
          </a>
        )}
      </div>
    </div>
  );
}
