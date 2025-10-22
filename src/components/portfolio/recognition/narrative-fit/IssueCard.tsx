import React from 'react';
import { Card } from '@/components/ui/card';
import { WritingIssue } from './types';
import { SuggestionCarousel } from './SuggestionCarousel';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface IssueCardProps {
  issue: WritingIssue;
  onToggle: () => void;
  onApplySuggestion: (issueId: string, suggestionText: string, type: 'replace' | 'insert_before' | 'insert_after') => void;
  onNextSuggestion: (issueId: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onToggle,
  onApplySuggestion,
  onNextSuggestion
}) => {
  const getStatusBadge = (status: WritingIssue['status']) => {
    switch (status) {
      case 'fixed': return '✅';
      case 'in_progress': return '🟡';
      default: return '🔴';
    }
  };

  if (issue.status === 'fixed') {
    return (
      <Card className="bg-green-50 dark:bg-green-950/10 border-l-4 border-l-green-500 p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{getStatusBadge(issue.status)}</span>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{issue.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">Issue resolved</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!issue.expanded) {
    return (
      <Card 
        className="bg-background/50 border-l-4 border-l-primary/30 p-4 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xl">{getStatusBadge(issue.status)}</span>
            <div>
              <h4 className="font-medium text-sm">{issue.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {issue.suggestions.length} suggestion{issue.suggestions.length !== 1 ? 's' : ''} available — click to expand
              </p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-background border-2 border-primary/20 shadow-lg">
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl flex-shrink-0">{getStatusBadge(issue.status)}</span>
            <h4 className="text-lg font-semibold">{issue.title}</h4>
          </div>
          <button 
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-2"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
              📍 From Your Draft:
            </p>
            <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-primary/40">
              <p className="text-sm italic leading-relaxed">
                {issue.excerpt.replace(/"/g, '')}
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">
              ❌ The Problem:
            </p>
            <p className="text-sm leading-relaxed pl-4 border-l-2 border-muted">
              {issue.analysis}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-2">
              💡 Why It Matters:
            </p>
            <p className="text-sm leading-relaxed pl-4 border-l-2 border-muted">
              {issue.impact}
            </p>
          </div>

          <div className="h-px bg-border" />

          <SuggestionCarousel
            suggestions={issue.suggestions}
            currentIndex={issue.currentSuggestionIndex}
            onNext={() => onNextSuggestion(issue.id)}
            onApply={(text, type) => onApplySuggestion(issue.id, text, type)}
          />
        </div>
      </div>
    </Card>
  );
};
