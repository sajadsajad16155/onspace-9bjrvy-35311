import { FilterState } from '@/types';

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  stats: { total: number; positive: number; negative: number; neutral: number };
}

export default function ResultFilters({ filters, onChange, stats }: Props) {
  const set = (key: keyof FilterState, val: string) =>
    onChange({ ...filters, [key]: val } as FilterState);

  return (
    <div className="intel-panel p-4 space-y-4">
      {/* Classification tabs */}
      <div>
        <div className="text-[10px] tracking-widest uppercase mb-2" style={{ color: 'hsl(215,15%,50%)' }}>
          التصنيف
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { val: 'all', label: `الكل (${stats.total})`, color: 'hsl(189,100%,50%)' },
            { val: 'positive', label: `إيجابي (${stats.positive})`, color: 'hsl(160,100%,50%)' },
            { val: 'negative', label: `سلبي (${stats.negative})`, color: 'hsl(354,100%,61%)' },
            { val: 'neutral', label: `محايد (${stats.neutral})`, color: 'hsl(215,15%,60%)' },
          ] as const).map(({ val, label, color }) => (
            <button
              key={val}
              onClick={() => set('classification', val)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all"
              style={{
                background: filters.classification === val ? `${color}20` : 'hsla(218,40%,12%,0.8)',
                border: `1px solid ${filters.classification === val ? color + '60' : 'hsl(218,40%,20%)'}`,
                color: filters.classification === val ? color : 'hsl(215,15%,60%)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Date range */}
        <div>
          <div className="text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(215,15%,50%)' }}>
            الفترة الزمنية
          </div>
          <select
            value={filters.dateRange}
            onChange={e => set('dateRange', e.target.value)}
            className="intel-input text-xs py-2"
          >
            <option value="all">كل الوقت</option>
            <option value="today">اليوم</option>
            <option value="7days">آخر 7 أيام</option>
            <option value="30days">آخر 30 يومًا</option>
          </select>
        </div>

        {/* Match confidence */}
        <div>
          <div className="text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(215,15%,50%)' }}>
            دقة التطابق
          </div>
          <select
            value={filters.matchConfidence}
            onChange={e => set('matchConfidence', e.target.value)}
            className="intel-input text-xs py-2"
          >
            <option value="all">الكل</option>
            <option value="high">عالي (80%+)</option>
            <option value="medium">متوسط (50-79%)</option>
            <option value="low">منخفض (أقل من 50%)</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <div className="text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(215,15%,50%)' }}>
            الترتيب
          </div>
          <select
            value={filters.sortBy}
            onChange={e => set('sortBy', e.target.value)}
            className="intel-input text-xs py-2"
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="oldest">الأقدم أولاً</option>
            <option value="highest_relevance">الأعلى صلة</option>
            <option value="highest_confidence">الأعلى تطابقًا</option>
          </select>
        </div>

        {/* Source type */}
        <div>
          <div className="text-[10px] tracking-widest uppercase mb-1.5" style={{ color: 'hsl(215,15%,50%)' }}>
            نوع المصدر
          </div>
          <select
            value={filters.sourceType}
            onChange={e => set('sourceType', e.target.value)}
            className="intel-input text-xs py-2"
          >
            <option value="all">كل المصادر</option>
            <option value="news">الأخبار</option>
            <option value="web">الويب</option>
            <option value="rss">RSS</option>
          </select>
        </div>
      </div>
    </div>
  );
}
