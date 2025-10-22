import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WritingIssue } from './types';
import { SuggestionCarousel } from './SuggestionCarousel';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

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
  const getStatusConfig = (status: WritingIssue['status']) => {
    switch (status) {
      case 'fixed':
        return { 
          badge: '✅', 
          color: 'text-green-600 dark:text-green-400', 
          bgColor: 'bg-green-50 dark:bg-green-950/20', 
          borderColor: 'border-l-green-500', 
          label: 'Fixed!' 
        };
      case 'in_progress':
        return { 
          badge: '🟡', 
          color: 'text-yellow-600 dark:text-yellow-400', 
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20', 
          borderColor: 'border-l-yellow-500', 
          label: 'In Progress' 
        };
      default:
        return { 
          badge: '🔴', 
          color: 'text-red-600 dark:text-red-400', 
          bgColor: 'bg-red-50 dark:bg-red-950/20', 
          borderColor: 'border-l-red-500', 
          label: 'Not Fixed' 
        };
    }
  };

  const statusConfig = getStatusConfig(issue.status);

  // If fixed, show collapsed success state
  if (issue.status === 'fixed') {
    return (
      <Card className={`${statusConfig.bgColor} border-l-4 ${statusConfig.borderColor} p-5`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{statusConfig.badge}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-base">{issue.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">✓ Issue resolved</p>
          </div>
        </div>
      </Card>
    );
  }

  // If collapsed, show preview
  if (!issue.expanded) {
    return (
      <Card 
        className={`${statusConfig.bgColor} border-l-4 ${statusConfig.borderColor} p-5 cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all duration-200`}
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{statusConfig.badge}</span>
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-base">{issue.title}</h4>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium text-xs">
                ⚡ Quick Fix Available
              </span>
              <span className="text-muted-foreground text-xs">
                Click to expand and see {issue.suggestions.length} suggestion{issue.suggestions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </Card>
    );
  }

  // Expanded view
  return (
    <Card className={`${statusConfig.bgColor} border-l-4 ${statusConfig.borderColor} shadow-md`}>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl flex-shrink-0">{statusConfig.badge}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{issue.title}</h4>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground -mt-1 -mr-2"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wide">📍 From Your Draft:</span>
            </div>
            <div className="p-4 rounded-lg bg-background border-l-4 border-l-primary/30 shadow-sm">
              <p className="text-sm italic leading-relaxed text-foreground/90">
                "{issue.excerpt.replace(/"/g, '')}"
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wide text-red-600 dark:text-red-400">❌ The Problem:</span>
            </div>
            <p className="text-sm leading-relaxed pl-6">{issue.explanation}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">💡 Why It Matters:</span>
            </div>
            <p className="text-sm leading-relaxed pl-6">{issue.whyItMatters}</p>
          </div>

          <div className="h-px bg-border" />

          <SuggestionCarousel
            suggestions={issue.suggestions}
            currentIndex={issue.currentSuggestionIndex}
            onNext={() => onNextSuggestion(issue.id)}
            onApply={(text) => onApplySuggestion(issue.id, text)}
            onInsert={(text) => onInsertSuggestion(issue.id, text)}
          />
        </div>
      </div>
    </Card>
  );
};
