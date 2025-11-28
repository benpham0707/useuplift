import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExtracurricularItem } from '../ExtracurricularCard';
import { DraftVersion, RubricDimension, WritingIssue } from './types';
import { detectAllIssuesWithRubric, getMockDraft } from './issueDetector';
import { buildDimensionsFromAnalysis, calculateOverallScoreFromDimensions } from './workshopAdapter';
import { calculateOverallScore } from './rubricScorer';
import { HeroSection } from './HeroSection';
import { DraftEditor } from './DraftEditor';
import { OverallScoreCard } from './OverallScoreCard';
import { RubricDimensionCard } from './RubricDimensionCard';
import { WorkshopComplete } from './WorkshopComplete';
import { analyzeForWorkshop } from '@/services/workshop/workshopAnalyzer';
import { ExperienceEntry } from '@/core/types/experience';
import { Loader2 } from 'lucide-react';

interface ExtracurricularWorkshopProps {
  activity: ExtracurricularItem;
}

export const ExtracurricularWorkshop: React.FC<ExtracurricularWorkshopProps> = ({ activity }) => {
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([
    { id: 'v0', text: activity?.description || getMockDraft(), timestamp: Date.now() }
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [dimensions, setDimensions] = useState<RubricDimension[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(null);
  // Live draft being edited in the textarea (decoupled from saved versions)
  const [draft, setDraft] = useState<string>(draftVersions[currentVersionIndex].text);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const draftRef = useRef<string>(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  // Phase 17-19 Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);
  // Keep live draft in sync when undo/redo changes the selected version
  useEffect(() => {
    setDraft(draftVersions[currentVersionIndex].text);
  }, [currentVersionIndex, draftVersions]);

  // Throttled autosave timer (at most one save every 30 seconds after edits start)
  const autosaveTimerRef = useRef<number | null>(null);
  const clearAutosaveTimer = () => {
    if (autosaveTimerRef.current !== null) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  };

  const saveDraftVersion = useCallback((text: string, appliedIssueId?: string) => {
    // Avoid duplicate versions with identical text
    const last = draftVersions[draftVersions.length - 1];
    if (last && last.text === text) return;
    const newVersions = draftVersions.slice(0, currentVersionIndex + 1);
    const newVersion: DraftVersion = {
      id: `v${newVersions.length}`,
      text,
      timestamp: Date.now(),
      ...(appliedIssueId ? { appliedIssueId } : {})
    };
    setDraftVersions([...newVersions, newVersion]);
    setCurrentVersionIndex(newVersions.length);
  }, [draftVersions, currentVersionIndex]);

  // Recalculate issues and scores when live draft changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const newDimensions = detectAllIssuesWithRubric(draft, activity);

      // Preserve issue states (expanded, currentSuggestionIndex)
      const updatedDimensions = newDimensions.map(newDim => {
        const oldDim = dimensions.find(d => d.id === newDim.id);
        if (!oldDim) return newDim;

        return {
          ...newDim,
          issues: newDim.issues.map(newIssue => {
            const oldIssue = oldDim.issues.find(i => i.id === newIssue.id);
            if (!oldIssue) return newIssue;

            return {
              ...newIssue,
              expanded: oldIssue.expanded,
              currentSuggestionIndex: oldIssue.currentSuggestionIndex,
              status: oldIssue.status
            };
          })
        };
      });

      setDimensions(updatedDimensions);
      // Keep prior expansion if still valid; otherwise start with all collapsed
      setExpandedDimensionId(prev => {
        if (prev && updatedDimensions.some(d => d.id === prev)) return prev;
        return null;
      });
      setOverallScore(calculateOverallScore(updatedDimensions));
    }, 500);

    return () => clearTimeout(timer);
  }, [draft, activity]);

  // Phase 17-19 Analysis - Run once on mount to enhance issues with teaching
  useEffect(() => {
    if (hasRunAnalysis) return; // Only run once

    const runPhase19Analysis = async () => {
      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        // Convert ExtracurricularItem to ExperienceEntry
        const entry: ExperienceEntry = {
          id: activity.id,
          user_id: 'current-user',
          title: activity.name,
          description_original: draft,
          organization: activity.organization || '',
          role: activity.role || '',
          category: 'extracurricular' as any,
          hours_per_week: activity.hoursPerWeek || 5,
          weeks_per_year: 52,
          start_date: '',
          end_date: 'Present',
          time_span: '',
          version: 1,
        };

        console.log('[ExtracurricularWorkshop] Running Phase 17-19 analysis...');
        const result = await analyzeForWorkshop(entry, {
          enableTeachingLayer: true,
          maxIssues: 5,
        });

        console.log('[ExtracurricularWorkshop] Analysis complete!', {
          topIssues: result.topIssues.length,
          withTeaching: result.topIssues.filter(i => i.teaching).length,
        });

        // DEBUG: Log what teaching looks like
        console.log('[DEBUG] First issue with teaching:', result.topIssues.find(i => i.teaching));
        console.log('[DEBUG] All issues:', result.topIssues.map(i => ({
          id: i.id,
          title: i.title,
          hasTeaching: !!i.teaching,
          teachingPreview: i.teaching ? `${i.teaching.problem.hook.substring(0, 50)}...` : 'NO TEACHING'
        })));

        // FULL REPLACEMENT: Replace mock dimensions with Phase 19 results
        // This ensures teaching guidance is displayed via TeachingGuidanceCard
        const newDimensions = buildDimensionsFromAnalysis(
          result.topIssues,
          result.dimensions
        );

        console.log('[ExtracurricularWorkshop] Replacing dimensions with Phase 19 results...', {
          dimensionCount: newDimensions.length,
          issueCount: newDimensions.reduce((sum, d) => sum + d.issues.length, 0),
          withTeaching: newDimensions.reduce(
            (sum, d) => sum + d.issues.filter(i => i.teaching).length, 0
          ),
        });

        // DEBUG: Log converted issues
        console.log('[DEBUG] Converted dimensions:', newDimensions.map(d => ({
          name: d.name,
          issueCount: d.issues.length,
          issuesWithTeaching: d.issues.filter(i => i.teaching).length,
          firstIssue: d.issues[0] ? {
            title: d.issues[0].title,
            hasTeaching: !!d.issues[0].teaching,
          } : null
        })));

        setDimensions(newDimensions);

        // Update overall score from Phase 19 NQI (convert 0-100 to 0-10)
        const nqiScore = result.overallScore / 10;
        setOverallScore(nqiScore);

        setHasRunAnalysis(true);
      } catch (error) {
        console.error('[ExtracurricularWorkshop] Phase 19 analysis failed:', error);
        setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      } finally {
        setIsAnalyzing(false);
      }
    };

    runPhase19Analysis();
  }, [activity, draft, hasRunAnalysis]);

  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;

  const handleDraftChange = useCallback((newDraft: string) => {
    setDraft(newDraft);
    if (!isDirty) setIsDirty(true);
    // Start a 30s autosave window if not already scheduled
    if (autosaveTimerRef.current === null) {
      autosaveTimerRef.current = window.setTimeout(() => {
        autosaveTimerRef.current = null;
        saveDraftVersion(draftRef.current);
        setIsDirty(false);
      }, 30_000);
    }
  }, [saveDraftVersion, isDirty]);

  const handleManualSave = useCallback(() => {
    clearAutosaveTimer();
    saveDraftVersion(draftRef.current);
    setIsDirty(false);
  }, [saveDraftVersion]);

  const handleUndo = useCallback(() => {
    if (currentVersionIndex > 0) {
      setCurrentVersionIndex(currentVersionIndex - 1);
    }
  }, [currentVersionIndex]);

  const handleRedo = useCallback(() => {
    if (currentVersionIndex < draftVersions.length - 1) {
      setCurrentVersionIndex(currentVersionIndex + 1);
    }
  }, [currentVersionIndex, draftVersions.length]);

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

  const handleApplySuggestion = useCallback((
    issueId: string,
    suggestionText: string,
    type: 'replace' | 'insert_before' | 'insert_after'
  ) => {
    const dimension = dimensions.find(d => d.issues.some(i => i.id === issueId));
    const issue = dimension?.issues.find(i => i.id === issueId);
    if (!issue) return;

    let updatedDraft = draft;
    const excerpt = issue.excerpt.replace(/"/g, '');

    switch (type) {
      case 'replace':
        updatedDraft = draft.replace(excerpt, suggestionText);
        break;
      case 'insert_before':
        updatedDraft = suggestionText + ' ' + draft;
        break;
      case 'insert_after':
        updatedDraft = draft + ' ' + suggestionText;
        break;
    }

    // Update live draft and immediately save a version for an explicit action
    setDraft(updatedDraft);
    clearAutosaveTimer();
    saveDraftVersion(updatedDraft, issueId);

    // Mark issue as fixed
    setDimensions(prev => prev.map(dim => ({
      ...dim,
      issues: dim.issues.map(i =>
        i.id === issueId
          ? { ...i, status: 'fixed' as const, expanded: false }
          : i
      )
    })));
  }, [draft, dimensions, saveDraftVersion]);

  const handleNextSuggestion = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(dim => ({
      ...dim,
      issues: dim.issues.map(issue => {
        if (issue.id === issueId) {
          const nextIndex = (issue.currentSuggestionIndex + 1) % issue.suggestions.length;
          return { ...issue, currentSuggestionIndex: nextIndex };
        }
        return issue;
      })
    })));
  }, []);

  const handlePrevSuggestion = useCallback((issueId: string) => {
    setDimensions(prev => prev.map(dim => ({
      ...dim,
      issues: dim.issues.map(issue => {
        if (issue.id === issueId) {
          const prevIndex = (issue.currentSuggestionIndex - 1 + issue.suggestions.length) % issue.suggestions.length;
          return { ...issue, currentSuggestionIndex: prevIndex };
        }
        return issue;
      })
    })));
  }, []);

  const toggleDimensionExpand = useCallback((dimensionId: string) => {
    setExpandedDimensionId(prev => (prev === dimensionId ? null : dimensionId));
  }, []);

  const totalIssues = dimensions.reduce((sum, dim) => sum + dim.issues.length, 0);
  const fixedIssues = dimensions.reduce((sum, dim) =>
    sum + dim.issues.filter(i => i.status === 'fixed').length, 0
  );

  const allFixed = fixedIssues === totalIssues && totalIssues > 0;
  const isComplete = allFixed && overallScore >= 8.0;

  const versionInfo = `Version ${currentVersionIndex + 1} of ${draftVersions.length}`;

  return (
    <div className="space-y-6">
      <HeroSection overallScore={overallScore} fixedCount={fixedIssues} totalCount={totalIssues} embedScoreCard />

      <DraftEditor
        draft={draft}
        onDraftChange={handleDraftChange}
        wordCount={wordCount}
        canUndo={currentVersionIndex > 0}
        canRedo={currentVersionIndex < draftVersions.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        versionInfo={versionInfo}
        isDirty={isDirty}
        onManualSave={handleManualSave}
      />

      <div className="space-y-4">
        {/* Phase 19 Analysis Loading State */}
        {isAnalyzing && (
          <div className="p-6 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
            <div className="flex items-start gap-4">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-bold text-lg text-purple-900 mb-2">
                  Enhancing with Deep Teaching Layer...
                </h4>
                <p className="text-sm text-purple-800 mb-3">
                  Running Phase 17-19 analysis to generate personalized teaching guidance.
                  This takes ~3 minutes as we analyze your essay with full context.
                </p>
                <div className="space-y-1 text-xs text-purple-700">
                  <p>✓ Phase 17: Core analysis & NQI scoring</p>
                  <p>✓ Phase 18: Suggestion validation</p>
                  <p className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Phase 19: Teaching layer (conversational guidance)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 19 Analysis Error */}
        {analysisError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">
              <strong>Teaching layer unavailable:</strong> {analysisError}
            </p>
            <p className="text-xs text-red-600 mt-1">
              You can still use the workshop with basic guidance.
            </p>
          </div>
        )}

        {isComplete ? (
          <WorkshopComplete draft={draft} overallScore={overallScore} />
        ) : (
          <>
            <div id="narrative-rubric">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Narrative Quality Rubric
              </h3>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};
