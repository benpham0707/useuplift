/**
 * AnnotationFilterBar — bottom bar with severity filter toggles.
 *
 * Shows toggleable badges with counts per severity level.
 * Also includes a stale toggle when stale annotations exist.
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Lightbulb, Star, Eye, EyeOff } from 'lucide-react';
import type { EssayAnnotation, AnnotationFilters, AnnotationSeverity } from './types';

interface AnnotationFilterBarProps {
  annotations: EssayAnnotation[];
  filters: AnnotationFilters;
  onToggleSeverity: (severity: AnnotationSeverity) => void;
  onToggleStale: () => void;
}

const SEVERITY_CONFIG: Record<AnnotationSeverity, {
  label: string;
  icon: typeof AlertTriangle;
  activeClass: string;
  inactiveClass: string;
}> = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    activeClass: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
    inactiveClass: 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted',
  },
  important: {
    label: 'Important',
    icon: AlertCircle,
    activeClass: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
    inactiveClass: 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted',
  },
  suggestion: {
    label: 'Suggestions',
    icon: Lightbulb,
    activeClass: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
    inactiveClass: 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted',
  },
  strength: {
    label: 'Strengths',
    icon: Star,
    activeClass: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
    inactiveClass: 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted',
  },
};

const SEVERITY_ORDER: AnnotationSeverity[] = ['critical', 'important', 'suggestion', 'strength'];

export const AnnotationFilterBar: React.FC<AnnotationFilterBarProps> = ({
  annotations,
  filters,
  onToggleSeverity,
  onToggleStale,
}) => {
  const counts = useMemo(() => {
    const result: Record<AnnotationSeverity, number> = {
      critical: 0,
      important: 0,
      suggestion: 0,
      strength: 0,
    };
    for (const a of annotations) {
      result[a.severity]++;
    }
    return result;
  }, [annotations]);

  const hasStale = useMemo(() => annotations.some((a) => a.stale), [annotations]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-border/60 bg-muted/20">
      {SEVERITY_ORDER.map((severity) => {
        const config = SEVERITY_CONFIG[severity];
        const Icon = config.icon;
        const isActive = filters.severities.has(severity);
        const count = counts[severity];

        return (
          <button
            key={severity}
            type="button"
            onClick={() => onToggleSeverity(severity)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              isActive ? config.activeClass : config.inactiveClass,
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{count}</span>
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}

      {hasStale && (
        <>
          <div className="w-px h-4 bg-border/60 mx-1" />
          <button
            type="button"
            onClick={onToggleStale}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              filters.showStale
                ? 'bg-muted text-muted-foreground border-border/60'
                : 'bg-muted/50 text-muted-foreground/50 border-transparent hover:bg-muted',
            )}
          >
            {filters.showStale ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>Stale</span>
          </button>
        </>
      )}
    </div>
  );
};
