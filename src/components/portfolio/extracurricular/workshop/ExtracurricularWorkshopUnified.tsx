// @ts-nocheck - Legacy workshop file with type mismatches
/**
 * Extracurricular Workshop - Unified Single-View Design
 *
 * Clean vertical flow:
 * 1. Hero: NQI Score + Progress at a glance
 * 2. Editor: Live editing with save/undo/redo
 * 3. Rubric: 11 expandable categories with combined analysis + coaching
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
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle2,
  Clock,
  Lightbulb,
  BookOpen,
  Brain,
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
import WorkshopChatV3 from './components/WorkshopChatV3';

interface ExtracurricularWorkshopUnifiedProps {
  activity: ExtracurricularItem;
}

interface DraftVersion {
  text: string;
  timestamp: number;
  score: number;
}

export const ExtracurricularWorkshopUnified: React.FC<ExtracurricularWorkshopUnifiedProps> = ({
  activity,
}) => {
  // State
  const [currentDraft, setCurrentDraft] = useState(activity.description || '');
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([
    { text: activity.description || '', timestamp: Date.now(), score: 0 },
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [teachingCoaching, setTeachingCoaching] = useState<TeachingCoachingOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [needsReanalysis, setNeedsReanalysis] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Teaching system state
  const [reflectionPromptsMap, setReflectionPromptsMap] = useState<Map<string, ReflectionPromptSet>>(new Map());
  const [loadingPromptsFor, setLoadingPromptsFor] = useState<Set<string>>(new Set());
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, Record<string, string>>>({});
  const [showReflectionFor, setShowReflectionFor] = useState<Set<string>>(new Set());
  const [selectedFixStrategies, setSelectedFixStrategies] = useState<Record<string, number>>({});

  const reanalysisTimerRef = useRef<number | null>(null);
  const initialScoreRef = useRef<number>(0);

  // Initial analysis
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

    const newVersions = draftVersions.slice(0, currentVersionIndex + 1);
    newVersions.push(newVersion);

    setDraftVersions(newVersions);
    setCurrentVersionIndex(newVersions.length - 1);
    setHasUnsavedChanges(false);

    if (needsReanalysis) {
      performAnalysis(currentDraft);
    }
  }, [currentDraft, draftVersions, currentVersionIndex, needsReanalysis, analysisResult, performAnalysis]);

  const handleUndo = useCallback(() => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      setCurrentDraft(draftVersions[newIndex].text);
      setHasUnsavedChanges(false);
      setNeedsReanalysis(false);
    }
  }, [currentVersionIndex, draftVersions]);

  const handleRedo = useCallback(() => {
    if (currentVersionIndex < draftVersions.length - 1) {
      const newIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(newIndex);
      setCurrentDraft(draftVersions[newIndex].text);
      setHasUnsavedChanges(false);
      setNeedsReanalysis(false);
    }
  }, [currentVersionIndex, draftVersions]);

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  // Load reflection prompts for a teaching issue
  const loadReflectionPrompts = async (issueId: string, teachingIssue: any) => {
    if (reflectionPromptsMap.has(issueId) || loadingPromptsFor.has(issueId)) {
      return; // Already loaded or loading
    }

    setLoadingPromptsFor(prev => new Set([...prev, issueId]));

    try {
      // Convert teachingIssue to DetectedIssue format for the generator
      const detectedIssue = {
        id: issueId,
        category: teachingIssue.category || '',
        severity: teachingIssue.severity || 'important',
        title: teachingIssue.problem?.title || '',
        from_draft: teachingIssue.problem?.from_draft || '',
        problem: teachingIssue.problem?.explanation || '',
        why_matters: teachingIssue.principle?.why_officers_care || '',
        suggested_fixes: [],
      };

      const prompts = await generateReflectionPromptsWithCache(
        detectedIssue as any,
        activity as any,
        {
          tone: 'mentor',
          depth: teachingIssue.severity === 'critical' ? 'deep' : 'surface',
        }
      );

      setReflectionPromptsMap(prev => new Map(prev).set(issueId, prompts));
    } catch (error) {
    } finally {
      setLoadingPromptsFor(prev => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  const handleReflectionAnswerChange = (issueId: string, promptId: string, answer: string) => {
    setReflectionAnswers(prev => ({
      ...prev,
      [issueId]: {
        ...(prev[issueId] || {}),
        [promptId]: answer,
      },
    }));
  };

  const toggleReflectionSection = (issueId: string, teachingIssue: any) => {
    const isCurrentlyShown = showReflectionFor.has(issueId);

    setShowReflectionFor(prev => {
      const next = new Set(prev);
      if (isCurrentlyShown) {
        next.delete(issueId);
      } else {
        next.add(issueId);
        // Auto-load prompts when expanding
        loadReflectionPrompts(issueId, teachingIssue);
      }
      return next;
    });
  };

  // Computed values
  const currentScore = analysisResult?.analysis.narrative_quality_index || 0;
  const initialScore = initialScoreRef.current;
  const scoreDelta = currentScore - initialScore;
  const wordCount = currentDraft.trim().split(/\s+/).filter(Boolean).length;

  const totalIssues = teachingCoaching?.teaching_issues.length || 0;
  const completedIssues =
    teachingCoaching?.teaching_issues.filter((i) => i.status === 'completed').length || 0;

  // Get NQI status config
  const getNQIConfig = () => {
    if (currentScore >= 85)
      return {
        label: 'Outstanding',
        color: 'text-green-600',
        bg: 'bg-green-100',
        icon: TrendingUp,
      };
    if (currentScore >= 75)
      return {
        label: 'Strong',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        icon: TrendingUp,
      };
    if (currentScore >= 65)
      return {
        label: 'Solid',
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        icon: TrendingUp,
      };
    return {
      label: 'Needs Work',
      color: 'text-red-600',
      bg: 'bg-red-100',
      icon: TrendingDown,
    };
  };

  const nqiConfig = getNQIConfig();
  const StatusIcon = nqiConfig.icon;

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Workshop Content - 2/3 width on large screens */}
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

      {/* 1. HERO SECTION - Score + Progress */}
      <Card className={`border-2 ${nqiConfig.bg} border-${nqiConfig.color.split('-')[1]}-300`}>
        <div className="p-6">
          <div className="flex items-start justify-between gap-6">
            {/* Score Display */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full ${nqiConfig.bg} flex items-center justify-center`}>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${nqiConfig.color}`}>{currentScore}</div>
                    <div className="text-xs text-muted-foreground">/ 100</div>
                  </div>
                </div>
                {scoreDelta !== 0 && (
                  <div
                    className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${
                      scoreDelta > 0
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {scoreDelta > 0 ? '+' : ''}{scoreDelta}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className={`w-5 h-5 ${nqiConfig.color}`} />
                  <h2 className="text-2xl font-bold text-foreground">
                    {nqiConfig.label}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Narrative Quality Index
                </p>
                <Badge variant="outline" className="text-xs">
                  {analysisResult.analysis.reader_impression_label.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>

            {/* Progress Metrics */}
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">{completedIssues}/{totalIssues}</span>
                </div>
                <p className="text-xs text-muted-foreground">Issues Resolved</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">{wordCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

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

          {needsReanalysis && (
            <Alert>
              <RefreshCcw className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Re-analyzing your changes... (automatic in 3s)
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* 3. RUBRIC CATEGORIES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            11-Category Rubric Analysis
          </h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCategories(new Set(analysisResult.analysis.categories.map(c => c.category)))}
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCategories(new Set())}
            >
              Collapse All
            </Button>
          </div>
        </div>

        {analysisResult.analysis.categories.map((category) => {
          const isExpanded = expandedCategories.has(category.category);
          const percentage = Math.round((category.score / category.maxScore) * 100);
          const weight = analysisResult.analysis.weights[category.category] || 0;

          // Find teaching issue for this category
          const teachingIssue = teachingCoaching?.teaching_issues.find(
            (issue) => issue.category === category.category
          );

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
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-base text-foreground">
                        {category.category
                          .split('_')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ')}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(weight * 100)}%
                      </Badge>
                      {teachingIssue?.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-foreground">
                        {category.score.toFixed(1)}/{category.maxScore}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          percentage >= 85
                            ? 'text-green-600'
                            : percentage >= 70
                            ? 'text-blue-600'
                            : percentage >= 55
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          percentage >= 85
                            ? 'bg-green-600'
                            : percentage >= 70
                            ? 'bg-blue-600'
                            : percentage >= 55
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Content - Combined Analysis + Coaching */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t">
                  {/* Analysis Comments */}
                  {category.comments && category.comments.length > 0 && (
                    <div className="pt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        💬 Assessment:
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

                  {/* Evidence */}
                  {category.evidence && category.evidence.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        🔍 Evidence from your essay:
                      </p>
                      <ul className="space-y-1">
                        {category.evidence.map((evidence, idx) => (
                          <li key={idx} className="text-sm text-foreground/80 italic">
                            "{evidence}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {category.suggestions && category.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        💡 How to improve:
                      </p>
                      <ul className="space-y-1.5">
                        {category.suggestions.map((suggestion, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-foreground/90 flex items-start gap-2"
                          >
                            <span className="text-primary mt-1">→</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Teaching Issue (if exists) - ENHANCED WITH FULL TEACHING FRAMEWORK */}
                  {teachingIssue && (() => {
                    const issueId = `${category.category}-${teachingIssue.principle?.name || 'issue'}`;
                    const prompts = reflectionPromptsMap.get(issueId);
                    const isLoadingPrompts = loadingPromptsFor.has(issueId);
                    const showReflection = showReflectionFor.has(issueId);
                    const issueAnswers = reflectionAnswers[issueId] || {};
                    const selectedFixIdx = selectedFixStrategies[issueId] || 0;

                    const severityConfig = (() => {
                      const sev = teachingIssue.severity;
                      if (sev === 'critical') return {
                        icon: AlertCircle,
                        color: 'text-red-600',
                        bg: 'bg-red-50',
                        border: 'border-red-200',
                        label: 'Critical',
                      };
                      if (sev === 'major') return {
                        icon: Zap,
                        color: 'text-orange-600',
                        bg: 'bg-orange-50',
                        border: 'border-orange-200',
                        label: 'Important',
                      };
                      return {
                        icon: Lightbulb,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                        border: 'border-blue-200',
                        label: 'Helpful',
                      };
                    })();

                    const SevIcon = severityConfig.icon;

                    return (
                      <div className={`p-5 rounded-lg ${severityConfig.bg} border-2 ${severityConfig.border} space-y-4 animate-in slide-in-from-bottom-2 duration-300`}>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${severityConfig.bg} border ${severityConfig.border}`}>
                              <SevIcon className={`w-5 h-5 ${severityConfig.color}`} />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-base text-foreground mb-1">
                                {teachingIssue.problem?.title || teachingIssue.principle?.name}
                              </h5>
                              <div className="flex items-center gap-2">
                                <Badge variant={teachingIssue.severity === 'critical' ? 'destructive' : 'default'} className="text-xs">
                                  {severityConfig.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {teachingIssue.problem?.impact_on_score}
                                </span>
                              </div>
                            </div>
                          </div>
                          {teachingIssue.status === 'completed' && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 animate-in zoom-in-75 duration-300" />
                          )}
                        </div>

                        {/* FROM YOUR DRAFT */}
                        {teachingIssue.problem?.from_draft && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-muted-foreground" />
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                From Your Draft
                              </p>
                            </div>
                            <div className="p-3 rounded-md bg-white/60 border border-border">
                              <p className="text-sm text-foreground/80 italic leading-relaxed">
                                "{teachingIssue.problem.from_draft}"
                              </p>
                            </div>
                          </div>
                        )}

                        {/* THE PROBLEM */}
                        {teachingIssue.problem?.explanation && (
                          <div className="space-y-2">
                            <p className="text-sm text-foreground leading-relaxed">
                              {teachingIssue.problem.explanation}
                            </p>
                            {teachingIssue.principle?.why_officers_care && (
                              <div className="p-3 rounded-md bg-primary/10 border border-primary/30">
                                <p className="text-xs font-semibold text-primary mb-1">
                                  💡 Why Admissions Officers Care
                                </p>
                                <p className="text-sm text-foreground/90 leading-relaxed">
                                  {teachingIssue.principle.why_officers_care}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* TEACHING EXAMPLE */}
                        {teachingIssue.examples && teachingIssue.examples.length > 0 && teachingIssue.examples[0] && (
                          <div className="space-y-3 animate-in slide-in-from-left-2 duration-500">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                Teaching Example: Weak → Strong
                              </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-xs font-semibold text-red-700 mb-2">❌ Weak</p>
                                <p className="text-sm text-foreground/80 italic">
                                  "{teachingIssue.examples[0].before?.text}"
                                </p>
                              </div>
                              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-xs font-semibold text-green-700 mb-2">✅ Strong</p>
                                <p className="text-sm text-foreground/80 font-medium">
                                  "{teachingIssue.examples[0].after?.text}"
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

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
                    );
                  })()}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      </div>

      {/* AI Chat Assistant - 1/3 width on large screens, sticky */}
      <div className="lg:col-span-1">
        <div className="sticky top-6" style={{ height: 'calc(100vh - 6rem)' }}>
          <WorkshopChatV3
            activity={activity}
            currentDraft={currentDraft}
            analysisResult={analysisResult}
            teachingCoaching={teachingCoaching}
            currentScore={currentScore}
            initialScore={initialScoreRef.current}
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
                await loadReflectionPrompts(issue, issueId);
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
    </div>
  );
};
