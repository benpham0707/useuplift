import React from 'react';
import { Card } from '@/components/ui/card';
import { WritingIssue } from './types';
import { SuggestionCarousel } from './SuggestionCarousel';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Loader2, Quote, AlertOctagon, Lightbulb } from 'lucide-react';

interface IssueCardProps {
  issue: WritingIssue;
  onToggle: () => void;
  onApplySuggestion: (issueId: string, suggestionText: string, type: 'replace' | 'insert_before' | 'insert_after') => void;
  onNextSuggestion: (issueId: string) => void;
  onPrevSuggestion: (issueId: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onToggle,
  onApplySuggestion,
  onNextSuggestion,
  onPrevSuggestion
}) => {
  const getStatusIcon = (status: WritingIssue['status']) => {
    switch (status) {
      case 'fixed': return CheckCircle2;
      case 'in_progress': return Loader2;
      default: return Circle;
    }
  };

  const getStatusColor = (status: WritingIssue['status']) => {
    switch (status) {
      case 'fixed': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/30';
      case 'in_progress': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/30';
      default: return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30';
    }
  };

  const StatusIcon = getStatusIcon(issue.status);

  if (issue.status === 'fixed') {
    return (
      <Card className="border-l-4 border-l-primary p-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-sm">{issue.title}</h4>
            <p className="text-xs text-muted-foreground">Issue resolved</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!issue.expanded) {
    return (
      <Card 
        className="border-l-4 border-l-primary p-3 cursor-pointer hover:bg-accent/50 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <StatusIcon className={`w-4 h-4 ${
              issue.status === 'not_fixed' ? 'text-red-500' : 'text-yellow-500'
            } ${issue.status === 'in_progress' ? 'animate-spin' : ''} flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm">{issue.title}</h4>
              <p className="text-xs text-muted-foreground">
                {issue.suggestions.length} suggestion{issue.suggestions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30">
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onToggle}
          className="w-full -mx-4 px-4 py-4 mb-3 flex items-start justify-between gap-3 text-left cursor-pointer hover:bg-accent/40 rounded-t-xl transition-colors"
          aria-label="Collapse issue"
        >
          <div className="flex items-start gap-2 flex-1">
            <StatusIcon className={`w-5 h-5 ${
              issue.status === 'not_fixed' ? 'text-red-500' : 'text-yellow-500'
            } ${issue.status === 'in_progress' ? 'animate-spin' : ''} flex-shrink-0 mt-0.5`} />
            <h4 className="text-base font-bold text-primary">{issue.title}</h4>
          </div>
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              From Your Draft
            </p>
            <div className="relative rounded-md bg-primary/5 py-4 pr-7 pl-7">
              <span className="absolute top-2 left-1 text-2xl leading-none text-primary select-none pointer-events-none">“</span>
              <p className="text-sm italic text-foreground/80 pr-2">
                {issue.excerpt.replace(/"/g, '')}
              </p>
              <span className="absolute top-2 right-1 text-2xl leading-none text-primary select-none pointer-events-none">”</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
              The Problem
            </p>
            <p className="text-sm text-muted-foreground pl-3 border-l-2 border-red-300 dark:border-red-800">
              {issue.analysis}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-primary mb-1">
              Why It Matters
            </p>
            <p className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/30">
              {issue.impact}
            </p>
          </div>

          <div className="pt-4 border-t">
            <SuggestionCarousel
              suggestions={issue.suggestions}
              currentIndex={issue.currentSuggestionIndex}
              onNext={() => onNextSuggestion(issue.id)}
              onPrev={() => onPrevSuggestion(issue.id)}
              onApply={(text, type) => onApplySuggestion(issue.id, text, type)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
