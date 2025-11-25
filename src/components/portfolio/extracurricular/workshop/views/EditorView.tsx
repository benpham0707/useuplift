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
  Cloud,
} from 'lucide-react';
import GradientText from '@/components/ui/GradientText';
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
  versionHistory?: Array<{ text: string; timestamp: number; score: number }>;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onShowHistory?: () => void;
  onSaveToCloud?: () => void; // Manual save to cloud
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
  versionHistory = [],
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onShowHistory,
  onSaveToCloud,
}) => {
  const [localDraft, setLocalDraft] = useState(currentDraft);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(localDraft !== currentDraft);
  }, [localDraft, currentDraft]);

  // Handle draft change
  const handleDraftChange = (value: string) => {
    setLocalDraft(value);
    onDraftChange(value);
  };

  // Handle save
  const handleSave = () => {
    onSave();
    setLastSaveTime(new Date());
    setHasUnsavedChanges(false);
  };

  // Score difference calculation
  const scoreDiff = currentScore - initialScore;
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
                {onSaveToCloud && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSaveToCloud}
                    title="Save version to cloud for cross-device access"
                  >
                    <Cloud className="w-4 h-4 mr-2" />
                    Save to Cloud
                  </Button>
                )}
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
                  <Button variant="outline" size="sm" onClick={onRequestReanalysis}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {hasAnalysisResult ? 'Re-analyze' : 'Analyze'}
                  </Button>
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
