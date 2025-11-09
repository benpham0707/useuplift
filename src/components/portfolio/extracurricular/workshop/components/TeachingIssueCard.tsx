/**
 * TeachingIssueCard - Core Pedagogical Component
 *
 * Implements teaching-focused approach to writing improvement:
 * 1. Show the problem (their excerpt + explanation)
 * 2. Explain why it matters (admissions perspective)
 * 3. Teach the principle (transferable concept)
 * 4. Demonstrate with examples (elite essays)
 * 5. Guide application (reflection prompts)
 * 6. Practice (student workspace)
 * 7. Review (optional AI feedback)
 *
 * Philosophy: Build better writers, not just better essays.
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Loader2,
  BookOpen,
  Lightbulb,
  PenTool,
  Target,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { TeachingIssue, EliteEssayExample } from '../teachingTypes';
import { ExampleCard } from './ExampleCard';
import { ReflectionPromptsPanel } from './ReflectionPromptsPanel';

interface TeachingIssueCardProps {
  issue: TeachingIssue;
  onUpdateWorkspace: (issueId: string, draftText: string) => void;
  onRequestHint: (issueId: string) => void;
  onRequestAIReview: (issueId: string) => void;
  onMarkComplete: (issueId: string) => void;
  onExpand: (issueId: string) => void;
  isExpanded: boolean;
}

export const TeachingIssueCard: React.FC<TeachingIssueCardProps> = ({
  issue,
  onUpdateWorkspace,
  onRequestHint,
  onRequestAIReview,
  onMarkComplete,
  onExpand,
  isExpanded,
}) => {
  const [activeTab, setActiveTab] = useState<'learn' | 'practice'>('learn');
  const [showAllExamples, setShowAllExamples] = useState(false);

  // Status styling
  const getStatusConfig = () => {
    switch (issue.status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-950/30',
          border: 'border-green-300 dark:border-green-800',
        };
      case 'in_progress':
        return {
          icon: Loader2,
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-950/30',
          border: 'border-yellow-300 dark:border-yellow-800',
        };
      case 'needs_review':
        return {
          icon: AlertCircle,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100 dark:bg-blue-950/30',
          border: 'border-blue-300 dark:border-blue-800',
        };
      default:
        return {
          icon: Circle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-950/30',
          border: 'border-red-300 dark:border-red-800',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Severity badge
  const getSeverityBadge = () => {
    const config = {
      critical: { label: 'CRITICAL', color: 'bg-red-600 text-white' },
      major: { label: 'MAJOR', color: 'bg-orange-600 text-white' },
      minor: { label: 'MINOR', color: 'bg-yellow-600 text-white' },
    };
    const { label, color } = config[issue.severity];
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>{label}</span>;
  };

  // Collapsed state
  if (!isExpanded) {
    return (
      <Card
        className={`border-l-4 ${statusConfig.border} cursor-pointer hover:shadow-md transition-all`}
        onClick={() => onExpand(issue.id)}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <StatusIcon
                className={`w-5 h-5 ${statusConfig.color} flex-shrink-0 mt-0.5 ${
                  issue.status === 'in_progress' ? 'animate-spin' : ''
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm text-primary">{issue.problem.title}</h4>
                  {getSeverityBadge()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Priority #{issue.priority_rank} • Impact: {issue.problem.impact_on_score}
                </p>
                {issue.status === 'completed' && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Completed
                  </p>
                )}
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </div>
      </Card>
    );
  }

  // Expanded state with full teaching content
  return (
    <Card className={`border-2 ${statusConfig.border}`}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => onExpand(issue.id)}
            className="w-full flex items-start justify-between gap-3 text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-start gap-3 flex-1">
              <StatusIcon
                className={`w-6 h-6 ${statusConfig.color} flex-shrink-0 mt-1 ${
                  issue.status === 'in_progress' ? 'animate-spin' : ''
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-primary">{issue.problem.title}</h3>
                  {getSeverityBadge()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Priority #{issue.priority_rank} • Impact: {issue.problem.impact_on_score}
                </p>
              </div>
            </div>
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('learn')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'learn'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Learn the Principle
            </div>
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'practice'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Practice & Apply
            </div>
          </button>
        </div>

        {/* Learn Tab */}
        {activeTab === 'learn' && (
          <div className="space-y-6">
            {/* Problem Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h4 className="font-bold text-sm text-red-600 dark:text-red-400 uppercase tracking-wide">
                  The Problem
                </h4>
              </div>

              {/* Their excerpt */}
              <div className="relative rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                  From Your Draft:
                </p>
                <div className="relative pl-4 border-l-2 border-red-400">
                  <p className="text-sm italic text-foreground/90">
                    "{issue.problem.from_draft}"
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {issue.problem.explanation}
                </p>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1">
                    💰 Impact on Your Score:
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-300">
                    {issue.problem.impact_on_score}
                  </p>
                </div>
              </div>
            </div>

            {/* Principle Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-sm text-primary uppercase tracking-wide">
                  The Writing Principle
                </h4>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-bold text-primary">
                    {issue.principle.name}
                  </p>
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                    {issue.principle.skill_level}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 mb-3">
                  {issue.principle.description}
                </p>
                <div className="pt-3 border-t border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-1">
                    Why Admissions Officers Care:
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    {issue.principle.why_officers_care}
                  </p>
                </div>
              </div>
            </div>

            {/* Examples Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-bold text-sm text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    Examples from Admitted Students
                  </h4>
                </div>
                {issue.examples.length > 2 && (
                  <button
                    onClick={() => setShowAllExamples(!showAllExamples)}
                    className="text-xs text-primary hover:underline"
                  >
                    {showAllExamples
                      ? 'Show Less'
                      : `View All ${issue.examples.length} Examples`}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {(showAllExamples ? issue.examples : issue.examples.slice(0, 2)).map(
                  (example, idx) => (
                    <ExampleCard key={idx} example={example} />
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Practice Tab */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            {/* Reflection Prompts */}
            <ReflectionPromptsPanel
              prompts={issue.reflection_prompts}
              issueId={issue.id}
            />

            {/* Student Workspace */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wide">
                  Your Rewrite
                </h4>
                {issue.student_workspace.is_complete && (
                  <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-medium">
                    ✓ Submitted
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  value={issue.student_workspace.draft_text}
                  onChange={(e) => onUpdateWorkspace(issue.id, e.target.value)}
                  placeholder="Rewrite your sentence here applying the principle you learned..."
                  className="min-h-[120px] text-sm"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{issue.student_workspace.draft_text.length} characters</span>
                  {issue.student_workspace.last_updated && (
                    <span>
                      Last saved:{' '}
                      {new Date(issue.student_workspace.last_updated).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Support Level Actions */}
              <div className="flex gap-2">
                {issue.support.current_level === 'teach' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRequestHint(issue.id)}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Need a Hint?
                  </Button>
                )}

                {issue.student_workspace.draft_text.length > 20 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRequestAIReview(issue.id)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get AI Feedback
                  </Button>
                )}

                {issue.student_workspace.draft_text.length > 50 && (
                  <Button
                    size="sm"
                    onClick={() => onMarkComplete(issue.id)}
                    className="ml-auto"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>

              {/* Hint Display */}
              {issue.support.hint && (
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                    💡 Hint:
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-300">
                    {issue.support.hint}
                  </p>
                </div>
              )}

              {/* AI Feedback Display */}
              {issue.student_workspace.feedback && (
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
                    ✨ AI Feedback on Your Attempt:
                  </p>
                  <p className="text-sm text-purple-900 dark:text-purple-300 whitespace-pre-line">
                    {issue.student_workspace.feedback}
                  </p>
                </div>
              )}

              {/* AI Variations (Last Resort) */}
              {issue.support.ai_variations && issue.support.ai_variations.length > 0 && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-2">
                    ⚠️ Inspiration (Don't Copy - Adapt to YOUR Voice):
                  </p>
                  <div className="space-y-2">
                    {issue.support.ai_variations.map((variation, idx) => (
                      <div key={idx} className="p-2 rounded bg-white dark:bg-gray-900 border">
                        <p className="text-sm text-foreground/90 italic">"{variation}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
