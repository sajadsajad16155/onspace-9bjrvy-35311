import { Person, DashboardStats } from '@/types';
import { User, MapPin, Briefcase, Calendar, Building2, Award, RefreshCw } from 'lucide-react';

interface Props {
  person: Person;
  stats: DashboardStats;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function PersonProfileCard({ person, stats, onRefresh, refreshing }: Props) {
  const totalSentiment = stats.positiveCount + stats.negativeCount + stats.neutralCount;
  const posPercent = totalSentiment > 0 ? Math.round((stats.positiveCount / totalSentiment) * 100) : 0;
  const negPercent = totalSentiment > 0 ? Math.round((stats.negativeCount / totalSentiment) * 100) : 0;
  const neuPercent = totalSentiment > 0 ? Math.round((stats.neutralCount / totalSentiment) * 100) : 0;

  return (
    <div className="intel-panel-primary rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between"
        style={{ background: 'hsl(218,50%,7%)', borderColor: 'hsla(189,100%,50%,0.2)' }}>
        <div className="text-[10px] tracking-widest uppercase" style={{ color: 'hsl(189,100%,50%)' }}>
          INTELLIGENCE PROFILE
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] transition-all"
            style={{
              border: '1px solid hsla(189,100%,50%,0.3)',
              color: 'hsl(189,100%,60%)',
              background: 'hsla(189,100%,50%,0.06)',
            }}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-5">
          <div className="hud-frame relative w-20 h-20 rounded-full overflow-hidden mb-3">
            {person.photo_url ? (
              <img src={person.photo_url} alt={person.full_name}
                className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"
                style={{ background: 'hsla(189,100%,50%,0.1)' }}>
                <User className="w-8 h-8" style={{ color: 'hsl(189,100%,50%)' }} />
              </div>
            )}
          </div>
          <h2 className="text-lg font-bold text-center" style={{ color: 'hsl(195,100%,92%)' }}>
            {person.display_name || person.full_name}
          </h2>
          {person.position && (
            <div className="text-xs mt-0.5" style={{ color: 'hsl(189,100%,60%)' }}>
              {person.position}
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="space-y-2.5 mb-5">
          {[
            { icon: <Briefcase className="w-3.5 h-3.5" />, label: 'المهنة', value: person.occupation },
            { icon: <Building2 className="w-3.5 h-3.5" />, label: 'المؤسسة', value: person.organization },
            { icon: <MapPin className="w-3.5 h-3.5" />, label: 'الموقع', value: [person.city, person.country].filter(Boolean).join('، ') },
            { icon: <Calendar className="w-3.5 h-3.5" />, label: 'سنة الميلاد', value: person.birth_year?.toString() },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0" style={{ color: 'hsl(215,15%,50%)' }}>{icon}</span>
              <div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(215,15%,50%)' }}>{label}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: value ? 'hsl(195,80%,80%)' : 'hsl(215,15%,45%)' }}>
                  {value || 'غير متاح'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="border-t pt-4 space-y-3" style={{ borderColor: 'hsl(218,40%,15%)' }}>
          <div className="text-[10px] tracking-widest uppercase" style={{ color: 'hsl(215,15%,50%)' }}>
            CONTENT ANALYSIS
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold font-mono" style={{ color: 'hsl(189,100%,50%)' }}>
              {stats.totalResults.toLocaleString()}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'hsl(215,15%,55%)' }}>إجمالي النتائج</div>
          </div>

          {/* Sentiment bar */}
          {totalSentiment > 0 && (
            <div>
              <div className="flex rounded-full overflow-hidden h-2 mb-2" style={{ background: 'hsl(218,40%,15%)' }}>
                <div className="h-full transition-all duration-700"
                  style={{ width: `${posPercent}%`, background: 'hsl(160,100%,50%)' }} />
                <div className="h-full transition-all duration-700"
                  style={{ width: `${neuPercent}%`, background: 'hsl(215,15%,40%)' }} />
                <div className="h-full transition-all duration-700"
                  style={{ width: `${negPercent}%`, background: 'hsl(354,100%,61%)' }} />
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: 'hsl(160,100%,50%)' }}>● {posPercent}% إيجابي</span>
                <span style={{ color: 'hsl(215,15%,55%)' }}>● {neuPercent}% محايد</span>
                <span style={{ color: 'hsl(354,100%,61%)' }}>● {negPercent}% سلبي</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { val: stats.positiveCount, label: 'إيجابي', color: 'hsl(160,100%,50%)' },
              { val: stats.neutralCount, label: 'محايد', color: 'hsl(215,15%,60%)' },
              { val: stats.negativeCount, label: 'سلبي', color: 'hsl(354,100%,61%)' },
            ].map(({ val, label, color }) => (
              <div key={label} className="p-2 rounded"
                style={{ background: 'hsla(218,40%,12%,0.8)', border: '1px solid hsl(218,40%,18%)' }}>
                <div className="text-lg font-bold font-mono" style={{ color }}>{val}</div>
                <div className="text-[10px]" style={{ color: 'hsl(215,15%,50%)' }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="text-[9px] leading-relaxed p-2.5 rounded"
            style={{ background: 'hsla(38,100%,56%,0.06)', border: '1px solid hsla(38,100%,56%,0.15)', color: 'hsl(38,100%,65%)' }}>
            ملاحظة: يعكس هذا التحليل المحتوى العام المجمع ولا يمثل حكمًا نهائيًا على الشخص.
          </div>
        </div>
      </div>
    </div>
  );
}
