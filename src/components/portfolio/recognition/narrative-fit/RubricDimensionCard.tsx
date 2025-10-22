import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { RubricDimension } from './types';
import { IssueCard } from './IssueCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RubricDimensionCardProps {
  dimension: RubricDimension;
  onToggleIssue: (issueId: string) => void;
  onApplySuggestion: (issueId: string, suggestionText: string, type: 'replace' | 'insert_before' | 'insert_after') => void;
  onNextSuggestion: (issueId: string) => void;
}

const statusConfig = {
  critical: {
    badge: '🔴',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800'
  },
  needs_work: {
    badge: '🟡',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  good: {
    badge: '🟢',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800'
  },
  excellent: {
    badge: '✨',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800'
  }
};

export const RubricDimensionCard: React.FC<RubricDimensionCardProps> = ({
  dimension,
  onToggleIssue,
  onApplySuggestion,
  onNextSuggestion
}) => {
  const [isExpanded, setIsExpanded] = useState(dimension.status === 'critical' || dimension.status === 'needs_work');
  const config = statusConfig[dimension.status];
  const notFixedIssues = dimension.issues.filter(i => i.status !== 'fixed');

  return (
    <Card className={`${config.bg} border-2 ${config.border} shadow-md overflow-hidden`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:opacity-80 transition-opacity"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{config.badge}</span>
              <h3 className="text-xl font-semibold">{dimension.name}</h3>
              <span className={`text-2xl font-bold ${config.color}`}>
                {dimension.score.toFixed(1)}/10
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {dimension.overview}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-6 h-6 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {!isExpanded && notFixedIssues.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            {notFixedIssues.length} issue{notFixedIssues.length !== 1 ? 's' : ''} to address — click to expand
          </div>
        )}
      </button>
      
      {isExpanded && dimension.issues.length > 0 && (
        <div className="px-6 pb-6 space-y-4 border-t">
          <div className="pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Issues in this dimension:
            </p>
            <div className="space-y-3">
              {dimension.issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onToggle={() => onToggleIssue(issue.id)}
                  onApplySuggestion={onApplySuggestion}
                  onNextSuggestion={onNextSuggestion}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {isExpanded && dimension.issues.length === 0 && (
        <div className="px-6 pb-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            ✓ No issues detected in this dimension. Great work!
          </p>
        </div>
      )}
    </Card>
  );
};
