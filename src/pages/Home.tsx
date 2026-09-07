import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createSearchSession, findOrCreatePerson, simulatePublicSearch } from '@/lib/searchPipeline';
import { SearchParams } from '@/types';
import RadarAnimation from '@/components/radar/RadarAnimation';
import { toast } from 'sonner';
import { Search, ChevronDown, ChevronUp, Zap, Database, Brain, Shield } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState<SearchParams>({
    personName: '',
    occupation: '',
    country: '',
    city: '',
    birthYear: undefined,
    organization: '',
    position: '',
    additionalDetails: '',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personName.trim()) { toast.error('أدخل اسم الشخصية للبحث'); return; }
    if (!user) { toast.error('يجب تسجيل الدخول أولاً'); return; }
    setSearching(true);
    try {
      const personId = await findOrCreatePerson(form, user.id);
      const searchId = await createSearchSession(user.id, form, personId);
      // Start the pipeline in background
      simulatePublicSearch(searchId, personId, form, (stage, progress) => {
        console.log(`[Search] ${stage}: ${progress}%`);
      });
      navigate(`/search/${searchId}`);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('حدث خطأ أثناء بدء البحث');
      setSearching(false);
    }
  };

  const setField = (key: keyof SearchParams, val: string | number | undefined) =>
    setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'hsl(218,56%,5%)' }}>
      {/* Hero background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, hsla(218,56%,5%,0.6) 0%, hsl(218,56%,5%) 70%)' }} />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 intel-grid opacity-30" />

      <div className="relative z-10 max-w-screen-lg mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-[11px] tracking-widest uppercase font-mono"
            style={{ background: 'hsla(189,100%,50%,0.08)', border: '1px solid hsla(189,100%,50%,0.25)', color: 'hsl(189,100%,60%)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(160,100%,50%)' }} />
            INTELLIGENCE MEDIA MONITORING
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight"
            style={{ color: 'hsl(195,100%,95%)' }}>
            منظومة{' '}
            <span style={{ color: 'hsl(189,100%,50%)', textShadow: '0 0 30px hsla(189,100%,50%,0.4)' }}>
              مراقبة
            </span>
          </h1>
          <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: 'hsl(215,20%,60%)' }}>
            رصد وتحليل المحتوى العام المنشور على الإنترنت عن الشخصيات
            <br className="hidden sm:block" />
            باستخدام الذكاء الاصطناعي ومصادر عامة موثوقة
          </p>
        </div>

        {/* Main layout: Radar + Search Form */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Radar */}
          <div className="hidden lg:flex flex-col items-center gap-4 flex-shrink-0">
            <RadarAnimation isScanning={searching} size={260} />
            {searching && (
              <div className="text-xs tracking-widest uppercase animate-pulse font-mono" style={{ color: 'hsl(189,100%,50%)' }}>
                SCANNING PUBLIC SOURCES
              </div>
            )}
          </div>

          {/* Search Form */}
          <div className="flex-1 w-full">
            <div className="intel-panel-primary rounded-xl overflow-hidden">
              {/* Form header */}
              <div className="px-6 py-4 border-b flex items-center gap-3"
                style={{ background: 'hsl(218,50%,7%)', borderColor: 'hsla(189,100%,50%,0.2)' }}>
                <Search className="w-4 h-4" style={{ color: 'hsl(189,100%,50%)' }} />
                <div>
                  <div className="text-[10px] tracking-widest uppercase" style={{ color: 'hsl(189,100%,50%)' }}>
                    RADAR SEARCH INTERFACE
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'hsl(195,100%,85%)' }}>
                    بحث استخباراتي
                  </div>
                </div>
              </div>

              <form onSubmit={handleSearch} className="p-6 space-y-4">
                {/* Main search target */}
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-2" style={{ color: 'hsl(189,100%,50%)' }}>
                    SEARCH TARGET — اسم الشخصية *
                  </label>
                  <input
                    value={form.personName}
                    onChange={e => setField('personName', e.target.value)}
                    className="intel-input text-base"
                    placeholder="أدخل الاسم الكامل..."
                    required
                    disabled={searching}
                  />
                </div>

                {/* Advanced toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-medium transition-all"
                  style={{ color: 'hsl(189,100%,60%)' }}
                >
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showAdvanced ? 'إخفاء التفاصيل المتقدمة' : 'تفاصيل متقدمة (اختياري)'}
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: 'hsl(215,15%,50%)' }}>
                    — تحسين دقة التطابق
                  </span>
                </button>

                {showAdvanced && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-up">
                    {[
                      { key: 'occupation', label: 'المهنة / Occupation', ph: 'صحفي، سياسي، رجل أعمال...' },
                      { key: 'organization', label: 'المؤسسة / Organization', ph: 'اسم الشركة أو المؤسسة' },
                      { key: 'country', label: 'الدولة / Country', ph: 'السعودية، مصر، الإمارات...' },
                      { key: 'city', label: 'المدينة / City', ph: 'الرياض، القاهرة، دبي...' },
                      { key: 'position', label: 'المنصب / Position', ph: 'وزير، مدير عام، رئيس تنفيذي...' },
                    ].map(({ key, label, ph }) => (
                      <div key={key}>
                        <label className="block text-[10px] tracking-wider uppercase mb-1.5" style={{ color: 'hsl(215,15%,55%)' }}>
                          {label}
                        </label>
                        <input
                          value={(form as Record<string, unknown>)[key] as string || ''}
                          onChange={e => setField(key as keyof SearchParams, e.target.value)}
                          className="intel-input text-sm"
                          placeholder={ph}
                          disabled={searching}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] tracking-wider uppercase mb-1.5" style={{ color: 'hsl(215,15%,55%)' }}>
                        سنة الميلاد
                      </label>
                      <input
                        type="number"
                        value={form.birthYear || ''}
                        onChange={e => setField('birthYear', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="intel-input text-sm"
                        placeholder="مثال: 1975"
                        min={1900} max={2010}
                        disabled={searching}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] tracking-wider uppercase mb-1.5" style={{ color: 'hsl(215,15%,55%)' }}>
                        معلومات إضافية
                      </label>
                      <textarea
                        value={form.additionalDetails || ''}
                        onChange={e => setField('additionalDetails', e.target.value)}
                        className="intel-input resize-none text-sm"
                        placeholder="أي معلومات إضافية تساعد في التمييز بين الأشخاص ذوي الأسماء المتشابهة..."
                        rows={2}
                        disabled={searching}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={searching || !form.personName.trim()}
                  className="btn-intel-primary w-full text-sm py-3 mt-2"
                >
                  {searching ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      INITIALIZING SEARCH...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      START INTELLIGENCE SEARCH
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* Feature badges */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: <Database className="w-3.5 h-3.5" />, label: 'مصادر عامة', sub: 'أخبار + RSS + ويب' },
                { icon: <Brain className="w-3.5 h-3.5" />, label: 'تحليل AI', sub: 'تصنيف ذكي' },
                { icon: <Shield className="w-3.5 h-3.5" />, label: 'مطابقة دقيقة', sub: 'نتائج موثوقة' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="p-3 rounded-lg text-center"
                  style={{ background: 'hsla(218,50%,8%,0.8)', border: '1px solid hsl(218,40%,16%)' }}>
                  <div className="flex justify-center mb-1.5" style={{ color: 'hsl(189,100%,50%)' }}>{icon}</div>
                  <div className="text-xs font-medium" style={{ color: 'hsl(195,80%,80%)' }}>{label}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'hsl(215,15%,50%)' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent searches */}
        <RecentSearches userId={user?.id} />
      </div>
    </div>
  );
}

