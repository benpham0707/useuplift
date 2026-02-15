// @ts-nocheck - Initial scaffold with mock data integration points
/**
 * Activity Workshop - Cloned from PIQ Workshop Layout
 *
 * Split-pane layout with:
 * - Sticky carousel navigation for activities
 * - Left column: Editor (150-char description) + Activity Analysis
 * - Right column: AI Coach Chat (ContextualWorkshopChat)
 */

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Target, TrendingUp, AlertTriangle, PenTool, Info, Sparkles } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';

// UI Components
import { EditorView } from '@/components/portfolio/extracurricular/workshop/views/EditorView';
import ContextualWorkshopChat from '@/components/portfolio/extracurricular/workshop/components/ContextualWorkshopChat';
import { SaveStatusIndicator } from '@/components/portfolio/extracurricular/workshop/SaveStatusIndicator';
import type { AutosaveState } from '@/services/piqWorkshop/autosaveService';

// Activity Carousel
import { ActivityCarouselNav } from '@/components/portfolio/activity-workshop/ActivityCarouselNav';
import type { ActivityItem } from '@/components/portfolio/activity-workshop/ActivityCarouselNav';

// Mock Data
import { MOCK_DATA, activityTitles } from '@/components/portfolio/activity-workshop/mockData';

// Chat message type
import type { ChatMessage } from '@/services/workshop/chatService';

// Credits System
import { CREDIT_COSTS } from '@/services/credits';
import { InsufficientCreditsModal } from '@/components/credits';

// ============================================================================
// HELPERS: Derive activity list from mock data
// ============================================================================

// HARD-CODED MOCK DATA: Activity list derived from pipeline result's ordered activities
// and tier classifications. Replace with real API data when endpoint is wired up.
const buildActivityList = (): ActivityItem[] => {
  return MOCK_DATA.stage3.orderedActivities.map(ordered => {
    const stage1 = MOCK_DATA.stage1.activities[ordered.activityId];
    const teachingCandidates = MOCK_DATA.stage1.teachingCandidates;

    let teachingDepth: 'deep' | 'medium' | 'quick' = 'quick';
    if (teachingCandidates.deepTeachingIds.includes(ordered.activityId)) teachingDepth = 'deep';
    else if (teachingCandidates.mediumTeachingIds.includes(ordered.activityId)) teachingDepth = 'medium';

    return {
      id: ordered.activityId,
      title: activityTitles[ordered.activityId] || ordered.activityId,
      tier: stage1?.classification.tier || 4,
      teachingDepth,
    };
  });
};

const ACTIVITY_LIST = buildActivityList();

// ============================================================================
// TIER BADGE CONFIG (for analysis section)
// ============================================================================

