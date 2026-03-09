/**
 * useAnnotationState — manages selection, hover, filter, and context panel state
 * for the annotation UI.
 *
 * Provides a centralized state management hook that coordinates:
 * - Which annotation is selected (clicked) and hovered
 * - Active severity/dimension filters
 * - Context panel navigation (dashboard, annotation detail, deep dive)
 * - Deep dive loading state
 */

import { useState, useCallback } from 'react';
import type { AnnotatedAnalysisResult } from '../../../pipeline/types';
import type { AnnotationFilters, AnnotationSeverity, ContextPanelView } from '../types';

const ALL_SEVERITIES: AnnotationSeverity[] = ['critical', 'important', 'suggestion', 'strength'];

function createDefaultFilters(): AnnotationFilters {
  return {
    severities: new Set<AnnotationSeverity>(ALL_SEVERITIES),
    dimensionIds: new Set<string>(),
    showStale: true,
  };
}

export function useAnnotationState(result: AnnotatedAnalysisResult | null) {
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnnotationFilters>(createDefaultFilters);
  const [contextPanelView, setContextPanelView] = useState<ContextPanelView>({ type: 'dashboard' });
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);

  const selectAnnotation = useCallback((id: string | null) => {
    setSelectedAnnotationId(id);
    if (id) {
      setContextPanelView({ type: 'annotation', annotationId: id });
    } else {
      setContextPanelView({ type: 'dashboard' });
    }
  }, []);

  const hoverAnnotation = useCallback((id: string | null) => {
    setHoveredAnnotationId(id);
  }, []);

  const toggleSeverityFilter = useCallback((severity: AnnotationSeverity) => {
    setFilters((prev) => {
      const next = new Set(prev.severities);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return { ...prev, severities: next };
    });
  }, []);

  const toggleDimensionFilter = useCallback((dimensionId: string) => {
    setFilters((prev) => {
      const next = new Set(prev.dimensionIds);
      if (next.has(dimensionId)) {
        next.delete(dimensionId);
      } else {
        next.add(dimensionId);
      }
      return { ...prev, dimensionIds: next };
    });
  }, []);

  const toggleStaleFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, showStale: !prev.showStale }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  const openDeepDive = useCallback((annotationId: string) => {
    setIsDeepDiveLoading(true);
    setContextPanelView({ type: 'deep-dive', annotationId });
  }, []);

  const completeDeepDive = useCallback((annotationId: string, result: NonNullable<ContextPanelView & { type: 'deep-dive' }>['result']) => {
    setIsDeepDiveLoading(false);
    setContextPanelView({ type: 'deep-dive', annotationId, result });
  }, []);

  const goToDashboard = useCallback(() => {
    setSelectedAnnotationId(null);
    setContextPanelView({ type: 'dashboard' });
  }, []);

  return {
    // State
    selectedAnnotationId,
    hoveredAnnotationId,
    filters,
    contextPanelView,
    isDeepDiveLoading,
    annotations: result?.annotations ?? [],
    dimensionScores: result?.dimensionScores ?? [],

    // Handlers
    selectAnnotation,
    hoverAnnotation,
    toggleSeverityFilter,
    toggleDimensionFilter,
    toggleStaleFilter,
    resetFilters,
    openDeepDive,
    completeDeepDive,
    goToDashboard,
  };
}
