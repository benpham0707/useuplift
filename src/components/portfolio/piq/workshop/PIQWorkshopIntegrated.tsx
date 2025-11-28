// @ts-nocheck - PIQ Workshop file
/**
 * PIQ Narrative Workshop - Complete Integration
 *
 * Adapted from ExtracurricularWorkshopFinal for UC Personal Insight Questions
 * Leverages the same backend analysis infrastructure with PIQ-specific context
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle, Loader2, RefreshCcw, Target, TrendingUp, TrendingDown,
  Minus, ChevronDown, ChevronUp, ArrowLeft, Sparkles, BookOpen, Edit3
} from 'lucide-react';

// Backend integration - reuse extracurricular analysis (works for all essays)
import { type AnalysisResult } from '@/components/portfolio/extracurricular/workshop/backendTypes';
import { transformAnalysisToCoaching } from '@/components/portfolio/extracurricular/workshop/teachingTransformer';
import type { TeachingCoachingOutput, TeachingIssue } from '@/components/portfolio/extracurricular/workshop/teachingTypes';

// UI Components - reuse from extracurricular workshop
import { RubricDimensionCard } from '@/components/portfolio/extracurricular/workshop/RubricDimensionCard';
import type { RubricDimension, WritingIssue, EditSuggestion } from '@/components/portfolio/extracurricular/workshop/types';

// PIQ Workshop UI Components
import { VoiceFingerprintCard } from './VoiceFingerprintCard';
import { ExperienceFingerprintCard } from './ExperienceFingerprintCard';
import { RandomizingScore } from './RandomizingScore';

// PIQ-specific analysis service
import { analyzePIQEntryTwoStep } from '@/services/piqWorkshopAnalysisService';
import { getTargetTier } from '@/services/piqSurgicalWorkshopService';

interface PIQWorkshopIntegratedProps {
  initialText: string;
  promptTitle: string;
  promptText: string;
  onBack: () => void;
}

export const PIQWorkshopIntegrated: React.FC<PIQWorkshopIntegratedProps> = ({
  initialText,
  promptTitle,
  promptText,
  onBack,
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Draft management
  const [currentDraft, setCurrentDraft] = useState(initialText);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [teachingCoaching, setTeachingCoaching] = useState<TeachingCoachingOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Teaching issues state
  const [teachingIssues, setTeachingIssues] = useState<TeachingIssue[]>([]);

  // Initial score tracking
  const initialScoreRef = useRef<number>(0);

  // UI state
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<RubricDimension[]>([]);
  const [activeView, setActiveView] = useState<'analysis' | 'editor'>('analysis');

  // Prompt selection state
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  // ============================================================================
  // ANALYSIS FUNCTION
  // ============================================================================

  const performAnalysis = useCallback(
    async (draft: string, isInitial: boolean = false) => {
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        console.log('🔍 Starting PIQ analysis...', {
          draft: draft.substring(0, 50) + '...',
          promptTitle,
          isInitial
        });

        // Call PIQ analysis service with Phase 17-19 teaching layer
        const result = await analyzePIQEntryTwoStep(draft, promptTitle, promptText, {
          onProgress: (status) => {
            console.log(`📊 Progress: ${status}`);
          },
          onPhase17Complete: (phase17Result) => {
            console.log('✅ Phase 17 (Analysis) complete - suggestions available');
          },
          onPhase18Complete: (phase18Result) => {
            console.log('✅ Phase 18 (Validation) complete - quality scores added');
          },
          onPhase19Complete: (phase19Result) => {
            console.log('✅ Phase 19 (Teaching) complete - deep guidance added');
          },
        }, {
          depth: 'comprehensive',
          skip_coaching: false,
          essayType: 'uc_piq',
        });

        console.log('🎯 PIQ Analysis completed successfully');
        console.log('  NQI:', result.analysis.narrative_quality_index);
        console.log('  Categories:', result.analysis.categories.length);

        setAnalysisResult(result);

        // Transform to teaching format
        const coaching = transformAnalysisToCoaching(
          result.analysis,
          result.coaching || null,
          draft
        );
        setTeachingCoaching(coaching);
        setTeachingIssues(coaching.teaching_issues);

        // Track initial score
        if (isInitial) {
          initialScoreRef.current = result.analysis.narrative_quality_index;
        }

        console.log('✅ PIQ Coaching transformed, issues:', coaching.teaching_issues.length);
      } catch (error) {
        console.error('❌ PIQ Analysis failed:', error);
        setAnalysisError(
          error instanceof Error ? error.message : 'Analysis failed. Please try again.'
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [promptTitle, promptText]
  );

  // ============================================================================
  // TRANSFORM CATEGORIES TO DIMENSIONS
  // ============================================================================

  const transformCategoriesToDimensions = useCallback((analysisResult: AnalysisResult, teachingIssues: TeachingIssue[]): RubricDimension[] => {
    return analysisResult.analysis.categories.map((category) => {
      const categoryIssues = teachingIssues.filter(
        (issue) => issue.rubric_category === category.category
      );

      const percentage = (category.score / category.maxScore) * 100;
      let status: 'critical' | 'needs_work' | 'good' | 'excellent';
      if (percentage >= 85) status = 'excellent';
      else if (percentage >= 70) status = 'good';
      else if (percentage >= 55) status = 'needs_work';
      else status = 'critical';

      const issues: WritingIssue[] = categoryIssues.map((teachingIssue) => {
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

      const weight = analysisResult.analysis.weights[category.category] || 0;
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

  // Transform dimensions when analysis result changes
  useEffect(() => {
    if (analysisResult) {
      const transformed = transformCategoriesToDimensions(analysisResult, teachingIssues);
      setDimensions(transformed);
      console.log('✅ Transformed categories to dimensions:', transformed.length);
    }
  }, [analysisResult, teachingIssues, transformCategoriesToDimensions]);

  // Initial analysis on mount
  useEffect(() => {
    if (initialText && !analysisResult && !isAnalyzing) {
      performAnalysis(initialText, true);
    }
  }, []);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(currentDraft !== initialText);
  }, [currentDraft, initialText]);

  // ============================================================================
  // DIMENSION HANDLERS
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
          return { ...i, expanded: false };
        })
      };
    }));
  }, []);

  const handleApplySuggestion = useCallback((issueId: string, suggestionText: string, type: 'replace' | 'insert_before' | 'insert_after') => {
    console.log('Apply suggestion:', { issueId, suggestionText: suggestionText.substring(0, 30), type });
    // For PIQ, we'll implement this later - just log for now
  }, []);

  const handleNextSuggestion = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(d => ({
      ...d,
      issues: d.issues.map(i =>
        i.id === issueId
          ? { ...i, currentSuggestionIndex: (i.currentSuggestionIndex + 1) % i.suggestions.length }
          : i
      )
    })));
  }, []);

  const handlePrevSuggestion = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(d => ({
      ...d,
      issues: d.issues.map(i =>
        i.id === issueId
          ? {
              ...i,
              currentSuggestionIndex:
                i.currentSuggestionIndex === 0
                  ? i.suggestions.length - 1
                  : i.currentSuggestionIndex - 1,
            }
          : i
      ),
    })));
  }, []);

  // ============================================================================
  // RENDER: ERROR STATE
  // ============================================================================

  if (analysisError && !analysisResult) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Button onClick={onBack} variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
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
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================

  if (isAnalyzing && !analysisResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <div className="relative">
              {/* Gradient Spinner */}
              <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 border-b-pink-500 animate-spin" />
              <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Analyzing Your PIQ Essay</h3>
            <p className="text-muted-foreground">
              Evaluating across 11 narrative dimensions...
            </p>
          </div>
          <div className="text-sm text-muted-foreground animate-pulse">
            This will finish in 2-3 minutes...
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN WORKSHOP INTERFACE
  // ============================================================================

  const nqi = analysisResult?.analysis.narrative_quality_index || 0;
  const scoreChange = nqi - initialScoreRef.current;
  const totalIssues = dimensions.reduce((acc, d) => acc + d.issues.length, 0);
  const fixedIssues = dimensions.reduce(
    (acc, d) => acc + d.issues.filter(i => i.status === 'fixed').length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h1 className="text-lg font-bold">{promptTitle}</h1>
                </div>
                <p className="text-sm text-muted-foreground">PIQ Narrative Workshop</p>
              </div>
            </div>

            {/* Score Display */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Narrative Quality Index</div>
                <div className="flex items-center gap-2">
                  <RandomizingScore score={nqi} isAnalyzing={isAnalyzing} className="text-3xl font-bold" />
                  <span className="text-sm text-muted-foreground">/100</span>
                  {scoreChange !== 0 && (
                    <Badge variant={scoreChange > 0 ? 'default' : 'destructive'} className="gap-1">
                      {scoreChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(scoreChange)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Analysis & Dimensions */}
          <div className="lg:col-span-2 space-y-6">
            {/* PIQ Prompt Selector - Removed */}
            {/* Overall Summary */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Analysis Overview</h2>
                <Badge variant="outline">
                  {fixedIssues}/{totalIssues} Issues Addressed
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-slate-100 dark:bg-slate-900">
                  <div className="text-2xl font-bold text-primary">
                    <RandomizingScore score={nqi} isAnalyzing={isAnalyzing} className="" />
                  </div>
                  <div className="text-xs text-muted-foreground">Current NQI</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-100 dark:bg-slate-900">
                  <div className="text-2xl font-bold text-green-600">{teachingCoaching?.overall.target_nqi || nqi}</div>
                  <div className="text-xs text-muted-foreground">Target NQI</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-100 dark:bg-slate-900">
                  <div className="text-2xl font-bold text-blue-600">{teachingCoaching?.overall.potential_gain || 0}</div>
                  <div className="text-xs text-muted-foreground">Potential Gain</div>
                </div>
              </div>
              {analysisResult && (
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  Target Tier: <span className="font-semibold">{getTargetTier(nqi)}</span>
                </div>
              )}
            </Card>

            {/* Voice Fingerprint */}
            {analysisResult?.voiceFingerprint && (
              <VoiceFingerprintCard voiceFingerprint={analysisResult.voiceFingerprint} />
            )}

            {/* Experience Fingerprint */}
            {analysisResult?.experienceFingerprint && (
              <ExperienceFingerprintCard experienceFingerprint={analysisResult.experienceFingerprint} />
            )}

            {/* Rubric Dimensions */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Rubric Dimensions</h2>
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
          </div>

          {/* Right: Editor */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Essay Editor Card */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Your Essay</h3>
                  <Badge variant="outline">
                    {currentDraft.trim().split(/\s+/).filter(Boolean).length} words
                  </Badge>
                </div>

                <Textarea
                  value={currentDraft}
                  onChange={(e) => setCurrentDraft(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Edit your essay here..."
                />
                {hasUnsavedChanges && (
                  <Button
                    onClick={() => performAnalysis(currentDraft, false)}
                    disabled={isAnalyzing}
                    className="w-full gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Re-analyze Essay
                      </>
                    )}
                  </Button>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
