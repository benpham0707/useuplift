/**
 * Extracurricular Workshop - Integrated V3 Chat
 *
 * Complete workshop with:
 * - Original beautiful Hero/scoring header with progress tracking
 * - Editor with versioning
 * - Teaching issues with reflection prompts
 * - V3 Chat with deep context and world-class coaching
 *
 * Layout: 2/3 main content + 1/3 chat sidebar
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExtracurricularItem } from '../ExtracurricularCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Loader2,
  RefreshCcw,
  Save,
  Undo2,
  Redo2,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp,
  Brain,
  Lightbulb,
  BookOpen,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';

// Backend integration
import { type AnalysisResult } from './backendTypes';
import { analyzeExtracurricularEntry } from '@/services/workshopAnalysisService';
import { transformAnalysisToCoaching } from './teachingTransformer';
import type { TeachingCoachingOutput, TeachingIssue } from './teachingTypes';
import {
  type ReflectionPromptSet,
  generateReflectionPromptsWithCache,
} from '@/services/workshop/reflectionPrompts';

// Chat integration
import ContextualWorkshopChat from './components/ContextualWorkshopChat';

// Version history
import { VersionHistory } from './VersionHistory';
import { saveVersion, getVersions } from './versioningSystem';

interface ExtracurricularWorkshopIntegratedProps {
  activity: ExtracurricularItem;
}

interface DraftVersion {
  text: string;
  timestamp: number;
  score: number;
}

export const ExtracurricularWorkshopIntegrated: React.FC<ExtracurricularWorkshopIntegratedProps> = ({
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [teachingCoaching, setTeachingCoaching] = useState<TeachingCoachingOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [needsReanalysis, setNeedsReanalysis] = useState(false);

  // Teaching issues state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [reflectionPromptsMap, setReflectionPromptsMap] = useState<Map<string, ReflectionPromptSet>>(new Map());
  const [loadingPromptsFor, setLoadingPromptsFor] = useState<Set<string>>(new Set());
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, Record<string, string>>>({});
  const [showReflectionFor, setShowReflectionFor] = useState<Set<string>>(new Set());
  const [selectedFixStrategies, setSelectedFixStrategies] = useState<Record<string, number>>({});

  // Version history
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Refs
  const reanalysisTimerRef = useRef<number | null>(null);
  const initialScoreRef = useRef<number>(0);

  // ============================================================================
  // INITIAL ANALYSIS
  // ============================================================================

  useEffect(() => {
    if (activity.description) {
      performAnalysis(activity.description, true);
    }
  }, []);

  const performAnalysis = useCallback(
    async (draft: string, isInitial: boolean = false) => {
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const result = await analyzeExtracurricularEntry(draft, activity, {
          depth: 'comprehensive',
          skip_coaching: false,
        });

        setAnalysisResult(result);

        const coaching = transformAnalysisToCoaching(
          result.analysis,
          result.coaching || null,
          draft
        );
        setTeachingCoaching(coaching);

        if (isInitial) {
          initialScoreRef.current = result.analysis.narrative_quality_index;
        }

        setDraftVersions((prev) => {
          const updated = [...prev];
          updated[currentVersionIndex] = {
            ...updated[currentVersionIndex],
            score: result.analysis.narrative_quality_index,
          };
          return updated;
        });

        setNeedsReanalysis(false);

        // Save version
        try {
          saveVersion(activity, draft, result, {
            depth: 'comprehensive',
            engine: 'sophisticated_19_iteration_system',
          });
        } catch (versionError) {
          console.error('Failed to save version:', versionError);
        }
      } catch (error) {
        console.error('Analysis failed:', error);
        setAnalysisError(
          error instanceof Error ? error.message : 'Analysis failed. Please try again.'
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [activity, currentVersionIndex]
  );

  // ============================================================================
  // DRAFT EDITING HANDLERS
  // ============================================================================

  const handleDraftChange = useCallback(
    (newDraft: string) => {
      setCurrentDraft(newDraft);
      setHasUnsavedChanges(true);
      setNeedsReanalysis(true);

      if (reanalysisTimerRef.current) {
        clearTimeout(reanalysisTimerRef.current);
      }

      reanalysisTimerRef.current = window.setTimeout(() => {
        performAnalysis(newDraft);
        reanalysisTimerRef.current = null;
      }, 3000);
    },
    [performAnalysis]
  );

  const handleSave = useCallback(() => {
    if (reanalysisTimerRef.current) {
      clearTimeout(reanalysisTimerRef.current);
      reanalysisTimerRef.current = null;
    }

    const newVersion: DraftVersion = {
      text: currentDraft,
      timestamp: Date.now(),
      score: analysisResult?.analysis.narrative_quality_index || 0,
    };

    setDraftVersions((prev) => [...prev.slice(0, currentVersionIndex + 1), newVersion]);
    setCurrentVersionIndex((prev) => prev + 1);
    setHasUnsavedChanges(false);
  }, [currentDraft, currentVersionIndex, analysisResult]);

  const handleUndo = useCallback(() => {
    if (currentVersionIndex > 0) {
      const prevIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(prevIndex);
      setCurrentDraft(draftVersions[prevIndex].text);
      setHasUnsavedChanges(false);
      setNeedsReanalysis(true);
    }
  }, [currentVersionIndex, draftVersions]);

  const handleRedo = useCallback(() => {
    if (currentVersionIndex < draftVersions.length - 1) {
      const nextIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(nextIndex);
      setCurrentDraft(draftVersions[nextIndex].text);
      setHasUnsavedChanges(false);
      setNeedsReanalysis(true);
    }
  }, [currentVersionIndex, draftVersions]);

  const handleRequestReanalysis = useCallback(() => {
    if (reanalysisTimerRef.current) {
      clearTimeout(reanalysisTimerRef.current);
      reanalysisTimerRef.current = null;
    }
    performAnalysis(currentDraft);
  }, [currentDraft, performAnalysis]);

  // ============================================================================
  // TEACHING & REFLECTION HANDLERS
  // ============================================================================

  const loadReflectionPrompts = async (issueId: string, teachingIssue: any) => {
    setLoadingPromptsFor((prev) => new Set(prev).add(issueId));

    try {
      const prompts = await generateReflectionPromptsWithCache(
        teachingIssue,
        activity,
        currentDraft
      );

      setReflectionPromptsMap((prev) => {
        const next = new Map(prev);
        next.set(issueId, prompts);
        return next;
      });
    } catch (error) {
      console.error('Failed to load reflection prompts:', error);
    } finally {
      setLoadingPromptsFor((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  const handleReflectionAnswerChange = (issueId: string, promptId: string, answer: string) => {
    setReflectionAnswers((prev) => ({
      ...prev,
      [issueId]: {
        ...(prev[issueId] || {}),
        [promptId]: answer,
      },
    }));
  };

  const toggleReflectionSection = (issueId: string, teachingIssue: any) => {
    const isCurrentlyShown = showReflectionFor.has(issueId);

    setShowReflectionFor((prev) => {
      const next = new Set(prev);
      if (isCurrentlyShown) {
        next.delete(issueId);
      } else {
        next.add(issueId);
        loadReflectionPrompts(issueId, teachingIssue);
      }
      return next;
    });
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
  const wordCount = currentDraft.trim().split(/\s+/).filter(Boolean).length;

  const totalIssues = teachingCoaching?.teaching_issues.length || 0;
  const completedIssues =
    teachingCoaching?.teaching_issues.filter((i) => i.status === 'completed').length || 0;
  const inProgressIssues =
    teachingCoaching?.teaching_issues.filter((i) => i.status === 'in_progress').length || 0;
  const notStartedIssues =
    teachingCoaching?.teaching_issues.filter((i) => i.status === 'not_started').length || 0;

  // NQI status config
  const getNQIConfig = () => {
    if (currentScore >= 85)
      return {
        label: 'Outstanding',
        color: 'text-green-600',
        bg: 'bg-green-100',
        border: 'border-green-300',
        icon: TrendingUp,
      };
    if (currentScore >= 75)
      return {
        label: 'Strong',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        border: 'border-blue-300',
        icon: TrendingUp,
      };
    if (currentScore >= 65)
      return {
        label: 'Solid',
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        icon: Minus,
      };
    return {
      label: 'Needs Work',
      color: 'text-red-600',
      bg: 'bg-red-100',
      border: 'border-red-300',
      icon: TrendingDown,
    };
  };

  const nqiConfig = getNQIConfig();
  const NQIIcon = nqiConfig.icon;

  // ============================================================================
  // RENDER - LOADING/ERROR STATES
  // ============================================================================

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

  if (!analysisResult) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No analysis available. Please try again.</p>
        <Button className="mt-4" onClick={() => performAnalysis(currentDraft, true)}>
          Analyze Essay
        </Button>
      </div>
    );
  }

  // ============================================================================
  // RENDER - MAIN WORKSHOP INTERFACE
  // ============================================================================

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* MAIN CONTENT - 2/3 width on large screens */}
      <div className="lg:col-span-2 space-y-6">
        {/* Error banner */}
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

        {/* 1. SCORE HERO SECTION */}
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
                  Issues to Resolve: {totalIssues - completedIssues} of {totalIssues} remaining
                </span>
                <span className="font-semibold text-primary">
                  {completedIssues}/{totalIssues} completed
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-semibold text-green-700">Completed</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{completedIssues}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs font-semibold text-yellow-700">In Progress</p>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{inProgressIssues}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-xs font-semibold text-red-700">Not Started</p>
                </div>
                <p className="text-2xl font-bold text-red-600">{notStartedIssues}</p>
              </div>
            </div>

            {/* Flags */}
            {analysisResult.analysis.flags.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs font-semibold text-red-700 mb-2">
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

        {/* Warning if changes need re-analysis */}
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

        {/* 2. EDITOR SECTION */}
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Your Essay</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={currentVersionIndex === 0}
                >
                  <Undo2 className="w-4 h-4 mr-1" />
                  Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={currentVersionIndex >= draftVersions.length - 1}
                >
                  <Redo2 className="w-4 h-4 mr-1" />
                  Redo
                </Button>
                <Button
                  variant={hasUnsavedChanges ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {hasUnsavedChanges ? 'Save' : 'Saved'}
                </Button>
              </div>
            </div>

            <Textarea
              value={currentDraft}
              onChange={(e) => handleDraftChange(e.target.value)}
              className="min-h-[300px] text-base leading-relaxed"
              placeholder="Write your extracurricular description here..."
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Version {currentVersionIndex + 1} of {draftVersions.length}</span>
              <span>{wordCount} words</span>
            </div>
          </div>
        </Card>

        {/* 3. TEACHING ISSUES SECTION */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Issues to Address</h3>

            <div className="space-y-3">
              {teachingCoaching?.teaching_issues.map((teachingIssue) => {
                const issueId = teachingIssue.id;
                const isExpanded = expandedCategories.has(issueId);
                const showReflection = showReflectionFor.has(issueId);
                const isLoadingPrompts = loadingPromptsFor.has(issueId);
                const prompts = reflectionPromptsMap.get(issueId);
                const issueAnswers = reflectionAnswers[issueId] || {};

                return (
                  <Card
                    key={issueId}
                    className={`border-l-4 ${
                      teachingIssue.severity === 'critical'
                        ? 'border-l-red-500'
                        : teachingIssue.severity === 'major'
                        ? 'border-l-orange-500'
                        : 'border-l-yellow-500'
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setExpandedCategories((prev) => {
                          const next = new Set(prev);
                          if (next.has(issueId)) {
                            next.delete(issueId);
                          } else {
                            next.add(issueId);
                          }
                          return next;
                        });
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                teachingIssue.severity === 'critical'
                                  ? 'destructive'
                                  : teachingIssue.severity === 'major'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {teachingIssue.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {teachingIssue.category}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-foreground">{teachingIssue.short_label}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {teachingIssue.one_line_why}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t">
                        {/* Teaching Content */}
                        <div className="pt-4 space-y-3">
                          {/* Problem Explanation */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-primary" />
                              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                What's Missing
                              </p>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              {teachingIssue.problem_explanation}
                            </p>
                          </div>

                          {/* Before/After Example */}
                          {teachingIssue.teaching_example && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                  Example
                                </p>
                              </div>
                              <div className="grid gap-3">
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                  <p className="text-xs font-semibold text-red-700 mb-1">
                                    ❌ Weak:
                                  </p>
                                  <p className="text-sm text-foreground italic">
                                    {teachingIssue.teaching_example.weak}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                  <p className="text-xs font-semibold text-green-700 mb-1">
                                    ✅ Strong:
                                  </p>
                                  <p className="text-sm text-foreground italic">
                                    {teachingIssue.teaching_example.strong}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground italic">
                                {teachingIssue.teaching_example.explanation}
                              </p>
                            </div>
                          )}

                          {/* Fix Strategies */}
                          {teachingIssue.fix_strategies && teachingIssue.fix_strategies.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-primary" />
                                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                  How to Fix This
                                </p>
                              </div>
                              <ul className="space-y-2">
                                {teachingIssue.fix_strategies.map((strategy, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                  >
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <span className="text-sm text-foreground flex-1">{strategy}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* REFLECTION PROMPTS SECTION */}
                        <div className="space-y-3 pt-2 border-t-2 border-dashed border-border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Brain className="w-4 h-4 text-primary" />
                              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                Guided Reflection
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={showReflection ? "outline" : "default"}
                              onClick={() => toggleReflectionSection(issueId, teachingIssue)}
                              className="text-xs"
                            >
                              {showReflection ? 'Hide' : 'Start Reflection'}
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>

                          {showReflection && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-500">
                              {isLoadingPrompts && (
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">
                                      Crafting personalized questions...
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Analyzing your specific activity to generate thoughtful prompts
                                    </p>
                                  </div>
                                </div>
                              )}

                              {prompts && (
                                <div className="space-y-4">
                                  <div className="p-3 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                                    <p className="text-xs text-blue-900 leading-relaxed">
                                      💭 <strong>These questions are tailored to your specific activity.</strong> Take time to reflect deeply.
                                    </p>
                                  </div>

                                  {prompts.prompts.map((prompt, idx) => (
                                    <div key={prompt.id} className="space-y-2 animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                      <div className="flex items-start gap-2">
                                        <Badge variant="outline" className="mt-1">Q{idx + 1}</Badge>
                                        <div className="flex-1">
                                          <p className="text-sm font-semibold text-foreground leading-relaxed mb-1">
                                            {prompt.question}
                                          </p>
                                          <p className="text-xs text-muted-foreground italic">
                                            {prompt.purpose}
                                          </p>
                                        </div>
                                      </div>
                                      <Textarea
                                        value={issueAnswers[prompt.id] || ''}
                                        onChange={(e) => handleReflectionAnswerChange(issueId, prompt.id, e.target.value)}
                                        placeholder={prompt.placeholderExample || 'Your answer...'}
                                        className="min-h-[80px] text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* CHAT SIDEBAR - 1/3 width on large screens, sticky */}
      <div className="lg:col-span-1">
        <div className="sticky top-6" style={{ height: 'calc(100vh - 6rem)' }}>
          <ContextualWorkshopChat
            activity={activity}
            currentDraft={currentDraft}
            analysisResult={analysisResult}
            teachingCoaching={teachingCoaching}
            currentScore={currentScore}
            initialScore={initialScore}
            hasUnsavedChanges={hasUnsavedChanges}
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
            onLoadReflectionPrompts={async (issueId) => {
              const issue = teachingCoaching?.teaching_issues.find((i) => i.id === issueId);
              if (issue) {
                await loadReflectionPrompts(issueId, issue);
              }
            }}
            onTriggerReanalysis={() => {
              if (currentDraft !== draftVersions[currentVersionIndex].text) {
                performAnalysis(currentDraft);
              }
            }}
          />
        </div>
      </div>

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