function RecentSearches({ userId }: { userId?: string }) {
  const navigate = useNavigate();
  const [searches, setSearches] = useState<Array<{ id: string; person_name: string; status: string; results_found: number; created_at: string }>>([]);

  useState(() => {
    if (!userId) return;
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('searches')
        .select('id, person_name, status, results_found, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => { if (data) setSearches(data); });
    });
  });

  if (!searches.length) return null;

  return (
    <div className="mt-8">
      <div className="text-[10px] tracking-widest uppercase mb-3" style={{ color: 'hsl(215,15%,50%)' }}>
        RECENT SEARCHES — آخر عمليات البحث
      </div>
      <div className="grid gap-2">
        {searches.map(s => (
          <button key={s.id}
            onClick={() => navigate(s.status === 'completed' ? `/profile/${s.id}` : `/search/${s.id}`)}
            className="intel-panel p-3 flex items-center gap-4 hover:border-cyan-500/20 transition-all text-right w-full rounded-lg"
            style={{ borderColor: 'hsl(218,40%,18%)' }}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'completed' ? 'bg-green-400' : s.status === 'running' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'hsl(195,80%,85%)' }}>{s.person_name}</div>
              <div className="text-xs mt-0.5" style={{ color: 'hsl(215,15%,50%)' }}>
                {new Date(s.created_at).toLocaleDateString('ar')} · {s.results_found} نتيجة
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-widest font-mono"
              style={{ color: s.status === 'completed' ? 'hsl(160,100%,50%)' : s.status === 'running' ? 'hsl(38,100%,56%)' : 'hsl(215,15%,55%)' }}>
              {s.status === 'completed' ? 'DONE' : s.status === 'running' ? 'RUNNING' : s.status === 'failed' ? 'FAILED' : 'PENDING'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
