import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { WritingIssue } from './types';
import { SuggestionCarousel } from './SuggestionCarousel';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: WritingIssue;
  onToggle: () => void;
  onApplySuggestion: (issueId: string, suggestionText: string) => void;
  onInsertSuggestion: (issueId: string, suggestionText: string) => void;
  onNextSuggestion: (issueId: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onToggle,
  onApplySuggestion,
  onInsertSuggestion,
  onNextSuggestion
}) => {
  const getStatusConfig = () => {
    switch (issue.status) {
      case 'fixed':
        return {
          icon: CheckCircle2,
          color: 'border-l-success bg-success/5',
          badge: '🟢',
          label: 'Fixed'
        };
      case 'in_progress':
        return {
          icon: ChevronRight,
          color: 'border-l-warning bg-warning/5',
          badge: '🟡',
          label: 'In Progress'
        };
      default:
        return {
          icon: ChevronRight,
          color: 'border-l-destructive bg-destructive/5',
          badge: '🔴',
          label: 'Not Fixed'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  if (issue.status === 'fixed' && !issue.expanded) {
    return (
      <Card 
        className={cn(
          "p-4 border-l-4 cursor-pointer transition-all",
          config.color
        )}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <StatusIcon className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <h4 className="font-semibold text-sm line-through opacity-60">
                {issue.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                ✓ Fixed with suggested edit
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "border-l-4 transition-all",
        config.color,
        issue.expanded ? "p-6" : "p-4"
      )}
    >
      <div 
        className="flex items-start justify-between gap-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3 flex-1">
          <StatusIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">
              {issue.title}
            </h4>
            {!issue.expanded && (
              <p className="text-xs text-muted-foreground mt-1">
                Click to expand and fix
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {issue.expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      </div>

      {issue.expanded && (
        <div className="mt-4 space-y-4 ml-8">
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              From your draft:
            </h5>
            <div className="border-l-4 border-l-muted pl-4 py-2">
              <p className="text-sm italic text-muted-foreground">
                {issue.excerpt}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-semibold">❌ What's wrong:</h5>
            <p className="text-sm leading-relaxed">
              {issue.explanation}
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-semibold">💡 Why this matters:</h5>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {issue.whyItMatters}
            </p>
          </div>

          <SuggestionCarousel
            suggestions={issue.suggestions}
            currentIndex={issue.currentSuggestionIndex}
            onNext={() => onNextSuggestion(issue.id)}
            onApply={(text) => onApplySuggestion(issue.id, text)}
            onInsert={(text) => onInsertSuggestion(issue.id, text)}
          />
        </div>
      )}
    </Card>
  );
};
