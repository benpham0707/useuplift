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
    <div className="relative min-h-screen">
      {/* Hero Introduction */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            ✍️ Narrative Fit Workshop
          </h2>
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 border shadow-sm space-y-3">
            <p className="font-semibold text-base">How to use this tool:</p>
            <div className="grid gap-2 text-sm leading-relaxed">
              <div className="flex gap-3">
                <span className="font-bold text-primary">1️⃣</span>
                <span>Review your draft in the editor below</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">2️⃣</span>
                <span>Click each issue card to see what's wrong</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">3️⃣</span>
                <span>Choose an edit suggestion and apply it</span>
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-primary">4️⃣</span>
                <span>Watch your narrative quality improve in real-time</span>
              </div>
            </div>
            <div className="pt-2 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Goal:</span> Transform your recognition description into an officer-ready narrative that showcases selectivity, theme connection, and measurable impact.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Draft Editor - Sticky */}
      <DraftEditor 
        draft={draft}
        onDraftChange={setDraft}
        wordCount={wordCount}
      />
      
      {/* Issues Section */}
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
