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
} from 'lucide-react';

// Backend integration
import { type AnalysisResult } from './backendTypes';
import { analyzeExtracurricularEntry } from '@/services/workshopAnalysisService';
import { transformAnalysisToCoaching } from './teachingTransformer';
import type { TeachingCoachingOutput, TeachingIssue } from './teachingTypes';

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
    <div className="space-y-6">
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

                  {/* Teaching Issue (if exists) */}
                  {teachingIssue && (
                    <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-bold text-sm text-foreground mb-1">
                            📚 Learning Opportunity
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            {teachingIssue.principle.name}
                          </p>
                        </div>
                        <Badge
                          variant={
                            teachingIssue.severity === 'critical'
                              ? 'destructive'
                              : teachingIssue.severity === 'major'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {teachingIssue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground/80 mb-2">
                        {teachingIssue.problem.impact_on_score}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
