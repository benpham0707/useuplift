/**
 * AnnotationContextPanel — right-side panel with state-machine navigation.
 *
 * Three views:
 * - Dashboard: score overview + priorities + strengths
 * - Annotation: full detail card for selected annotation
 * - Deep Dive: expanded teaching content for an annotation
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { AnnotatedAnalysisResult, ResolvedAnnotation, ContextPanelView, DeepDiveResult } from './types';
import { ScoreDashboardCompact } from './ScoreDashboardCompact';
import { AnnotationDetailCard } from './AnnotationDetailCard';

interface AnnotationContextPanelProps {
  view: ContextPanelView;
  result: AnnotatedAnalysisResult | null;
  annotations: ResolvedAnnotation[];
  isDeepDiveLoading: boolean;
  onDeepDive: (annotationId: string) => void;
  onBack: () => void;
}

function DeepDiveView({ result, isLoading }: { result?: DeepDiveResult; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Generating deeper analysis...</span>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Expanded teaching */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Deep Analysis
        </h4>
        <p className="text-sm text-foreground/90 leading-relaxed">
          {result.expandedTeaching}
        </p>
      </div>

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Alternative Approaches
          </h4>
          <div className="space-y-2">
            {result.alternatives.map((alt, i) => (
              <div key={i} className="rounded-md border border-border/60 p-3">
                <p className="text-sm font-medium text-foreground mb-1">
                  &ldquo;{alt.text}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">{alt.tradeoff}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exemplar */}
      {result.exemplar && (
        <div className="rounded-md bg-purple-50/30 dark:bg-purple-950/10 border border-purple-200/30 dark:border-purple-800/30 p-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
            Elite Exemplar
          </h4>
          <p className="text-sm text-foreground font-medium italic mb-1">
            &ldquo;{result.exemplar.text}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground">{result.exemplar.whyItWorks}</p>
        </div>
      )}

      {/* Craft principle */}
      {result.craftPrinciple && (
        <div className="rounded-md bg-muted/30 p-3">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Craft Principle: {result.craftPrinciple.name}
          </h4>
          <p className="text-xs text-foreground/80 mb-2">{result.craftPrinciple.explanation}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-red-50/50 dark:bg-red-950/10 p-2">
              <span className="text-[9px] font-semibold uppercase text-muted-foreground">Before</span>
              <p className="mt-0.5 text-foreground/70">{result.craftPrinciple.beforeAfter.before}</p>
            </div>
            <div className="rounded bg-green-50/50 dark:bg-green-950/10 p-2">
              <span className="text-[9px] font-semibold uppercase text-muted-foreground">After</span>
              <p className="mt-0.5 text-foreground/90 font-medium">{result.craftPrinciple.beforeAfter.after}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const AnnotationContextPanel: React.FC<AnnotationContextPanelProps> = ({
  view,
  result,
  annotations,
  isDeepDiveLoading,
  onDeepDive,
  onBack,
}) => {
  const selectedAnnotation = useMemo(() => {
    if (view.type === 'annotation' || view.type === 'deep-dive') {
      return annotations.find((a) => a.id === view.annotationId) ?? null;
    }
    return null;
  }, [view, annotations]);

  const showBackButton = view.type !== 'dashboard';

  return (
    <div className="h-full flex flex-col">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 flex-shrink-0">
        {showBackButton && (
          <Button variant="ghost" size="sm" onClick={onBack} className="h-7 w-7 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {view.type === 'dashboard' && 'Score Overview'}
          {view.type === 'annotation' && 'Annotation Detail'}
          {view.type === 'deep-dive' && 'Deep Dive'}
        </h3>
      </div>

      {/* Panel content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {view.type === 'dashboard' && result && (
            <ScoreDashboardCompact result={result} />
          )}

          {view.type === 'annotation' && selectedAnnotation && (
            <AnnotationDetailCard
              annotation={selectedAnnotation}
              onDeepDive={onDeepDive}
              isDeepDiveLoading={isDeepDiveLoading}
            />
          )}

          {view.type === 'deep-dive' && (
            <div className="space-y-4">
              {selectedAnnotation && (
                <AnnotationDetailCard
                  annotation={selectedAnnotation}
                  onDeepDive={onDeepDive}
                  isDeepDiveLoading={isDeepDiveLoading}
                />
              )}
              <div className="border-t border-border/60 pt-4">
                <DeepDiveView result={view.result} isLoading={isDeepDiveLoading} />
              </div>
            </div>
          )}

          {!result && view.type === 'dashboard' && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Run analysis to see scores
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
