import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { RubricDimension } from './types';
import { IssueCard } from './IssueCard';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

interface RubricDimensionCardProps {
  dimension: RubricDimension;
  onToggleIssue: (issueId: string) => void;
  onApplySuggestion: (issueId: string, suggestionText: string, type: 'replace' | 'insert_before' | 'insert_after') => void;
  onNextSuggestion: (issueId: string) => void;
  onPrevSuggestion: (issueId: string) => void;
}

const statusConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    iconColor: 'text-red-600 dark:text-red-400',
    bg: 'bg-gradient-to-br from-red-50/80 to-orange-50/50 dark:from-red-950/30 dark:to-orange-950/20',
    border: 'border-red-300 dark:border-red-800',
    gradient: 'from-red-500 to-orange-500',
    iconBg: 'bg-gradient-to-br from-red-500 to-orange-500'
  },
  needs_work: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-gradient-to-br from-yellow-50/80 to-amber-50/50 dark:from-yellow-950/30 dark:to-amber-950/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    gradient: 'from-yellow-500 to-amber-500',
    iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-500'
  },
  good: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    iconColor: 'text-green-600 dark:text-green-400',
    bg: 'bg-gradient-to-br from-green-50/80 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20',
    border: 'border-green-300 dark:border-green-700',
    gradient: 'from-green-500 to-emerald-500',
    iconBg: 'bg-gradient-to-br from-green-500 to-emerald-500'
  },
  excellent: {
    icon: Sparkles,
    color: 'text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-gradient-to-br from-blue-50/80 via-purple-50/50 to-pink-50/30 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-pink-950/10',
    border: 'border-purple-300 dark:border-purple-700',
    gradient: 'from-blue-500 via-purple-500 to-pink-500',
    iconBg: 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'
  }
};

export const RubricDimensionCard: React.FC<RubricDimensionCardProps> = ({
  dimension,
  onToggleIssue,
  onApplySuggestion,
  onNextSuggestion,
  onPrevSuggestion
}) => {
  const [isExpanded, setIsExpanded] = useState(dimension.status === 'critical' || dimension.status === 'needs_work');
  const config = statusConfig[dimension.status];
  const StatusIcon = config.icon;
  const notFixedIssues = dimension.issues.filter(i => i.status !== 'fixed');

  return (
    <Card className="border-l-4 border-l-primary overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3 flex-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              dimension.status === 'critical' ? 'bg-red-100 dark:bg-red-950/30' :
              dimension.status === 'needs_work' ? 'bg-yellow-100 dark:bg-yellow-950/30' :
              dimension.status === 'good' ? 'bg-green-100 dark:bg-green-950/30' :
              'bg-primary/10'
            }`}>
              <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="text-lg font-bold text-primary">{dimension.name}</h3>
                <span className={`text-lg font-bold ${config.color}`}>
                  {dimension.score.toFixed(1)}/10
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {dimension.overview}
              </p>
              {!isExpanded && notFixedIssues.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {notFixedIssues.length} issue{notFixedIssues.length !== 1 ? 's' : ''} to address
                </div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>
      
      {isExpanded && dimension.issues.length > 0 && (
        <div className="px-4 pb-4 space-y-2 border-t">
          <div className="pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Detected Issues
            </p>
            <div className="space-y-2">
              {dimension.issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onToggle={() => onToggleIssue(issue.id)}
                  onApplySuggestion={onApplySuggestion}
                  onNextSuggestion={onNextSuggestion}
                  onPrevSuggestion={onPrevSuggestion}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {isExpanded && dimension.issues.length === 0 && (
        <div className="px-4 pb-4 pt-3 border-t">
          <p className="text-sm text-primary">
            No issues detected. Great work!
          </p>
        </div>
      )}
    </Card>
  );
};
