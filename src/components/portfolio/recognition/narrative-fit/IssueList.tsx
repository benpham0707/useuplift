import React from 'react';
import { WritingIssue } from './types';
import { IssueCard } from './IssueCard';
import { WorkshopComplete } from './WorkshopComplete';
import { Progress } from '@/components/ui/progress';

interface IssueListProps {
  issues: WritingIssue[];
  onToggleIssue: (issueId: string) => void;
  onApplySuggestion: (issueId: string, suggestionText: string) => void;
  onInsertSuggestion: (issueId: string, suggestionText: string) => void;
  onNextSuggestion: (issueId: string) => void;
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onToggleIssue,
  onApplySuggestion,
  onInsertSuggestion,
  onNextSuggestion
}) => {
  const fixedCount = issues.filter(i => i.status === 'fixed').length;
  const totalCount = issues.length;
  const allFixed = fixedCount === totalCount;
  const progressPercent = totalCount > 0 ? (fixedCount / totalCount) * 100 : 0;

  if (allFixed) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <WorkshopComplete />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Progress Tracker */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-6 border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">
            Your Progress
          </h3>
          <div className="text-lg font-bold text-primary">
            {fixedCount}/{totalCount} Fixed
          </div>
        </div>
        
        <Progress value={progressPercent} className="h-3" />
        
        <div className="space-y-2 pt-2">
          {issues.map((issue) => (
            <div key={issue.id} className="flex items-center gap-3 text-sm">
              <span className="text-lg">
                {issue.status === 'fixed' ? '✅' : '🔴'}
              </span>
              <span className={issue.status === 'fixed' ? 'text-muted-foreground line-through' : 'font-medium'}>
                {issue.title}
              </span>
              {issue.status === 'not_fixed' && !issues.find(i => i.status === 'in_progress') && issue === issues.find(i => i.status === 'not_fixed') && (
                <span className="text-xs text-primary animate-pulse">← Start here</span>
              )}
            </div>
          ))}
        </div>
        
        {fixedCount > 0 && fixedCount < totalCount && (
          <p className="text-sm text-muted-foreground pt-2 border-t">
            Keep going! <span className="font-semibold text-foreground">{totalCount - fixedCount}</span> more issue{totalCount - fixedCount !== 1 ? 's' : ''} to address.
          </p>
        )}
      </div>

      {/* Issues Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide text-xs mb-4">
          Issues to Fix
        </h3>
        <div className="space-y-4">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onToggle={() => onToggleIssue(issue.id)}
              onApplySuggestion={onApplySuggestion}
              onInsertSuggestion={onInsertSuggestion}
              onNextSuggestion={onNextSuggestion}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
