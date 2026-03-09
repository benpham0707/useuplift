/**
 * ActivityAnnotatedCard — compact activity card with inline annotation highlights.
 *
 * Displays a 150-char activity description with severity-coded highlights,
 * similar to AnnotatedEssayReader but in a card format for the activity list.
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AnnotationHighlight } from '../AnnotationHighlight';
import type {
  EssayAnnotation,
  AnnotationSeverity,
} from '../types';
import { buildHighlightSegments } from '../utils/highlightBuilder';
import { resolveAnchors } from '../utils/anchorResolver';

interface ActivityAnnotatedCardProps {
  activityId: string;
  title: string;
  role: string;
  category: string;
  description: string;
  annotations: EssayAnnotation[];
  eqi: number;
  impressionLabel: string;
  textHash: string;
  selectedAnnotationId: string | null;
  hoveredAnnotationId: string | null;
  onAnnotationClick: (id: string) => void;
  onAnnotationHover: (id: string | null) => void;
  onCardClick?: () => void;
}

function getEqiColor(eqi: number): string {
  if (eqi < 60) return 'text-red-600 dark:text-red-400';
  if (eqi <= 75) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function getSeverityCounts(annotations: EssayAnnotation[]): Record<AnnotationSeverity, number> {
  const counts: Record<AnnotationSeverity, number> = {
    critical: 0,
    important: 0,
    suggestion: 0,
    strength: 0,
  };
  for (const a of annotations) {
    counts[a.severity]++;
  }
  return counts;
}

const ALL_SEVERITIES = new Set<AnnotationSeverity>(['critical', 'important', 'suggestion', 'strength']);

export const ActivityAnnotatedCard: React.FC<ActivityAnnotatedCardProps> = ({
  title,
  role,
  category,
  description,
  annotations,
  eqi,
  impressionLabel,
  textHash,
  selectedAnnotationId,
  hoveredAnnotationId,
  onAnnotationClick,
  onAnnotationHover,
  onCardClick,
}) => {
  // Resolve + segment annotations for the description text
  const resolved = useMemo(
    () => resolveAnchors(annotations, description, textHash),
    [annotations, description, textHash],
  );

  const segments = useMemo(
    () =>
      buildHighlightSegments(description, resolved, {
        severities: ALL_SEVERITIES,
        dimensionIds: new Set<string>(),
        showStale: true,
      }),
    [description, resolved],
  );

  const severityCounts = useMemo(() => getSeverityCounts(annotations), [annotations]);

  return (
    <div
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onClick={onCardClick}
      onKeyDown={
        onCardClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick();
              }
            }
          : undefined
      }
      className={cn(
        'rounded-lg border border-border/60 p-4 space-y-3 transition-colors',
        onCardClick && 'cursor-pointer hover:bg-muted/30',
      )}
    >
      {/* Header: title + score */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-foreground truncate">{title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {role} &middot; {category}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className={cn('text-lg font-bold tabular-nums', getEqiColor(eqi))}>
            {Math.round(eqi)}
          </div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {impressionLabel}
          </div>
        </div>
      </div>

      {/* Description with highlights */}
      <p className="text-xs leading-relaxed text-foreground/80">
        {segments.map((segment, i) => {
          if (segment.annotations.length === 0) {
            return <span key={i}>{segment.text}</span>;
          }

          const primaryId = segment.annotations[0].id;
          const isSelected = segment.annotations.some((a) => a.id === selectedAnnotationId);
          const isHovered = segment.annotations.some((a) => a.id === hoveredAnnotationId);

          return (
            <AnnotationHighlight
              key={i}
              segment={segment}
              isSelected={isSelected}
              isHovered={isHovered}
              onClick={() => {
                onAnnotationClick(primaryId);
              }}
              onMouseEnter={() => onAnnotationHover(primaryId)}
              onMouseLeave={() => onAnnotationHover(null)}
            />
          );
        })}
      </p>

      {/* Severity counts */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {severityCounts.critical > 0 && (
          <Badge className="text-[10px] py-0 bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300" variant="outline">
            {severityCounts.critical} critical
          </Badge>
        )}
        {severityCounts.important > 0 && (
          <Badge className="text-[10px] py-0 bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300" variant="outline">
            {severityCounts.important} important
          </Badge>
        )}
        {severityCounts.suggestion > 0 && (
          <Badge className="text-[10px] py-0 bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300" variant="outline">
            {severityCounts.suggestion} suggestion
          </Badge>
        )}
        {severityCounts.strength > 0 && (
          <Badge className="text-[10px] py-0 bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300" variant="outline">
            {severityCounts.strength} strength
          </Badge>
        )}
      </div>
    </div>
  );
};
