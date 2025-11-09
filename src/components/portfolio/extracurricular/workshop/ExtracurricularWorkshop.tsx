import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExtracurricularItem } from '../ExtracurricularCard';
import { DraftVersion, RubricDimension, WritingIssue } from './types';
import { detectAllIssuesWithRubric, getMockDraft } from './issueDetector';
import { calculateOverallScore } from './rubricScorer';
import { HeroSection } from './HeroSection';
import { DraftEditor } from './DraftEditor';
import { OverallScoreCard } from './OverallScoreCard';
import { RubricDimensionCard } from './RubricDimensionCard';
import { WorkshopComplete } from './WorkshopComplete';

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
