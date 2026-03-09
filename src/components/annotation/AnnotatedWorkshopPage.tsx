/**
 * AnnotatedWorkshopPage — top-level container for the annotation-based workshop.
 *
 * Manages read/edit mode, analysis state, and layout.
 * Uses ResizablePanelGroup for a horizontal split (60/40) on desktop,
 * vertical on smaller viewports.
 *
 * On mount, calls the annotation pipeline API and wires resolved annotations
 * into the essay reader and context panel.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { AnnotatedAnalysisResult, AnnotationPipelineConfig } from '../../pipeline/types';
import type { WorkshopEssayType } from '../../workshop/shared/types';
import { useAnnotationResolver } from './hooks/useAnnotationResolver';
import { useAnnotationState } from './hooks/useAnnotationState';
import { buildHighlightSegments, buildParagraphInfo } from './utils/highlightBuilder';
import { WorkshopToolbar } from './WorkshopToolbar';
import { AnnotatedEssayReader } from './AnnotatedEssayReader';
import { AnnotationContextPanel } from './AnnotationContextPanel';
import { AnnotationFilterBar } from './AnnotationFilterBar';

interface AnnotatedWorkshopPageProps {
  initialText: string;
  essayType: WorkshopEssayType;
  config?: Partial<AnnotationPipelineConfig>;
  onTextChange?: (text: string) => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const AnnotatedWorkshopPage: React.FC<AnnotatedWorkshopPageProps> = ({
  initialText,
  essayType,
  config,
  onTextChange,
}) => {
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [text, setText] = useState(initialText);
  const [editedText, setEditedText] = useState(initialText);
  const [analysisResult, setAnalysisResult] = useState<AnnotatedAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Annotation state (selection, hover, filters, panel)
  const state = useAnnotationState(analysisResult);

  // Resolve annotations to character offsets
  const resolved = useAnnotationResolver(
    analysisResult?.annotations,
    text,
    analysisResult?.textHash ?? '',
  );

  // Build renderable segments and paragraph info
  const segments = useMemo(
    () => buildHighlightSegments(text, resolved, state.filters),
    [text, resolved, state.filters],
  );

  const paragraphs = useMemo(
    () => buildParagraphInfo(text, resolved),
    [text, resolved],
  );

  const wordCount = useMemo(() => countWords(mode === 'edit' ? editedText : text), [mode, text, editedText]);

  // Run analysis
  const analyze = useCallback(async (essayText: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/v1/annotate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: essayText,
          config: { essayType, ...config },
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAnalysisResult(json.data);
        setHasChanges(false);
      }
    } catch (err) {
      console.error('[AnnotatedWorkshopPage] Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [essayType, config]);

  // Analyze on mount
  useEffect(() => {
    analyze(initialText);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mode toggle
  const handleModeToggle = useCallback(() => {
    if (mode === 'edit') {
      // Switching from edit to read: commit edits
      if (editedText !== text) {
        setText(editedText);
        setHasChanges(true);
        onTextChange?.(editedText);
      }
    } else {
      // Switching from read to edit: sync edited text
      setEditedText(text);
    }
    setMode((prev) => (prev === 'read' ? 'edit' : 'read'));
  }, [mode, text, editedText, onTextChange]);

  // Re-analyze after edits
  const handleReanalyze = useCallback(() => {
    analyze(text);
  }, [analyze, text]);

  // Deep dive handler
  const handleDeepDive = useCallback(async (annotationId: string) => {
    if (!analysisResult) return;
    const annotation = analysisResult.annotations.find((a) => a.id === annotationId);
    if (!annotation) return;

    state.openDeepDive(annotationId);

    try {
      const res = await fetch('/api/v1/annotate/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: analysisResult.analysisId,
          annotationId,
          annotation,
          essayText: text,
          essayType,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        state.completeDeepDive(annotationId, json.data);
      }
    } catch (err) {
      console.error('[AnnotatedWorkshopPage] Deep dive failed:', err);
    }
  }, [analysisResult, text, essayType, state]);

  return (
    <div className="flex flex-col h-full">
      <WorkshopToolbar
        mode={mode}
        onModeToggle={handleModeToggle}
        wordCount={wordCount}
        isAnalyzing={isAnalyzing}
        hasChanges={hasChanges}
        onReanalyze={handleReanalyze}
      />

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left panel: essay */}
          <ResizablePanel defaultSize={60} minSize={40}>
            {mode === 'read' ? (
              <AnnotatedEssayReader
                text={text}
                segments={segments}
                paragraphs={paragraphs}
                selectedAnnotationId={state.selectedAnnotationId}
                hoveredAnnotationId={state.hoveredAnnotationId}
                onAnnotationClick={state.selectAnnotation}
                onAnnotationHover={state.hoverAnnotation}
              />
            ) : (
              <div className="h-full p-4">
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className={cn(
                    'w-full h-full resize-none rounded-md border border-border/60 p-4',
                    'text-sm leading-relaxed text-foreground bg-background',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  )}
                  placeholder="Enter your essay text..."
                />
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right panel: context */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <div className={cn(mode === 'edit' && 'opacity-50 pointer-events-none', 'h-full')}>
              <AnnotationContextPanel
                view={state.contextPanelView}
                result={analysisResult}
                annotations={resolved}
                isDeepDiveLoading={state.isDeepDiveLoading}
                onDeepDive={handleDeepDive}
                onBack={state.goToDashboard}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Bottom filter bar */}
      {analysisResult && mode === 'read' && (
        <AnnotationFilterBar
          annotations={analysisResult.annotations}
          filters={state.filters}
          onToggleSeverity={state.toggleSeverityFilter}
          onToggleStale={state.toggleStaleFilter}
        />
      )}
    </div>
  );
};
