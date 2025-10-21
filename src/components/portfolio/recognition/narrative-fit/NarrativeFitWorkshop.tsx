import React, { useState, useEffect, useCallback } from 'react';
import { RecognitionItem } from '../RecognitionCard';
import { DraftEditor } from './DraftEditor';
import { IssueList } from './IssueList';
import { WritingIssue } from './types';
import { detectAllIssues, getMockDraft } from './issueDetector';

interface NarrativeFitWorkshopProps {
  recognition: RecognitionItem;
}

export const NarrativeFitWorkshop: React.FC<NarrativeFitWorkshopProps> = ({ recognition }) => {
  // Hard coded mock draft as placeholder
  const [draft, setDraft] = useState(getMockDraft());
  const [issues, setIssues] = useState<WritingIssue[]>([]);

  // Detect issues when draft changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const detectedIssues = detectAllIssues(draft, recognition);
      setIssues(detectedIssues);
    }, 500);

    return () => clearTimeout(timer);
  }, [draft, recognition]);

  // Calculate word count
  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;

  const handleToggleIssue = useCallback((issueId: string) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId 
        ? { ...issue, expanded: !issue.expanded, status: issue.expanded ? issue.status : 'in_progress' }
        : issue
    ));
  }, []);

  const handleApplySuggestion = useCallback((issueId: string, suggestionText: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    // Replace the excerpt in the draft with the suggestion
    const updatedDraft = draft.replace(issue.excerpt.replace(/"/g, ''), suggestionText);
    setDraft(updatedDraft);

    // Mark issue as fixed and collapse
    setIssues(prev => prev.map(i => 
      i.id === issueId 
        ? { ...i, status: 'fixed', expanded: false }
        : i
    ));
  }, [draft, issues]);

  const handleInsertSuggestion = useCallback((issueId: string, suggestionText: string) => {
    // Insert at end of draft
    setDraft(prev => prev + (prev.endsWith(' ') ? '' : ' ') + suggestionText);

    // Mark issue as fixed
    setIssues(prev => prev.map(i => 
      i.id === issueId 
        ? { ...i, status: 'fixed', expanded: false }
        : i
    ));
  }, []);

  const handleNextSuggestion = useCallback((issueId: string) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        const nextIndex = (issue.currentSuggestionIndex + 1) % issue.suggestions.length;
        return { ...issue, currentSuggestionIndex: nextIndex };
      }
      return issue;
    }));
  }, []);

  return (
    <div className="space-y-0">
      <DraftEditor 
        draft={draft}
        onDraftChange={setDraft}
        wordCount={wordCount}
      />
      
      <IssueList
        issues={issues}
        onToggleIssue={handleToggleIssue}
        onApplySuggestion={handleApplySuggestion}
        onInsertSuggestion={handleInsertSuggestion}
        onNextSuggestion={handleNextSuggestion}
      />
    </div>
  );
};
