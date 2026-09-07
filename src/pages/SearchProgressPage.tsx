import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Search } from '@/types';
import RadarAnimation from '@/components/radar/RadarAnimation';

const STAGES = [
  { id: 'init', labelAr: 'تهيئة محرك البحث', labelEn: 'INITIALIZING INTELLIGENCE SEARCH', minProgress: 0 },
  { id: 'scan', labelAr: 'فحص المصادر العامة', labelEn: 'SCANNING PUBLIC SOURCES', minProgress: 15 },
  { id: 'collect', labelAr: 'جمع النتائج', labelEn: 'COLLECTING RESULTS', minProgress: 30 },
  { id: 'normalize', labelAr: 'توحيد البيانات', labelEn: 'NORMALIZING DATA', minProgress: 50 },
  { id: 'deduplicate', labelAr: 'إزالة التكرارات', labelEn: 'REMOVING DUPLICATES', minProgress: 62 },
  { id: 'match', labelAr: 'التحقق من تطابق الشخصية', labelEn: 'VERIFYING PERSON MATCH', minProgress: 74 },
  { id: 'ai', labelAr: 'تحليل الذكاء الاصطناعي', labelEn: 'AI CONTENT ANALYSIS', minProgress: 85 },
  { id: 'classify', labelAr: 'تصنيف النتائج', labelEn: 'CLASSIFYING RESULTS', minProgress: 92 },
  { id: 'final', labelAr: 'إعداد التقرير النهائي', labelEn: 'FINALIZING REPORT', minProgress: 97 },
];

export default function SearchProgressPage() {
  const { searchId } = useParams<{ searchId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState<Search | null>(null);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    if (!searchId) return;

    const fetchSearch = async () => {
      const { data } = await supabase.from('searches').select('*').eq('id', searchId).single();
      if (data) {
        setSearch(data as Search);
        if (data.status === 'completed') {
          setTimeout(() => navigate(`/profile/${searchId}`), 1500);
        } else if (data.status === 'failed') {
          // Stay on page to show error
        }
      }
    };

    fetchSearch();
    const interval = setInterval(fetchSearch, 1500);
    const dotTimer = setInterval(() => setDots(p => (p + 1) % 4), 500);

    return () => { clearInterval(interval); clearInterval(dotTimer); };
  }, [searchId, navigate]);

  const progress = search?.progress || 0;
  const currentStage = STAGES.slice().reverse().find(s => progress >= s.minProgress) || STAGES[0];

  const counterVal = (key: keyof Search, placeholder = 0): number => {
    if (!search) return placeholder;
    const val = search[key];
    return typeof val === 'number' ? val : placeholder;
  };

  return (
    <div className="min-h-screen intel-grid flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'hsl(218,56%,5%)' }}>
      <div className="w-full max-w-2xl">
        {/* Status header */}
        <div className="text-center mb-8">
          <div className="text-[10px] tracking-[0.3em] uppercase font-mono mb-2 animate-pulse"
            style={{ color: 'hsl(189,100%,50%)' }}>
            INTELLIGENCE SEARCH ACTIVE
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'hsl(195,100%,92%)' }}>
            {search?.person_name || 'جاري البحث...'}
          </h1>
          <div className="text-xs" style={{ color: 'hsl(215,15%,55%)' }}>
            {currentStage.labelAr}
          </div>
        </div>

        {/* Radar center */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <RadarAnimation isScanning={search?.status === 'running' || search?.status === 'pending'} size={300} />
            {/* Progress overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold font-mono" style={{ color: 'hsl(189,100%,50%)', textShadow: '0 0 20px hsla(189,100%,50%,0.5)' }}>
                  {progress}%
                </div>
                {search?.status === 'completed' && (
                  <div className="text-xs tracking-widest mt-1" style={{ color: 'hsl(160,100%,50%)' }}>
                    COMPLETE ✓
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="intel-progress-track">
            <div className="intel-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Stages */}
        <div className="intel-panel p-4 mb-6 rounded-lg">
          <div className="space-y-2">
            {STAGES.map((stage, i) => {
              const isActive = stage.id === currentStage.id;
              const isDone = progress > stage.minProgress && !isActive;
              const isPending = progress < stage.minProgress;
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'animate-pulse' : ''}`}
                    style={{
                      background: isDone ? 'hsl(160,100%,50%)' : isActive ? 'hsl(189,100%,50%)' : 'hsl(218,40%,20%)',
                    }} />
                  <div className="flex-1 flex items-center justify-between gap-4">
                    <span className="text-xs" style={{
                      color: isDone ? 'hsl(160,100%,55%)' : isActive ? 'hsl(189,100%,70%)' : 'hsl(215,15%,40%)',
                    }}>
                      {stage.labelAr}
                    </span>
                    <span className="text-[10px] font-mono tracking-widest flex-shrink-0" style={{
                      color: isDone ? 'hsl(160,100%,40%)' : isActive ? 'hsl(189,100%,50%)' : 'hsl(215,15%,35%)',
                    }}>
                      {isDone ? 'DONE' : isActive ? `ACTIVE${'.'.repeat(dots)}` : 'PENDING'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'مصادر مفحوصة', key: 'sources_scanned' as keyof Search, color: 'hsl(189,100%,50%)' },
            { label: 'نتائج وُجدت', key: 'results_found' as keyof Search, color: 'hsl(160,100%,50%)' },
            { label: 'تكرارات أُزيلت', key: 'duplicates_removed' as keyof Search, color: 'hsl(38,100%,56%)' },
            { label: 'تطابقات مؤكدة', key: 'person_matches_verified' as keyof Search, color: 'hsl(189,100%,70%)' },
          ].map(({ label, key, color }) => (
            <div key={label} className="intel-panel p-3 text-center rounded-lg">
              <div className="text-2xl font-bold font-mono" style={{ color }}>
                {counterVal(key)}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'hsl(215,15%,50%)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Failed state */}
        {search?.status === 'failed' && (
          <div className="mt-6 p-4 rounded-lg text-center"
            style={{ background: 'hsla(354,100%,61%,0.08)', border: '1px solid hsla(354,100%,61%,0.3)' }}>
            <div className="text-sm font-semibold mb-1" style={{ color: 'hsl(354,100%,61%)' }}>
              SEARCH FAILED
            </div>
            <div className="text-xs mb-3" style={{ color: 'hsl(215,15%,55%)' }}>
              {search.error_message || 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.'}
            </div>
            <button onClick={() => navigate('/')} className="btn-intel text-xs">
              بحث جديد
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
