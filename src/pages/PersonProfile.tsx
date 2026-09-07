import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Search, SearchResult, Person, FilterState, DashboardStats } from '@/types';
import PersonProfileCard from '@/components/person/PersonProfileCard';
import ResultCard from '@/components/results/ResultCard';
import ResultFilters from '@/components/results/ResultFilters';
import { updateSearchProgress } from '@/lib/searchPipeline';
import { Loader2, ArrowRight, BarChart2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const DEFAULT_FILTERS: FilterState = {
  classification: 'all',
  matchConfidence: 'all',
  dateRange: 'all',
  language: 'all',
  sourceType: 'all',
  sortBy: 'newest',
};

export default function PersonProfile() {
  const { searchId } = useParams<{ searchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState<Search | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const fetchData = async () => {
    if (!searchId) return;
    const { data: searchData } = await supabase.from('searches').select('*').eq('id', searchId).single();
    if (!searchData) { setLoading(false); return; }
    setSearch(searchData as Search);

    if (searchData.person_id) {
      const { data: personData } = await supabase.from('persons').select('*').eq('id', searchData.person_id).single();
      if (personData) setPerson(personData as Person);

      const { data: resultsData } = await supabase
        .from('results')
        .select('*, analysis:result_analysis(*)')
        .eq('person_id', searchData.person_id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (resultsData) setResults(resultsData as SearchResult[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [searchId]);

  const handleRefresh = async () => {
    if (!search || !user || refreshing) return;
    setRefreshing(true);
    try {
      const { createSearchSession, simulatePublicSearch } = await import('@/lib/searchPipeline');
      const newSearchId = await createSearchSession(user.id, search.search_params, search.person_id);
      simulatePublicSearch(newSearchId, search.person_id!, search.search_params, () => {});
      toast.success('جاري تحديث البيانات...');
      setTimeout(() => navigate(`/search/${newSearchId}`), 500);
    } catch {
      toast.error('فشل تحديث البيانات');
    }
    setRefreshing(false);
  };

  const stats: DashboardStats = useMemo(() => ({
    totalResults: results.length,
    positiveCount: results.filter(r => r.classification === 'positive').length,
    negativeCount: results.filter(r => r.classification === 'negative').length,
    neutralCount: results.filter(r => r.classification === 'neutral').length,
    totalSearches: 1,
    pendingReviews: 0,
  }), [results]);

  const filteredResults = useMemo(() => {
    let res = [...results];

    if (filters.classification !== 'all') res = res.filter(r => r.classification === filters.classification);

    if (filters.matchConfidence === 'high') res = res.filter(r => r.match_confidence >= 80);
    else if (filters.matchConfidence === 'medium') res = res.filter(r => r.match_confidence >= 50 && r.match_confidence < 80);
    else if (filters.matchConfidence === 'low') res = res.filter(r => r.match_confidence < 50);

    if (filters.dateRange !== 'all') {
      const days = filters.dateRange === 'today' ? 1 : filters.dateRange === '7days' ? 7 : 30;
      const cutoff = new Date(Date.now() - days * 86400000);
      res = res.filter(r => r.published_at && new Date(r.published_at) > cutoff);
    }

    if (filters.sourceType !== 'all') res = res.filter(r => r.source_type === filters.sourceType);

    switch (filters.sortBy) {
      case 'oldest': res.sort((a, b) => new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || b.created_at).getTime()); break;
      case 'highest_relevance': res.sort((a, b) => (b.classification_confidence || 0) - (a.classification_confidence || 0)); break;
      case 'highest_confidence': res.sort((a, b) => b.match_confidence - a.match_confidence); break;
      default: res.sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());
    }

    return res;
  }, [results, filters]);

  const paginatedResults = filteredResults.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = filteredResults.length > paginatedResults.length;

  // Chart data
  const sentimentChartData = [
    { name: 'إيجابي', value: stats.positiveCount, color: 'hsl(160,100%,50%)' },
    { name: 'محايد', value: stats.neutralCount, color: 'hsl(215,15%,55%)' },
    { name: 'سلبي', value: stats.negativeCount, color: 'hsl(354,100%,61%)' },
  ].filter(d => d.value > 0);

  const topicsData = useMemo(() => {
    const map: Record<string, number> = {};
    results.forEach(r => {
      r.analysis?.topics?.forEach(t => { map[t] = (map[t] || 0) + 1; });
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [results]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(218,56%,5%)' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(189,100%,50%)' }} />
        <div className="text-xs tracking-widest uppercase" style={{ color: 'hsl(215,15%,55%)' }}>LOADING INTELLIGENCE DATA...</div>
      </div>
    </div>
  );

  if (!search || !person) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(218,56%,5%)' }}>
      <div className="text-center">
        <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(215,15%,50%)' }} />
        <div className="text-sm" style={{ color: 'hsl(215,15%,60%)' }}>لم يتم العثور على بيانات البحث</div>
        <button onClick={() => navigate('/')} className="btn-intel mt-4 text-xs">بحث جديد</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'hsl(218,56%,5%)' }}>
      {/* Page header */}
      <div className="border-b px-4 sm:px-6 py-3" style={{ background: 'hsl(218,50%,7%)', borderColor: 'hsl(218,40%,15%)' }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-1.5 rounded hover:bg-white/5 transition-colors">
              <ArrowRight className="w-4 h-4" style={{ color: 'hsl(215,15%,55%)' }} />
            </button>
            <div>
              <div className="text-[10px] tracking-widest uppercase" style={{ color: 'hsl(189,100%,50%)' }}>INTELLIGENCE PROFILE</div>
              <div className="text-sm font-semibold" style={{ color: 'hsl(195,100%,90%)' }}>{person.full_name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono" style={{ color: 'hsl(215,15%,50%)' }}>
              {search.completed_at ? new Date(search.completed_at).toLocaleDateString('ar') : ''}
            </span>
            <span className="badge-positive text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              COMPLETE
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Person card */}
          <div className="lg:col-span-1 space-y-4">
            <PersonProfileCard person={person} stats={stats} onRefresh={handleRefresh} refreshing={refreshing} />

            {/* Sentiment Chart */}
            {sentimentChartData.length > 0 && (
              <div className="intel-panel p-4 rounded-lg">
                <div className="text-[10px] tracking-widest uppercase mb-3" style={{ color: 'hsl(215,15%,50%)' }}>
                  SENTIMENT DISTRIBUTION
                </div>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sentimentChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                        {sentimentChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'hsl(218,50%,8%)', border: '1px solid hsl(218,40%,20%)', borderRadius: '4px' }}
                        labelStyle={{ color: 'hsl(195,80%,80%)' }}
                        itemStyle={{ color: 'hsl(215,15%,70%)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Topics */}
            {topicsData.length > 0 && (
              <div className="intel-panel p-4 rounded-lg">
                <div className="text-[10px] tracking-widest uppercase mb-3" style={{ color: 'hsl(215,15%,50%)' }}>
                  TOPICS ANALYSIS
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicsData} layout="vertical" margin={{ left: 0, right: 10 }}>
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215,15%,50%)' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215,20%,65%)' }} width={65} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(218,50%,8%)', border: '1px solid hsl(218,40%,20%)' }}
                        itemStyle={{ color: 'hsl(195,80%,80%)' }}
                      />
                      <Bar dataKey="count" fill="hsl(189,100%,50%)" opacity={0.8} radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'إجمالي النتائج', val: stats.totalResults, color: 'hsl(189,100%,50%)' },
                { label: 'إيجابي', val: stats.positiveCount, color: 'hsl(160,100%,50%)' },
                { label: 'محايد', val: stats.neutralCount, color: 'hsl(215,15%,60%)' },
                { label: 'سلبي', val: stats.negativeCount, color: 'hsl(354,100%,61%)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="intel-panel p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color }}>{val}</div>
                  <div className="text-[11px] mt-1" style={{ color: 'hsl(215,15%,55%)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <ResultFilters filters={filters} onChange={setFilters} stats={stats} />

            {/* Results */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] tracking-widest uppercase" style={{ color: 'hsl(215,15%,50%)' }}>
                  INTELLIGENCE RESULTS FEED — {filteredResults.length} نتيجة
                </div>
                <div className="text-xs" style={{ color: 'hsl(215,15%,50%)' }}>
                  {results.length > 0 && `${paginatedResults.length} / ${filteredResults.length}`}
                </div>
              </div>

              {filteredResults.length === 0 ? (
                <div className="intel-panel p-12 text-center rounded-lg">
                  <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'hsl(189,100%,50%)' }} />
                  <div className="text-sm font-semibold mb-1" style={{ color: 'hsl(215,15%,60%)' }}>
                    NO INTELLIGENCE DATA AVAILABLE
                  </div>
                  <div className="text-xs" style={{ color: 'hsl(215,15%,45%)' }}>
                    {results.length === 0
                      ? 'لم يتم العثور على نتائج عامة. جرب تحسين معلومات البحث.'
                      : 'لا توجد نتائج تطابق التصفية الحالية.'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedResults.map(result => (
                    <ResultCard key={result.id} result={result} onReviewSubmitted={fetchData} />
                  ))}

                  {hasMore && (
                    <button onClick={() => setPage(p => p + 1)}
                      className="w-full py-3 rounded-lg text-sm font-medium transition-all"
                      style={{ background: 'hsla(218,40%,12%,0.8)', border: '1px solid hsl(218,40%,20%)', color: 'hsl(189,100%,60%)' }}>
                      تحميل المزيد ({filteredResults.length - paginatedResults.length} متبقية)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
