// @ts-nocheck - Legacy workshop file with type mismatches
/**
 * Extracurricular Workshop - Complete Integration
 *
 * Multi-stage professional workshop leveraging full backend system:
 * - Phase 1: Analysis (11-category rubric + deep analysis)
 * - Phase 2: Coaching (teaching-focused issues with examples)
 * - Phase 3: Editing (live feedback + version history)
 * - Phase 4: Generation (optional AI assistance)
 *
 * Philosophy: Build better writers through teaching, not copy-paste.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExtracurricularItem } from '../ExtracurricularCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, RefreshCcw, Target, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, MessageCircle, Send, CheckCircle2, Clock, AlertTriangle, History } from 'lucide-react';

// Backend integration
import { type AnalysisResult } from './backendTypes';
import { analyzeExtracurricularEntry } from '@/services/workshopAnalysisService';
import { transformAnalysisToCoaching } from './teachingTransformer';
import type { TeachingCoachingOutput, TeachingIssue } from './teachingTypes';

// Versioning system
import { saveVersion, getVersions } from './versioningSystem';
import { VersionHistory } from './VersionHistory';

// Views - import components we need from these views
import { EditorView } from './views/EditorView';
import { TeachingIssueCard } from './components/TeachingIssueCard';
import { RubricDimensionCard } from './RubricDimensionCard';
import type { RubricDimension, WritingIssue, EditSuggestion } from './types';

// Chat integration
import ContextualWorkshopChat from './components/ContextualWorkshopChat';

// Reflection prompts
import {
  type ReflectionPromptSet,
  generateReflectionPromptsWithCache,
} from '@/services/workshop/reflectionPrompts';

interface ExtracurricularWorkshopProps {
  activity: ExtracurricularItem;
}

interface DraftVersion {
  text: string;
  timestamp: number;
  score: number;
}

export const ExtracurricularWorkshopFinal: React.FC<ExtracurricularWorkshopProps> = ({
  activity,
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Draft management
  const [currentDraft, setCurrentDraft] = useState(activity.description || '');
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([
    { text: activity.description || '', timestamp: Date.now(), score: 0 },
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [teachingCoaching, setTeachingCoaching] = useState<TeachingCoachingOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Teaching issues state (mutable for student interaction)
  const [teachingIssues, setTeachingIssues] = useState<TeachingIssue[]>([]);

  // Re-analysis debounce
  const reanalysisTimerRef = useRef<number | null>(null);
  const [needsReanalysis, setNeedsReanalysis] = useState(false);

  // Initial score tracking
  const initialScoreRef = useRef<number>(0);

  // UI state for expandable sections
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(null);

  // Rubric dimensions (transformed from backend categories)
  const [dimensions, setDimensions] = useState<RubricDimension[]>([]);

  // Version history modal state
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Reflection state (for chat integration)
  const [reflectionPromptsMap, setReflectionPromptsMap] = useState<Map<string, ReflectionPromptSet>>(new Map());
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, Record<string, string>>>({});

  // ============================================================================
  // INITIAL ANALYSIS
  // ============================================================================

  const performAnalysis = useCallback(
    async (draft: string, isInitial: boolean = false) => {
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {

        // Call real backend analysis system
        const result = await analyzeExtracurricularEntry(draft, activity, {
          depth: 'comprehensive', // product API calls should use ANTHROPIC_API_KEY as normal
          skip_coaching: false,
        });

        setAnalysisResult(result);

        // Transform to teaching format
        const coaching = transformAnalysisToCoaching(
          result.analysis,
          result.coaching || null,
          draft
        );
        setTeachingCoaching(coaching);
        setTeachingIssues(coaching.teaching_issues);

        // Cache results to activity object to avoid re-analysis
        (activity as any).workshopAnalysis = {
          analysisResult: result,
          teachingCoaching: coaching,
          teachingIssues: coaching.teaching_issues,
          timestamp: Date.now(),
          draft,
        };

        // Auto-save version to localStorage for persistence
        try {
          const savedVersion = saveVersion(
            activity,
            draft,
            result,
            {
              depth: 'comprehensive',
              engine: 'sophisticated_19_iteration_system',
            }
          );
        } catch (versionError) {
          // Don't fail the whole analysis if version save fails
        }

        // Track initial score
        if (isInitial) {
          initialScoreRef.current = result.analysis.narrative_quality_index;
        }

        // Update version score
        setDraftVersions((prev) => {
          const updated = [...prev];
          updated[currentVersionIndex] = {
            ...updated[currentVersionIndex],
            score: result.analysis.narrative_quality_index,
          };
          return updated;
        });

        setNeedsReanalysis(false);
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : 'Analysis failed. Please try again.'
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [activity, currentVersionIndex]
  );

  // Transform backend categories to RubricDimension format
  const transformCategoriesToDimensions = useCallback((analysisResult: AnalysisResult, teachingIssues: TeachingIssue[]): RubricDimension[] => {
    return analysisResult.analysis.categories.map((category) => {
      // Find all teaching issues for this category
      const categoryIssues = teachingIssues.filter(
        (issue) => issue.rubric_category === category.category
      );

      // Determine status based on score
      const percentage = (category.score / category.maxScore) * 100;
      let status: 'critical' | 'needs_work' | 'good' | 'excellent';
      if (percentage >= 85) status = 'excellent';
      else if (percentage >= 70) status = 'good';
      else if (percentage >= 55) status = 'needs_work';
      else status = 'critical';

      // Transform teaching issues to WritingIssue format
      const issues: WritingIssue[] = categoryIssues.map((teachingIssue) => {
        // Transform edit suggestions from elite essay examples
        const suggestions: EditSuggestion[] = teachingIssue.examples?.map((example, idx) => ({
          text: typeof example === 'string' ? example : example.after?.text || '',
          rationale: typeof example === 'string'
            ? (teachingIssue.teaching_points?.[idx] || 'Apply this improvement')
            : example.annotations?.[0]?.explanation || 'Notice how this elite version improves the original',
          type: 'replace' as const,
        })) || [];

        return {
          id: teachingIssue.id,
          dimensionId: category.category,
          title: teachingIssue.title || teachingIssue.problem?.title || 'Untitled Issue',
          excerpt: teachingIssue.problem?.from_draft || teachingIssue.context || '',
          analysis: teachingIssue.problem?.explanation || (teachingIssue.teaching_points || []).join(' '),
          impact: teachingIssue.problem?.impact_on_score || teachingIssue.why_it_matters || '',
          suggestions,
          status: teachingIssue.status === 'completed' ? 'fixed' : teachingIssue.status === 'in_progress' ? 'in_progress' : 'not_fixed',
          currentSuggestionIndex: 0,
          expanded: false,
        };
      });

      // Get weight for this category
      const weight = analysisResult.analysis.weights[category.category] || 0;

      // Create overview from comments
      const overview = category.comments?.join(' ') || category.evidence?.join(' ') || 'No detailed analysis available.';

      return {
        id: category.category,
        name: category.category
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        score: category.score,
        maxScore: category.maxScore,
        status,
        overview,
        weight,
        issues,
      };
    });
  }, []);

  // Transform dimensions when analysis result changes (teachingIssues can be empty)
  useEffect(() => {
    if (analysisResult) {
      const transformed = transformCategoriesToDimensions(analysisResult, teachingIssues);
      setDimensions(transformed);
    }
  }, [analysisResult, teachingIssues, transformCategoriesToDimensions]);

  // Initial analysis on mount - ONLY if we don't have cached analysis
  useEffect(() => {
    // Check if activity already has cached workshop analysis
    const hasCachedAnalysis = (activity as any).workshopAnalysis;

    if (hasCachedAnalysis) {
      setAnalysisResult(hasCachedAnalysis.analysisResult);
      setTeachingCoaching(hasCachedAnalysis.teachingCoaching);
      setTeachingIssues(hasCachedAnalysis.teachingIssues);
      initialScoreRef.current = hasCachedAnalysis.analysisResult.analysis.narrative_quality_index;

      // Update version with initial score
      setDraftVersions([{
        text: activity.description || '',
        timestamp: Date.now(),
        score: hasCachedAnalysis.analysisResult.analysis.narrative_quality_index,
      }]);
    } else if (activity.description) {
      // Only run analysis if no cached data
      performAnalysis(activity.description, true);
    }
  }, []); // Only run once on mount

  // ============================================================================
  // DRAFT MANAGEMENT
  // ============================================================================

  const handleDraftChange = useCallback((newDraft: string) => {
    setCurrentDraft(newDraft);
    setNeedsReanalysis(true);

    // Clear existing timer (don't auto-reanalyze anymore)
    if (reanalysisTimerRef.current) {
      clearTimeout(reanalysisTimerRef.current);
      reanalysisTimerRef.current = null;
    }

    // Note: Removed automatic re-analysis to save credits
    // User must manually click "Re-analyze" button
  }, []);

  const handleSave = useCallback(() => {
    // Cancel pending re-analysis
    if (reanalysisTimerRef.current) {
      clearTimeout(reanalysisTimerRef.current);
      reanalysisTimerRef.current = null;
    }

    // Save new version
    const newVersion: DraftVersion = {
      text: currentDraft,
      timestamp: Date.now(),
      score: analysisResult?.analysis.narrative_quality_index || 0,
    };

    // Remove any versions after current index (if we're not at the end)
    const newVersions = draftVersions.slice(0, currentVersionIndex + 1);
    newVersions.push(newVersion);

    setDraftVersions(newVersions);
    setCurrentVersionIndex(newVersions.length - 1);

    // Trigger immediate re-analysis if needed
    if (needsReanalysis) {
      performAnalysis(currentDraft);
    }
  }, [
    currentDraft,
    draftVersions,
    currentVersionIndex,
    needsReanalysis,
    analysisResult,
    performAnalysis,
  ]);

  const handleUndo = useCallback(() => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      setCurrentDraft(draftVersions[newIndex].text);
      setNeedsReanalysis(false);
    }
  }, [currentVersionIndex, draftVersions]);

  const handleRedo = useCallback(() => {
    if (currentVersionIndex < draftVersions.length - 1) {
      const newIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(newIndex);
      setCurrentDraft(draftVersions[newIndex].text);
      setNeedsReanalysis(false);
    }
  }, [currentVersionIndex, draftVersions]);

  const handleRequestReanalysis = useCallback(() => {
    performAnalysis(currentDraft);
  }, [currentDraft, performAnalysis]);

  // ============================================================================
  // TEACHING ISSUE INTERACTIONS
  // ============================================================================

  const handleUpdateWorkspace = useCallback((issueId: string, draftText: string) => {
    setTeachingIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              student_workspace: {
                ...issue.student_workspace,
                draft_text: draftText,
                last_updated: Date.now(),
              },
              status: issue.status === 'not_started' ? 'in_progress' : issue.status,
            }
          : issue
      )
    );
  }, []);

  const handleRequestHint = useCallback((issueId: string) => {
    setTeachingIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== issueId) return issue;

        // Generate contextual hint (in real system, could call AI)
        const hint = `Try focusing on the principle: "${issue.principle.name}". Look at the examples and notice how they apply this concept. What specific element could you add to your own excerpt?`;

        return {
          ...issue,
          support: {
            ...issue.support,
            current_level: 'hint',
            hint,
          },
        };
      })
    );
  }, []);

  const handleRequestAIReview = useCallback((issueId: string) => {
    setTeachingIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== issueId) return issue;

        // Generate AI feedback (in real system, would call backend)
        const studentAttempt = issue.student_workspace.draft_text;
        const feedback = `Good start! You're applying the principle. Consider: ${issue.principle.description.substring(0, 100)}... Your attempt shows understanding. Try being even more specific.`;

        return {
          ...issue,
          student_workspace: {
            ...issue.student_workspace,
            feedback,
          },
          support: {
            ...issue.support,
            current_level: 'assist',
          },
        };
      })
    );
  }, []);

  const handleMarkComplete = useCallback((issueId: string) => {
    setTeachingIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              status: 'completed',
              student_workspace: {
                ...issue.student_workspace,
                is_complete: true,
              },
            }
          : issue
      )
    );
  }, []);

  // ============================================================================
  // CATEGORY EXPANSION HANDLERS
  // ============================================================================

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (analysisResult) {
      setExpandedCategories(new Set(analysisResult.analysis.categories.map((cat) => cat.category)));
    }
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const handleIssueExpand = (issueId: string) => {
    setExpandedIssueId(expandedIssueId === issueId ? null : issueId);
  };

  // ============================================================================
  // RUBRIC DIMENSION HANDLERS (for RubricDimensionCard)
  // ============================================================================

  const toggleDimensionExpand = useCallback((dimensionId: string) => {
    setExpandedDimensionId(prev => prev === dimensionId ? null : dimensionId);
  }, []);

  const handleToggleIssue = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(dim => {
      const containsIssue = dim.issues.some(i => i.id === issueId);
      if (!containsIssue) return dim;

      return {
        ...dim,
        issues: dim.issues.map(i => {
          if (i.id === issueId) {
            const willExpand = !i.expanded;
            return {
              ...i,
              expanded: willExpand,
              status: willExpand && i.status === 'not_fixed' ? 'in_progress' : i.status
            };
          }
          // Close all other issues in the same dimension
          return { ...i, expanded: false };
        })
      };
    }));
  }, []);

  const handleApplySuggestion = useCallback((issueId: string) => {
    const dimension = dimensions.find(d => d.issues.some(i => i.id === issueId));
    if (!dimension) return;

    const issue = dimension.issues.find(i => i.id === issueId);
    if (!issue || !issue.suggestions[issue.currentSuggestionIndex]) return;

    const suggestion = issue.suggestions[issue.currentSuggestionIndex];

    // Apply the suggestion to the draft
    let newDraft = currentDraft;
    if (suggestion.type === 'replace' && issue.excerpt) {
      newDraft = currentDraft.replace(issue.excerpt, suggestion.text);
    } else if (suggestion.type === 'insert_after' && issue.excerpt) {
      const idx = currentDraft.indexOf(issue.excerpt);
      if (idx !== -1) {
        newDraft = currentDraft.slice(0, idx + issue.excerpt.length) + ' ' + suggestion.text + currentDraft.slice(idx + issue.excerpt.length);
      }
    } else if (suggestion.type === 'insert_before' && issue.excerpt) {
      const idx = currentDraft.indexOf(issue.excerpt);
      if (idx !== -1) {
        newDraft = currentDraft.slice(0, idx) + suggestion.text + ' ' + currentDraft.slice(idx);
      }
    }

    setCurrentDraft(newDraft);
    setNeedsReanalysis(true);

    // Mark issue as fixed
    setDimensions(prev => prev.map(d => ({
      ...d,
      issues: d.issues.map(i => i.id === issueId ? { ...i, status: 'fixed' as const } : i)
    })));
  }, [dimensions, currentDraft]);

  const handleNextSuggestion = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(dim => ({
      ...dim,
      issues: dim.issues.map(i => {
        if (i.id === issueId && i.currentSuggestionIndex < i.suggestions.length - 1) {
          return { ...i, currentSuggestionIndex: i.currentSuggestionIndex + 1 };
        }
        return i;
      })
    })));
  }, []);

  const handlePrevSuggestion = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(dim => ({
      ...dim,
      issues: dim.issues.map(i => {
        if (i.id === issueId && i.currentSuggestionIndex > 0) {
          return { ...i, currentSuggestionIndex: i.currentSuggestionIndex - 1 };
        }
        return i;
      })
    })));
  }, []);

  // ============================================================================
  // VERSION HISTORY HANDLERS
  // ============================================================================

  const handleRestoreVersion = useCallback((versionDescription: string) => {
    setCurrentDraft(versionDescription);
    setShowVersionHistory(false);
    setNeedsReanalysis(true);
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const currentScore = analysisResult?.analysis.narrative_quality_index || 0;
  const initialScore = initialScoreRef.current;

  const activeIssues = teachingIssues;

  // NQI status configuration
  const getNQIConfig = () => {
    const nqi = currentScore;
    if (nqi >= 85)
      return {
        label: 'Outstanding',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-100 dark:bg-green-950/30',
        border: 'border-green-300 dark:border-green-800',
        icon: TrendingUp,
      };
    if (nqi >= 75)
      return {
        label: 'Strong',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-950/30',
        border: 'border-blue-300 dark:border-blue-800',
        icon: TrendingUp,
      };
    if (nqi >= 65)
      return {
        label: 'Solid',
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-100 dark:bg-yellow-950/30',
        border: 'border-yellow-300 dark:border-yellow-800',
        icon: Minus,
      };
    return {
      label: 'Needs Work',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-950/30',
      border: 'border-red-300 dark:border-red-800',
      icon: TrendingDown,
    };
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state
  if (isAnalyzing && !analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Analyzing Your Essay</h3>
          <p className="text-sm text-muted-foreground">
            Running comprehensive 11-category rubric analysis...
          </p>
          <p className="text-xs text-muted-foreground mt-1">This may take 10-15 seconds</p>
        </div>
      </div>
    );
  }

  // Error state
  if (analysisError && !analysisResult) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{analysisError}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => performAnalysis(currentDraft, true)}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // No analysis result yet
  if (!analysisResult || !teachingCoaching) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No analysis available. Please try again.</p>
        <Button className="mt-4" onClick={() => performAnalysis(currentDraft, true)}>
          Analyze Essay
        </Button>
      </div>
    );
  }

  // Main workshop interface - unified vertical flow
  const nqiConfig = getNQIConfig();
  const NQIIcon = nqiConfig.icon;

  const completedCount = teachingIssues.filter((i) => i.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Error banner (if error during re-analysis) */}
      {analysisError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{analysisError}</span>
            <Button variant="outline" size="sm" onClick={() => setAnalysisError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 1. SCORE HERO SECTION - Full width across top */}
      <Card className={`border-2 ${nqiConfig.border}`}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-primary">Narrative Quality Index</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Your essay's overall effectiveness across all dimensions
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-5xl font-bold text-primary">
                  {currentScore}
                </span>
                <span className="text-2xl font-semibold text-muted-foreground mb-1">/100</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${nqiConfig.bg}`}>
                <NQIIcon className={`w-4 h-4 ${nqiConfig.color}`} />
                <span className={`text-sm font-bold ${nqiConfig.color}`}>{nqiConfig.label}</span>
              </div>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Issues to Resolve: {teachingIssues.length - completedCount} of {teachingIssues.length} remaining
              </span>
              <span className="font-semibold text-primary">
                {completedCount}/{teachingIssues.length} completed
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${teachingIssues.length > 0 ? (completedCount / teachingIssues.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Issue Status Breakdown */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">Completed</p>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {teachingIssues.filter((i) => i.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">In Progress</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {teachingIssues.filter((i) => i.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">Not Started</p>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {teachingIssues.filter((i) => i.status === 'not_started').length}
              </p>
            </div>
          </div>

          {/* Flags if any */}
          {analysisResult.analysis.flags.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
                ⚠️ Critical Issues:
              </p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.analysis.flags.map((flag, idx) => (
                  <Badge key={idx} variant="destructive" className="text-xs">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Version History Button */}
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionHistory(true)}
              className="w-full"
            >
              <History className="w-4 h-4 mr-2" />
              View Version History
              {getVersions(activity.id).length > 1 && (
                <Badge variant="secondary" className="ml-2">
                  {getVersions(activity.id).length} versions
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2-COLUMN LAYOUT: Editor+Rubric (3/5) | Chat (2/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN: Editor and Rubric */}
        <div className="lg:col-span-3 space-y-6">
          {/* Warning banner if changes need re-analysis */}
          {needsReanalysis && !isAnalyzing && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              You've made changes to your essay. Click <strong>Re-analyze</strong> to get updated feedback.
            </span>
            <Button variant="default" size="sm" onClick={handleRequestReanalysis}>
              Re-analyze Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 2. EDITOR SECTION - Full EditorView with side coaching panel */}
      <EditorView
        currentDraft={currentDraft}
        onDraftChange={handleDraftChange}
        onSave={handleSave}
        activeIssues={activeIssues}
        currentScore={currentScore}
        initialScore={initialScore}
        isAnalyzing={isAnalyzing}
        onRequestReanalysis={handleRequestReanalysis}
        versionHistory={draftVersions}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={currentVersionIndex > 0}
        canRedo={currentVersionIndex < draftVersions.length - 1}
      />
        </div>

        {/* RIGHT COLUMN: Chat (matches editor + textarea height) */}
        <div className="lg:col-span-2">
          <ContextualWorkshopChat
            activity={activity}
            currentDraft={currentDraft}
            analysisResult={analysisResult}
            teachingCoaching={teachingCoaching}
            currentScore={currentScore}
            initialScore={initialScore}
            hasUnsavedChanges={false}
            needsReanalysis={needsReanalysis}
            reflectionPromptsMap={reflectionPromptsMap}
            reflectionAnswers={reflectionAnswers}
            onToggleCategory={(categoryKey) => {
              setExpandedCategories((prev) => {
                const next = new Set(prev);
                if (next.has(categoryKey)) {
                  next.delete(categoryKey);
                } else {
                  next.add(categoryKey);
                }
                return next;
              });
            }}
            onLoadReflectionPrompts={undefined}
            onTriggerReanalysis={() => {
              if (needsReanalysis) {
                handleRequestReanalysis();
              }
            }}
          />
        </div>
      </div> {/* End grid */}

      {/* 3. RUBRIC DIMENSIONS - Full width below editor/chat */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-primary">
                Rubric Dimensions ({dimensions.length})
              </h2>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Click each dimension to see detailed analysis, issues, and edit suggestions.
          </p>

          {dimensions.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading dimensions...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dimensions.map((dimension) => (
                <RubricDimensionCard
                  key={dimension.id}
                  dimension={dimension}
                  onToggleIssue={handleToggleIssue}
                  onApplySuggestion={handleApplySuggestion}
                  onNextSuggestion={handleNextSuggestion}
                  onPrevSuggestion={handlePrevSuggestion}
                  isExpanded={expandedDimensionId === dimension.id}
                  onToggleExpand={() => toggleDimensionExpand(dimension.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Version History Modal */}
      {showVersionHistory && (
        <VersionHistory
          activity={activity}
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          onRestoreVersion={handleRestoreVersion}
        />
      )}
    </div>
  );
};
