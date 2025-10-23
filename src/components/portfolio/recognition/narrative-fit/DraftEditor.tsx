import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, FileEdit, Save } from 'lucide-react';
import { Check } from 'lucide-react';

interface DraftEditorProps {
  draft: string;
  onDraftChange: (draft: string) => void;
  wordCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  versionInfo: string;
  isDirty: boolean;
  onManualSave: () => void;
}

export const DraftEditor: React.FC<DraftEditorProps> = ({ 
  draft, 
  onDraftChange, 
  wordCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  versionInfo,
  isDirty,
  onManualSave
}) => {
  
  return (
    <div className="bg-gradient-to-br from-background via-primary/5 to-background border-b">
      <div className="max-w-5xl mx-auto p-5 space-y-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileEdit className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold">Your Draft</h3>
            </div>
            <div className="flex items-center gap-2">
              {(canUndo || canRedo) && (
                <>
                  <span className="text-xs text-muted-foreground">
                    {versionInfo}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onUndo}
                      disabled={!canUndo}
                      className="h-7 w-7 p-0"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRedo}
                      disabled={!canRedo}
                      className="h-7 w-7 p-0"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </>
              )}
              {isDirty ? (
                <Button size="sm" onClick={onManualSave} className="h-7 px-2">
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Save className="w-3 h-3" />
                  Autosaved
                </div>
              )}
            </div>
          </div>
          <Textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Write about your recognition here... Aim for 90-170 words with specific metrics, selectivity context, and thematic connection."
            className="min-h-[160px] text-sm leading-relaxed resize-none"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${
                wordCount < 90 ? 'text-yellow-600 dark:text-yellow-400' : 
                wordCount > 170 ? 'text-red-600 dark:text-red-400' : 
                'text-primary'
              }`}>
                {wordCount}
              </span>
              <span className="text-muted-foreground">words (target: 90-170)</span>
            </div>
            {wordCount >= 90 && wordCount <= 170 && (
              <span className="text-xs text-primary flex items-center gap-1">
                <Check className="w-3 h-3" />
                Perfect Range
              </span>
            )}
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                wordCount < 90 ? 'bg-yellow-500' : 
                wordCount > 170 ? 'bg-red-500' : 
                'bg-primary'
              }`}
              style={{ width: `${Math.min((wordCount / 170) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
