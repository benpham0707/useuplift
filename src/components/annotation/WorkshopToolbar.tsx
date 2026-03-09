/**
 * WorkshopToolbar — mode toggle, word count, and re-analyze controls.
 *
 * Sits above the essay panel. Provides read/edit mode switching,
 * live word count, and a re-analyze button when text has changed.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Loader2, RefreshCw } from 'lucide-react';

interface WorkshopToolbarProps {
  mode: 'read' | 'edit';
  onModeToggle: () => void;
  wordCount: number;
  isAnalyzing: boolean;
  hasChanges: boolean;
  onReanalyze: () => void;
}

export const WorkshopToolbar: React.FC<WorkshopToolbarProps> = ({
  mode,
  onModeToggle,
  wordCount,
  isAnalyzing,
  hasChanges,
  onReanalyze,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-background">
      <div className="flex items-center gap-3">
        {/* Mode toggle */}
        <div className="flex items-center rounded-md border border-border/60 p-0.5">
          <button
            type="button"
            onClick={mode === 'edit' ? onModeToggle : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              mode === 'read'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Read
          </button>
          <button
            type="button"
            onClick={mode === 'read' ? onModeToggle : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              mode === 'edit'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>

        {/* Word count */}
        <span className="text-xs text-muted-foreground tabular-nums">
          {wordCount} word{wordCount !== 1 ? 's' : ''}
        </span>

        {/* Analyzing spinner */}
        {isAnalyzing && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Analyzing...
          </span>
        )}
      </div>

      {/* Re-analyze button */}
      {hasChanges && !isAnalyzing && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReanalyze}
          className="text-xs gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Re-analyze
        </Button>
      )}
    </div>
  );
};
