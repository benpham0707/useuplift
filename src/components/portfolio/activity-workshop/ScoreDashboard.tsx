// @ts-nocheck
/**
 * ScoreDashboard
 *
 * Extracted from ActivityWorkshop.tsx — the 6-card score grid
 * (Overall + 5 clickable category cards) plus the full-width
 * expansion panel with caret indicator.
 *
 * All expansion state + caret refs are local so parent re-renders
 * don't force a recalculation or DOM measurement.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import type { ActivityWorkshopPipelineResult } from '../../../services/portfolioStrategy/services/activityWorkshop/types';

// ============================================================================
// TYPES
// ============================================================================

interface ScoreDashboardProps {
  data: ActivityWorkshopPipelineResult;
}

// ============================================================================
// HELPER
// ============================================================================

const getScoreCardColor = (score: number): string => {
  if (score >= 8.0) return 'text-green-500';
  if (score >= 6.0) return 'text-teal-500';
  if (score >= 4.0) return 'text-amber-500';
  return 'text-red-500';
};

// ============================================================================
// COMPONENT
// ============================================================================

const ScoreDashboard = React.memo(function ScoreDashboard({ data }: ScoreDashboardProps) {
  const [expandedScoreCard, setExpandedScoreCard] = useState<number | null>(null);
  const [caretLeftPx, setCaretLeftPx] = useState<number | null>(null);
  const scoreCardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scoreContainerRef = useRef<HTMLDivElement>(null);

  // Derive score cards from pipeline data
  const rubric = data.scoring?.portfolioRubric;
  const overallScore = rubric?.overallScore?.total ?? 0;
  const harvardDesc = rubric?.harvardScale?.description ?? '';
  const harvardRating = rubric?.harvardScale?.rating ?? 0;
  const overallConfidence = rubric?.overallScore?.confidence ?? 0;

  const scoreCards = useMemo(() => {
    const categoryMap: { label: string; key: string }[] = [
      { label: 'Activity Strength', key: 'tierDistribution' },
      { label: 'Spike Depth', key: 'spikeDetection' },
      { label: 'Story Coherence', key: 'coherence' },
      { label: 'Major Fit', key: 'majorAlignment' },
      { label: 'Description Quality', key: 'presentationQuality' },
    ];

    return categoryMap.map(({ label, key }) => {
      const dim = rubric?.breakdown?.[key];
      const recs = (rubric?.prioritizedRecommendations ?? [])
        .filter((r: any) => {
          const rec = (r.recommendation ?? '').toLowerCase();
          if (key === 'tierDistribution') return rec.includes('tier') || rec.includes('activity') || rec.includes('strength');
          if (key === 'spikeDetection') return rec.includes('spike') || rec.includes('depth') || rec.includes('publication') || rec.includes('research');
          if (key === 'coherence') return rec.includes('coheren') || rec.includes('story') || rec.includes('narrative') || rec.includes('connect');
          if (key === 'majorAlignment') return rec.includes('major') || rec.includes('fit') || rec.includes('align');
          if (key === 'presentationQuality') return rec.includes('description') || rec.includes('quantif') || rec.includes('presentation');
          return false;
        })
        .map((r: any) => r.recommendation ?? '');

      return {
        label,
        score: dim?.score ?? 0,
        rationale: dim?.rationale ?? '',
        improvements: recs.length > 0 ? recs : ['Analysis pending...'],
      };
    });
  }, [rubric]);

  // Recalculate caret position on card selection and window resize
  useEffect(() => {
    const recalc = () => {
      if (expandedScoreCard === null || !scoreContainerRef.current) {
        setCaretLeftPx(null);
        return;
      }
      const btn = scoreCardRefs.current[expandedScoreCard];
      const container = scoreContainerRef.current;
      if (btn && container) {
        const btnRect = btn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        setCaretLeftPx(btnRect.left - containerRect.left + btnRect.width / 2);
      }
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [expandedScoreCard]);

  return (
    <div ref={scoreContainerRef} className="relative space-y-0">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {/* ---- OVERALL card: non-expandable, display-only ---- */}
        <div className="flex flex-col items-center">
          <div className="w-full text-center p-4 rounded-xl border border-white/30 bg-white/15 backdrop-blur-sm">
            <div className={`text-4xl font-bold ${getScoreCardColor(overallScore)}`}>
              {overallScore.toFixed(1)}
            </div>
            <div className="text-xs font-medium text-white/80 mt-1 uppercase tracking-wider">
              Overall
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 mt-1">
            <span className="text-[10px] text-white/50">{harvardRating ? `Harvard Scale ${harvardRating}` : ''}{overallConfidence ? ` — ${Math.round(overallConfidence * 100)}% confidence` : ''}</span>
            <span className="text-[10px] text-teal-400/70 font-medium">{harvardDesc ? harvardDesc.split(':')[0] : ''}</span>
          </div>
        </div>
        {scoreCards.map((card, idx) => (
          <button
            key={card.label}
            ref={(el) => { scoreCardRefs.current[idx] = el; }}
            onClick={() => setExpandedScoreCard(expandedScoreCard === idx ? null : idx)}
            className={`w-full text-center p-4 rounded-xl border backdrop-blur-sm transition-colors duration-300 cursor-pointer ${
              expandedScoreCard === idx
                ? 'border-white/50 bg-white/25 shadow-lg'
                : 'border-white/20 bg-white/10 hover:bg-white/15 hover:border-white/30'
            }`}
          >
            <div className={`text-3xl font-bold ${getScoreCardColor(card.score)}`}>
              {card.score.toFixed(1)}
            </div>
            <div className="text-xs font-medium text-white/80 mt-1 uppercase tracking-wider">
              {card.label}
            </div>
          </button>
        ))}
      </div>

      {/* Full-width expansion panel with caret */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300"
        style={{
          maxHeight: expandedScoreCard !== null ? '400px' : '0px',
          opacity: expandedScoreCard !== null ? 1 : 0,
        }}
      >
        {expandedScoreCard !== null && (
          <div className="relative mt-3">
            {/* Caret triangle */}
            {caretLeftPx !== null && (
              <div
                className="absolute -top-2 w-4 h-4 bg-white/15 border-t border-l border-white/30 rotate-45 z-10"
                style={{ left: caretLeftPx - 8 }}
              />
            )}
            <div className="rounded-xl border border-white/25 bg-white/15 backdrop-blur-sm p-5">
              <h4 className="font-bold text-white text-base mb-2">{scoreCards[expandedScoreCard].label}</h4>
              <p className="text-sm text-white/90 leading-relaxed mb-3">{scoreCards[expandedScoreCard].rationale}</p>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">How to improve</p>
                <ul className="space-y-1.5">
                  {scoreCards[expandedScoreCard].improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                      <TrendingUp className="h-3.5 w-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ScoreDashboard;
