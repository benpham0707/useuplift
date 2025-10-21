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
      <div className="p-6">
        <WorkshopComplete />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Writing Issues ({totalCount} found)
          </h3>
          <div className="text-sm font-medium">
            Progress: <span className="text-primary">{fixedCount}/{totalCount}</span> ✓
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      <div className="space-y-3">
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
  );
};
