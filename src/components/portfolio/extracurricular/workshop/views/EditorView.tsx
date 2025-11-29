/**
 * EditorView - Live Essay Editing with Real-time Feedback
 *
 * Features:
 * - Rich text editor for essay draft
 * - Version history (undo/redo)
 * - Live coaching panel (stays visible)
 * - Real-time score updates (debounced)
 * - Visual feedback for improvements
 * - Apply suggestion workflows
 *
 * Purpose: Provide seamless editing experience with immediate feedback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  RotateCcw,
  RotateCw,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Sparkles,
  FileEdit,
  Zap,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import GradientText from '@/components/ui/GradientText';
import GradientZap from '@/components/ui/GradientZap';
import type { TeachingIssue } from '../teachingTypes';

interface EditorViewProps {
  currentDraft: string;
  onDraftChange: (draft: string) => void;
  onSave: () => void;
  activeIssues: TeachingIssue[];
  currentScore: number;
  initialScore: number;
  isAnalyzing?: boolean;
  onRequestReanalysis?: () => void;
  hasAnalysisResult?: boolean; // Whether analysis has been run at least once
  canAnalyze?: boolean; // Whether essay has enough content to analyze
  minCharacters?: number; // Minimum characters required to analyze (default 50)
  versionHistory?: Array<{ text: string; timestamp: number; score?: number }>;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onShowHistory?: () => void;
  hasUnsavedChanges?: boolean; // Whether there are unsaved changes (controlled by parent)
  analysisCreditCost?: number; // Credit cost for analysis (optional, shows badge if provided)
}

export const EditorView: React.FC<EditorViewProps> = ({
  currentDraft,
  onDraftChange,
  onSave,
  activeIssues,
  currentScore,
  initialScore,
  isAnalyzing = false,
  onRequestReanalysis,
  hasAnalysisResult = false,
  canAnalyze = true,
  minCharacters = 50,
  versionHistory = [],
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onShowHistory,
  hasUnsavedChanges = false,
  analysisCreditCost,
}) => {
  const [localDraft, setLocalDraft] = useState(currentDraft);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local draft when parent's currentDraft changes (e.g., on PIQ switch)
  useEffect(() => {
    setLocalDraft(currentDraft);
  }, [currentDraft]);

  // Handle draft change
  const handleDraftChange = (value: string) => {
    setLocalDraft(value);
    onDraftChange(value);
  };

  // Handle save
  const handleSave = () => {
    onSave();
    setLastSaveTime(new Date());
  };

  // Score difference calculation - only meaningful when we have analysis AND a valid initial score
  // Prevents showing wrong deltas for new essays or after switching prompts
  const hasValidScoreComparison = hasAnalysisResult && initialScore > 0 && currentScore > 0;
  const scoreDiff = hasValidScoreComparison ? (currentScore - initialScore) : 0;
  const scoreChange = scoreDiff > 0 ? 'improved' : scoreDiff < 0 ? 'decreased' : 'unchanged';

  return (
    <div className="space-y-4">
        {/* Editor Header */}
        <Card className="border-2 border-primary">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <FileEdit className="w-6 h-6 text-primary" />
                <GradientText
                  className="text-xl font-bold"
                  colors={["#3b82f6", "#8b5cf6", "#3b82f6"]}
                >
                  Essay Editor
                </GradientText>
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Unsaved changes
                  </Badge>
                )}
              </div>

              {/* Version Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Undo"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  title="Redo"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                {onShowHistory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onShowHistory}
                    title="Version History"
                  >
                    <Clock className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Current Score</p>
                  <p className="text-2xl font-bold text-primary">{currentScore}</p>
                </div>
                {scoreChange !== 'unchanged' && (
                  <div className="flex items-center gap-1.5">
                    {scoreChange === 'improved' ? (
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    <span
                      className={`text-sm font-bold ${
                        scoreChange === 'improved'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {scoreDiff > 0 ? '+' : ''}
                      {scoreDiff}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
                    Analyzing...
                  </div>
                )}
                {onRequestReanalysis && !isAnalyzing && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onRequestReanalysis}
                            disabled={!canAnalyze}
                            className="gap-1.5"
                          >
                            <Sparkles className="w-3 h-3" />
                            {hasAnalysisResult ? 'Re-analyze' : 'Analyze'}
                            {analysisCreditCost && (
                              <Badge 
                                variant="secondary" 
                                className="ml-1 px-1.5 py-0 text-[10px] font-medium bg-primary/10 text-primary border-primary/20"
                              >
                                <Zap className="w-2.5 h-2.5 mr-0.5" />
                                {analysisCreditCost}
                              </Badge>
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {!canAnalyze ? (
                          <>
                            <p className="text-xs">
                              {localDraft.trim().length} / {minCharacters} characters
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Write {minCharacters - localDraft.trim().length} more to analyze
                            </p>
                          </>
                        ) : analysisCreditCost ? (
                          <p className="text-xs">
                            Uses {analysisCreditCost} credits for full essay analysis
                          </p>
                        ) : null}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {/* Last save info */}
            {lastSaveTime && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last saved: {lastSaveTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        </Card>

        {/* Text Editor */}
        <Card className="border-2 border-border">
          <div className="p-4">
            <Textarea
              ref={textareaRef}
              value={localDraft}
              onChange={(e) => handleDraftChange(e.target.value)}
              placeholder="Write your essay here..."
              className="min-h-[340px] text-base leading-relaxed resize-none border-0 focus-visible:ring-0 p-0"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span>{localDraft.length} characters • {localDraft.split(/\s+/).filter(w => w.length > 0).length} words</span>
              {versionHistory.length > 0 && (
                <span>Version {versionHistory.length} of {versionHistory.length}</span>
              )}
            </div>
          </div>
        </Card>
    </div>
  );
};
