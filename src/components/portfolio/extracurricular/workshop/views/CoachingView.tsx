/**
 * CoachingView - Teaching-Focused Issue Display
 *
 * Shows prioritized teaching issues with pedagogical approach:
 * - Priority-ranked issues (critical → major → minor)
 * - Quick wins highlighted (high impact, low effort)
 * - Strategic guidance for improvement path
 * - Score projections (if all completed vs quick wins only)
 * - Integration with TeachingIssueCard for full teaching flow
 *
 * Philosophy: Guide students through improvements systematically.
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Zap,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { TeachingCoachingOutput, TeachingIssue } from '../teachingTypes';
import { TeachingIssueCard } from '../components/TeachingIssueCard';

interface CoachingViewProps {
  coaching: TeachingCoachingOutput;
  onUpdateWorkspace: (issueId: string, draftText: string) => void;
  onRequestHint: (issueId: string) => void;
  onRequestAIReview: (issueId: string) => void;
  onMarkComplete: (issueId: string) => void;
  onStartEditing?: () => void;
}

export const CoachingView: React.FC<CoachingViewProps> = ({
  coaching,
  onUpdateWorkspace,
  onRequestHint,
  onRequestAIReview,
  onMarkComplete,
  onStartEditing,
}) => {
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [showProjections, setShowProjections] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);

  // Count issues by severity
  const criticalCount = coaching.teaching_issues.filter((i) => i.severity === 'critical').length;
  const majorCount = coaching.teaching_issues.filter((i) => i.severity === 'major').length;
  const minorCount = coaching.teaching_issues.filter((i) => i.severity === 'minor').length;

  // Count completed issues
  const completedCount = coaching.teaching_issues.filter((i) => i.status === 'completed').length;

  // Toggle issue expansion
  const handleExpand = (issueId: string) => {
    setExpandedIssueId(expandedIssueId === issueId ? null : issueId);
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary Card */}
      <Card className="border-2 border-primary">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-primary">Coaching Overview</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Prioritized improvements to maximize your essay's impact
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-4xl font-bold text-primary">
                  {coaching.overall.current_nqi}
                </span>
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
                <span className="text-2xl font-semibold text-green-600 dark:text-green-400 mb-1">
                  {coaching.overall.target_nqi}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Potential gain: +{coaching.overall.potential_gain} points
              </p>
            </div>
          </div>

          {/* Issue Breakdown */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-2xl font-bold text-primary">{coaching.overall.total_issues}</p>
              <p className="text-xs text-muted-foreground">Total Issues</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalCount}</p>
              <p className="text-xs text-red-700 dark:text-red-400">Critical</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{majorCount}</p>
              <p className="text-xs text-orange-700 dark:text-orange-400">Major</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{minorCount}</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">Minor</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progress: {completedCount}/{coaching.overall.total_issues} completed
              </span>
              <span className="font-semibold text-primary">
                {Math.round((completedCount / coaching.overall.total_issues) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${(completedCount / coaching.overall.total_issues) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <span className="font-semibold">Estimated time to complete:</span>{' '}
              {coaching.overall.estimated_time_minutes} minutes
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Wins Section */}
      {coaching.quick_wins.length > 0 && (
        <Card className="border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50/30 dark:bg-yellow-950/20">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-300">
                Quick Wins
              </h2>
              <Badge className="bg-yellow-600 text-white">High Impact, Low Effort</Badge>
            </div>
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Start here for maximum improvement with minimal time investment
            </p>

            <div className="space-y-3">
              {coaching.quick_wins.map((win, idx) => (
                <Card key={idx} className="border border-yellow-300 dark:border-yellow-700">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-yellow-900 dark:text-yellow-300 mb-1">
                          {win.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-yellow-700 dark:text-yellow-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{win.estimated_minutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {win.impact}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400"
                          >
                            {win.effort} effort
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => {
                          const issue = coaching.teaching_issues.find((i) => i.id === win.issue_id);
                          if (issue) handleExpand(issue.id);
                        }}
                      >
                        Start
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Strategic Guidance */}
      {coaching.strategy && (
        <Card>
          <button
            onClick={() => setShowStrategy(!showStrategy)}
            className="w-full p-6 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-bold text-purple-900 dark:text-purple-300">
                  Strategic Guidance
                </h2>
              </div>
              {showStrategy ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>

          {showStrategy && (
            <div className="px-6 pb-6 space-y-4 border-t pt-6">
              {/* Strengths */}
              {coaching.strategy.strengths_to_maintain.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <h3 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                      Strengths to Maintain
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {coaching.strategy.strengths_to_maintain.map((strength, idx) => (
                      <li key={idx} className="text-sm text-foreground/90 flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critical Gaps */}
              {coaching.strategy.critical_gaps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
                      Critical Gaps
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {coaching.strategy.critical_gaps.map((gap, idx) => (
                      <li key={idx} className="text-sm text-foreground/90 flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400">⚠</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learning Path */}
              {coaching.strategy.learning_path && (
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
                    📚 Your Learning Path:
                  </p>
                  <p className="text-sm text-purple-900 dark:text-purple-300 leading-relaxed">
                    {coaching.strategy.learning_path}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Projections */}
      {coaching.projections && (
        <Card>
          <button
            onClick={() => setShowProjections(!showProjections)}
            className="w-full p-6 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <h2 className="text-xl font-bold text-amber-900 dark:text-amber-300">
                  Score Projections
                </h2>
              </div>
              {showProjections ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>

          {showProjections && (
            <div className="px-6 pb-6 space-y-3 border-t pt-6">
              {/* If All Completed */}
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border-2 border-green-300 dark:border-green-700">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-green-900 dark:text-green-300 mb-1">
                      If All Issues Completed
                    </h3>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      Complete all {coaching.overall.total_issues} issues
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {coaching.projections.if_all_completed.estimated_nqi}
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      Tier {coaching.projections.if_all_completed.tier_placement}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-800 dark:text-green-300">
                  Confidence range: {coaching.projections.if_all_completed.confidence_range[0]}-
                  {coaching.projections.if_all_completed.confidence_range[1]}
                </p>
              </div>

              {/* Quick Wins Only */}
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300 dark:border-yellow-700">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-yellow-900 dark:text-yellow-300 mb-1">
                      If Quick Wins Only
                    </h3>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      Complete {coaching.quick_wins.length} high-impact issues
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {coaching.projections.if_quick_wins_only.estimated_nqi}
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      Saves {coaching.projections.if_quick_wins_only.time_saved_minutes} min
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Priority Issues List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-primary">
                Priority Issues ({coaching.teaching_issues.length})
              </h2>
            </div>
            {onStartEditing && (
              <Button onClick={onStartEditing} variant="outline">
                <ArrowRight className="w-4 h-4 mr-2" />
                Start Editing
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Issues sorted by impact and priority. Expand each to learn and practice improvements.
          </p>

          <div className="space-y-3">
            {coaching.teaching_issues.map((issue) => (
              <TeachingIssueCard
                key={issue.id}
                issue={issue}
                onUpdateWorkspace={onUpdateWorkspace}
                onRequestHint={onRequestHint}
                onRequestAIReview={onRequestAIReview}
                onMarkComplete={onMarkComplete}
                onExpand={handleExpand}
                isExpanded={expandedIssueId === issue.id}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
