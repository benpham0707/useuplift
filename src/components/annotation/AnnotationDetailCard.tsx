/**
 * AnnotationDetailCard — full detail view for a selected annotation.
 *
 * Shows severity badge, dimension tag, insight, suggestion, optional
 * rewrite example, and action buttons (Go Deeper, copy rewrite).
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Star,
  ArrowDown,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import type { ResolvedAnnotation, AnnotationSeverity } from './types';

interface AnnotationDetailCardProps {
  annotation: ResolvedAnnotation;
  onDeepDive: (annotationId: string) => void;
  isDeepDiveLoading: boolean;
}

const SEVERITY_BADGE: Record<AnnotationSeverity, { label: string; icon: typeof AlertTriangle; className: string }> = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300',
  },
  important: {
    label: 'Important',
    icon: AlertCircle,
    className: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
  },
  suggestion: {
    label: 'Suggestion',
    icon: Lightbulb,
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300',
  },
  strength: {
    label: 'Strength',
    icon: Star,
    className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300',
  },
};

export const AnnotationDetailCard: React.FC<AnnotationDetailCardProps> = ({
  annotation,
  onDeepDive,
  isDeepDiveLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const badge = SEVERITY_BADGE[annotation.severity];
  const SeverityIcon = badge.icon;

  const copyRewrite = useCallback(async () => {
    if (!annotation.rewriteExample) return;
    try {
      await navigator.clipboard.writeText(annotation.rewriteExample);
    } catch {
      // Fallback for non-HTTPS contexts
      const ta = document.createElement('textarea');
      ta.value = annotation.rewriteExample;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [annotation.rewriteExample]);

  return (
    <div className="space-y-4">
      {/* Header: severity + dimension */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={cn('gap-1 border', badge.className)} variant="outline">
          <SeverityIcon className="h-3 w-3" />
          {badge.label}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          {annotation.dimensionId}
        </Badge>
        {annotation.stale && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
            Stale
          </Badge>
        )}
      </div>

      {/* Quoted text */}
      <div className="rounded-md bg-muted/40 px-3 py-2 border-l-2 border-muted-foreground/20">
        <p className="text-xs text-muted-foreground italic line-clamp-3">
          &ldquo;{annotation.span.text}&rdquo;
        </p>
      </div>

      {/* Insight */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Insight
        </h4>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {annotation.insight}
        </p>
      </div>

      {/* Suggestion */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Suggestion
        </h4>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {annotation.suggestion}
        </p>
      </div>

      {/* Rewrite example */}
      {annotation.rewriteExample && (
        <div className="rounded-lg border border-border/60 bg-emerald-50/30 dark:bg-emerald-950/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Suggested rewrite
            </span>
            <button
              type="button"
              onClick={copyRewrite}
              className={cn(
                'flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors',
                copied
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
            </button>
          </div>
          <p className="text-sm text-foreground font-medium leading-relaxed">
            {annotation.rewriteExample}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeepDive(annotation.id)}
          disabled={isDeepDiveLoading}
          className="text-xs gap-1.5"
        >
          <ArrowDown className="h-3 w-3" />
          {isDeepDiveLoading ? 'Loading...' : 'Go Deeper'}
        </Button>
      </div>
    </div>
  );
};