const TIER_LABELS: Record<number, { label: string; description: string; color: string }> = {
  1: { label: 'Tier 1', description: 'Rare Achievement', color: 'text-amber-600 dark:text-amber-400' },
  2: { label: 'Tier 2', description: 'High Achievement', color: 'text-blue-600 dark:text-blue-400' },
  3: { label: 'Tier 3', description: 'Typical', color: 'text-green-600 dark:text-green-400' },
  4: { label: 'Tier 4', description: 'Participation', color: 'text-gray-500 dark:text-gray-400' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ActivityWorkshop() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedActivityId, setSelectedActivityId] = useState<string>(ACTIVITY_LIST[0]?.id || 'research');

  // HARD-CODED MOCK DATA: Using sample pipeline result until API endpoint is wired up
  const data = MOCK_DATA;

  // Editor state (per-activity descriptions would come from the database)
  // HARD-CODED: Empty draft for now — real data would load the 150-char Common App description
  const [currentDraft, setCurrentDraft] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Autosave state (stubbed — no database table yet)
  const [autosaveState] = useState<AutosaveState>({
    status: 'idle',
    lastSavedAt: null,
    lastError: null,
    hasUnsavedChanges: false,
  });

  // Credits modal
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [currentCreditBalance, setCurrentCreditBalance] = useState(0);

  // ============================================================================
  // DERIVED VALUES
  // ============================================================================

  const stage1Activity = data.stage1.activities[selectedActivityId];
  const activityScoring = data.scoring?.activityScores?.find(s => s.activityId === selectedActivityId);
  const storyRole = data.stage0.activityStoryRoles.find(r => r.activityId === selectedActivityId);
  const orderedEntry = data.stage3.orderedActivities.find(o => o.activityId === selectedActivityId);

  const activityScore = activityScoring?.activityScore.total || 0;
  const descriptionScore = activityScoring?.descriptionScore.total || 0;
  const tier = stage1Activity?.classification.tier || 4;
  const tierInfo = TIER_LABELS[tier];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDraftChange = useCallback((newDraft: string) => {
    setCurrentDraft(newDraft);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    // Stubbed — no database table yet for activity descriptions
    setHasUnsavedChanges(false);
  }, []);

  const handleActivityChange = useCallback((activityId: string) => {
    setSelectedActivityId(activityId);
    // Reset draft for new activity (would load from DB in real implementation)
    setCurrentDraft('');
    setHasUnsavedChanges(false);
  }, []);

  const handleRequestReanalysis = useCallback(() => {
    // Stubbed — no analysis pipeline endpoint yet
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient background */}
      <div className="hero-gradient hero-gradient-fade absolute top-0 left-0 right-0 h-[120vh] pointer-events-none -z-10" />

      {/* Sticky Activity header — cloned from PIQ Workshop */}
      <div className="sticky top-16 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b shadow-sm">
        <div className="mx-auto px-4 py-3 flex items-center justify-center gap-4">
          {/* Center: Activity Carousel Navigation */}
          <div className="flex-1 flex justify-center">
            <ActivityCarouselNav
              activities={ACTIVITY_LIST}
              currentActivityId={selectedActivityId}
              onActivityChange={handleActivityChange}
            />
          </div>

          {/* Right: Save Status */}
          <div className="flex items-center gap-2 min-w-[120px] justify-end absolute right-4">
            <SaveStatusIndicator state={autosaveState} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto px-4 py-4 space-y-6">
        {/* Hero section — Activity Score Card */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Card className="flex-1 p-5">
              {/* Header with Score & Tier */}
              <div className="flex items-start justify-between mb-4 pb-4">
                {/* Left: Title + Icon */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 via-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                    <PenTool className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <GradientText
                      className="text-2xl font-extrabold uppercase tracking-wide"
                      colors={["#3b82f6", "#6366f1", "#818cf8", "#60a5fa", "#3b82f6"]}
                    >
                      Activity Analysis
                    </GradientText>
                    <p className="text-sm text-muted-foreground font-medium">
                      {activityTitles[selectedActivityId] || selectedActivityId}
                    </p>
                  </div>
                </div>

                {/* Right: Scores */}
                <div className="text-right">
                  <div className="flex items-baseline gap-2 justify-end mb-2">
                    <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600">
                      {activityScore.toFixed(1)}
                    </span>
                    <span className="text-xl font-semibold text-muted-foreground">/10</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Badge className={`${tierInfo.color} bg-muted border px-2 py-0.5 text-xs`}>
                      {tierInfo.label} — {tierInfo.description}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="mb-4 pb-4 border-b">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground font-medium">Activity Score</span>
                      <span className="font-semibold">{activityScore.toFixed(1)}/10</span>
                    </div>
                    <Progress value={activityScore * 10} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground font-medium">Description Score</span>
                      <span className="font-semibold">{descriptionScore.toFixed(1)}/10</span>
                    </div>
                    <Progress value={descriptionScore * 10} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Quick Info: Story Role + Recommended Position */}
              <div className="space-y-3">
                {storyRole && (
                  <div className="flex items-start gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Story Role:</span>{' '}
                      <span className="text-muted-foreground capitalize">{storyRole.storyRole.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground"> — {storyRole.roleExplanation}</span>
                    </div>
                  </div>
                )}
                {orderedEntry && (
                  <div className="flex items-start gap-2 text-sm">
                    <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Recommended Position:</span>{' '}
                      <span className="text-muted-foreground">#{orderedEntry.rank} — {orderedEntry.reason}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Strengths & Issues */}
              <div className="mt-4 pt-4 border-t">
                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Info className="w-4 h-4 text-blue-500/60" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-blue-600/70 dark:text-blue-400/70">Activity Overview</h3>
                      <p className="text-xs text-muted-foreground">Strengths & areas for improvement</p>
                    </div>
                  </div>

                  {/* Green flags */}
                  {stage1Activity?.greenFlags.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Strengths</p>
                      <ul className="space-y-1">
                        {stage1Activity.greenFlags.map((f, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                            <span className="text-green-500 mt-1">•</span> {f.flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Description issues */}
                  {stage1Activity?.descriptionQuality.issues.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Description Improvements</p>
                      <ul className="space-y-1">
                        {stage1Activity.descriptionQuality.issues.map((issue, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                            <span className="text-amber-500 mt-1">•</span> {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Main workshop area — Two-column split pane */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Editor + Analysis Details */}
          <div className="space-y-6">
            {/* Editor */}
            <Card className="p-6 bg-gradient-to-br from-background/95 via-background/90 to-blue-50/80 dark:from-background/95 dark:via-background/90 dark:to-blue-950/20 backdrop-blur-xl border shadow-lg">
              <EditorView
                key={selectedActivityId}
                currentDraft={currentDraft}
                onDraftChange={handleDraftChange}
                onSave={handleSave}
                activeIssues={[]}
                currentScore={activityScore * 10} // Scale to 100 for compatibility
                initialScore={0}
                isAnalyzing={false}
                onRequestReanalysis={handleRequestReanalysis}
                hasAnalysisResult={true}
                canAnalyze={currentDraft.trim().length >= 10}
                versionHistory={[]}
                canUndo={false}
                canRedo={false}
                onUndo={() => {}}
                onRedo={() => {}}
                onShowHistory={() => {}}
                hasUnsavedChanges={hasUnsavedChanges}
                analysisCreditCost={CREDIT_COSTS.ESSAY_ANALYSIS}
              />
            </Card>

            {/* Activity Score Breakdown */}
            {activityScoring && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 ring-1 ring-blue-500/20">
                    <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <GradientText
                    className="text-2xl font-bold"
                    colors={["#3b82f6", "#6366f1", "#818cf8", "#60a5fa", "#3b82f6"]}
                    animationSpeed={8}
                  >
                    Score Breakdown
                  </GradientText>
                </div>

                <Card className="p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Activity Score Components</h4>
                  {Object.entries(activityScoring.activityScore.breakdown).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-mono font-medium text-foreground">{val.score}/10</span>
                      </div>
                      <Progress value={val.score * 10} className="h-1.5" />
                    </div>
                  ))}

                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Description Score Components</h4>
                    {Object.entries(activityScoring.descriptionScore.breakdown).map(([key, val]) => (
                      <div key={key} className="space-y-1 mb-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-mono font-medium text-foreground">{val.score}/10</span>
                        </div>
                        <Progress value={val.score * 10} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Right column: AI Coach Chat */}
          <div className="space-y-6">
            <Card className="sticky top-36 p-6 bg-gradient-to-br from-background/95 via-background/90 to-blue-50/80 dark:from-background/95 dark:via-background/90 dark:to-blue-950/20 backdrop-blur-xl border shadow-lg">
              <ContextualWorkshopChat
                mode="extracurricular"
                activity={{
                  id: selectedActivityId,
                  name: activityTitles[selectedActivityId] || selectedActivityId,
                  category: stage1Activity?.classification.detectedCategory || 'Activity',
                  position: '',
                  organization: '',
                  description: currentDraft,
                  grades: [],
                  hoursPerWeek: 0,
                  weeksPerYear: 0,
                  intendToContinue: false,
                }}
                currentDraft={currentDraft}
                analysisResult={null}
                teachingCoaching={null}
                currentScore={activityScore * 10}
                initialScore={0}
                hasUnsavedChanges={hasUnsavedChanges}
                needsReanalysis={false}
                reflectionPromptsMap={new Map()}
                reflectionAnswers={{}}
                onTriggerReanalysis={handleRequestReanalysis}
                externalMessages={chatMessages}
                onMessagesChange={setChatMessages}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
        currentBalance={currentCreditBalance}
        requiredCredits={CREDIT_COSTS.ESSAY_ANALYSIS}
        actionType="analysis"
      />
    </div>
  );
}
