/**
 * ScoreDashboardCompact — vertical score dashboard for the context panel.
 *
 * Shows EQI score with impression label and 13 dimension bars.
 * Color-coded by score range: red (<60), amber (60-75), green (>75).
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { DerivedDimensionScore, AnnotatedAnalysisResult } from './types';

interface ScoreDashboardCompactProps {
  result: AnnotatedAnalysisResult;
}

function getScoreColor(score: number): { bar: string; text: string } {
  if (score < 60) return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
  if (score <= 75) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
}

function DimensionBar({ dim }: { dim: DerivedDimensionScore }) {
  const colors = getScoreColor(dim.score);
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-foreground/70 truncate mr-2">
          {dim.displayName}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {dim.effectiveWeight < 1 && (
            <span className="text-[9px] text-muted-foreground/60 tabular-nums">
              w:{dim.effectiveWeight.toFixed(1)}
            </span>
          )}
          <span className={cn('text-[11px] font-medium tabular-nums', colors.text)}>
            {Math.round(dim.score)}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
          style={{ width: `${Math.min(dim.score, 100)}%` }}
        />
      </div>
    </div>
  );
}

export const ScoreDashboardCompact: React.FC<ScoreDashboardCompactProps> = ({ result }) => {
  const eqiColors = getScoreColor(result.eqi);

  return (
    <div className="space-y-4">
      {/* EQI Header */}
      <div className="text-center py-3">
        <div className={cn('text-3xl font-bold tabular-nums', eqiColors.text)}>
          {Math.round(result.eqi)}
        </div>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
          {result.impressionLabel}
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2 text-xs text-foreground/80">
        {result.summary.strengths.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Strengths
            </h4>
            <ul className="space-y-0.5">
              {result.summary.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">+</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.summary.improvements.length > 0 && (
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Improvements
            </h4>
            <ul className="space-y-0.5">
              {result.summary.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">-</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Dimension bars */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Dimensions
        </h4>
        <div className="space-y-2">
          {result.dimensionScores
            .sort((a, b) => a.score - b.score)
            .map((dim) => (
              <DimensionBar key={dim.dimensionId} dim={dim} />
            ))}
        </div>
      </div>
    </div>
  );
};
