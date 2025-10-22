import React, { useState, useEffect, useCallback } from 'react';
import { RecognitionItem } from '../RecognitionCard';
import { DraftVersion, RubricDimension, WritingIssue } from './types';
import { detectAllIssuesWithRubric, getMockDraft } from './issueDetector';
import { calculateOverallScore } from './rubricScorer';
import { HeroSection } from './HeroSection';
import { DraftEditor } from './DraftEditor';
import { OverallScoreCard } from './OverallScoreCard';
import { RubricDimensionCard } from './RubricDimensionCard';
import { WorkshopComplete } from './WorkshopComplete';

interface NarrativeFitWorkshopProps {
  recognition: RecognitionItem;
}

export const NarrativeFitWorkshop: React.FC<NarrativeFitWorkshopProps> = ({ recognition }) => {
  const [draftVersions, setDraftVersions] = useState<DraftVersion[]>([
    { id: 'v0', text: getMockDraft(), timestamp: Date.now() }
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [dimensions, setDimensions] = useState<RubricDimension[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  const currentDraft = draftVersions[currentVersionIndex].text;

  // Recalculate issues and scores when draft changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const newDimensions = detectAllIssuesWithRubric(currentDraft, recognition);
      
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
      setOverallScore(calculateOverallScore(updatedDimensions));
    }, 500);

    return () => clearTimeout(timer);
  }, [currentDraft, recognition]);

  const wordCount = currentDraft.trim().split(/\s+/).filter(Boolean).length;

  const handleDraftChange = useCallback((newDraft: string) => {
    // If we're not at the latest version, discard future versions
    const newVersions = draftVersions.slice(0, currentVersionIndex + 1);
    const newVersion: DraftVersion = {
      id: `v${newVersions.length}`,
      text: newDraft,
      timestamp: Date.now()
    };
    setDraftVersions([...newVersions, newVersion]);
    setCurrentVersionIndex(newVersions.length);
  }, [draftVersions, currentVersionIndex]);

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
    setDimensions(prev => prev.map(dim => ({
      ...dim,
      issues: dim.issues.map(issue =>
        issue.id === issueId
          ? {
              ...issue,
              expanded: !issue.expanded,
              status: !issue.expanded && issue.status === 'not_fixed' ? 'in_progress' : issue.status
            }
          : issue
      )
    })));
  }, []);

  const handleApplySuggestion = useCallback((
    issueId: string,
    suggestionText: string,
    type: 'replace' | 'insert_before' | 'insert_after'
  ) => {
    const dimension = dimensions.find(d => d.issues.some(i => i.id === issueId));
    const issue = dimension?.issues.find(i => i.id === issueId);
    if (!issue) return;

    let updatedDraft = currentDraft;
    const excerpt = issue.excerpt.replace(/"/g, '');

    switch (type) {
      case 'replace':
        updatedDraft = currentDraft.replace(excerpt, suggestionText);
        break;
      case 'insert_before':
        updatedDraft = suggestionText + ' ' + currentDraft;
        break;
      case 'insert_after':
        updatedDraft = currentDraft + ' ' + suggestionText;
        break;
    }

    // Create new version
    const newVersions = draftVersions.slice(0, currentVersionIndex + 1);
    const newVersion: DraftVersion = {
      id: `v${newVersions.length}`,
      text: updatedDraft,
      timestamp: Date.now(),
      appliedIssueId: issueId
    };
    setDraftVersions([...newVersions, newVersion]);
    setCurrentVersionIndex(newVersions.length);

    // Mark issue as fixed
    setDimensions(prev => prev.map(dim => ({
      ...dim,
      issues: dim.issues.map(i =>
        i.id === issueId
          ? { ...i, status: 'fixed' as const, expanded: false }
          : i
      )
    })));
  }, [currentDraft, draftVersions, currentVersionIndex, dimensions]);

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

  const totalIssues = dimensions.reduce((sum, dim) => sum + dim.issues.length, 0);
  const fixedIssues = dimensions.reduce((sum, dim) => 
    sum + dim.issues.filter(i => i.status === 'fixed').length, 0
  );

  const allFixed = fixedIssues === totalIssues && totalIssues > 0;
  const isComplete = allFixed && overallScore >= 8.0;

  const versionInfo = `Version ${currentVersionIndex + 1} of ${draftVersions.length}`;

  return (
    <div className="relative min-h-screen bg-background">
      <HeroSection />
      
      <DraftEditor
        draft={currentDraft}
        onDraftChange={handleDraftChange}
        wordCount={wordCount}
        canUndo={currentVersionIndex > 0}
        canRedo={currentVersionIndex < draftVersions.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        versionInfo={versionInfo}
      />

      <div className="max-w-5xl mx-auto p-8 space-y-8">
        <OverallScoreCard
          overallScore={overallScore}
          fixedCount={fixedIssues}
          totalCount={totalIssues}
        />

        {isComplete ? (
          <WorkshopComplete draft={currentDraft} overallScore={overallScore} />
        ) : (
          <>
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide text-xs mb-4">
                Narrative Quality Rubric
              </h3>
              <div className="space-y-4">
                {dimensions.map((dimension) => (
                  <RubricDimensionCard
                    key={dimension.id}
                    dimension={dimension}
                    onToggleIssue={handleToggleIssue}
                    onApplySuggestion={handleApplySuggestion}
                    onNextSuggestion={handleNextSuggestion}
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
