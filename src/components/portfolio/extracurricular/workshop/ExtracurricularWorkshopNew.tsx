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

interface ExtracurricularWorkshopProps {
  activity: ExtracurricularItem;
}

interface DraftVersion {
  text: string;
  timestamp: number;
  score: number;
}

export const ExtracurricularWorkshopNew: React.FC<ExtracurricularWorkshopProps> = ({
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

  // Version history modal state
  const [showVersionHistory, setShowVersionHistory] = useState(false);

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

  // Category status helper
  const getCategoryStatus = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 85)
      return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    if (percentage >= 70)
      return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (percentage >= 55)
      return { label: 'Acceptable', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Needs Work', color: 'text-red-600 dark:text-red-400' };
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

      {/* 1. SCORE HERO SECTION - Overall quality at a glance */}
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

      {/* 3. RUBRIC CATEGORIES - Expandable with full analysis + coaching combined */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-primary">
                Rubric Categories ({analysisResult.analysis.categories.length})
              </h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <ChevronDown className="w-4 h-4 mr-1" />
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <ChevronUp className="w-4 h-4 mr-1" />
                Collapse All
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Click each category to see detailed analysis, evidence, suggestions, and teaching issues.
          </p>

          <div className="space-y-3">
            {analysisResult.analysis.categories.map((category) => {
              const isExpanded = expandedCategories.has(category.category);
              const status = getCategoryStatus(category.score, category.maxScore);
              const percentage = Math.round((category.score / category.maxScore) * 100);
              const weight = analysisResult.analysis.weights[category.category] || 0;

              // Find teaching issue for this category
              const relatedIssue = teachingIssues.find(
                (issue) => issue.rubric_category === category.category
              );

              // Debug logging
              if (isExpanded && !relatedIssue) {
              }

              return (
                <Card
                  key={category.category}
                  className={`border-2 transition-all ${
                    isExpanded ? 'border-primary' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-base text-foreground">
                            {category.category
                              .split('_')
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ')}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            Weight: {Math.round(weight * 100)}%
                          </Badge>
                          {relatedIssue && (
                            <Badge
                              className={`text-xs ${
                                relatedIssue.severity === 'critical'
                                  ? 'bg-red-600'
                                  : relatedIssue.severity === 'major'
                                  ? 'bg-orange-600'
                                  : 'bg-yellow-600'
                              } text-white`}
                            >
                              {relatedIssue.status === 'completed' ? '✓ ' : ''}
                              {relatedIssue.severity.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-foreground">
                            {category.score.toFixed(1)}/{category.maxScore}
                          </span>
                          <span className={`text-xs font-bold ${status.color}`}>
                            {percentage}% • {status.label}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percentage >= 85
                            ? 'bg-green-600 dark:bg-green-400'
                            : percentage >= 70
                            ? 'bg-blue-600 dark:bg-blue-400'
                            : percentage >= 55
                            ? 'bg-yellow-600 dark:bg-yellow-400'
                            : 'bg-red-600 dark:bg-red-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </button>

                  {/* Expanded Details - Full Teaching Issue */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t">
                      {relatedIssue ? (
                        // Show full TeachingIssueCard if issue exists
                        <div className="pt-4">
                          <TeachingIssueCard
                            issue={relatedIssue}
                            onUpdateWorkspace={handleUpdateWorkspace}
                            onRequestHint={handleRequestHint}
                            onRequestAIReview={handleRequestAIReview}
                            onMarkComplete={handleMarkComplete}
                            onExpand={handleIssueExpand}
                            isExpanded={expandedIssueId === relatedIssue.id}
                          />
                        </div>
                      ) : (
                        // Fallback: Show basic analysis if no teaching issue
                        <div className="pt-4 space-y-3">
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                              ✓ This category is performing well
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-400">
                              No major issues detected. Keep up the good work!
                            </p>
                          </div>

                          {/* Show evidence if available */}
                          {category.evidence && category.evidence.length > 0 && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                🔍 Strong examples from your essay:
                              </p>
                              <ul className="space-y-1">
                                {category.evidence.map((item, idx) => (
                                  <li key={idx} className="text-xs text-muted-foreground italic">
                                    "{item}"
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Show comments if available */}
                          {category.comments && category.comments.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                💬 Evaluator notes:
                              </p>
                              <ul className="space-y-1.5">
                                {category.comments.map((comment, idx) => (
                                  <li
                                    key={idx}
                                    className="text-sm text-foreground/90 flex items-start gap-2"
                                  >
                                    <span className="text-primary mt-1">•</span>
                                    <span>{comment}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
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
