import { SearchResult } from '@/types';
import { ExternalLink, BarChart2, Flag, AlertTriangle, Shield, Calendar, Globe } from 'lucide-react';
import { useState } from 'react';
import ReviewRequestModal from '@/components/review/ReviewRequestModal';

interface Props {
  result: SearchResult;
  onReviewSubmitted?: () => void;
}

export default function ResultCard({ result, onReviewSubmitted }: Props) {
  const [showReview, setShowReview] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const classConfig = {
    positive: {
      label: 'إيجابي',
      dot: 'bg-green-400',
      badge: 'badge-positive',
      border: 'border-green-400/20',
    },
    negative: {
      label: 'سلبي',
      dot: 'bg-red-400',
      badge: 'badge-negative',
      border: 'border-red-400/20',
    },
    neutral: {
      label: 'محايد',
      dot: 'bg-gray-400',
      badge: 'badge-neutral',
      border: 'border-gray-400/10',
    },
    unknown: {
      label: 'غير محدد',
      dot: 'bg-gray-500',
      badge: 'badge-neutral',
      border: 'border-gray-500/10',
    },
  };

  const cfg = classConfig[result.classification] || classConfig.neutral;

  const formatDate = (date?: string) => {
    if (!date) return 'غير محدد';
    return new Date(date).toLocaleDateString('ar', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'hsl(160,100%,50%)';
    if (score >= 60) return 'hsl(38,100%,56%)';
    return 'hsl(215,15%,55%)';
  };

  return (
    <>
      <div
        className={`intel-panel rounded-lg overflow-hidden transition-all duration-300 hover:border-cyan-500/20 group`}
        style={{ borderColor: 'hsl(218,40%,18%)' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: 'hsl(218,40%,15%)', background: 'hsl(218,50%,7%)' }}>
          <div className="flex items-center gap-2">
            <span className={cfg.badge}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {result.analysis?.allegation_detected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded"
                style={{ background: 'hsla(38,100%,56%,0.12)', color: 'hsl(38,100%,56%)', border: '1px solid hsla(38,100%,56%,0.3)' }}>
                <AlertTriangle className="w-2.5 h-2.5" />
                ادعاء غير مؤكد
              </span>
            )}
            {result.analysis?.claim_detected && !result.analysis?.allegation_detected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded"
                style={{ background: 'hsla(189,100%,50%,0.08)', color: 'hsl(189,100%,60%)', border: '1px solid hsla(189,100%,50%,0.2)' }}>
                محتوى رأي
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs"
              style={{ color: getMatchColor(result.match_confidence) }}>
              <Shield className="w-3 h-3" />
              <span className="font-mono font-semibold">{result.match_confidence}%</span>
              <span className="opacity-60" style={{ color: 'hsl(215,15%,55%)' }}>تطابق</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-sm leading-relaxed mb-2 group-hover:text-cyan-400 transition-colors"
            style={{ color: 'hsl(195,100%,90%)' }}>
            {result.title || 'بدون عنوان'}
          </h3>

          {result.excerpt && (
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'hsl(215,20%,60%)' }}>
              {expanded ? result.excerpt : (result.excerpt.length > 160 ? result.excerpt.slice(0, 160) + '...' : result.excerpt)}
              {result.excerpt.length > 160 && (
                <button onClick={() => setExpanded(!expanded)}
                  className="mr-1 text-cyan-400 hover:text-cyan-300 underline">
                  {expanded ? 'أقل' : 'المزيد'}
                </button>
              )}
            </p>
          )}

          {/* AI Summary */}
          {result.ai_summary && (
            <div className="mb-3 p-3 rounded text-xs leading-relaxed"
              style={{ background: 'hsla(189,100%,50%,0.04)', border: '1px solid hsla(189,100%,50%,0.1)', color: 'hsl(189,100%,75%)' }}>
              <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'hsla(189,100%,50%,0.6)' }}>
                AI SUMMARY
              </div>
              {result.ai_summary}
            </div>
          )}

          {/* Topics */}
          {result.analysis?.topics && result.analysis.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {result.analysis.topics.map(topic => (
                <span key={topic} className="px-2 py-0.5 text-[10px] rounded font-mono"
                  style={{ background: 'hsla(218,40%,15%,0.8)', color: 'hsl(215,20%,60%)', border: '1px solid hsl(218,40%,22%)' }}>
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'hsl(215,15%,50%)' }}>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {result.source_name || new URL(result.source_url).hostname}
            </span>
            {result.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(result.published_at)}
              </span>
            )}
            {result.language && (
              <span className="uppercase font-mono" style={{ color: 'hsl(215,15%,45%)' }}>
                [{result.language}]
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: 'hsl(218,40%,14%)' }}>
          <a
            href={result.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all"
            style={{
              background: 'hsla(189,100%,50%,0.06)',
              border: '1px solid hsla(189,100%,50%,0.2)',
              color: 'hsl(189,100%,60%)',
            }}
          >
            <ExternalLink className="w-3 h-3" />
            المصدر الأصلي
          </a>
          <button
            onClick={() => setShowReview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all mr-auto"
            style={{
              background: 'hsla(215,15%,50%,0.06)',
              border: '1px solid hsla(215,15%,50%,0.2)',
              color: 'hsl(215,15%,60%)',
            }}
          >
            <Flag className="w-3 h-3" />
            طلب مراجعة
          </button>
        </div>
      </div>

      {showReview && (
        <ReviewRequestModal
          resultId={result.id}
          personId={result.person_id}
          resultTitle={result.title}
          onClose={() => setShowReview(false)}
          onSubmitted={() => {
            setShowReview(false);
            onReviewSubmitted?.();
          }}
        />
      )}
    </>
  );
}
