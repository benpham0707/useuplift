import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WritingIssue } from './types';
import { SuggestionCarousel } from './SuggestionCarousel';
import { TeachingGuidanceCard } from './TeachingGuidanceCard';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Loader2 } from 'lucide-react';

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
    // Debug: Log teaching data structure
    if (!issue.teaching?.problem) {
    }

    // Get preview text from Phase 19 teaching.problem.hook or fallback
    const previewText = issue.teaching?.problem?.hook ||
                       issue.teaching?.problem?.description?.substring(0, 120) ||
                       issue.analysis?.substring(0, 120) ||
                       issue.excerpt?.substring(0, 120) ||
                       'Analysis in progress...';

    return (
      <Card
        className="border-l-4 border-l-primary p-3 cursor-pointer hover:bg-accent/50 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 flex-1 min-w-0">
            <StatusIcon className={`w-5 h-5 ${
              issue.status === 'not_fixed' ? 'text-yellow-500' : 'text-yellow-500'
            } ${issue.status === 'in_progress' ? 'animate-spin' : ''} flex-shrink-0`} />
            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="font-medium text-sm">{issue.title}</h4>
              <p className="text-sm font-medium text-purple-600/80 dark:text-purple-400/80 line-clamp-2 leading-relaxed">
                {previewText}
              </p>
              <p className="text-xs text-purple-500/60 dark:text-purple-400/50">
                {issue.suggestions.length} suggestion{issue.suggestions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
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
          {issue.excerpt && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                From Your Draft
              </p>
              <div className="relative rounded-md bg-primary/5 py-4 pr-7 pl-7">
                <span className="absolute top-2 left-1 text-2xl leading-none text-primary select-none pointer-events-none">"</span>
                <p className="text-sm italic text-foreground/80 pr-2">
                  {(issue.excerpt || '').replace(/"/g, '')}
                </p>
                <span className="absolute top-2 right-1 text-2xl leading-none text-primary select-none pointer-events-none">"</span>
              </div>
            </div>
          )}

        {/* Phase 19 Teaching Layer - Replaces old problem/impact sections */}
          {(() => {
            if (issue.teaching?.suggestionRationales) {
            }
            return null;
          })()}
          {/* Phase 19 Teaching Guidance (REQUIRED) */}
          {issue.teaching ? (
            <div className="mb-4">
              <TeachingGuidanceCard teaching={issue.teaching} mode="problem" />
            </div>
          ) : (
            <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">
                Teaching guidance unavailable
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                This issue was analyzed before teaching layer was enabled. Re-analyze to get deep teaching guidance.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <SuggestionCarousel
              suggestions={issue.suggestions}
              currentIndex={issue.currentSuggestionIndex}
              onNext={() => onNextSuggestion(issue.id)}
              onPrev={() => onPrevSuggestion(issue.id)}
              onApply={(text, type) => onApplySuggestion(issue.id, text, type)}
              teaching={issue.teaching}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
